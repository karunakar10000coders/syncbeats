const express = require('express');
const LibraryController = require('../controllers/library.controller');
const authenticate = require('../middleware/auth');
const validateRequest = require('../middleware/validation');
const { z } = require('zod');

const router = express.Router();

const songSchema = z.object({
  title: z.string(),
  artist: z.string().optional(),
  album: z.string().optional(),
  duration_ms: z.number(),
  file_path: z.string(),
  file_hash: z.string(),
  format: z.enum(['mp3', 'wav', 'm4a', 'aac', 'flac']),
  file_size: z.number().optional(),
  fingerprint: z.string().optional(),
  artwork_url: z.string().optional()
});

const syncLibrarySchema = z.object({
  body: z.object({
    songs: z.array(songSchema)
  })
});

router.post('/sync', authenticate, validateRequest(syncLibrarySchema), LibraryController.syncLibrary);
router.get('/', authenticate, LibraryController.getLibrary);
router.delete('/:songId', authenticate, LibraryController.removeSong);
router.get('/match/:roomId', authenticate, LibraryController.getMatchStatus);

module.exports = router;
