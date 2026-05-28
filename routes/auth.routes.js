const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (email !== 'admin@test.com') {
    return res.status(400).json({
      success: false,
      message: 'User not found'
    });
  }

  const valid = await bcrypt.compare(password, '$2a$10$abcdefghijk');

  if (!valid) {
    return res.status(400).json({
      success: false,
      message: 'Wrong password'
    });
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

  res.json({
    success: true,
    token
  });
});

module.exports = router;