import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { SparkleBackground } from '../components/SparkleBackground';

interface InviteCodeScreenProps {
  navigation: any;
}

export const InviteCodeScreen: React.FC<InviteCodeScreenProps> = ({ navigation }) => {
  const [inviteCode] = useState('RW' + Math.random().toString(36).substr(2, 6).toUpperCase());

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my Roadie Watch safety network! Use code: ${inviteCode}\n\nDownload: https://roadiewatch.app`,
        title: 'Roadie Watch Invitation'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share invite code');
    }
  };

  const handleContinue = () => {
    navigation.navigate('Followers');
  };

  return (
    <SparkleBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Invite Your Watchers</Text>
        <Text style={styles.subtitle}>
          Share this code with people you trust to watch over you
        </Text>
        
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Your Invite Code</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{inviteCode}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>📤 Share Invite Code</Text>
        </TouchableOpacity>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            • Share this code with trusted friends & family{'\n'}
            • They download Roadie Watch and enter your code{'\n'}
            • They become your safety watchers{'\n'}
            • Maximum 20 watchers per group
          </Text>
        </View>
        
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue Setup</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleContinue}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
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
  codeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  codeLabel: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 10,
  },
  codeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  codeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  shareButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    marginBottom: 30,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginBottom: 30,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipText: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});