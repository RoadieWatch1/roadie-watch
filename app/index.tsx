import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useVoiceActivation } from '../src/components/VoiceActivationProvider';

export default function Index() {
  const { isEnabled, startListening } = useVoiceActivation();

  useEffect(() => {
    // Auto-start voice activation if enabled
    if (isEnabled) {
      startListening();
    }

    const timer = setTimeout(() => {
      router.replace('/flash');
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isEnabled]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading...</Text>
      {isEnabled && (
        <Text style={styles.voiceText}>🎤 Voice activation ready</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 18,
  },
  voiceText: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 10,
  },
});