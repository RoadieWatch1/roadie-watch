import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Vibration, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SparkleBackground } from '../src/components/SparkleBackground';
import SafetyService from '../src/utils/SafetyService';
import EmergencyDialService from '../src/utils/EmergencyDialService';
import VoiceService, { VoiceCommand } from '../src/utils/VoiceService';
import GestureService from '../src/utils/GestureService';
import LocationService, { LocationData } from '../src/utils/LocationService';

export default function SOSScreen() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const [isActive, setIsActive] = useState(false);
  const [emergencyType, setEmergencyType] = useState<'general' | 'medical' | 'fire' | 'police'>('general');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const scaleAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval!);
            executeEmergencyProtocol();
            return 0;
          }
          Vibration.vibrate(200);
          Animated.spring(scaleAnim, {
            toValue: 1.2,
            friction: 3,
            useNativeDriver: true,
          }).start(() => {
            Animated.spring(scaleAnim, {
              toValue: 1,
              friction: 3,
              useNativeDriver: true,
            }).start();
          });
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
      scaleAnim.setValue(1);
    };
  }, [isActive, countdown, scaleAnim]);

  useEffect(() => {
    const initialize = async () => {
      initializeEmergencyFeatures();
      await getCurrentLocation();
    };
    initialize();

    return () => {
      VoiceService.getInstance().stopListening();
      GestureService.removeListener(() => {});
    };
  }, []);

  const initializeEmergencyFeatures = useCallback(() => {
    VoiceService.getInstance().startListening((command: VoiceCommand) => {
      if (command.action === 'activate' && command.type === 'emergency') {
        startEmergencyCountdown('general');
      } else if (command.action === 'cancel') {
        cancelEmergency();
      } else if (command.type === 'medical') {
        startEmergencyCountdown('medical');
      } else if (command.type === 'fire') {
        startEmergencyCountdown('fire');
      } else if (command.type === 'police') {
        startEmergencyCountdown('police');
      }
    });

    GestureService.addListener((event) => {
      if (event.type === 'panic_tap' || event.type === 'shake') {
        Alert.alert(
          'Emergency Gesture Detected',
          'Panic gesture activated. Start emergency protocol?',
          [
            { text: 'Cancel' },
            { text: 'Start SOS', onPress: () => startEmergencyCountdown('general') }
          ]
        );
      }
    });
  }, []);

  const getCurrentLocation = async () => {
    setIsLocationLoading(true);
    const loc = await LocationService.getInstance().getCurrentLocation();
    setLocation(loc);
    setIsLocationLoading(false);
  };

  const startEmergencyCountdown = useCallback((type: 'general' | 'medical' | 'fire' | 'police') => {
    setEmergencyType(type);
    setIsActive(true);
    setCountdown(10);
    Vibration.vibrate([200, 100, 200, 100, 200]);
  }, []);

  const cancelEmergency = useCallback(() => {
    setIsActive(false);
    setCountdown(10);
    Alert.alert('Emergency Cancelled', 'Emergency protocol has been cancelled.');
  }, []);

  const executeEmergencyProtocol = useCallback(async () => {
    setIsActive(false);
    
    await SafetyService.getInstance().performSafetyCheck('emergency', `${emergencyType} emergency activated`);
    LocationService.getInstance().startContinuousTracking();
    
    Alert.alert(
      'Emergency Protocol Active',
      'Your watchers have been notified. Contact emergency services?',
      [
        { text: 'Not Now' },
        { text: 'Call 911', onPress: () => EmergencyDialService.getInstance().dialEmergency() },
        { text: 'Specific Service', onPress: () => showEmergencyServices() }
      ]
    );
  }, [emergencyType]);

  const showEmergencyServices = useCallback(() => {
    Alert.alert(
      'Emergency Services',
      'Which service do you need?',
      [
        { text: 'Cancel' },
        { text: '🚨 Police', onPress: () => EmergencyDialService.getInstance().dialPolice() },
        { text: '🚑 Medical', onPress: () => EmergencyDialService.getInstance().dialMedical() },
        { text: '🚒 Fire Dept', onPress: () => EmergencyDialService.getInstance().dialFire() },
        { text: '📞 General 911', onPress: () => EmergencyDialService.getInstance().dialEmergency() }
      ]
    );
  }, []);

  const performSafetyCheck = useCallback(async (status: 'safe' | 'help_needed') => {
    await SafetyService.getInstance().performSafetyCheck(status);
    Alert.alert(
      'Safety Check Sent',
      `Your watchers have been notified that you are ${status === 'safe' ? 'safe' : 'requesting help'}.`
    );
  }, []);

  if (isLocationLoading) {
    return (
      <SparkleBackground>
        <View style={styles.container}>
          <Text style={styles.title}>Loading Location...</Text>
        </View>
      </SparkleBackground>
    );
  }

  return (
    <SparkleBackground>
      <View style={styles.container}>
        {!isActive ? (
          <View style={styles.content}>
            <Text style={styles.title}>🚨 Emergency SOS</Text>
            <Text style={styles.subtitle}>Activate emergency protocol</Text>
            
            {location && (
              <Text style={styles.locationText}>
                📍 Location ready: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Text>
            )}

            <View style={styles.emergencyTypes}>
              {/* @ts-ignore - Suppress TypeScript error on TouchableOpacity return type */}
              <TouchableOpacity 
                style={styles.emergencyButton}
                onPress={() => startEmergencyCountdown('general')}
                accessibilityLabel="General Emergency"
              >
                <Text style={styles.emergencyButtonText}>🚨 General Emergency</Text>
              </TouchableOpacity>

              {/* @ts-ignore - Suppress TypeScript error on TouchableOpacity return type */}
              <TouchableOpacity 
                style={[styles.emergencyButton, styles.medicalButton]}
                onPress={() => startEmergencyCountdown('medical')}
                accessibilityLabel="Medical Emergency"
              >
                <Text style={styles.emergencyButtonText}>🚑 Medical Emergency</Text>
              </TouchableOpacity>

              {/* @ts-ignore - Suppress TypeScript error on TouchableOpacity return type */}
              <TouchableOpacity 
                style={[styles.emergencyButton, styles.fireButton]}
                onPress={() => startEmergencyCountdown('fire')}
                accessibilityLabel="Fire Emergency"
              >
                <Text style={styles.emergencyButtonText}>🚒 Fire Emergency</Text>
              </TouchableOpacity>

              {/* @ts-ignore - Suppress TypeScript error on TouchableOpacity return type */}
              <TouchableOpacity 
                style={[styles.emergencyButton, styles.policeButton]}
                onPress={() => startEmergencyCountdown('police')}
                accessibilityLabel="Police Emergency"
              >
                <Text style={styles.emergencyButtonText}>👮 Police Emergency</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.safetyChecks}>
              <Text style={styles.safetyTitle}>Quick Safety Updates</Text>
              <View style={styles.safetyButtons}>
                {/* @ts-ignore - Suppress TypeScript error on TouchableOpacity return type */}
                <TouchableOpacity 
                  style={styles.safeButton}
                  onPress={() => performSafetyCheck('safe')}
                  accessibilityLabel="I'm Safe"
                >
                  <Text style={styles.safeButtonText}>✅ I'm Safe</Text>
                </TouchableOpacity>

                {/* @ts-ignore - Suppress TypeScript error on TouchableOpacity return type */}
                <TouchableOpacity 
                  style={styles.helpButton}
                  onPress={() => performSafetyCheck('help_needed')}
                  accessibilityLabel="Need Help"
                >
                  <Text style={styles.helpButtonText}>⚠️ Need Help</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* @ts-ignore - Suppress TypeScript error on TouchableOpacity return type */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownTitle}>🚨 EMERGENCY ACTIVATING</Text>
            <Text style={styles.emergencyTypeText}>{emergencyType.toUpperCase()} EMERGENCY</Text>
            <Animated.Text style={[styles.countdownNumber, { transform: [{ scale: scaleAnim }] }]}>
              {countdown}
            </Animated.Text>
            <Text style={styles.countdownText}>Notifying watchers and emergency services...</Text>
            
            {/* @ts-ignore - Suppress TypeScript error on TouchableOpacity return type */}
            <TouchableOpacity style={styles.cancelButton} onPress={cancelEmergency}>
              <Text style={styles.cancelButtonText}>CANCEL EMERGENCY</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SparkleBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FF4444', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#ccc', textAlign: 'center', marginBottom: 20 },
  locationText: { fontSize: 12, color: '#4CAF50', textAlign: 'center', marginBottom: 30 },
  emergencyTypes: { width: '100%', marginBottom: 30 },
  emergencyButton: { backgroundColor: '#FF4444', padding: 18, borderRadius: 10, marginBottom: 15 },
  medicalButton: { backgroundColor: '#FF6B35' },
  fireButton: { backgroundColor: '#FF8C00' },
  policeButton: { backgroundColor: '#4169E1' },
  emergencyButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  safetyChecks: { width: '100%', marginBottom: 30 },
  safetyTitle: { fontSize: 18, color: '#fff', textAlign: 'center', marginBottom: 15 },
  safetyButtons: { flexDirection: 'row', gap: 15 },
  safeButton: { flex: 1, backgroundColor: '#4CAF50', padding: 15, borderRadius: 8 },
  safeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  helpButton: { flex: 1, backgroundColor: '#FF9800', padding: 15, borderRadius: 8 },
  helpButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  backButton: { backgroundColor: '#333', padding: 15, borderRadius: 8 },
  backButtonText: { color: '#fff', fontSize: 16, textAlign: 'center' },
  countdownContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  countdownTitle: { fontSize: 24, fontWeight: 'bold', color: '#FF4444', textAlign: 'center', marginBottom: 10 },
  emergencyTypeText: { fontSize: 18, color: '#FFD700', textAlign: 'center', marginBottom: 30 },
  countdownNumber: { fontSize: 120, fontWeight: 'bold', color: '#FF4444', textAlign: 'center' },
  countdownText: { fontSize: 16, color: '#ccc', textAlign: 'center', marginBottom: 50 },
  cancelButton: { backgroundColor: '#666', padding: 20, borderRadius: 10 },
  cancelButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }
});