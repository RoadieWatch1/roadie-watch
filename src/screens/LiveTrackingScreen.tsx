import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Vibration, TouchableWithoutFeedback, Animated, BackHandler } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SparkleBackground } from '../components/SparkleBackground';
import { ChatComponent } from '../components/ChatComponent';
import * as Haptics from 'expo-haptics';
import * as ScreenCapture from 'expo-screen-capture';
import { StatusBar } from 'expo-status-bar';
import LocationService from '../utils/LocationService';
import { useVoiceActivation } from '../components/VoiceActivationProvider';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  isWatcher: boolean;
}

export default function LiveTrackingScreen() {
  const params = useLocalSearchParams<{ stealthMode: string }>();
  const stealthMode = params.stealthMode === 'true';
  const [isActive, setIsActive] = useState(true);
  const [duration, setDuration] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [watchersCount, setWatchersCount] = useState(3);
  const [showChat, setShowChat] = useState(false);
  const [showRealUI, setShowRealUI] = useState(!stealthMode);
  const [tapCount, setTapCount] = useState(0);
  const durationAnim = useState(new Animated.Value(0))[0];
  const fakeUIAnim = useState(new Animated.Value(0))[0];
  const [currentLocation, setCurrentLocation] = useState<string>('Tracking...');
  const [disguiseType, setDisguiseType] = useState<'notes' | 'calculator' | 'weather' | 'clock' | 'music'>(stealthMode ? 'notes' : 'notes');
  const { isListening } = useVoiceActivation();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'SOS activated - tracking your location',
      sender: 'Mom',
      timestamp: '10:30 AM',
      isWatcher: true
    }
  ]);

  useEffect(() => {
    if (stealthMode && !showRealUI) {
      Animated.timing(fakeUIAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      fakeUIAnim.setValue(0);
    }
  }, [stealthMode, showRealUI]);

  useEffect(() => {
    if (stealthMode) {
      ScreenCapture.preventScreenCaptureAsync();
      return () => {
        ScreenCapture.allowScreenCaptureAsync();
      };
    }
  }, [stealthMode]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return stealthMode && !showRealUI; // Block exit
    });

    return () => backHandler.remove();
  }, [stealthMode, showRealUI]);

  useEffect(() => {
    if (showRealUI && stealthMode) {
      const timeout = setTimeout(() => {
        setShowRealUI(false);
        setTapCount(0);
      }, 60000); // 1 min

      return () => clearTimeout(timeout);
    }
  }, [showRealUI, stealthMode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
      setLastUpdated(new Date().toLocaleTimeString());
      Animated.timing(durationAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }).start(() => durationAnim.setValue(0));
    }, 1000);

    const autoExpire = setTimeout(() => {
      Alert.alert('Session Expired', 'Session ended after 30 minutes.');
      setIsActive(false);
    }, 1800000);

    // Start location tracking and pings
    LocationService.getInstance().startContinuousTracking();
    const locationInterval = setInterval(async () => {
      const loc = await LocationService.getInstance().getCurrentLocation();
      if (loc) {
        setCurrentLocation(`${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
        // Randomize watchers count for demo
        setWatchersCount(Math.floor(Math.random() * 5) + 2);
        // Simulate pinging to watchers (e.g., Supabase update)
        console.log('Ping location to watchers:', loc);
      }
    }, 5000);

    // Randomize disguise type
    if (stealthMode) {
      const disguises: ('notes' | 'calculator' | 'weather' | 'clock' | 'music')[] = ['notes', 'calculator', 'weather', 'clock', 'music'];
      setDisguiseType(disguises[Math.floor(Math.random() * disguises.length)]);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(autoExpire);
      clearInterval(locationInterval);
      LocationService.getInstance().stopLocationTracking();
    };
  }, [stealthMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const stopSOS = () => {
    Alert.alert('Stop SOS', 'Are you sure you want to end the session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop',
        style: 'destructive',
        onPress: () => {
          setIsActive(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
    ]);
  };

  const handleSendMessage = (message: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'You',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isWatcher: false
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleStealthTap = () => {
    setTapCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setShowRealUI(true);
        Vibration.vibrate(100);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      return next;
    });
  };

  if (stealthMode && !showRealUI) {
    return (
      <TouchableWithoutFeedback onPress={handleStealthTap}>
        <Animated.View style={[styles.fakeNotesContainer, { opacity: fakeUIAnim }]}>
          <Text style={styles.fakeNotesTitle}>My Notes</Text>
          <Text style={styles.fakeNoteEntry}>• Grocery: eggs, water, bananas</Text>
          <Text style={styles.fakeNoteEntry}>• Call pharmacy tomorrow</Text>
          <Text style={styles.fakeNoteEntry}>• Schedule car maintenance</Text>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }

  if (showChat) {
    return (
      <SparkleBackground>
        <View style={styles.container}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setShowChat(false)}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.chatTitle}>Watcher Chat</Text>
          </View>
          <ChatComponent messages={messages} onSendMessage={handleSendMessage} />
        </View>
      </SparkleBackground>
    );
  }

  return (
    <SparkleBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>
          {stealthMode ? 'SILENT TRACKING' : 'LIVE TRACKING'}
        </Text>

        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: isActive ? '#4caf50' : '#f44336' }]} />
          <Text style={styles.statusText}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Text>
        </View>

        <Animated.Text style={[styles.duration, { opacity: durationAnim }]}>{formatTime(duration)}</Animated.Text>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Watchers Online</Text>
            <Text style={styles.infoValue}>{watchersCount}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Last Ping</Text>
            <Text style={styles.infoValue}>{lastUpdated}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{currentLocation}</Text>
          </View>
          {!stealthMode && (
            <>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Video</Text>
                <Text style={styles.infoValue}>Recording</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Audio</Text>
                <Text style={styles.infoValue}>Recording</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.chatButton} onPress={() => setShowChat(true)}>
            <Text style={styles.chatButtonText}>💬 Chat with Watchers</Text>
          </TouchableOpacity>
          {isActive && (
            <TouchableOpacity style={styles.stopButton} onPress={stopSOS}>
              <Text style={styles.stopButtonText}>STOP SOS</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.note}>
          {stealthMode
            ? 'Silent mode is active. No alerts or visible signals.'
            : 'Watchers are receiving live updates from your device.'}
        </Text>
      </ScrollView>
    </SparkleBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    letterSpacing: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  duration: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
  },
  infoContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 40,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoLabel: {
    color: '#ccc',
    fontSize: 16,
  },
  infoValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 20,
  },
  chatButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  note: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 300,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    color: '#FFFFFF',
    fontSize: 16,
    marginRight: 20,
  },
  chatTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  fakeNotesContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'flex-start',
  },
  fakeNotesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 20,
  },
  fakeNoteEntry: {
    fontSize: 16,
    color: '#444',
    marginBottom: 10,
  },
});
