const express = require('express');
const QueueController = require('../controllers/queue.controller');
const authenticate = require('../middleware/auth');
const validateRequest = require('../middleware/validation');
const { z } = require('zod');

const router = express.Router();

const addToQueueSchema = z.object({
  body: z.object({
    songId: z.string().uuid()
  })
});

const reorderQueueSchema = z.object({
  body: z.object({
    itemId: z.string().uuid(),
    newPosition: z.number().min(0)
  })
});

const voteQueueSchema = z.object({
  body: z.object({
    direction: z.enum(['up', 'down'])
  })
});

router.get('/:roomId', authenticate, QueueController.getQueue);
router.post('/:roomId', authenticate, validateRequest(addToQueueSchema), QueueController.addToQueue);
router.delete('/:roomId/:itemId', authenticate, QueueController.removeFromQueue);
router.put('/:roomId/reorder', authenticate, validateRequest(reorderQueueSchema), QueueController.reorderQueue);
router.post('/:roomId/:itemId/vote', authenticate, validateRequest(voteQueueSchema), QueueController.voteOnItem);

module.exports = router;
