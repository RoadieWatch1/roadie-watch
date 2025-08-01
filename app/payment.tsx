import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SparkleBackground } from '../src/components/SparkleBackground';

export default function PaymentScreen() {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [loading, setLoading] = useState(false);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    const matches = cleaned.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return match;
    }
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handlePayment = async () => {
    if (!cardNumber || !expiryDate || !cvv || !cardholderName || !billingZip) {
      Alert.alert('Error', 'Please fill in all payment details');
      return;
    }

    if (cardNumber.replace(/\s/g, '').length < 16) {
      Alert.alert('Error', 'Please enter a valid card number');
      return;
    }

    setLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Payment Successful!', 
        'Welcome to Roadie Watch Premium. Your subscription is now active.',
        [{ text: 'Continue', onPress: () => router.push('/welcomeback') }]
      );
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <SparkleBackground>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <Text style={styles.title}>Premium Subscription</Text>
            <Text style={styles.subtitle}>$9.99/month</Text>
            
            <View style={styles.featuresContainer}>
              <Text style={styles.featureText}>✓ Unlimited SOS activations</Text>
              <Text style={styles.featureText}>✓ Up to 20 watchers</Text>
              <Text style={styles.featureText}>✓ Live video & audio streaming</Text>
              <Text style={styles.featureText}>✓ Location tracking</Text>
              <Text style={styles.featureText}>✓ Emergency chat system</Text>
              <Text style={styles.featureText}>✓ 30-day history storage</Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Cardholder Name"
                placeholderTextColor="#666"
                value={cardholderName}
                onChangeText={setCardholderName}
                autoCapitalize="words"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Card Number"
                placeholderTextColor="#666"
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                keyboardType="numeric"
                maxLength={19}
              />
              
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="MM/YY"
                  placeholderTextColor="#666"
                  value={expiryDate}
                  onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                  keyboardType="numeric"
                  maxLength={5}
                />
                
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="CVV"
                  placeholderTextColor="#666"
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Billing ZIP Code"
                placeholderTextColor="#666"
                value={billingZip}
                onChangeText={setBillingZip}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handlePayment}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Processing...' : 'SUBSCRIBE NOW'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Secure payment processing. Cancel anytime.
            </Text>
          </View>
        </ScrollView>
      </SparkleBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  featuresContainer: {
    backgroundColor: 'rgba(42, 42, 42, 0.8)',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
  },
  featureText: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 30,
    gap: 16,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfInput: {
    flex: 1,
  },
  button: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
});