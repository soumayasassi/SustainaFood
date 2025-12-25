import axios from "axios";

// Créer une notification
export const createnotification = async (requestData) => {
  try {
    const response = await axios.post('http://localhost:3000/notification', requestData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
};

// Obtenir toutes les notifications d'un récepteur
export const getNotificationsByReceiver = async (receiverId) => {
  try {
    const response = await axios.get(`http://localhost:3000/notification/receiver/${receiverId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
};

// Obtenir une notification par son ID
export const getNotificationById = async (notificationId) => {
  try {
    const response = await axios.get(`http://localhost:3000/notification/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notification by ID:', error);
    throw new Error('Failed to fetch notification by ID');
  }
};

// Marquer une notification comme lue
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await axios.put(`http://localhost:3000/notification/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
};

// Supprimer une notification
export const deleteNotification = async (notificationId) => {
  try {
    const response = await axios.delete(`http://localhost:3000/notification/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw new Error('Failed to delete notification');
  }
};

// Obtenir le nombre de notifications non lues pour un récepteur
export const getUnreadNotificationsCount = async (receiverId) => {
  try {
    const response = await axios.get(`http://localhost:3000/notification/receiver/${receiverId}/unread-count`);
    return response.data;
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    throw new Error('Failed to fetch unread notifications count');
  }
};
