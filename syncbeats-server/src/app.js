const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Middlewares
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const roomRoutes = require('./routes/room.routes');
const libraryRoutes = require('./routes/library.routes');
const queueRoutes = require('./routes/queue.routes');
const chatRoutes = require('./routes/chat.routes');

const app = express();

// Secure headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: '*', // In production, replace with specific origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logger middleware
app.use(morgan('dev'));

// Parse requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'OK', timestamp: new Date() });
});

// Register routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', apiLimiter, roomRoutes);
app.use('/api/library', apiLimiter, libraryRoutes);
app.use('/api/queue', apiLimiter, queueRoutes);
app.use('/api/chat', apiLimiter, chatRoutes);

// Fallback 404
app.use((req, res, next) => {
  const err = new Error('Resource not found');
  err.statusCode = 404;
  err.code = 'NOT_FOUND';
  next(err);
});

// Global error handler
app.use(errorHandler);

module.exports = app;
