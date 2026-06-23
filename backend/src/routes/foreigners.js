const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const ctrl = require('../controllers/foreignerController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const uploadDir = path.join(__dirname, '../../uploads/photos');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Format non supporté. JPEG, PNG ou WEBP requis.'));
  },
});

router.use(protect);

router.get('/stats', authorize('READ_STATS'), ctrl.getStats);
router.get('/check-blacklist/:passportNumber', authorize('READ_DOSSIER_SUMMARY'), ctrl.checkBlacklist);
router.get('/', authorize('READ_DOSSIER_SUMMARY'), ctrl.getAll);
router.post('/', authorize('CREATE_DOSSIER'), ctrl.create);
router.get('/:id', authorize('READ_DOSSIER_SUMMARY'), ctrl.getOne);
router.put('/:id', authorize('CREATE_DOSSIER'), ctrl.update);
router.patch('/:id/photo', authorize('CREATE_DOSSIER'), upload.single('photo'), ctrl.updatePhoto);

module.exports = router;
