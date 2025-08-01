import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

const SettingScreen: React.FC<{ navigation: StackNavigationProp<RootStackParamList, 'SettingScreen'> }> = ({ navigation }) => {
  const [settings, setSettings] = useState({
    notifications: true,
    locationTracking: true,
    biometricAuth: false,
    autoSOS: false,
    silentMode: false,
    emergencyContacts: true,
    voiceActivation: false,
    darkMode: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Your privacy is important to us. We protect your data with end-to-end encryption.');
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'By using Roadie Watch, you agree to our terms and conditions.');
  };

  const handleSupport = () => {
    Alert.alert(
      'Support',
      'Need help?',
      [
        { text: 'Email Support', onPress: () => Alert.alert('Email', 'support@roadiewatch.com') },
        { text: 'Call Support', onPress: () => Alert.alert('Phone', '1-800-ROADIE-1') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Roadie Watch',
      'Version 1.0.0\n\nYour personal security companion.\nBuilt with ❤️ for your safety.'
    );
  };

  const SettingItem = ({ 
    title, 
    subtitle, 
    value, 
    onToggle, 
    showSwitch = true 
  }: {
    title: string;
    subtitle?: string;
    value?: boolean;
    onToggle?: () => void;
    showSwitch?: boolean;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showSwitch && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#333', true: '#FD7C0A' }}
          thumbColor={value ? '#FFF' : '#AAA'}
        />
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>⚙️ Settings</Text>

      {/* Security Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔒 Security</Text>
        
        <SettingItem
          title="Biometric Authentication"
          subtitle="Use Face ID or fingerprint to unlock"
          value={settings.biometricAuth}
          onToggle={() => toggleSetting('biometricAuth')}
        />
        
        <SettingItem
          title="Auto SOS"
          subtitle="Automatically activate SOS in emergencies"
          value={settings.autoSOS}
          onToggle={() => toggleSetting('autoSOS')}
        />
        
        <SettingItem
          title="Silent Mode"
          subtitle="Enable stealth SOS activation"
          value={settings.silentMode}
          onToggle={() => toggleSetting('silentMode')}
        />

        <SettingItem
          title="Voice Activation"
          subtitle="Enable voice commands for SOS"
          value={settings.voiceActivation}
          onToggle={() => toggleSetting('voiceActivation')}
        />
      </View>

      {/* Privacy Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛡️ Privacy</Text>
        
        <SettingItem
          title="Location Tracking"
          subtitle="Allow location sharing during SOS"
          value={settings.locationTracking}
          onToggle={() => toggleSetting('locationTracking')}
        />
        
        <SettingItem
          title="Push Notifications"
          subtitle="Receive alerts and updates"
          value={settings.notifications}
          onToggle={() => toggleSetting('notifications')}
        />
        
        <SettingItem
          title="Emergency Contacts"
          subtitle="Share alerts with emergency contacts"
          value={settings.emergencyContacts}
          onToggle={() => toggleSetting('emergencyContacts')}
        />
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 App Settings</Text>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigation.navigate('PaymentScreen')}
        >
          <Text style={styles.menuItemText}>💳 Subscription</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigation.navigate('MedicalInfoScreen')}
        >
          <Text style={styles.menuItemText}>🏥 Medical Information</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        
        <SettingItem
          title="Dark Mode"
          subtitle="Enable dark theme"
          value={settings.darkMode}
          onToggle={() => toggleSetting('darkMode')}
        />
        
        <TouchableOpacity style={styles.menuItem} onPress={handleSupport}>
          <Text style={styles.menuItemText}>💬 Support & Help</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyPolicy}>
          <Text style={styles.menuItemText}>🔐 Privacy Policy</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleTermsOfService}>
          <Text style={styles.menuItemText}>📋 Terms of Service</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
          <Text style={styles.menuItemText}>ℹ️ About</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={[styles.section, styles.dangerSection]}>
        <Text style={[styles.sectionTitle, styles.dangerTitle]}>⚠️ Danger Zone</Text>
        
        <TouchableOpacity 
          style={[styles.menuItem, styles.dangerItem]} 
          onPress={() => Alert.alert(
            'Reset Settings',
            'This will reset all settings to default. Continue?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: () => Alert.alert('Settings Reset') },
            ]
          )}
        >
          <Text style={styles.dangerText}>🔄 Reset All Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, styles.dangerItem]} 
          onPress={() => Alert.alert(
            'Delete Account',
            'This action cannot be undone. All your data will be permanently deleted.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Account Deleted') },
            ]
          )}
        >
          <Text style={styles.dangerText}>🗑️ Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigation.navigate('GetHelpScreen')}
        >
          <Text style={styles.navText}>🚨 Help</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigation.navigate('FollowersScreen')}
        >
          <Text style={styles.navText}>👥 Groups</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigation.navigate('ProfileScreen')}
        >
          <Text style={styles.navText}>👤 Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigation.navigate('LiveTrackingScreen', { userId: undefined })}
        >
          <Text style={styles.navText}>📍 Tracking</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FD7C0A',
    textAlign: 'center',
    marginVertical: 20,
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingSubtitle: {
    color: '#AAA',
    fontSize: 14,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  menuItemText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuArrow: {
    color: '#AAA',
    fontSize: 20,
  },
  dangerSection: {
    borderWidth: 1,
    borderColor: '#EA0000',
    borderRadius: 10,
    padding: 15,
  },
  dangerTitle: {
    color: '#EA0000',
  },
  dangerItem: {
    borderColor: '#EA0000',
    borderWidth: 1,
  },
  dangerText: {
    color: '#EA0000',
    fontSize: 16,
    fontWeight: 'bold',
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

export default SettingScreen;