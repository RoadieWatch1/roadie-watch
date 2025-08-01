import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SparkleBackground } from '../components/SparkleBackground';
import { SubscriptionManager } from '../components/SubscriptionManager';
import { supabase } from '@/app/lib/supabase';

interface PaymentScreenProps {
  navigation: any;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ navigation }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }
  };

  const handleSubscriptionChange = (isActive: boolean) => {
    setHasActiveSubscription(isActive);
    if (isActive) {
      // Navigate to welcome screen after successful subscription
      setTimeout(() => {
        navigation.navigate('WelcomeBack');
      }, 2000);
    }
  };

  const handleSkipTrial = () => {
    Alert.alert(
      'Start Free Trial',
      'Start your 7-day free trial? You can cancel anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Trial', 
          onPress: () => navigation.navigate('WelcomeBack')
        }
      ]
    );
  };

  if (!userId) {
    return (
      <SparkleBackground>
        <View style={styles.container}>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </SparkleBackground>
    );
  }

  return (
    <SparkleBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Roadie Watch Premium</Text>
        <Text style={styles.subtitle}>
          Advanced emergency protection with voice activation and real-time monitoring
        </Text>
        
        <View style={styles.featuresContainer}>
          <Text style={styles.featureItem}>✅ Voice-activated emergency calls</Text>
          <Text style={styles.featureItem}>✅ 24/7 live tracking</Text>
          <Text style={styles.featureItem}>✅ Custom wake word training</Text>
          <Text style={styles.featureItem}>✅ Emergency contact notifications</Text>
          <Text style={styles.featureItem}>✅ Medical information storage</Text>
        </View>

        <SubscriptionManager 
          userId={userId}
          onSubscriptionChange={handleSubscriptionChange}
        />
        
        {!hasActiveSubscription && (
          <TouchableOpacity style={styles.trialButton} onPress={handleSkipTrial}>
            <Text style={styles.trialButtonText}>Start 7-Day Free Trial</Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.secureText}>
          🔒 Secure payments powered by RevenueCat
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
    marginBottom: 30,
    lineHeight: 22,
  },
  featuresContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  featureItem: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 20,
  },
  trialButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  trialButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secureText: {
    color: '#CCCCCC',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 10,
  },
});