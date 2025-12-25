// notificationController.js
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const createNotification = async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;

    if (!sender || !isValidObjectId(sender)) {
      return res.status(400).json({ message: 'ID de l\'expéditeur valide requis' });
    }
    if (!receiver || !isValidObjectId(receiver)) {
      return res.status(400).json({ message: 'ID du destinataire valide requis' });
    }
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ message: 'Le message est requis et doit être une chaîne non vide' });
    }

    const senderUser = await User.findById(sender);
    if (!senderUser) {
      return res.status(404).json({ message: 'Expéditeur non trouvé' });
    }
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({ message: 'Destinataire non trouvé' });
    }

    const newNotification = new Notification({
      sender,
      receiver,
      message,
      isRead: false,
    });

    console.log('Création de la notification avec les données:', newNotification);

    const savedNotification = await newNotification.save();

    console.log('Notification enregistrée avec succès:', savedNotification);

    if (receiverUser.email) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: receiverUser.email,
        subject: `Nouvelle notification de ${senderUser.name || 'un utilisateur'}`,
        text: `Cher ${receiverUser.name || 'Utilisateur'},

Vous avez reçu une nouvelle notification :

Message : ${message}

Vous pouvez voir cette notification dans votre compte.

Cordialement,
L'équipe de la plateforme`,
        html: `
          <div style="font-family: Arial, sans-serif; color: black;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="cid:logo" alt="Logo de la plateforme" style="max-width: 150px; height: auto;" />
            </div>
            <h2 style="color: #228b22;">Nouvelle notification</h2>
            <p>Cher ${receiverUser.name || 'Utilisateur'},</p>
            <p>Vous avez reçu une nouvelle notification :</p>
            <p><strong>Message :</strong> ${message}</p>
            <p>Vous pouvez voir cette notification dans votre compte.</p>
            <p>Cordialement,<br>L'équipe de la plateforme</p>
          </div>
        `,
        attachments: [],
      };

      const logoPath = path.join(__dirname, '../uploads/logo.png');
      if (fs.existsSync(logoPath)) {
        mailOptions.attachments.push({
          filename: 'logo.png',
          path: logoPath,
          cid: 'logo',
        });
      } else {
        console.warn('Fichier de logo non trouvé à:', logoPath);
        mailOptions.html = mailOptions.html.replace('<img src="cid:logo" alt="Logo de la plateforme" style="max-width: 150px; height: auto;" />', '');
      }

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Email envoyé à ${receiverUser.email}`);
      } catch (emailError) {
        console.error('Échec de l\'envoi de l\'email:', emailError);
      }
    } else {
      console.warn(`Email du destinataire non trouvé pour l'ID du destinataire : ${receiver}`);
    }

    res.status(201).json({ message: 'Notification créée avec succès', notification: savedNotification });
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la création de la notification', error: error.message });
  }
};

const getNotificationsByReceiver = async (req, res) => {
  try {
    const { receiverId } = req.params;
    if (!isValidObjectId(receiverId)) {
      return res.status(400).json({ message: 'ID du destinataire invalide' });
    }

    const notifications = await Notification.find({ receiver: receiverId })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des notifications', error: error.message });
  }
};

const getNotificationById = async (req, res) => {
  try {
    const { notificationId } = req.params;
    if (!isValidObjectId(notificationId)) {
      return res.status(400).json({ message: 'ID de notification invalide' });
    }

    const notification = await Notification.findById(notificationId)
      .populate('sender', 'name email')
      .populate('receiver', 'name email');

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    res.status(200).json({ notification });
  } catch (error) {
    console.error('Erreur lors de la récupération de la notification:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération de la notification', error: error.message });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    if (!isValidObjectId(notificationId)) {
      return res.status(400).json({ message: 'ID de notification invalide' });
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ message: 'Notification marquée comme lue', notification });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la notification:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de la notification', error: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    if (!isValidObjectId(notificationId)) {
      return res.status(400).json({ message: 'ID de notification invalide' });
    }

    const notification = await Notification.findByIdAndDelete(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    res.status(200).json({ message: 'Notification supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression de la notification', error: error.message });
  }
};

const getUnreadNotificationsCount = async (req, res) => {
  try {
    const { receiverId } = req.params;
    if (!isValidObjectId(receiverId)) {
      return res.status(400).json({ message: 'ID du destinataire invalide' });
    }

    const count = await Notification.countDocuments({ receiver: receiverId, isRead: false });

    res.status(200).json({ unreadCount: count });
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre de notifications non lues:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération du nombre de notifications non lues', error:emailError.message });
  }
};

module.exports = {
  createNotification,
  getNotificationsByReceiver,
  getNotificationById,
  markNotificationAsRead,
  deleteNotification,
  getUnreadNotificationsCount,
};