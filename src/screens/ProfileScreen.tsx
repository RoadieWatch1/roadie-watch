import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../app/lib/supabase';

const { width } = Dimensions.get('window');

const ProfileScreen: React.FC = () => {
  const [user, setUser] = useState({
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    inserted_at: new Date().toISOString(),
    sosCount: 0,
    watcherCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email, phone, inserted_at')
          .eq('id', authUser.id)
          .single();

        if (profileData) {
          setUser(prev => ({
            ...prev,
            full_name: profileData.full_name || 'John Doe',
            email: profileData.email || authUser.email,
            phone: profileData.phone || '+1 (555) 123-4567',
            inserted_at: profileData.inserted_at || new Date().toISOString(),
          }));
        }

        const { count: sosCount } = await supabase
          .from('sos_activations')
          .select('id', { count: 'exact' })
          .eq('user_id', authUser.id);

        const { count: watcherCount } = await supabase
          .from('followers')
          .select('id', { count: 'exact' })
          .eq('followed_id', authUser.id);

        setUser(prev => ({
          ...prev,
          sosCount: sosCount || 0,
          watcherCount: watcherCount || 0,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing feature coming soon!');
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Photo',
      'Choose photo source',
      [
        { text: 'Camera', onPress: () => console.log('Camera selected') },
        { text: 'Gallery', onPress: () => console.log('Gallery selected') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubscription = () => {
    Alert.alert(
      'Subscription',
      'Current Plan: Premium\n$5/month - Cancel anytime',
      [
        { text: 'Manage Subscription', onPress: () => console.log('Manage subscription') },
        { text: 'OK' },
      ]
    );
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/title');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleChangePhoto} style={styles.photoContainer}>
          <Image
            source={require('../../assets/default-profile.png')}
            style={styles.profilePhoto}
          />
          <View style={styles.photoOverlay}>
            <Text style={styles.photoOverlayText}>📷</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.userName}>{user.full_name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <Text style={styles.memberSince}>
          Member since {new Date(user.inserted_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.sosCount}</Text>
          <Text style={styles.statLabel}>SOS Alerts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.watcherCount}</Text>
          <Text style={styles.statLabel}>Watchers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>24/7</Text>
          <Text style={styles.statLabel}>Protection</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
          <Text style={styles.actionButtonText}>✏️ Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/medical-info' as any)}>
          <Text style={styles.actionButtonText}>📞 Emergency Contacts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleSubscription}>
          <Text style={styles.actionButtonText}>💳 Subscription</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={() =>
            Alert.alert('Sign Out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign Out',
                onPress: handleSignOut,
              },
            ])
          }
        >
          <Text style={styles.actionButtonText}>🚪 Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Contact Information</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{user.phone}</Text>
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push('/get-help' as any)}
        >
          <Text style={styles.navText}>🚨 Help</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push('/followers' as any)}
        >
          <Text style={styles.navText}>👥 Groups</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push('/live-tracking' as any)}
        >
          <Text style={styles.navText}>📍 Tracking</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push('/setting' as any)}
        >
          <Text style={styles.navText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1C',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FD7C0A',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FD7C0A',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoOverlayText: {
    fontSize: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#FD7C0A',
    marginBottom: 5,
  },
  memberSince: {
    fontSize: 14,
    color: '#AAA',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FD7C0A',
  },
  statLabel: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 5,
  },
  actionsContainer: {
    padding: 20,
  },
  actionButton: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  dangerButton: {
    borderColor: '#EA0000',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    color: '#AAA',
    fontSize: 16,
  },
  infoValue: {
    color: 'white',
    fontSize: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#0A0A0A',
    paddingVertical: 15,
    marginTop: 20,
  },
  navButton: {
    alignItems: 'center',
  },
  navText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;