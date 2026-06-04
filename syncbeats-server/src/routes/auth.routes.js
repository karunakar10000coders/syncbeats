const express = require('express');
const AuthController = require('../controllers/auth.controller');
const validateRequest = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');
const authenticate = require('../middleware/auth');
const { z } = require('zod');

const router = express.Router();

const registerSchema = z.object({
  body: z.object({
    display_name: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(6)
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string()
  })
});

const guestSchema = z.object({
  body: z.object({
    display_name: z.string().min(2).max(50).optional()
  })
});

router.post('/register', authLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/login', authLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/guest', authLimiter, validateRequest(guestSchema), AuthController.guest);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', authenticate, AuthController.logout);

module.exports = router;
