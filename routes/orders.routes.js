const router = require('express').Router();
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  res.json({
    success: true,
    orders: []
  });
});

router.post('/', auth, async (req, res) => {
  res.json({
    success: true,
    message: 'Order created'
  });
});

module.exports = router;