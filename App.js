import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, StatusBar, Alert, Platform, PermissionsAndroid } from 'react-native';
import MessageList from './components/MessageList';
import StorageService from './services/StorageService';
import SmsListener from './services/SmsListener';
import ApiService from './services/ApiService';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    requestPermissions();
    loadMessages();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        ]);

        if (
          granted['android.permission.READ_SMS'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.RECEIVE_SMS'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          setPermissionGranted(true);
          startSmsListener();
        } else {
          Alert.alert('Permission Required', 'This app needs SMS permissions to work.');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const loadMessages = async () => {
    const storedMessages = await StorageService.getMessages();
    setMessages(storedMessages);
  };

  const startSmsListener = () => {
    SmsListener.startListening((sms) => {
      handleNewSms(sms);
    });
  };

  const handleNewSms = async (sms) => {
    // Filter only bKash messages
    const messageText = sms.body || sms.message || '';
    
    if (messageText.includes('Tk') && messageText.includes('TrxID')) {
      // Parse the SMS
      const parsedData = parseSms(messageText);
      
      // Save to local storage
      await StorageService.saveMessage(parsedData);
      
      // Reload messages
      await loadMessages();
      
      // Try to send to server
      ApiService.sendToServer(parsedData);
    }
  };

  const parseSms = (messageText) => {
    const timestamp = new Date().toISOString();
    
    // Extract amount (after "Tk")
    const amountMatch = messageText.match(/Tk\s*([\d,]+(?:\.\d{2})?)/i);
    const amount = amountMatch ? amountMatch[1].replace(/,/g, '') : '0';
    
    // Extract transaction ID (after "TrxID:")
    const trxIdMatch = messageText.match(/TrxID[:\s]+([A-Z0-9]+)/i);
    const trxId = trxIdMatch ? trxIdMatch[1] : 'N/A';
    
    return {
      id: Date.now().toString(),
      amount: amount,
      trxId: trxId,
      message: messageText,
      timestamp: timestamp,
      synced: false
    };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#E2136E" />
      
      <View style={styles.header}>
        <Text style={styles.headerText}>bKash Payment Tracker</Text>
        <Text style={styles.subHeaderText}>
          {permissionGranted ? '✓ Listening for SMS' : '⚠ Waiting for permissions'}
        </Text>
      </View>

      <MessageList messages={messages} onRefresh={loadMessages} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3513e2',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subHeaderText: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
});