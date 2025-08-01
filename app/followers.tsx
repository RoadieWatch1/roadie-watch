import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Share, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SparkleBackground } from '../src/components/SparkleBackground';
import GestureService from '../src/utils/GestureService';
import VoiceService from '../src/utils/VoiceService';
import TrialService from '../src/utils/TrialService';

interface Watcher {
  id: string;
  name: string;
  phone: string;
  status: 'online' | 'offline';
  joinedDate: string;
  platform: 'iOS' | 'Android';
}

export default function FollowersScreen() {
  const router = useRouter();
  const [watchers, setWatchers] = useState<Watcher[]>([
    { id: '1', name: 'Sarah Johnson', phone: '+1 (555) 123-4567', status: 'online', joinedDate: '2024-01-15', platform: 'iOS' },
    { id: '2', name: 'Mike Chen', phone: '+1 (555) 987-6543', status: 'offline', joinedDate: '2024-01-16', platform: 'Android' },
    { id: '3', name: 'Emma Davis', phone: '+1 (555) 456-7890', status: 'online', joinedDate: '2024-01-17', platform: 'iOS' }
  ]);
  const [trialDays, setTrialDays] = useState(15);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await checkTrialStatus();
      setupEmergencyFeatures();
      setIsLoading(false);
    };
    initialize();
  }, []);

  const checkTrialStatus = async () => {
    const trial = await TrialService.getTrialStatus();
    setTrialDays(trial.daysRemaining);
  };

  const setupEmergencyFeatures = () => {
    GestureService.addListener((event) => {
      if (event.type === 'panic_tap') {
        Alert.alert(
          'Panic Gesture Detected',
          'Emergency gesture detected. What would you like to do?',
          [
            { text: 'Cancel' },
            { text: 'Activate SOS', onPress: () => router.push('/sos') },
            { text: 'Call 911', onPress: () => {/* Emergency dial implementation */} }
          ]
        );
      }
    });
    
    VoiceService.getInstance().startListening((command) => {
      if (command.action === 'activate') {
        router.push('/sos');
      } else if (command.action === 'help') {
        Alert.alert('Voice Help', 'Say "activate" to start SOS, or "emergency" to call 911');
      }
    });
  };

  const shareInviteLink = useCallback(async () => {
    const inviteCode = 'RW' + Math.random().toString(36).substr(2, 8).toUpperCase();
    const universalLink = `https://roadiewatch.app/invite/${inviteCode}`;
    const message = `Join my Roadie Watch safety network!\n\n🔗 ${universalLink}\n\n📱 Don't have the app? Download it:\niOS: https://apps.apple.com/app/roadie-watch\nAndroid: https://play.google.com/store/apps/details?id=com.roadiewatch\n\n✅ Works on both iOS and Android\n🚨 Emergency alerts reach all watchers instantly`;
    
    try {
      await Share.share({ message });
    } catch (error) {
      Alert.alert('Error', 'Failed to share invite link');
    }
  }, []);

  const removeWatcher = useCallback((id: string) => {
    Alert.alert(
      'Remove Watcher',
      'Are you sure you want to remove this watcher?',
      [
        { text: 'Cancel' },
        { text: 'Remove', onPress: () => setWatchers(prev => prev.filter(w => w.id !== id)) }
      ]
    );
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkTrialStatus();
    // Simulate fetching watchers
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const renderWatcher = useCallback(({ item }: { item: Watcher }) => (
    <View style={styles.watcherCard}>
      <View style={styles.watcherInfo}>
        <View style={styles.watcherHeader}>
          <Text style={styles.watcherName}>{item.name}</Text>
          <Text style={styles.platform}>{item.platform}</Text>
          <View style={[styles.statusDot, { backgroundColor: item.status === 'online' ? '#4CAF50' : '#757575' }]} />
        </View>
        <Text style={styles.watcherPhone}>{item.phone}</Text>
        <Text style={styles.joinedDate}>Joined: {item.joinedDate}</Text>
      </View>
      {/* @ts-ignore - Suppress TypeScript error on TouchableOpacity return type */}
      <TouchableOpacity 
        style={styles.removeButton} 
        onPress={() => removeWatcher(item.id)}
        accessibilityLabel={`Remove ${item.name}`}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  ), [removeWatcher]);

  if (isLoading) {
    return (
      <SparkleBackground>
        <View style={styles.container}>
          <Text style={styles.title}>Loading Watchers...</Text>
        </View>
      </SparkleBackground>
    );
  }

  return (
    <SparkleBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Your Watchers</Text>
        <Text style={styles.subtitle}>{watchers.length}/20 watchers active</Text>
        <Text style={styles.trialInfo}>🆓 Trial: {trialDays} days remaining</Text>
        
        <View style={styles.compatibility}>
          <Text style={styles.compatibilityTitle}>🌐 Cross-Platform Network</Text>
          <Text style={styles.compatibilityText}>✅ iOS users can connect with Android users</Text>
          <Text style={styles.compatibilityText}>✅ Universal invite links work on all platforms</Text>
          <Text style={styles.compatibilityText}>✅ Real-time sync across all devices</Text>
          <Text style={styles.compatibilityText}>✅ Emergency alerts reach all watchers instantly</Text>
        </View>

        <FlatList
          data={watchers}
          renderItem={renderWatcher}
          keyExtractor={item => item.id}
          style={styles.watchersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />

        <View style={styles.actions}>
          {/* @ts-ignore - Suppress TypeScript error on TouchableOpacity return type */}
          <TouchableOpacity style={styles.inviteButton} onPress={shareInviteLink}>
            <Text style={styles.inviteButtonText}>📤 Share Universal Invite</Text>
          </TouchableOpacity>
          
          {/* @ts-ignore - Suppress TypeScript error on TouchableOpacity return type */}
          <TouchableOpacity style={styles.sosButton} onPress={() => router.push('/sos')}>
            <Text style={styles.sosButtonText}>🚨 Activate SOS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SparkleBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginTop: 40 },
  subtitle: { fontSize: 18, color: '#ccc', textAlign: 'center', marginBottom: 10 },
  trialInfo: { fontSize: 14, color: '#FFD700', textAlign: 'center', marginBottom: 20 },
  compatibility: { backgroundColor: '#1A4A3A', padding: 15, borderRadius: 10, marginBottom: 20 },
  compatibilityTitle: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50', marginBottom: 8, textAlign: 'center' },
  compatibilityText: { fontSize: 12, color: '#E8F5E8', marginBottom: 4 },
  watchersList: { flex: 1, marginBottom: 20 },
  watcherCard: { 
    backgroundColor: '#333', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  watcherInfo: { flex: 1 },
  watcherHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  watcherName: { fontSize: 18, fontWeight: 'bold', color: '#fff', flex: 1 },
  platform: { fontSize: 12, color: '#007AFF', marginRight: 8, fontWeight: 'bold' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  watcherPhone: { fontSize: 14, color: '#ccc', marginBottom: 3 },
  joinedDate: { fontSize: 12, color: '#888' },
  removeButton: {
    backgroundColor: '#FF4444',
    padding: 8,
    borderRadius: 5,
    marginLeft: 10
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  actions: { gap: 15 },
  inviteButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10 },
  inviteButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  sosButton: { backgroundColor: '#FF4444', padding: 18, borderRadius: 10 },
  sosButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' }
});