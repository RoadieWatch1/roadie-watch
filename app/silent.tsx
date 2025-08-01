import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SparkleBackground } from '../src/components/SparkleBackground';
import { useVoiceActivation } from '../src/components/VoiceActivationProvider';

export default function SilentHelpScreen() {
  const router = useRouter();
  const [secretCode, setSecretCode] = useState('');
  const [tapCount, setTapCount] = useState(0);
  const [lastActivatedPhrase, setLastActivatedPhrase] = useState('');
  
  const { isListening, isEnabled, triggerPhrases, toggleEnabled } = useVoiceActivation();

  useEffect(() => {
    const tapTimer = setTimeout(() => setTapCount(0), 3000);
    return () => clearTimeout(tapTimer);
  }, [tapCount]);

  const handleSecretCodeSubmit = () => {
    if (secretCode.length < 4) {
      Alert.alert('Invalid Code', 'Please enter a 4-digit code.');
      return;
    }

    const validCodes = ['4911', '0000', '1234', '9999'];
    
    if (validCodes.includes(secretCode.trim())) {
      Alert.alert('Success', 'Silent help activated!', [
        { text: 'OK', onPress: () => router.push('/sos') }
      ]);
      setSecretCode('');
    } else {
      Alert.alert('Invalid Code', 'Please enter a valid 4-digit code.');
      setSecretCode('');
    }
  };

  const handleCornerTap = () => {
    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);
    
    if (newTapCount >= 5) {
      Alert.alert('Success', 'Silent help activated via tap sequence!', [
        { text: 'OK', onPress: () => router.push('/sos') }
      ]);
      setTapCount(0);
    }
  };

  const testVoiceActivation = () => {
    Alert.alert(
      'Voice Test',
      'Testing voice activation with current phrases...',
      [{ text: 'OK', onPress: () => {
        setTimeout(() => {
          const testPhrase = triggerPhrases[0] || 'roadie help me';
          setLastActivatedPhrase(testPhrase);
          Alert.alert('Test Complete', `Voice activation would trigger for: "${testPhrase}"`);
        }, 2000);
      }}]
    );
  };

  return (
    <SparkleBackground>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.cornerTap}
          onPress={handleCornerTap}
          activeOpacity={1}
        />
        
        <View style={styles.content}>
          <Text style={styles.title}>🔒 Silent Help Access</Text>
          <Text style={styles.subtitle}>Emergency stealth mode activation</Text>

          {/* Voice Activation Status */}
          <View style={styles.voiceStatus}>
            <Text style={styles.voiceTitle}>🎤 Voice Activation</Text>
            <Text style={[styles.voiceText, { color: isListening ? '#4CAF50' : '#666' }]}>
              {isListening ? '🔴 Listening for emergency phrases' : '⚫ Voice detection inactive'}
            </Text>
            
            <View style={styles.phrasesList}>
              {triggerPhrases.map((phrase, index) => (
                <Text key={index} style={styles.phraseItem}>• "{phrase}"</Text>
              ))}
            </View>

            {lastActivatedPhrase && (
              <Text style={styles.lastPhrase}>
                Last detected: "{lastActivatedPhrase}"
              </Text>
            )}
            
            <View style={styles.voiceControls}>
              <TouchableOpacity style={styles.voiceToggle} onPress={toggleEnabled}>
                <Text style={styles.voiceToggleText}>
                  {isEnabled ? 'Disable Voice' : 'Enable Voice'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.testButton} onPress={testVoiceActivation}>
                <Text style={styles.testButtonText}>Test</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.accessMethods}>
            <Text style={styles.methodTitle}>Alternative Access Methods:</Text>
            
            <View style={styles.codeInput}>
              <Text style={styles.methodText}>Enter Secret Code:</Text>
              <TextInput
                style={styles.textInput}
                value={secretCode}
                onChangeText={setSecretCode}
                placeholder="4-digit code"
                placeholderTextColor="#666"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSecretCodeSubmit}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gestureMethod}>
              <Text style={styles.methodText}>Corner Tap Method:</Text>
              <Text style={styles.instructionText}>
                Tap the top-left corner 5 times quickly
              </Text>
              <Text style={styles.tapCounter}>
                Taps: {tapCount}/5
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SparkleBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cornerTap: { position: 'absolute', top: 0, left: 0, width: 80, height: 80, zIndex: 1000 },
  content: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FF6B35', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#ccc', textAlign: 'center', marginBottom: 20 },
  voiceStatus: { width: '100%', backgroundColor: 'rgba(255, 107, 53, 0.1)', padding: 15, borderRadius: 10, marginBottom: 20 },
  voiceTitle: { fontSize: 16, color: '#FF6B35', fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  voiceText: { fontSize: 14, textAlign: 'center', marginBottom: 10 },
  phrasesList: { marginBottom: 10 },
  phraseItem: { fontSize: 12, color: '#4CAF50', textAlign: 'center', marginBottom: 2 },
  lastPhrase: { fontSize: 12, color: '#FFD700', textAlign: 'center', marginBottom: 10, fontStyle: 'italic' },
  voiceControls: { flexDirection: 'row', gap: 10 },
  voiceToggle: { flex: 1, backgroundColor: '#333', padding: 10, borderRadius: 5 },
  voiceToggleText: { color: '#fff', fontSize: 14, textAlign: 'center' },
  testButton: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 5, paddingHorizontal: 15 },
  testButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  accessMethods: { width: '100%', marginBottom: 30 },
  methodTitle: { fontSize: 18, color: '#fff', textAlign: 'center', marginBottom: 20 },
  codeInput: { marginBottom: 25 },
  methodText: { fontSize: 16, color: '#FFD700', marginBottom: 10 },
  textInput: { backgroundColor: '#333', color: '#fff', padding: 15, borderRadius: 8, fontSize: 18, textAlign: 'center', marginBottom: 10 },
  submitButton: { backgroundColor: '#FF6B35', padding: 15, borderRadius: 8 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  gestureMethod: { alignItems: 'center' },
  instructionText: { fontSize: 14, color: '#ccc', textAlign: 'center', marginBottom: 10 },
  tapCounter: { fontSize: 16, color: '#4CAF50', fontWeight: 'bold' },
  backButton: { backgroundColor: '#333', padding: 15, borderRadius: 8 },
  backButtonText: { color: '#fff', fontSize: 16, textAlign: 'center' }
});