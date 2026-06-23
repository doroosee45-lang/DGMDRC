const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/correctionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/', authorize('SUBMIT_CORRECTION'), ctrl.getAll);
router.post('/', authorize('SUBMIT_CORRECTION'), ctrl.submit);
router.patch('/:id/validate', authorize('VALIDATE_CORRECTION'), ctrl.validate);

module.exports = router;
