import { Alert, Platform } from 'react-native';

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    // For now, just return true since we can't use expo-notifications
    return true;
  }

  async sendLocalNotification(notification: NotificationData): Promise<void> {
    // Use Alert as fallback for notifications
    Alert.alert(notification.title, notification.body);
  }

  async sendSOSAlert(watcherName: string): Promise<void> {
    Alert.alert(
      'SOS Alert',
      `${watcherName} has activated SOS and needs immediate assistance!`,
      [
        { text: 'View', onPress: () => {} },
        { text: 'OK', style: 'default' }
      ]
    );
  }

  async sendWatcherJoined(userName: string): Promise<void> {
    Alert.alert(
      'Watcher Joined',
      `${userName} is now watching your safety session`
    );
  }

  async sendSessionEnded(): Promise<void> {
    Alert.alert(
      'Session Ended',
      'Your safety session has ended automatically after 30 minutes'
    );
  }
}

export default NotificationService;