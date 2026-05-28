const router = require('express').Router();
const upload = require('../middleware/upload');

router.post('/', upload.single('file'), (req, res) => {
  res.json({
    success: true,
    file: req.file
  });
});

module.exports = router;