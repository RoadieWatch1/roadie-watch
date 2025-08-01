import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { VoiceRecognitionService } from '../utils/VoiceRecognitionService';

interface VoiceTestingPanelProps {
  voiceService: VoiceRecognitionService | null;
  onPhraseDetected: (phrase: string) => void;
}

export const VoiceTestingPanel: React.FC<VoiceTestingPanelProps> = ({
  voiceService,
  onPhraseDetected
}) => {
  const [testPhrase, setTestPhrase] = useState('');
  const [isTestingMode, setIsTestingMode] = useState(false);

  const handleTestPhrase = async () => {
    if (!voiceService || !testPhrase.trim()) {
      Alert.alert('Error', 'Please enter a test phrase');
      return;
    }

    try {
      const detected = await voiceService.testPhrase(testPhrase);
      
      if (detected) {
        Alert.alert('Success', `Phrase "${testPhrase}" detected and triggered!`);
        onPhraseDetected(testPhrase);
      } else {
        Alert.alert('No Match', `Phrase "${testPhrase}" did not match any triggers`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to test phrase');
    }
  };

  const toggleTestingMode = () => {
    setIsTestingMode(!isTestingMode);
  };

  const testPredefinedPhrases = async () => {
    const phrases = ['roadie help me', 'what are you doing', 'please stop'];
    
    for (const phrase of phrases) {
      try {
        const detected = await voiceService?.testPhrase(phrase);
        console.log(`Testing "${phrase}": ${detected ? 'DETECTED' : 'NOT DETECTED'}`);
      } catch (error) {
        console.error(`Error testing "${phrase}":`, error);
      }
    }
    
    Alert.alert('Testing Complete', 'Check console for results');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Testing Panel</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter test phrase..."
          value={testPhrase}
          onChangeText={setTestPhrase}
          placeholderTextColor="#666"
        />
        <TouchableOpacity style={styles.testButton} onPress={handleTestPhrase}>
          <Text style={styles.buttonText}>Test Phrase</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.modeButton, isTestingMode && styles.activeModeButton]} 
        onPress={toggleTestingMode}
      >
        <Text style={styles.buttonText}>
          {isTestingMode ? 'Exit Testing Mode' : 'Enter Testing Mode'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.predefinedButton} onPress={testPredefinedPhrases}>
        <Text style={styles.buttonText}>Test All Trigger Phrases</Text>
      </TouchableOpacity>

      {isTestingMode && (
        <View style={styles.testingInfo}>
          <Text style={styles.infoText}>Testing Mode Active</Text>
          <Text style={styles.infoSubtext}>
            Voice recognition is in test mode. Speak or type phrases to test detection.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    padding: 12,
    color: '#fff',
    backgroundColor: '#2a2a2a',
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    justifyContent: 'center',
  },
  modeButton: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  activeModeButton: {
    backgroundColor: '#4ECDC4',
  },
  predefinedButton: {
    backgroundColor: '#95E1D3',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  testingInfo: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  infoText: {
    color: '#4ECDC4',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoSubtext: {
    color: '#999',
    fontSize: 12,
  },
});