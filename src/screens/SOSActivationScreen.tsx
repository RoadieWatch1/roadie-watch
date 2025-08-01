import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, Animated } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import { SparkleBackground } from '../components/SparkleBackground';
import * as Haptics from 'expo-haptics';
import { useVoiceActivation } from '../components/VoiceActivationProvider';
import SOSService from '../utils/SOSService';

const SOSActivationScreen: React.FC = () => {
  const params = useLocalSearchParams<{ stealthMode: string }>();
  const stealthMode = params.stealthMode === 'true';
  const [countdown, setCountdown] = useState(5);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [detectedPhrase, setDetectedPhrase] = useState<string | null>(null); // Local state for detected phrase
  const scaleAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    let timer: number | undefined;
    if (isCountingDown && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          friction: 3,
          useNativeDriver: true,
        }).start(() => scaleAnim.setValue(1));
      }, 1000);
    } else if (isCountingDown && countdown === 0) {
      startSOS();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, isCountingDown]);

  const { triggerPhrases } = useVoiceActivation(); // Use triggerPhrases for detection logic

  useEffect(() => {
    // Simulate phrase detection; in real app, integrate with voice service
    const phraseListener = setInterval(() => {
      // Mock detection
      const randomPhrase = triggerPhrases[Math.floor(Math.random() * triggerPhrases.length)];
      setDetectedPhrase(randomPhrase);
    }, 10000); // Every 10s for demo

    return () => clearInterval(phraseListener);
  }, [triggerPhrases]);

  useEffect(() => {
    if (detectedPhrase) {
      if (detectedPhrase.toLowerCase().includes('help')) {
        startSOS();
      } else if (detectedPhrase.toLowerCase().includes('fine')) {
        cancelCountdown();
      }
    }
  }, [detectedPhrase]);

  const startCountdown = () => {
    if (stealthMode) {
      startSOS();
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsCountingDown(true);
    setCountdown(5);
  };

  const cancelCountdown = () => {
    setIsCountingDown(false);
    setCountdown(5);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const startSOS = async () => {
    setIsCountingDown(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await SOSService.getInstance().activateSOS();
      Alert.alert(
        'SOS Activated',
        stealthMode ? 'Silent tracking mode enabled' : 'Emergency alert sent to watchers',
        [{ text: 'Continue', onPress: () => router.push({ pathname: '/livetracking', params: { stealthMode: stealthMode.toString() } }) }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to activate SOS.');
    }
  };

  const FakeNotesUI = () => (
    <View style={styles.fakeNotesContainer}>
      <TextInput
        placeholder="Enter your notes..."
        placeholderTextColor="#888"
        multiline
        style={styles.fakeNotesInput}
      />
    </View>
  );

  return (
    <SparkleBackground>
      <View style={styles.container}>
        {stealthMode ? (
          <FakeNotesUI />
        ) : (
          <>
            <Text style={styles.title}>SOS ACTIVATION</Text>
            {isCountingDown ? (
              <View style={styles.countdownContainer}>
                <Animated.Text style={[styles.countdownText, { transform: [{ scale: scaleAnim }] }]}>{countdown}</Animated.Text>
                <Text style={styles.countdownLabel}>Sending SOS alert...</Text>
                <TouchableOpacity style={styles.cancelButton} onPress={cancelCountdown}>
                  <Text style={styles.cancelButtonText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.sosButton} onPress={startCountdown}>
                  <Text style={styles.sosButtonText}>START SOS</Text>
                </TouchableOpacity>
                <Text style={styles.description}>This will alert your watchers and start live tracking</Text>
              </View>
            )}
          </>
        )}
      </View>
    </SparkleBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 50,
    letterSpacing: 2,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  sosButton: {
    backgroundColor: '#d32f2f',
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 4,
    borderColor: '#fff',
  },
  sosButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  description: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 300,
  },
  countdownContainer: {
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 20,
  },
  countdownLabel: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 40,
  },
  cancelButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    paddingHorizontal: 40,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fakeNotesContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
  },
  fakeNotesInput: {
    height: 300,
    textAlignVertical: 'top',
    color: '#000',
    fontSize: 16,
  },
});

export default SOSActivationScreen;
