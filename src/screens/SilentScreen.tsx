import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SparkleBackground } from '../components/SparkleBackground';

interface SilentScreenProps {
  navigation: any;
}

export const SilentScreen: React.FC<SilentScreenProps> = ({ navigation }) => {
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('Initializing...');

  useEffect(() => {
    const tasks = [
      'Requesting camera permissions...',
      'Requesting microphone permissions...',
      'Requesting location permissions...',
      'Setting up background services...',
      'Configuring security protocols...',
      'Ready to protect you!'
    ];

    let taskIndex = 0;
    const interval = setInterval(() => {
      if (taskIndex < tasks.length) {
        setCurrentTask(tasks[taskIndex]);
        setProgress((taskIndex + 1) / tasks.length * 100);
        taskIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          navigation.navigate('NameGroup');
        }, 1000);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [navigation]);

  return (
    <SparkleBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Setting Up Protection</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
        
        <Text style={styles.taskText}>{currentTask}</Text>
        
        <Text style={styles.infoText}>
          We're configuring your device for optimal security monitoring.
          This includes camera, microphone, and location services.
        </Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 50,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskText: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  infoText: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});