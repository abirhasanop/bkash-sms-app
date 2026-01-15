import { Platform } from 'react-native';

let SmsListenerModule = null;

// Try to import the native module (will only work in built APK, not Expo Go)
if (Platform.OS === 'android') {
  try {
    SmsListenerModule = require('react-native-android-sms-listener');
  } catch (e) {
    console.log('SMS Listener not available - will work after APK build');
  }
}

const SmsListener = {
  startListening: (callback) => {
    if (!SmsListenerModule) {
      console.log('SMS Listener module not loaded. This will work in the built APK.');
      return null;
    }

    try {
      const subscription = SmsListenerModule.addListener(message => {
        callback(message);
      });

      return subscription;
    } catch (error) {
      console.error('Error starting SMS listener:', error);
      return null;
    }
  },

  stopListening: (subscription) => {
    if (subscription) {
      subscription.remove();
    }
  }
};

export default SmsListener;