const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const security = require('./middleware/security');
const limiter = require('./middleware/limiter');

const authRoutes = require('./routes/auth.routes');
const orderRoutes = require('./routes/orders.routes');
const userRoutes = require('./routes/users.routes');
const uploadRoutes = require('./routes/upload.routes');

const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(morgan('dev'));

security(app);
app.use(limiter);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Amer On The Road API Running'
  });
});

app.use(errorHandler);

module.exports = app;