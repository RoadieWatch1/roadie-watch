import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SparkleBackground } from '../components/SparkleBackground';

interface NameGroupScreenProps {
  navigation: any;
}

export const NameGroupScreen: React.FC<NameGroupScreenProps> = ({ navigation }) => {
  const [groupName, setGroupName] = useState('');

  const handleContinue = () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    
    // Save group name and continue
    navigation.navigate('InviteCode');
  };

  const suggestedNames = [
    'Family Circle',
    'Close Friends',
    'Safety Network',
    'My Watchers',
    'Emergency Contacts'
  ];

  return (
    <SparkleBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Name Your Safety Group</Text>
        <Text style={styles.subtitle}>
          Choose a name for your trusted watchers network
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="Enter group name..."
          placeholderTextColor="#666"
          value={groupName}
          onChangeText={setGroupName}
          maxLength={30}
        />
        
        <Text style={styles.suggestionsTitle}>Suggested Names:</Text>
        <View style={styles.suggestionsContainer}>
          {suggestedNames.map((name, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionButton}
              onPress={() => setGroupName(name)}
            >
              <Text style={styles.suggestionText}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity 
          style={[styles.continueButton, !groupName.trim() && styles.disabledButton]} 
          onPress={handleContinue}
          disabled={!groupName.trim()}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
        
        <Text style={styles.infoText}>
          You can invite up to 20 watchers to your safety group
        </Text>
      </View>
    </SparkleBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    textAlign: 'center',
  },
  suggestionsTitle: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 15,
  },
  suggestionsContainer: {
    marginBottom: 40,
  },
  suggestionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#666666',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoText: {
    color: '#999999',
    fontSize: 12,
    textAlign: 'center',
  },
});