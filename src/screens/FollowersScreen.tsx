import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, RefreshControl, Image } from 'react-native';
import { router } from 'expo-router';
import { SparkleBackground } from '../components/SparkleBackground';
import { useVoiceActivation } from '../components/VoiceActivationProvider'; // Assuming this exists for consistency

interface Watcher {
  id: string;
  name: string;
  avatar?: string; // Added for creative avatars
  status: 'online' | 'offline';
  joinedDate: string;
  lastSeen?: string; // Added for more details
}

export default function FollowersScreen() {
  const { isListening } = useVoiceActivation(); // Integrated voice status for app consistency
  const [watchers, setWatchers] = useState<Watcher[]>([
    { id: '1', name: 'Mom', avatar: 'https://example.com/mom.jpg', status: 'online', joinedDate: '2024-01-15', lastSeen: 'Now' },
    { id: '2', name: 'Dad', avatar: 'https://example.com/dad.jpg', status: 'online', joinedDate: '2024-01-15', lastSeen: 'Now' },
    { id: '3', name: 'Sarah (Sister)', avatar: 'https://example.com/sarah.jpg', status: 'offline', joinedDate: '2024-01-16', lastSeen: '2h ago' },
  ]);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<number>(2); // Added creative pending invites feature

  const handleRemoveWatcher = useCallback((watcherId: string) => {
    Alert.alert(
      'Remove Watcher',
      'Are you sure you want to remove this watcher from your safety network?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setWatchers(prev => prev.filter(w => w.id !== watcherId));
          },
        },
      ]
    );
  }, []);

  const handleStartSOS = () => {
    router.push('/sos');
  };

  const handleInvite = () => {
    router.push('/invitecode');
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call for real-time updates
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Update watchers status creatively
    setWatchers(prev => prev.map(w => ({
      ...w,
      status: Math.random() > 0.3 ? 'online' : 'offline',
      lastSeen: w.status === 'online' ? 'Now' : `${Math.floor(Math.random() * 5) + 1}h ago`
    })));
    setPendingInvites(Math.floor(Math.random() * 3) + 1);
    setRefreshing(false);
  }, []);

  const renderWatcher = ({ item }: { item: Watcher }) => (
    <TouchableOpacity style={styles.watcherItem} onPress={() => Alert.alert(item.name, `Status: ${item.status}\nJoined: ${item.joinedDate}\nLast seen: ${item.lastSeen}`)}>
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
        )}
      </View>
      <View style={styles.watcherInfo}>
        <Text style={styles.watcherName}>{item.name}</Text>
        <Text style={styles.joinedDate}>Joined: {item.joinedDate}</Text>
        <Text style={styles.lastSeen}>Last seen: {item.lastSeen}</Text>
      </View>
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: item.status === 'online' ? '#4CAF50' : '#999' },
          ]}
        />
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
      <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveWatcher(item.id)}>
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SparkleBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Safety Network</Text>
          <Text style={styles.subtitle}>
            {watchers.length} watchers active • {pendingInvites} pending invites
          </Text>
          {isListening && <Text style={styles.voiceStatus}>🎤 Voice Activation Listening</Text>}
        </View>

        <FlatList
          data={watchers}
          renderItem={renderWatcher}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF6B35" />}
          ListEmptyComponent={<Text style={styles.emptyText}>No watchers yet. Invite some!</Text>}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.inviteButton} onPress={handleInvite}>
            <Text style={styles.inviteButtonText}>+ Invite Watchers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sosButton} onPress={handleStartSOS}>
            <Text style={styles.sosButtonText}>🚨 Activate SOS</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.infoText}>
          Your network is your shield. Add trusted watchers for instant emergency support.
        </Text>
      </View>
    </SparkleBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: 50,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 5,
  },
  voiceStatus: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  watcherItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FF6B35',
    fontSize: 24,
    fontWeight: 'bold',
  },
  watcherInfo: {
    flex: 1,
  },
  watcherName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  joinedDate: {
    color: '#999999',
    fontSize: 12,
    marginBottom: 2,
  },
  lastSeen: {
    color: '#777777',
    fontSize: 12,
  },
  statusContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 15,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 5,
  },
  statusText: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  removeButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  removeButtonText: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#999999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  buttonContainer: {
    marginBottom: 20,
    gap: 15,
  },
  inviteButton: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  inviteButtonText: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sosButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoText: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
});