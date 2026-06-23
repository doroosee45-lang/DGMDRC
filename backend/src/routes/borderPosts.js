const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/borderPostController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/', ctrl.getAll);
router.post('/', authorize('MANAGE_BORDER_POSTS'), ctrl.create);
router.put('/:id', authorize('MANAGE_BORDER_POSTS'), ctrl.update);

module.exports = router;
