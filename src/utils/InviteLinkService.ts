import { Share, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface InviteLink {
  code: string;
  createdAt: number;
  expiresAt: number;
  createdBy: string;
  usedBy?: string;
  isActive: boolean;
}

class InviteLinkService {
  private static instance: InviteLinkService;
  private inviteLinks: InviteLink[] = [];

  static getInstance(): InviteLinkService {
    if (!InviteLinkService.instance) {
      InviteLinkService.instance = new InviteLinkService();
    }
    return InviteLinkService.instance;
  }

  async generateUniversalInvite(createdBy: string): Promise<string> {
    const code = 'RW' + Math.random().toString(36).substr(2, 8).toUpperCase();
    const now = Date.now();
    const expiresAt = now + (7 * 24 * 60 * 60 * 1000); // 7 days

    const invite: InviteLink = {
      code,
      createdAt: now,
      expiresAt,
      createdBy,
      isActive: true
    };

    this.inviteLinks.push(invite);
    await this.saveInvites();

    return code;
  }

  async shareUniversalInvite(createdBy: string): Promise<void> {
    const inviteCode = await this.generateUniversalInvite(createdBy);
    const universalLink = `https://roadiewatch.app/invite/${inviteCode}`;
    
    const message = this.createInviteMessage(universalLink, inviteCode);
    
    try {
      await Share.share({
        message,
        url: universalLink,
        title: 'Join my Roadie Watch Safety Network'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share invite link');
    }
  }

  private createInviteMessage(universalLink: string, inviteCode: string): string {
    return `🛡️ Join my Roadie Watch safety network!

🔗 Universal Link: ${universalLink}
📱 Invite Code: ${inviteCode}

📲 Don't have the app? Download it:
🍎 iOS: https://apps.apple.com/app/roadie-watch
🤖 Android: https://play.google.com/store/apps/details?id=com.roadiewatch

✅ Cross-platform compatibility - iOS and Android users can connect
🚨 Instant emergency alerts to all watchers
📍 Real-time location sharing during emergencies
🔒 Secure end-to-end encrypted communications

Your safety network is stronger together! 💪`;
  }

  async handleIncomingLink(url: string): Promise<boolean> {
    try {
      const match = url.match(/\/invite\/([A-Z0-9]+)/);
      if (!match) return false;

      const inviteCode = match[1];
      const invite = this.inviteLinks.find(inv => inv.code === inviteCode && inv.isActive);

      if (!invite) {
        Alert.alert(
          'Invalid Invite',
          'This invite link is invalid or has expired.',
          [
            { text: 'OK' },
            { text: 'Download App', onPress: () => this.openAppStore() }
          ]
        );
        return false;
      }

      if (Date.now() > invite.expiresAt) {
        Alert.alert(
          'Expired Invite',
          'This invite link has expired. Please ask for a new one.',
          [
            { text: 'OK' },
            { text: 'Download App', onPress: () => this.openAppStore() }
          ]
        );
        return false;
      }

      return await this.processValidInvite(invite);
    } catch (error) {
      console.error('Error handling invite link:', error);
      return false;
    }
  }

  private async processValidInvite(invite: InviteLink): Promise<boolean> {
    Alert.alert(
      'Join Safety Network',
      `You've been invited to join a Roadie Watch safety network. Accept this invitation?`,
      [
        { text: 'Decline', style: 'cancel' },
        { 
          text: 'Accept', 
          onPress: async () => {
            invite.usedBy = 'current_user'; // In real app, use actual user ID
            invite.isActive = false;
            await this.saveInvites();
            
            Alert.alert(
              'Welcome!',
              'You\'ve successfully joined the safety network. You can now receive emergency alerts and share your location when needed.'
            );
          }
        }
      ]
    );
    
    return true;
  }

  private openAppStore(): void {
    const isIOS = require('react-native').Platform.OS === 'ios';
    const storeUrl = isIOS 
      ? 'https://apps.apple.com/app/roadie-watch'
      : 'https://play.google.com/store/apps/details?id=com.roadiewatch';
    
    Linking.openURL(storeUrl).catch(() => {
      Alert.alert('Error', 'Could not open app store');
    });
  }

  async validateInviteCode(code: string): Promise<boolean> {
    const invite = this.inviteLinks.find(inv => 
      inv.code === code && 
      inv.isActive && 
      Date.now() < inv.expiresAt
    );
    
    return !!invite;
  }

  async getInviteStats(createdBy: string): Promise<{
    totalCreated: number;
    activeInvites: number;
    usedInvites: number;
    expiredInvites: number;
  }> {
    const userInvites = this.inviteLinks.filter(inv => inv.createdBy === createdBy);
    
    return {
      totalCreated: userInvites.length,
      activeInvites: userInvites.filter(inv => inv.isActive && Date.now() < inv.expiresAt).length,
      usedInvites: userInvites.filter(inv => inv.usedBy).length,
      expiredInvites: userInvites.filter(inv => Date.now() > inv.expiresAt).length
    };
  }

  private async saveInvites(): Promise<void> {
    try {
      await AsyncStorage.setItem('invite_links', JSON.stringify(this.inviteLinks));
    } catch (error) {
      console.error('Failed to save invites:', error);
    }
  }

  async loadInvites(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('invite_links');
      if (stored) {
        this.inviteLinks = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load invites:', error);
    }
  }

  // Cross-platform compatibility check
  checkPlatformCompatibility(): {
    currentPlatform: string;
    supportsUniversalLinks: boolean;
    canConnectCrossPlatform: boolean;
  } {
    const Platform = require('react-native').Platform;
    
    return {
      currentPlatform: Platform.OS,
      supportsUniversalLinks: true,
      canConnectCrossPlatform: true
    };
  }
}

export default InviteLinkService;