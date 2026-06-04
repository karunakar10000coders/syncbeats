const express = require('express');
const ChatController = require('../controllers/chat.controller');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/:roomId/messages', authenticate, ChatController.getMessages);

module.exports = router;
