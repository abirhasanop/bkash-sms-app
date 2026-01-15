import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@bkash_messages';

const StorageService = {
  // Save a new message
  saveMessage: async (message) => {
    try {
      const existingMessages = await StorageService.getMessages();
      const updatedMessages = [message, ...existingMessages];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));
      return true;
    } catch (error) {
      console.error('Error saving message:', error);
      return false;
    }
  },

  // Get all messages
  getMessages: async () => {
    try {
      const messages = await AsyncStorage.getItem(STORAGE_KEY);
      return messages ? JSON.parse(messages) : [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  },

  // Update message sync status
  updateSyncStatus: async (messageId) => {
    try {
      const messages = await StorageService.getMessages();
      const updatedMessages = messages.map(msg => 
        msg.id === messageId ? { ...msg, synced: true } : msg
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));
      return true;
    } catch (error) {
      console.error('Error updating sync status:', error);
      return false;
    }
  },

  // Clear all messages (optional - for testing)
  clearAll: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing messages:', error);
      return false;
    }
  }
};

export default StorageService;