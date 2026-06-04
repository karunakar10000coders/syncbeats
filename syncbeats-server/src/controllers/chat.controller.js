const Message = require('../models/Message');

class ChatController {
  static async getMessages(req, res, next) {
    try {
      const { roomId } = req.params;
      const { limit, offset } = req.query;
      
      const messages = await Message.getByRoom(
        roomId, 
        limit ? parseInt(limit, 10) : 50, 
        offset ? parseInt(offset, 10) : 0
      );

      res.status(200).json({
        success: true,
        data: messages
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ChatController;
