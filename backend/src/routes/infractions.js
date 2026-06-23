const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/infractionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/', authorize('READ_INFRACTIONS'), ctrl.getAll);
router.post('/', authorize('ADD_INFRACTION'), ctrl.create);
router.get('/:foreignerId', authorize('READ_INFRACTIONS'), ctrl.getByForeigner);
router.patch('/:id', authorize('ADD_INFRACTION'), ctrl.update);

module.exports = router;
