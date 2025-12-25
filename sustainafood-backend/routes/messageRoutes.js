const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');

// POST /messages/:chatId/mark-as-read - Mark all messages in a chat as read
router.post('/:chatId/mark-as-read', async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const userId = req.header('X-User-Id');

    if (!userId) {
      return res.status(401).json({ error: 'User ID requis' });
    }

    if (!chatId.includes(userId)) {
      return res.status(403).json({ error: 'Accès non autorisé à cette conversation' });
    }

    await Message.updateMany(
      { chatId, receiver: userId, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des messages:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des messages', details: error.message });
  }
});
// GET /messages/conversations - Fetch all conversations for the user
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.header('X-User-Id');

    if (!userId) {
      return res.status(401).json({ error: 'User ID requis' });
    }

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate('sender', 'name photo')
      .populate('receiver', 'name photo')
      .sort({ timestamp: -1 });

    const conversationsMap = new Map();
    for (const message of messages) {
      if (!conversationsMap.has(message.chatId)) {
        const participants = [
          { _id: message.sender._id, name: message.sender.name, photo: message.sender.photo },
          { _id: message.receiver._id, name: message.receiver.name, photo: message.receiver.photo },
        ];

        // Calculate unread count for this chat (messages sent to userId that are not read)
        const unreadCount = await Message.countDocuments({
          chatId: message.chatId,
          receiver: userId,
          read: false,
        });

        conversationsMap.set(message.chatId, {
          chatId: message.chatId,
          participants,
          lastMessage: message,
          unreadCount,
        });
      }
    }

    const conversations = Array.from(conversationsMap.values());
    res.json(conversations);
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des conversations', details: error.message });
  }
});
// Existing routes (GET /:chatId/messages and POST /) remain unchanged
router.get('/:chatId/messages', async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const userId = req.header('X-User-Id');

    if (!userId) {
      return res.status(401).json({ error: 'User ID requis' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    if (!chatId.includes(userId)) {
      return res.status(403).json({ error: 'Accès non autorisé à cette conversation' });
    }

    const messages = await Message.find({ chatId })
      .sort({ timestamp: 1 })
      .populate('sender', 'name photo')
      .populate('receiver', 'name photo');

    res.json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des messages', details: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { chatId, receiver, content } = req.body;
    const sender = req.header('X-User-Id');

    if (!chatId || !receiver || !content || !sender) {
      return res.status(400).json({ error: 'chatId, receiver, content et userId sont requis' });
    }

    const user = await User.findById(sender);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    const recipient = await User.findById(receiver);
    if (!recipient) {
      return res.status(400).json({ error: 'Destinataire non trouvé' });
    }

    if (!chatId.includes(sender)) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à envoyer dans cette conversation' });
    }

    const message = new Message({
      chatId,
      content,
      sender,
      receiver,
      timestamp: new Date(),
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name photo')
      .populate('receiver', 'name photo');

    const io = req.app.get('io');
    io.to(chatId).emit('message', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Erreur lors de la création du message:', error);
    res.status(500).json({ error: 'Erreur lors de la création du message', details: error.message });
  }
});

module.exports = router;