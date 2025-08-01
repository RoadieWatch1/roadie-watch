import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { SparkleBackground } from '../src/components/SparkleBackground';

export default function TitleScreen() {
  const [stealthCode, setStealthCode] = useState('');
  const [showStealthInput, setShowStealthInput] = useState(false);

  const handleStealthActivation = () => {
    if (stealthCode === '0000' || stealthCode === '9999') {
      router.push('/sos');
    } else {
      Alert.alert('Invalid Code', 'Please enter a valid stealth code.');
      setStealthCode('');
    }
  };

  return (
    <View style={styles.container}>
      <SparkleBackground />
      <View style={styles.content}>
        <Text style={styles.title}>ROADIE WATCH</Text>
        <Text style={styles.subtitle}>Your Personal Security Network</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/signin')}
          >
            <Text style={styles.buttonText}>SIGN IN</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.signUpButton]}
            onPress={() => router.push('/signup')}
          >
            <Text style={styles.buttonText}>SIGN UP</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.hiddenArea}
          onPress={() => setShowStealthInput(true)}
        />

        {showStealthInput && (
          <View style={styles.stealthContainer}>
            <TextInput
              style={styles.stealthInput}
              value={stealthCode}
              onChangeText={setStealthCode}
              placeholder="Enter stealth code"
              placeholderTextColor="#666"
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              onSubmitEditing={handleStealthActivation}
              autoFocus
            />
            <TouchableOpacity 
              style={styles.stealthButton}
              onPress={handleStealthActivation}
            >
              <Text style={styles.stealthButtonText}>ACTIVATE</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 60,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  signUpButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hiddenArea: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    height: 50,
  },
  stealthContainer: {
    position: 'absolute',
    bottom: 100,
    left: 40,
    right: 40,
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  stealthInput: {
    backgroundColor: '#222',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 12,
  },
  stealthButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  stealthButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});