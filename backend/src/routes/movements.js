const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/movementController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/', authorize('READ_DOSSIER_FULL'), ctrl.getAll);
router.post('/', authorize('REGISTER_MOVEMENT'), ctrl.register);
router.get('/:foreignerId', authorize('READ_DOSSIER_SUMMARY'), ctrl.getByForeigner);

module.exports = router;
