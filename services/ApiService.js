import axios from 'axios';
import StorageService from './StorageService';

// CHANGE THIS TO YOUR SERVER URL
const API_ENDPOINT = 'https://your-server.com/api/payments';

const ApiService = {
  sendToServer: async (messageData) => {
    try {
      const payload = {
        amount: messageData.amount,
        trxId: messageData.trxId,
        timestamp: messageData.timestamp,
        message: messageData.message
      };

      const response = await axios.post(API_ENDPOINT, payload, {
        timeout: 10000, // 10 seconds timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.status === 200 || response.status === 201) {
        // Mark as synced in local storage
        await StorageService.updateSyncStatus(messageData.id);
        console.log('Successfully sent to server:', messageData.trxId);
        return true;
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.log('Request timeout - will retry later');
      } else if (error.response) {
        console.log('Server error:', error.response.status);
      } else if (error.request) {
        console.log('No internet connection - will retry later');
      } else {
        console.log('Error:', error.message);
      }
      return false;
    }
  },

  // Retry sending unsent messages
  retryUnsynced: async () => {
    const messages = await StorageService.getMessages();
    const unsyncedMessages = messages.filter(msg => !msg.synced);

    for (const message of unsyncedMessages) {
      await ApiService.sendToServer(message);
    }
  }
};

export default ApiService;