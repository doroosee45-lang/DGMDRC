const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auditController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.use(authorize('READ_AUDIT_LOGS'));

router.get('/', ctrl.getLogs);
router.get('/stats', ctrl.getStats);
router.get('/verify-chain', ctrl.verifyChain);

module.exports = router;
