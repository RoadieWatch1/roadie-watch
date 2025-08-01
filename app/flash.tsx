import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SparkleBackground } from '../src/components/SparkleBackground';

export default function Flash() {
  const [countdown, setCountdown] = useState(5);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.replace('/title');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      <SparkleBackground>
        {/* @ts-ignore - Suppress TypeScript error on Animated.View return type */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.logoContainer} accessibilityLabel="Roadie Watch Logo">
            <Text style={styles.logoText}>ROADIE</Text>
            <Text style={styles.logoText}>WATCH</Text>
          </View>
          <Text style={styles.subtitle}>Security Watchers Network</Text>
          {countdown > 0 && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdown} accessibilityLabel={`Countdown: ${countdown} seconds`}>
                {countdown}
              </Text>
            </View>
          )}
        </Animated.View>
      </SparkleBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#888888',
    fontSize: 16,
    marginBottom: 60,
    textAlign: 'center',
  },
  countdownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  countdown: {
    color: '#FF6B6B',
    fontSize: 36,
    fontWeight: 'bold',
  },
});