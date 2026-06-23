const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.post('/change-password', ctrl.changePassword);
router.get('/', authorize('MANAGE_USERS'), ctrl.getAll);
router.post('/', authorize('MANAGE_USERS'), ctrl.create);
router.put('/:id', authorize('MANAGE_USERS'), ctrl.update);
router.delete('/:id', authorize('DEACTIVATE_ACCOUNT'), ctrl.deactivate);

module.exports = router;
