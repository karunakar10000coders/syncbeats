const express = require('express');
const UserController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth');
const validateRequest = require('../middleware/validation');
const { z } = require('zod');

const router = express.Router();

const updateProfileSchema = z.object({
  body: z.object({
    display_name: z.string().min(2).max(50).optional(),
    avatar_url: z.string().url().optional()
  })
});

router.get('/me', authenticate, UserController.getProfile);
router.put('/me', authenticate, validateRequest(updateProfileSchema), UserController.updateProfile);

module.exports = router;
