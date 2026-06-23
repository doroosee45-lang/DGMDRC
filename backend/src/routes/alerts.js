const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/alertController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/stats', authorize('READ_ALERTS'), ctrl.getStats);
router.get('/', authorize('READ_ALERTS'), ctrl.getAll);
router.post('/', authorize('CREATE_ALERT'), ctrl.create);
router.patch('/:id/resolve', authorize('CREATE_ALERT'), ctrl.resolve);

module.exports = router;
