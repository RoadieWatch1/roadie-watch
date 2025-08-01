import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationService from './LocationService';
import NotificationService from './NotificationService';
import EmergencyDialService from './EmergencyDialService';

interface SafetyCheck {
  id: string;
  timestamp: number;
  location: { latitude: number; longitude: number };
  status: 'safe' | 'help_needed' | 'emergency';
  message?: string;
}

interface GeofenceAlert {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  alertType: 'enter' | 'exit';
  isActive: boolean;
}

class SafetyService {
  private static instance: SafetyService;
  private safetyChecks: SafetyCheck[] = [];
  private geofences: GeofenceAlert[] = [];
  private checkInInterval: number | null = null;
  private lastKnownLocation: { latitude: number; longitude: number } | null = null;
  private locationService = LocationService.getInstance();
  private notificationService = NotificationService.getInstance();
  private emergencyDialService = EmergencyDialService.getInstance();

  static getInstance(): SafetyService {
    if (!SafetyService.instance) {
      SafetyService.instance = new SafetyService();
    }
    return SafetyService.instance;
  }

  async initializeSafety(): Promise<void> {
    await this.loadSafetyData();
    this.startLocationMonitoring();
    this.schedulePeriodicChecks();
  }

  private async loadSafetyData(): Promise<void> {
    try {
      const checks = await AsyncStorage.getItem('safety_checks');
      const fences = await AsyncStorage.getItem('geofences');
      
      if (checks) this.safetyChecks = JSON.parse(checks);
      if (fences) this.geofences = JSON.parse(fences);
    } catch (error) {
      console.error('Failed to load safety data:', error);
    }
  }

  private async saveSafetyData(): Promise<void> {
    try {
      await AsyncStorage.setItem('safety_checks', JSON.stringify(this.safetyChecks));
      await AsyncStorage.setItem('geofences', JSON.stringify(this.geofences));
    } catch (error) {
      console.error('Failed to save safety data:', error);
    }
  }

  async performSafetyCheck(status: 'safe' | 'help_needed' | 'emergency', message?: string): Promise<void> {
    const location = await this.locationService.getCurrentLocation();
    
    const check: SafetyCheck = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      location: location || { latitude: 0, longitude: 0 },
      status,
      message
    };

    this.safetyChecks.unshift(check);
    this.safetyChecks = this.safetyChecks.slice(0, 50); // Keep last 50 checks
    
    await this.saveSafetyData();
    await this.notifyWatchers(check);

    if (status === 'emergency') {
      await this.handleEmergencyProtocol();
    }
  }

  private async handleEmergencyProtocol(): Promise<void> {
    // Multi-step emergency response
    Alert.alert(
      'Emergency Protocol Activated',
      'Initiating emergency response sequence...',
      [
        { text: 'Cancel Emergency', onPress: () => this.cancelEmergency() },
        { text: 'Continue', onPress: () => this.executeEmergencySteps() }
      ]
    );
  }

  private async executeEmergencySteps(): Promise<void> {
    // Step 1: Notify all watchers
    // @ts-ignore
    await this.notificationService.sendEmergencyAlert('Emergency activated by user');
    
    // Step 2: Start continuous location sharing
    this.locationService.startContinuousTracking();
    
    // Step 3: Prepare emergency services contact
    setTimeout(() => {
      Alert.alert(
        'Contact Emergency Services?',
        'Would you like to call 911 now?',
        [
          { text: 'Not Yet' },
          { text: 'Call 911', onPress: () => this.emergencyDialService.dialEmergency() }
        ]
      );
    }, 5000);
  }

  private cancelEmergency(): void {
    Alert.alert('Emergency Cancelled', 'Emergency protocol has been cancelled.');
    this.performSafetyCheck('safe', 'False alarm - user cancelled emergency');
  }

  addGeofence(name: string, latitude: number, longitude: number, radius: number, alertType: 'enter' | 'exit'): void {
    const geofence: GeofenceAlert = {
      id: Date.now().toString(),
      name,
      latitude,
      longitude,
      radius,
      alertType,
      isActive: true
    };

    this.geofences.push(geofence);
    this.saveSafetyData();
  }

  private startLocationMonitoring(): void {
    setInterval(async () => {
      const location = await this.locationService.getCurrentLocation();
      if (location) {
        this.lastKnownLocation = location;
        this.checkGeofences(location);
      }
    }, 30000); // Check every 30 seconds
  }

  private schedulePeriodicChecks(): void {
    // Schedule periodic safety check reminders
    this.checkInInterval = setInterval(() => {
      const lastCheck = this.safetyChecks[0];
      const timeSinceLastCheck = Date.now() - (lastCheck?.timestamp || 0);
      
      if (timeSinceLastCheck > 4 * 60 * 60 * 1000) { // 4 hours
        // @ts-ignore
        this.notificationService.scheduleNotification(
          'Safety Check Reminder',
          'It\'s been a while since your last check-in. Let your watchers know you\'re safe!',
          new Date(Date.now() + 60000) // 1 minute from now
        );
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  private checkGeofences(location: { latitude: number; longitude: number }): void {
    this.geofences.forEach(fence => {
      if (!fence.isActive) return;

      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        fence.latitude,
        fence.longitude
      );

      const isInside = distance <= fence.radius;
      
      // Trigger alert based on fence type
      if ((fence.alertType === 'enter' && isInside) || (fence.alertType === 'exit' && !isInside)) {
        this.triggerGeofenceAlert(fence, location);
      }
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  private triggerGeofenceAlert(fence: GeofenceAlert, location: { latitude: number; longitude: number }): void {
    const message = `${fence.alertType === 'enter' ? 'Entered' : 'Left'} ${fence.name}`;
    // @ts-ignore
    this.notificationService.sendLocationAlert(message, location);
    this.performSafetyCheck('safe', message);
  }

  private async notifyWatchers(check: SafetyCheck): Promise<void> {
    const statusEmoji = check.status === 'safe' ? '✅' : check.status === 'help_needed' ? '⚠️' : '🚨';
    const message = `${statusEmoji} Safety Update: ${check.status.replace('_', ' ')}${check.message ? ` - ${check.message}` : ''}`;
    
    // @ts-ignore
    await this.notificationService.sendToWatchers(message, check.location);
  }

  getSafetyHistory(): SafetyCheck[] {
    return this.safetyChecks;
  }

  getActiveGeofences(): GeofenceAlert[] {
    return this.geofences.filter(fence => fence.isActive);
  }

  cleanup(): void {
    if (this.checkInInterval) {
      clearInterval(this.checkInInterval);
    }
  }
}

export default SafetyService;