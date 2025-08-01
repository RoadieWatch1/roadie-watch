import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { SparkleBackground } from '../components/SparkleBackground';

export default function FlashScreen() {
  const [countdown, setCountdown] = useState(5);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

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
        <Animated.View style={[
          styles.content,
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}>
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
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B35',
    letterSpacing: 3,
    textShadowColor: 'rgba(255, 107, 53, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    marginBottom: 15,
  },
  tagline: {
    fontSize: 18,
    color: '#888',
    letterSpacing: 1,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 40,
    opacity: 0.9,
  },
  countdownContainer: {
    position: 'absolute',
    bottom: 50,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  countdown: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
});
