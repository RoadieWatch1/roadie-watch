import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SparkleBackground } from '../src/components/SparkleBackground';
import LocationService, { LocationData } from '../src/utils/LocationService';
import NotificationService from '../src/utils/NotificationService';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  isWatcher: boolean;
}

export default function LiveTrackingScreen() {
  const router = useRouter();
  const [duration, setDuration] = useState(0);
  const [watchersOnline, setWatchersOnline] = useState(3);
  const [showChat, setShowChat] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'SOS activated - monitoring your location', sender: 'Sarah', timestamp: '12:34', isWatcher: true },
    { id: '2', text: 'We can see you, stay safe!', sender: 'Mike', timestamp: '12:35', isWatcher: true }
  ]);

  const locationService = LocationService.getInstance();
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    locationService.startContinuousTracking();

    const locationInterval = setInterval(async () => {
      const loc = await locationService.getCurrentLocation();
      setCurrentLocation(loc);
    }, 5000);

    const durationInterval = setInterval(() => {
      setDuration(prev => {
        const newDuration = prev + 1;
        // Auto-expire after 30 minutes (1800 seconds)
        if (newDuration >= 1800) {
          locationService.stopLocationTracking();
          notificationService.sendSessionEnded();
          Alert.alert(
            'Session Expired',
            'Live tracking has been automatically stopped after 30 minutes.',
            [{ text: 'OK', onPress: () => router.push('/followers') }]
          );
          return prev;
        }
        return newDuration;
      });
    }, 1000);

    return () => {
      clearInterval(locationInterval);
      clearInterval(durationInterval);
      locationService.stopLocationTracking();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const stopTracking = () => {
    Alert.alert(
      'Stop Live Tracking',
      'Are you sure you want to stop live tracking? Your watchers will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Stop', 
          style: 'destructive',
          onPress: () => {
            locationService.stopLocationTracking();
            Alert.alert('Tracking Stopped', 'Your watchers have been notified that you are safe.', [
              { text: 'OK', onPress: () => router.push('/followers') }
            ]);
          }
        }
      ]
    );
  };

  const sendUpdate = async () => {
    await notificationService.sendLocalNotification({
      title: 'Safety Update',
      body: 'User has sent an "I\'m safe" update'
    });
    
    Alert.alert('Update Sent', 'Your watchers have been notified that you are safe.');
    const newMessage: Message = {
      id: Date.now().toString(),
      text: 'I\'m safe - automatic update',
      sender: 'You',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      isWatcher: false
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const renderMessage = (message: Message) => (
    <View key={message.id} style={[
      styles.messageContainer,
      message.isWatcher ? styles.watcherMessage : styles.userMessage
    ]}>
      <Text style={styles.senderName}>{message.sender}</Text>
      <Text style={styles.messageText}>{message.text}</Text>
      <Text style={styles.timestamp}>{message.timestamp}</Text>
    </View>
  );

  return (
    <SparkleBackground>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>🔴 LIVE TRACKING ACTIVE</Text>
        
        <View style={styles.statusCard}>
          <Text style={styles.duration}>{formatTime(duration)}</Text>
          <Text style={styles.durationLabel}>Duration</Text>
          
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{watchersOnline}</Text>
              <Text style={styles.statLabel}>Watchers Online</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{currentLocation ? '📍' : '❌'}</Text>
              <Text style={styles.statLabel}>GPS {currentLocation ? 'Active' : 'Searching'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>🎥</Text>
              <Text style={styles.statLabel}>Recording</Text>
            </View>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.infoText}>• Your location is being shared with watchers</Text>
          <Text style={styles.infoText}>• Emergency contacts have been notified</Text>
          <Text style={styles.infoText}>• Audio and video recording active</Text>
          <Text style={styles.infoText}>• Auto-stop in {Math.floor((1800 - duration) / 60)} minutes</Text>
          {currentLocation && (
            <Text style={styles.infoText}>• Last location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}</Text>
          )}
        </View>

        {showChat && (
          <View style={styles.chatSection}>
            <Text style={styles.chatTitle}>Emergency Chat</Text>
            <View style={styles.messagesContainer}>
              {messages.map(renderMessage)}
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={() => setShowChat(!showChat)}
          >
            <Text style={styles.chatButtonText}>
              {showChat ? 'Hide Chat' : 'Show Chat'} ({messages.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.updateButton} onPress={sendUpdate}>
            <Text style={styles.updateButtonText}>Send "I'm Safe" Update</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.stopButton} onPress={stopTracking}>
            <Text style={styles.stopButtonText}>Stop Tracking</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SparkleBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FF4444', textAlign: 'center', marginTop: 40, marginBottom: 30 },
  statusCard: { backgroundColor: '#333', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 30, borderWidth: 2, borderColor: '#FF4444' },
  duration: { fontSize: 36, fontWeight: 'bold', color: '#FF4444', marginBottom: 5 },
  durationLabel: { fontSize: 16, color: '#ccc', marginBottom: 20 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#007AFF' },
  statLabel: { fontSize: 12, color: '#ccc', marginTop: 5, textAlign: 'center' },
  info: { marginBottom: 30 },
  infoText: { fontSize: 16, color: '#ccc', marginBottom: 8, lineHeight: 22 },
  chatSection: { backgroundColor: '#222', borderRadius: 15, padding: 15, marginBottom: 30 },
  chatTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 15 },
  messagesContainer: { maxHeight: 200 },
  messageContainer: { marginVertical: 5, padding: 10, borderRadius: 10, maxWidth: '80%' },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#FF4444' },
  watcherMessage: { alignSelf: 'flex-start', backgroundColor: '#444' },
  senderName: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  messageText: { color: '#fff', fontSize: 14 },
  timestamp: { color: '#ccc', fontSize: 10, marginTop: 2 },
  actions: { gap: 15, paddingBottom: 30 },
  chatButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10 },
  chatButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  updateButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10 },
  updateButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  stopButton: { backgroundColor: '#FF4444', padding: 18, borderRadius: 10 },
  stopButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' }
});