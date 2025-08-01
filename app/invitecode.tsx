import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { SparkleBackground } from '../src/components/SparkleBackground';
import InviteLinkService from '../src/utils/InviteLinkService';
import TrialService from '../src/utils/TrialService';

export default function InviteCodeScreen() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [trialDays, setTrialDays] = useState(15);
  const [inviteStats, setInviteStats] = useState({
    totalCreated: 0,
    activeInvites: 0,
    usedInvites: 0,
    expiredInvites: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const trial = await TrialService.getTrialStatus();
    setTrialDays(trial.daysRemaining);
    
    const stats = await InviteLinkService.getInstance().getInviteStats('current_user');
    setInviteStats(stats);
  };

  const generateInviteCode = async () => {
    try {
      const code = await InviteLinkService.getInstance().generateUniversalInvite('current_user');
      setGeneratedCode(code);
      Alert.alert(
        'Invite Code Generated',
        `Your universal invite code: ${code}\n\nThis code works on both iOS and Android devices and includes app download links.`
      );
      loadData(); // Refresh stats
    } catch (error) {
      Alert.alert('Error', 'Failed to generate invite code');
    }
  };

  const shareUniversalInvite = async () => {
    try {
      await InviteLinkService.getInstance().shareUniversalInvite('current_user');
    } catch (error) {
      Alert.alert('Error', 'Failed to share invite');
    }
  };

  const validateAndJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    const isValid = await InviteLinkService.getInstance().validateInviteCode(inviteCode.trim());
    
    if (isValid) {
      Alert.alert(
        'Valid Invite Code',
        'This invite code is valid! You can now join this safety network.',
        [
          { text: 'Cancel' },
          { 
            text: 'Join Network', 
            onPress: () => {
              Alert.alert('Success', 'You have joined the safety network!');
              router.push('/followers');
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Invalid Code',
        'This invite code is invalid or has expired. Please check with the person who sent it.',
        [
          { text: 'OK' },
          { text: 'Request New Invite', onPress: () => {/* Contact sender */} }
        ]
      );
    }
  };

  const compatibility = InviteLinkService.getInstance().checkPlatformCompatibility();

  return (
    <SparkleBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Invite & Join</Text>
        <Text style={styles.subtitle}>Connect with your safety network</Text>
        <Text style={styles.trialInfo}>🆓 Trial: {trialDays} days remaining</Text>

        <View style={styles.platformInfo}>
          <Text style={styles.platformTitle}>📱 Platform: {compatibility.currentPlatform}</Text>
          <Text style={styles.platformText}>✅ Universal links supported</Text>
          <Text style={styles.platformText}>✅ Cross-platform connectivity</Text>
          <Text style={styles.platformText}>✅ Auto app download for new users</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📤 Share Your Network</Text>
          
          <TouchableOpacity style={styles.generateButton} onPress={generateInviteCode}>
            <Text style={styles.generateButtonText}>Generate Universal Invite</Text>
          </TouchableOpacity>

          {generatedCode ? (
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Your Invite Code:</Text>
              <Text style={styles.generatedCode}>{generatedCode}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.shareButton} onPress={shareUniversalInvite}>
            <Text style={styles.shareButtonText}>📲 Share Complete Invite</Text>
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>📊 Your Invite Stats</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statText}>Active: {inviteStats.activeInvites}</Text>
              <Text style={styles.statText}>Used: {inviteStats.usedInvites}</Text>
              <Text style={styles.statText}>Total: {inviteStats.totalCreated}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📥 Join a Network</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter invite code (e.g., RWABC12345)"
            placeholderTextColor="#888"
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
          />

          <TouchableOpacity style={styles.joinButton} onPress={validateAndJoin}>
            <Text style={styles.joinButtonText}>Join Safety Network</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>💡 How It Works</Text>
          <Text style={styles.helpText}>• Universal links work on both iOS and Android</Text>
          <Text style={styles.helpText}>• New users get app download links automatically</Text>
          <Text style={styles.helpText}>• Cross-platform emergency alerts and location sharing</Text>
          <Text style={styles.helpText}>• Secure encrypted connections between all devices</Text>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back to Followers</Text>
        </TouchableOpacity>
      </View>
    </SparkleBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginTop: 40 },
  subtitle: { fontSize: 16, color: '#ccc', textAlign: 'center', marginBottom: 10 },
  trialInfo: { fontSize: 14, color: '#FFD700', textAlign: 'center', marginBottom: 20 },
  platformInfo: { backgroundColor: '#1A3A4A', padding: 15, borderRadius: 10, marginBottom: 20 },
  platformTitle: { fontSize: 16, fontWeight: 'bold', color: '#4A9EFF', marginBottom: 8 },
  platformText: { fontSize: 12, color: '#E8F4FF', marginBottom: 4 },
  section: { backgroundColor: '#2A2A2A', padding: 20, borderRadius: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 15, textAlign: 'center' },
  generateButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginBottom: 15 },
  generateButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  codeContainer: { backgroundColor: '#333', padding: 15, borderRadius: 8, marginBottom: 15 },
  codeLabel: { fontSize: 14, color: '#ccc', marginBottom: 5 },
  generatedCode: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50', textAlign: 'center' },
  shareButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, marginBottom: 15 },
  shareButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  statsContainer: { backgroundColor: '#333', padding: 12, borderRadius: 8 },
  statsTitle: { fontSize: 14, color: '#ccc', marginBottom: 8, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statText: { fontSize: 12, color: '#fff' },
  input: { backgroundColor: '#333', color: '#fff', padding: 15, borderRadius: 8, fontSize: 16, marginBottom: 15 },
  joinButton: { backgroundColor: '#FF6B35', padding: 15, borderRadius: 8 },
  joinButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  helpSection: { backgroundColor: '#2A2A2A', padding: 15, borderRadius: 10, marginBottom: 20 },
  helpTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 10 },
  helpText: { fontSize: 12, color: '#ccc', marginBottom: 4 },
  backButton: { backgroundColor: '#555', padding: 15, borderRadius: 8 },
  backButtonText: { color: '#fff', fontSize: 16, textAlign: 'center' }
});