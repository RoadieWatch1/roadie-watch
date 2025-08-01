import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { SparkleBackground } from '../components/SparkleBackground';

export default function CoverScreen() {
  const [countdown, setCountdown] = useState(3);
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
    <SparkleBackground>
      <View style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={styles.logo}>ROADIE WATCH</Text>
          <Text style={styles.tagline}>Emergency. Everywhere. Instantly.</Text>
        </Animated.View>
        <View style={styles.countdownContainer}>
          <Text style={styles.countdown}>{countdown}</Text>
        </View>
      </View>
    </SparkleBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    color: '#FF6B35',
    fontWeight: 'bold',
    letterSpacing: 3,
    textShadowColor: '#FF6B35',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    marginTop: 15,
    fontSize: 18,
    color: '#888',
    fontStyle: 'italic',
    letterSpacing: 1,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  countdownContainer: {
    position: 'absolute',
    bottom: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdown: {
    color: '#FF6B35',
    fontSize: 28,
    fontWeight: 'bold',
  },
});