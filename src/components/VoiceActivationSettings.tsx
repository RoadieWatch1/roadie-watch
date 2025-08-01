import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, Alert, ScrollView } from 'react-native';
import { useVoiceActivation } from './VoiceActivationProvider';
import { VoiceTestingPanel } from './VoiceTestingPanel';
import { VoiceSafetyProtocols } from './VoiceSafetyProtocols';
import { CustomWakeWordTrainer } from './CustomWakeWordTrainer';
import VoiceActivationService from '../utils/VoiceActivationService';

export const VoiceActivationSettings: React.FC = () => {
  const {
    isListening,
    isEnabled,
    triggerPhrases,
    toggleEnabled,
    updateTriggerPhrases
  } = useVoiceActivation();
  
  const [customPhrases, setCustomPhrases] = useState(triggerPhrases.join(', '));
  const [showTestingPanel, setShowTestingPanel] = useState(false);
  const [showSafetyProtocols, setShowSafetyProtocols] = useState(false);
  const [showCustomTrainer, setShowCustomTrainer] = useState(false);

  const handleUpdatePhrases = () => {
    const phrases = customPhrases
      .split(',')
      .map(p => p.trim().toLowerCase())
      .filter(p => p.length >= 3);
    
    if (phrases.length === 0) {
      Alert.alert('Invalid Phrases', 'At least one phrase must be 3+ characters long.');
      return;
    }
    
    updateTriggerPhrases(phrases);
    Alert.alert('Success', `Updated ${phrases.length} trigger phrases!`);
  };

  const resetToDefaults = () => {
    const defaultPhrases = ['roadie help me', 'what are you doing', 'please stop'];
    setCustomPhrases(defaultPhrases.join(', '));
    updateTriggerPhrases(defaultPhrases);
    Alert.alert('Reset', 'Trigger phrases reset to defaults.');
  };

  const handlePhraseDetected = (phrase: string) => {
    Alert.alert(
      'Voice Activation Triggered!',
      `Detected phrase: "${phrase}"\n\nThis would now activate silent emergency mode.`,
      [{ text: 'OK' }]
    );
  };

  const voiceService = VoiceActivationService.getInstance().getVoiceRecognitionService();
  if (!voiceService) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎤 Voice Activation</Text>
        <Text style={styles.errorText}>Voice recognition service not available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🎤 Voice Activation</Text>
      
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Enable Voice Activation</Text>
        <Switch
          value={isEnabled}
          onValueChange={toggleEnabled}
          trackColor={{ false: '#333', true: '#FF6B35' }}
          thumbColor={isEnabled ? '#fff' : '#666'}
        />
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={[styles.statusText, { color: isListening ? '#4CAF50' : '#666' }]}>
          {isListening ? '🔴 Listening' : '⚫ Inactive'}
        </Text>
      </View>

      <View style={styles.phraseSection}>
        <Text style={styles.sectionTitle}>Emergency Trigger Phrases</Text>
        
        <View style={styles.currentPhrases}>
          {triggerPhrases.map((phrase, index) => (
            <View key={index} style={styles.phraseChip}>
              <Text style={styles.phraseText}>"{phrase}"</Text>
            </View>
          ))}
        </View>
        
        <Text style={styles.inputLabel}>Edit Phrases (comma-separated):</Text>
        <TextInput
          style={styles.phraseInput}
          value={customPhrases}
          onChangeText={setCustomPhrases}
          placeholder="roadie help me, what are you doing, please stop"
          placeholderTextColor="#666"
          multiline
        />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdatePhrases}>
            <Text style={styles.buttonText}>Update</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.advancedSection}>
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={() => setShowTestingPanel(!showTestingPanel)}
          >
            <Text style={styles.buttonText}>
              {showTestingPanel ? '🔒 Hide Testing' : '🧪 Show Testing Panel'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.testButton} 
            onPress={() => setShowSafetyProtocols(!showSafetyProtocols)}
          >
            <Text style={styles.buttonText}>
              {showSafetyProtocols ? '🔒 Hide Safety' : '🛡️ Safety Protocols'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.testButton} 
            onPress={() => setShowCustomTrainer(!showCustomTrainer)}
          >
            <Text style={styles.buttonText}>
              {showCustomTrainer ? '🔒 Hide Trainer' : '🎯 Custom Wake Words'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showTestingPanel && (
        <VoiceTestingPanel
          voiceService={voiceService}
          onPhraseDetected={handlePhraseDetected}
        />
      )}

      {showSafetyProtocols && <VoiceSafetyProtocols />}

      {showCustomTrainer && <CustomWakeWordTrainer voiceService={voiceService} />}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>⚡ Emergency Phrases</Text>
        <Text style={styles.infoText}>
          • "Roadie Help Me" - Direct emergency call{'\n'}
          • "What are you doing" - Suspicious activity{'\n'}
          • "Please stop" - Harassment or threat{'\n'}
          • Works with Picovoice SDK for accuracy{'\n'}
          • Instantly activates silent emergency mode
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#000' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FF6B35', marginBottom: 20 },
  settingRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10
  },
  settingLabel: { fontSize: 16, color: '#fff' },
  statusRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10
  },
  statusLabel: { fontSize: 16, color: '#ccc', marginRight: 10 },
  statusText: { fontSize: 16, fontWeight: 'bold' },
  phraseSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, color: '#FFD700', marginBottom: 15 },
  currentPhrases: { marginBottom: 15 },
  phraseChip: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 8,
    alignSelf: 'flex-start'
  },
  phraseText: { color: '#4CAF50', fontSize: 14 },
  inputLabel: { fontSize: 14, color: '#ccc', marginBottom: 8 },
  phraseInput: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    minHeight: 60
  },
  buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  updateButton: { 
    flex: 1, 
    backgroundColor: '#FF6B35', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  resetButton: { 
    flex: 1, 
    backgroundColor: '#666', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  advancedSection: { gap: 10 },
  testButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  safetyButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  trainerButton: {
    backgroundColor: '#9C27B0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  infoBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
    marginBottom: 15
  },
  infoTitle: { fontSize: 16, color: '#FFD700', fontWeight: 'bold', marginBottom: 10 },
  infoText: { fontSize: 14, color: '#ccc', lineHeight: 20 },
  errorText: { color: '#FF4444', fontSize: 16, textAlign: 'center' }
});