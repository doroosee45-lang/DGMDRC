const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/blacklistController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/check/:passportNumber', authorize('READ_DOSSIER_SUMMARY'), ctrl.check);
router.get('/', authorize('BLACKLIST'), ctrl.getAll);
router.post('/', authorize('BLACKLIST'), ctrl.add);
router.patch('/:id/lift', authorize('BLACKLIST'), ctrl.lift);

module.exports = router;
