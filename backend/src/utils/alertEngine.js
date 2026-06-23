const cron = require('node-cron');
const Foreigner = require('../models/Foreigner');
const Alert = require('../models/Alert');
const moment = require('moment');

const checkAndCreateAlert = async (foreignerId, type, severity, message, notifiedRoles) => {
  const existing = await Alert.findOne({ foreignerId, type, status: { $in: ['ACTIVE', 'EN_TRAITEMENT'] } });
  if (!existing) {
    await Alert.create({ foreignerId, type, severity, message, isAutomatic: true, notifiedRoles });
  }
};

const runAlertEngine = async () => {
  try {
    const now = moment();
    const in15Days = moment().add(15, 'days').toDate();
    const in30Days = moment().add(30, 'days').toDate();

    const expiredVisas = await Foreigner.find({ isActive: true, presenceStatus: 'PRESENT', 'visa.expiryDate': { $lt: now.toDate() } });
    for (const f of expiredVisas) {
      await checkAndCreateAlert(f._id, 'VISA_EXPIRE', 'CRITIQUE', `Visa expiré le ${moment(f.visa.expiryDate).format('DD/MM/YYYY')} — ${f.lastName} ${f.firstName}`, ['ADMIN_NATIONAL', 'AGENT_DGM', 'POLICE_NATIONALE']);
      if (f.currentStatus !== 'EN_INFRACTION' && f.currentStatus !== 'BLACKLISTE') {
        f.currentStatus = 'EN_ALERTE';
        await f.save();
      }
    }

    const visasExpiringIn15 = await Foreigner.find({ isActive: true, presenceStatus: 'PRESENT', 'visa.expiryDate': { $gt: now.toDate(), $lte: in15Days } });
    for (const f of visasExpiringIn15) {
      const daysLeft = moment(f.visa.expiryDate).diff(now, 'days');
      await checkAndCreateAlert(f._id, 'DEPASSEMENT_SEJOUR', 'HAUTE', `Visa expire dans ${daysLeft} jour(s) — ${f.lastName} ${f.firstName}`, ['AGENT_DGM']);
    }

    const passportsExpiring = await Foreigner.find({ isActive: true, 'passport.expiryDate': { $gt: now.toDate(), $lte: in30Days } });
    for (const f of passportsExpiring) {
      const daysLeft = moment(f.passport.expiryDate).diff(now, 'days');
      await checkAndCreateAlert(f._id, 'PASSEPORT_EXPIRE', 'HAUTE', `Passeport expire dans ${daysLeft} jour(s) — ${f.lastName} ${f.firstName}`, ['AGENT_DGM']);
    }

    console.log(`✅ Moteur d'alertes exécuté: ${expiredVisas.length} visas expirés, ${visasExpiringIn15.length} expirés bientôt`);
  } catch (err) {
    console.error('❌ Erreur moteur d\'alertes:', err.message);
  }
};

const startAlertEngine = () => {
  cron.schedule('0 */6 * * *', runAlertEngine);
  console.log('🔔 Moteur d\'alertes démarré (toutes les 6 heures)');
  runAlertEngine();
};

module.exports = { startAlertEngine, runAlertEngine };
