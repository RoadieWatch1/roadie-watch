import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { SparkleBackground } from '../components/SparkleBackground'; // ✅ fixed named import

const TitleScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [secretCode, setSecretCode] = useState('');

  const handleSecretCode = (text: string) => {
    setSecretCode(text);
    if (text === '0000' || text === '9999') {
      console.log('Stealth mode activated');
      // @ts-ignore
      navigation.navigate('SOSActivationScreen', { stealthMode: true }); // ✅ fixed type
      setSecretCode('');
    }
  };

  return (
    <SparkleBackground>
      <View style={styles.container}>
        <Text style={styles.title}>ROADIE WATCH</Text>
        <Text style={styles.subtitle}>Your Personal Security Network</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('SignInScreen')}
          >
            <Text style={styles.buttonText}>SIGN IN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.signUpButton]}
            onPress={() => navigation.navigate('SignUpScreen')}
          >
            <Text style={styles.buttonText}>SIGN UP</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.hiddenInput}
          value={secretCode}
          onChangeText={handleSecretCode}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          placeholder="Emergency Code"
          placeholderTextColor="#333"
        />
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
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 3,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 60,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  signUpButton: {
    backgroundColor: '#444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  hiddenInput: {
    position: 'absolute',
    bottom: 50,
    width: 200,
    padding: 10,
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 5,
    textAlign: 'center',
  },
});

export default TitleScreen;

