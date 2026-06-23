const BorderPost = require('../models/BorderPost');

exports.getAll = async (req, res) => {
  try {
    const { type, province, isActive } = req.query;
    const query = {};
    if (type) query.type = type;
    if (province) query.province = province;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    else query.isActive = true;
    const posts = await BorderPost.find(query).populate('responsable', 'name email').sort({ type: 1, name: 1 });
    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.create = async (req, res) => {
  try {
    const post = await BorderPost.create(req.body);
    res.status(201).json({ success: true, data: post, message: 'Poste frontalier créé.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const post = await BorderPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ success: false, message: 'Poste introuvable.' });
    res.json({ success: true, data: post, message: 'Poste mis à jour.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
