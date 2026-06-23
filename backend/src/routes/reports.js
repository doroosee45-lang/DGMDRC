const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/dashboard', ctrl.getDashboard);
router.get('/statistics', authorize('READ_STATS'), ctrl.getStats);
router.get('/export', authorize('READ_STATS'), ctrl.exportForeigners);

module.exports = router;
