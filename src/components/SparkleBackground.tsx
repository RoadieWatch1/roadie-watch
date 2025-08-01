import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export function SparkleBackground({ children }: { children?: React.ReactNode }) {
  const sparkles = useRef(Array.from({ length: 50 }, () => ({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.5),
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 3 + 1,  // Increased size variation
  }))).current;

  useEffect(() => {
    const animations = sparkles.map((sparkle) => {
      return Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(sparkle.opacity, {
              toValue: 1,
              duration: 600 + Math.random() * 1200,
              useNativeDriver: true,
            }),
            Animated.timing(sparkle.scale, {
              toValue: 1.5,
              duration: 600 + Math.random() * 1200,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(sparkle.opacity, {
              toValue: 0,
              duration: 600 + Math.random() * 1200,
              useNativeDriver: true,
            }),
            Animated.timing(sparkle.scale, {
              toValue: 0.5,
              duration: 600 + Math.random() * 1200,
              useNativeDriver: true,
            }),
          ]),
        ]),
        { iterations: -1 }
      );
    });

    animations.forEach((anim, index) => {
      setTimeout(() => anim.start(), index * 100);  // Reduced stagger for denser effect
    });

    return () => animations.forEach(anim => anim.stop());
  }, []);

  return (
    <View style={styles.container}>
      {sparkles.map((sparkle, index) => (
        // @ts-ignore - Suppress TypeScript error on Animated.View return type
        <Animated.View
          key={index}
          style={[
            styles.sparkle,
            {
              left: sparkle.x,
              top: sparkle.y,
              opacity: sparkle.opacity,
              transform: [{ scale: sparkle.scale }],
              width: sparkle.size,
              height: sparkle.size,
              borderRadius: sparkle.size / 2,
            },
          ]}
        />
      ))}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  sparkle: {
    position: 'absolute',
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,  // Added for Android glow
  },
});