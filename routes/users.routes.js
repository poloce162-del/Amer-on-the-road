const router = require('express').Router();
const auth = require('../middleware/auth');

router.get('/profile', auth, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;