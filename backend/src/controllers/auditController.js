const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');

exports.getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action, targetType, dateFrom, dateTo, severity } = req.query;
    const query = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (targetType) query.targetType = targetType;
    if (severity) query.severity = severity;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: logs, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.verifyChain = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: 1 });
    let isValid = true;
    const issues = [];

    for (let i = 1; i < logs.length; i++) {
      const expected = logs[i].previousHash;
      const actual = logs[i - 1].hash;
      if (expected !== actual) {
        isValid = false;
        issues.push({ logId: logs[i]._id, index: i, expectedHash: expected, actualHash: actual });
      }
    }

    res.json({ success: true, data: { isValid, totalLogs: logs.length, issues } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [totalLogs, todayLogs, byAction, bySeverity] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ createdAt: { $gte: today } }),
      AuditLog.aggregate([{ $group: { _id: '$action', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      AuditLog.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
    ]);
    res.json({ success: true, data: { totalLogs, todayLogs, byAction, bySeverity } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
