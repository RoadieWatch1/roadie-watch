import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SparkleBackground } from '../components/SparkleBackground';

interface WelcomeBackScreenProps {
  navigation: any;
}

export const WelcomeBackScreen: React.FC<WelcomeBackScreenProps> = ({ navigation }) => {
  const handleContinue = () => {
    navigation.navigate('Silent');
  };

  return (
    <SparkleBackground>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.brandText}>ROADIE WATCH</Text>
          <Text style={styles.tagline}>Your Personal Security Network</Text>
          
          <View style={styles.featureList}>
            <Text style={styles.feature}>✓ Real-time location tracking</Text>
            <Text style={styles.feature}>✓ Live video & audio streaming</Text>
            <Text style={styles.feature}>✓ Trusted watcher network</Text>
            <Text style={styles.feature}>✓ Emergency SOS activation</Text>
            <Text style={styles.feature}>✓ Stealth mode protection</Text>
          </View>
          
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Get Started</Text>
          </TouchableOpacity>
          
          <Text style={styles.disclaimer}>
            Your safety is our priority. All data is encrypted and secure.
          </Text>
        </View>
      </View>
    </SparkleBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    color: '#CCCCCC',
    marginBottom: 5,
  },
  brandText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 40,
    textAlign: 'center',
  },
  featureList: {
    marginBottom: 40,
    alignItems: 'flex-start',
  },
  feature: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
    paddingLeft: 10,
  },
  continueButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 60,
    marginBottom: 30,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});