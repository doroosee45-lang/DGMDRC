const Foreigner = require('../models/Foreigner');
const Movement = require('../models/Movement');
const Infraction = require('../models/Infraction');
const Alert = require('../models/Alert');
const Blacklist = require('../models/Blacklist');
const moment = require('moment');

exports.getStats = async (req, res) => {
  try {
    const { dateFrom, dateTo, province, borderPostId } = req.query;
    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);

    const movQuery = Object.keys(dateFilter).length ? { datetime: dateFilter } : {};
    if (borderPostId) movQuery.borderPostId = borderPostId;

    const [totalForeigners, presentNow, byStatus, byNationality, byVisa, recentEntries, recentExits, byBorderPost, infractionsByNature, alertsByType, blacklistCount] = await Promise.all([
      Foreigner.countDocuments({ isActive: true }),
      Foreigner.countDocuments({ isActive: true, presenceStatus: 'PRESENT' }),
      Foreigner.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$currentStatus', count: { $sum: 1 } } }]),
      Foreigner.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$nationality', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 15 }]),
      Foreigner.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$visa.type', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Movement.countDocuments({ ...movQuery, type: 'ENTREE' }),
      Movement.countDocuments({ ...movQuery, type: 'SORTIE' }),
      Movement.aggregate([{ $match: { ...movQuery, type: 'ENTREE' } }, { $group: { _id: '$borderPostId', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }, { $lookup: { from: 'borderposts', localField: '_id', foreignField: '_id', as: 'post' } }]),
      Infraction.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$nature', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Alert.aggregate([{ $match: { status: { $in: ['ACTIVE', 'EN_TRAITEMENT'] } } }, { $group: { _id: '$type', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Blacklist.countDocuments({ isActive: true }),
    ]);

    const monthlyFlow = await Movement.aggregate([
      { $match: { datetime: { $gte: moment().subtract(12, 'months').toDate() } } },
      { $group: { _id: { month: { $month: '$datetime' }, year: { $year: '$datetime' }, type: '$type' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        summary: { totalForeigners, presentNow, recentEntries, recentExits, blacklistCount },
        byStatus, byNationality, byVisa, byBorderPost,
        infractions: { byNature: infractionsByNature },
        alerts: { byType: alertsByType },
        monthlyFlow,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    const [entriesToday, exitsToday, activeAlerts, pendingCorrections, recentMovements] = await Promise.all([
      Movement.countDocuments({ type: 'ENTREE', datetime: { $gte: today } }),
      Movement.countDocuments({ type: 'SORTIE', datetime: { $gte: today } }),
      Alert.countDocuments({ status: 'ACTIVE' }),
      require('../models/CorrectionRequest').countDocuments({ status: 'EN_ATTENTE' }),
      Movement.find({ datetime: { $gte: today } })
        .populate('foreignerId', 'lastName firstName nationality dossierNumber photo')
        .populate('borderPostId', 'name code')
        .sort({ datetime: -1 })
        .limit(10),
    ]);
    res.json({ success: true, data: { entriesToday, exitsToday, activeAlerts, pendingCorrections, recentMovements } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.exportForeigners = async (req, res) => {
  try {
    const { format = 'xlsx', nationality, status, isBlacklisted, search } = req.query;

    const query = { isActive: true };
    if (nationality) query.nationality = nationality.toUpperCase();
    if (status) query.currentStatus = status;
    if (isBlacklisted !== undefined) query.isBlacklisted = isBlacklisted === 'true';
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { lastName: { $regex: escaped, $options: 'i' } },
        { firstName: { $regex: escaped, $options: 'i' } },
        { dossierNumber: { $regex: escaped, $options: 'i' } },
        { 'passport.number': { $regex: escaped, $options: 'i' } },
      ];
    }

    const foreigners = await Foreigner.find(query)
      .select('dossierNumber lastName firstName gender dateOfBirth nationality passport visa currentStatus presenceStatus isBlacklisted createdAt')
      .sort({ createdAt: -1 })
      .limit(5000);

    const dateStr = moment().format('YYYY-MM-DD');

    if (format === 'xlsx') {
      const ExcelJS = require('exceljs');
      const wb = new ExcelJS.Workbook();
      wb.creator = 'DGM-SIMN';
      wb.created = new Date();

      const ws = wb.addWorksheet('Dossiers Étrangers', { views: [{ state: 'frozen', ySplit: 1 }] });
      ws.columns = [
        { header: 'N° Dossier', key: 'dossierNumber', width: 22 },
        { header: 'Nom', key: 'lastName', width: 20 },
        { header: 'Prénom(s)', key: 'firstName', width: 20 },
        { header: 'Sexe', key: 'gender', width: 8 },
        { header: 'Date de naissance', key: 'dateOfBirth', width: 18 },
        { header: 'Nationalité', key: 'nationality', width: 14 },
        { header: 'N° Passeport', key: 'passport', width: 20 },
        { header: 'Exp. Passeport', key: 'passportExpiry', width: 16 },
        { header: 'Type Visa', key: 'visaType', width: 14 },
        { header: 'Exp. Visa', key: 'visaExpiry', width: 16 },
        { header: 'Statut', key: 'currentStatus', width: 18 },
        { header: 'Présence', key: 'presenceStatus', width: 14 },
        { header: 'Liste noire', key: 'isBlacklisted', width: 12 },
        { header: 'Enregistré le', key: 'createdAt', width: 18 },
      ];

      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003087' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 22;

      foreigners.forEach((f, idx) => {
        const row = ws.addRow({
          dossierNumber: f.dossierNumber,
          lastName: f.lastName,
          firstName: f.firstName,
          gender: f.gender,
          dateOfBirth: f.dateOfBirth ? moment(f.dateOfBirth).format('DD/MM/YYYY') : '',
          nationality: f.nationality,
          passport: f.passport?.number || '',
          passportExpiry: f.passport?.expiryDate ? moment(f.passport.expiryDate).format('DD/MM/YYYY') : '',
          visaType: f.visa?.type || '',
          visaExpiry: f.visa?.expiryDate ? moment(f.visa.expiryDate).format('DD/MM/YYYY') : '',
          currentStatus: f.currentStatus,
          presenceStatus: f.presenceStatus,
          isBlacklisted: f.isBlacklisted ? 'OUI' : 'NON',
          createdAt: f.createdAt ? moment(f.createdAt).format('DD/MM/YYYY') : '',
        });
        if (idx % 2 === 1) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
        }
        if (f.isBlacklisted) {
          row.getCell('isBlacklisted').font = { color: { argb: 'FFD32F2F' }, bold: true };
        }
      });

      ws.addRow([]);
      const footerRow = ws.addRow([`Exporté le ${moment().format('DD/MM/YYYY à HH:mm')} — DGM SIMN`, '', '', '', '', '', '', '', '', '', '', '', '', `Total: ${foreigners.length} dossiers`]);
      footerRow.font = { italic: true, color: { argb: 'FF888888' } };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="dgm-etrangers-${dateStr}.xlsx"`);
      await wb.xlsx.write(res);
      return res.end();
    }

    if (format === 'pdf') {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 30 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="dgm-etrangers-${dateStr}.pdf"`);
      doc.pipe(res);

      doc.fontSize(16).fillColor('#003087').text('DIRECTION GÉNÉRALE DE MIGRATION — RDC', { align: 'center' });
      doc.fontSize(11).fillColor('#444').text('Liste des Dossiers Étrangers', { align: 'center' });
      doc.fontSize(8).fillColor('#888').text(`Exporté le ${moment().format('DD/MM/YYYY à HH:mm')} | Total: ${foreigners.length} dossiers`, { align: 'center' });
      doc.moveDown(0.5);
      doc.moveTo(30, doc.y).lineTo(800, doc.y).strokeColor('#003087').lineWidth(1.5).stroke();
      doc.moveDown(0.5);

      const colWidths = [110, 85, 85, 55, 70, 70, 75, 65, 65];
      const headers = ['N° Dossier', 'Nom', 'Prénom(s)', 'Nationalité', 'N° Passeport', 'Exp. Passeport', 'Type Visa', 'Statut', 'Présence'];
      let x = 30;
      const headerY = doc.y;
      doc.rect(30, headerY, colWidths.reduce((a, b) => a + b, 0), 16).fill('#003087');
      headers.forEach((h, i) => {
        doc.fontSize(7).fillColor('#FFFFFF').text(h, x + 2, headerY + 4, { width: colWidths[i] - 4, ellipsis: true });
        x += colWidths[i];
      });
      doc.y = headerY + 18;

      foreigners.forEach((f, idx) => {
        if (doc.y > 520) {
          doc.addPage({ layout: 'landscape', size: 'A4', margin: 30 });
        }
        const rowY = doc.y;
        const rowH = 14;
        if (idx % 2 === 0) {
          doc.rect(30, rowY, colWidths.reduce((a, b) => a + b, 0), rowH).fill('#F0F4FF');
        }
        x = 30;
        const cells = [
          f.dossierNumber || '',
          f.lastName || '',
          f.firstName || '',
          f.nationality || '',
          f.passport?.number || '',
          f.passport?.expiryDate ? moment(f.passport.expiryDate).format('DD/MM/YY') : '',
          f.visa?.type || '',
          f.currentStatus || '',
          f.presenceStatus || '',
        ];
        cells.forEach((cell, i) => {
          const color = (f.isBlacklisted && i === 7) ? '#D32F2F' : '#222';
          doc.fontSize(7).fillColor(color).text(cell, x + 2, rowY + 3, { width: colWidths[i] - 4, ellipsis: true });
          x += colWidths[i];
        });
        doc.y = rowY + rowH + 1;
      });

      doc.end();
      return;
    }

    res.status(400).json({ success: false, message: 'Format non supporté. Utilisez xlsx ou pdf.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'export.', error: err.message });
  }
};
