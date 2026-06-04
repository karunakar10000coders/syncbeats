const express = require('express');
const RoomController = require('../controllers/room.controller');
const authenticate = require('../middleware/auth');
const validateRequest = require('../middleware/validation');
const { z } = require('zod');

const router = express.Router();

const createRoomSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    settings: z.object({
      max_members: z.number().min(2).max(100).optional(),
      democratic_queue: z.boolean().optional(),
      allow_guest_queue: z.boolean().optional(),
      require_song_match: z.boolean().optional()
    }).optional()
  })
});

const joinRoomSchema = z.object({
  body: z.object({
    code: z.string().length(6),
    device_type: z.enum(['android', 'ios', 'web', 'desktop']).optional()
  })
});

const transferHostSchema = z.object({
  body: z.object({
    newHostId: z.string().uuid()
  })
});

router.post('/', authenticate, validateRequest(createRoomSchema), RoomController.create);
router.post('/join', authenticate, validateRequest(joinRoomSchema), RoomController.join);
router.get('/:id', authenticate, RoomController.getById);
router.get('/code/:code', authenticate, RoomController.getByCode);
router.post('/:id/leave', authenticate, RoomController.leave);
router.put('/:id/settings', authenticate, RoomController.updateSettings);
router.post('/:id/transfer-host', authenticate, validateRequest(transferHostSchema), RoomController.transferHost);

module.exports = router;
