import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, StyleSheet, ScrollView } from 'react-native';
import { CustomWakeWordService, CustomWakeWord, TrainingSession } from '../utils/CustomWakeWordService';
import { VoiceRecognitionService } from '../utils/VoiceRecognitionService';

interface Props {
  voiceService: VoiceRecognitionService;
}

export const CustomWakeWordTrainer: React.FC<Props> = ({ voiceService }) => {
  const [customWakeWordService] = useState(() => new CustomWakeWordService(voiceService));
  const [wakeWords, setWakeWords] = useState<CustomWakeWord[]>([]);
  const [newPhrase, setNewPhrase] = useState('');
  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
  const [recordingCount, setRecordingCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    loadWakeWords();
  }, []);

  const loadWakeWords = async () => {
    try {
      const words = await customWakeWordService.loadUserWakeWords();
      setWakeWords(words);
    } catch (error) {
      console.error('Failed to load wake words:', error);
    }
  };

  const createWakeWord = async () => {
    if (!newPhrase.trim()) {
      Alert.alert('Error', 'Please enter a wake phrase');
      return;
    }

    try {
      const wakeWord = await customWakeWordService.createCustomWakeWord(newPhrase);
      setWakeWords(prev => [...prev, wakeWord]);
      setNewPhrase('');
      Alert.alert('Success', 'Custom wake word created! Start training to activate it.');
    } catch (error) {
      Alert.alert('Error', 'Failed to create wake word');
    }
  };

  const startTraining = async (wakeWordId: string) => {
    try {
      const session = await customWakeWordService.startTrainingSession(wakeWordId);
      setCurrentSession(session);
      setRecordingCount(0);
      Alert.alert('Training Started', 'Say your wake phrase clearly 10 times when prompted');
    } catch (error) {
      Alert.alert('Error', 'Failed to start training session');
    }
  };

  const recordPhrase = async () => {
    if (!currentSession) return;

    setIsRecording(true);
    
    try {
      // Simulate audio recording - in real app would capture actual audio
      const mockAudioData = new Array(4096).fill(0).map(() => Math.random() * 0.1);
      
      await customWakeWordService.recordTrainingPhrase(currentSession.id, mockAudioData);
      
      const newCount = recordingCount + 1;
      setRecordingCount(newCount);
      
      if (newCount >= 10) {
        Alert.alert(
          'Training Complete',
          'Processing your voice model...',
          [
            {
              text: 'Finish Training',
              onPress: completeTraining
            }
          ]
        );
      } else {
        Alert.alert('Recorded', `Recording ${newCount}/10 complete. Say the phrase again.`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record phrase');
    }
    
    setIsRecording(false);
  };

  const completeTraining = async () => {
    if (!currentSession) return;

    try {
      const success = await customWakeWordService.completeTraining(currentSession.id);
      
      if (success) {
        Alert.alert('Success', 'Custom wake word trained successfully!');
        await loadWakeWords();
        setCurrentSession(null);
        setRecordingCount(0);
      } else {
        Alert.alert('Error', 'Training failed. Please try again with clearer pronunciation.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to complete training');
    }
  };

  const activateWakeWord = async (wakeWordId: string) => {
    try {
      await customWakeWordService.activateCustomWakeWord(wakeWordId);
      await loadWakeWords();
      Alert.alert('Success', 'Custom wake word activated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to activate wake word');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Custom Wake Word Training</Text>
      
      <View style={styles.createSection}>
        <Text style={styles.sectionTitle}>Create New Wake Word</Text>
        <TextInput
          style={styles.input}
          value={newPhrase}
          onChangeText={setNewPhrase}
          placeholder="Enter your custom phrase (e.g., 'Emergency Help')"
          maxLength={50}
        />
        <TouchableOpacity style={styles.createButton} onPress={createWakeWord}>
          <Text style={styles.buttonText}>Create Wake Word</Text>
        </TouchableOpacity>
      </View>

      {currentSession && (
        <View style={styles.trainingSection}>
          <Text style={styles.sectionTitle}>Training in Progress</Text>
          <Text style={styles.trainingText}>
            Recordings: {recordingCount}/10
          </Text>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={recordPhrase}
            disabled={isRecording}
          >
            <Text style={styles.buttonText}>
              {isRecording ? 'Recording...' : 'Record Phrase'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.wakeWordsSection}>
        <Text style={styles.sectionTitle}>Your Wake Words</Text>
        {wakeWords.map(word => (
          <View key={word.id} style={styles.wakeWordCard}>
            <View style={styles.wakeWordInfo}>
              <Text style={styles.wakeWordPhrase}>"{word.phrase}"</Text>
              <Text style={styles.wakeWordStatus}>
                {word.trainingComplete ? 
                  (word.isActive ? 'Active' : 'Trained') : 
                  'Training Required'
                }
              </Text>
            </View>
            <View style={styles.wakeWordActions}>
              {!word.trainingComplete && (
                <TouchableOpacity
                  style={styles.trainButton}
                  onPress={() => startTraining(word.id)}
                  disabled={!!currentSession}
                >
                  <Text style={styles.trainButtonText}>Train</Text>
                </TouchableOpacity>
              )}
              {word.trainingComplete && !word.isActive && (
                <TouchableOpacity
                  style={styles.activateButton}
                  onPress={() => activateWakeWord(word.id)}
                >
                  <Text style={styles.buttonText}>Activate</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333'
  },
  createSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12
  },
  createButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  trainingSection: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffeaa7'
  },
  trainingText: {
    fontSize: 16,
    marginBottom: 12,
    color: '#856404'
  },
  recordButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  recordingButton: {
    backgroundColor: '#6c757d'
  },
  wakeWordsSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8
  },
  wakeWordCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  wakeWordInfo: {
    flex: 1
  },
  wakeWordPhrase: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333'
  },
  wakeWordStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  wakeWordActions: {
    flexDirection: 'row',
    gap: 8
  },
  trainButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4
  },
  trainButtonText: {
    color: '#212529',
    fontSize: 14,
    fontWeight: '500'
  },
  activateButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4
  }
});