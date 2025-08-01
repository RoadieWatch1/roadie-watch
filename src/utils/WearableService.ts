import { Alert } from 'react-native';
import { supabase } from '@/app/lib/supabase';

export interface WearableDevice {
  id: string;
  name: string;
  type: 'apple_watch' | 'fitbit' | 'garmin' | 'samsung_watch' | 'other';
  isConnected: boolean;
  batteryLevel?: number;
  lastSync: number;
}

export interface WearableData {
  heartRate?: number;
  steps?: number;
  location?: { latitude: number; longitude: number };
  batteryLevel?: number;
  timestamp: number;
  deviceId: string;
}

export interface EmergencyTrigger {
  type: 'fall_detection' | 'heart_rate_anomaly' | 'panic_button' | 'no_movement';
  severity: 'low' | 'medium' | 'high' | 'critical';
  data: any;
  timestamp: number;
}

class WearableService {
  private static instance: WearableService;
  private connectedDevices: Map<string, WearableDevice> = new Map();
  private dataCallbacks: ((data: WearableData) => void)[] = [];
  private emergencyCallbacks: ((trigger: EmergencyTrigger) => void)[] = [];

  static getInstance(): WearableService {
    if (!WearableService.instance) {
      WearableService.instance = new WearableService();
    }
    return WearableService.instance;
  }

  async scanForDevices(): Promise<WearableDevice[]> {
    // Simulate device scanning
    const mockDevices: WearableDevice[] = [
      {
        id: 'apple_watch_1',
        name: 'Apple Watch Series 9',
        type: 'apple_watch',
        isConnected: false,
        lastSync: Date.now()
      },
      {
        id: 'fitbit_1',
        name: 'Fitbit Sense 2',
        type: 'fitbit',
        isConnected: false,
        lastSync: Date.now()
      }
    ];

    return mockDevices;
  }

  async connectDevice(device: WearableDevice): Promise<boolean> {
    try {
      // Simulate connection process
      return new Promise((resolve) => {
        Alert.alert(
          'Connect Wearable',
          `Connect to ${device.name}?`,
          [
            { text: 'Cancel', onPress: () => resolve(false) },
            { 
              text: 'Connect', 
              onPress: () => {
                device.isConnected = true;
                this.connectedDevices.set(device.id, device);
                this.startDataSync(device);
                resolve(true);
              }
            }
          ]
        );
      });
    } catch (error) {
      console.error('Device connection error:', error);
      return false;
    }
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    const device = this.connectedDevices.get(deviceId);
    if (device) {
      device.isConnected = false;
      this.connectedDevices.delete(deviceId);
    }
  }

  private startDataSync(device: WearableDevice): void {
    // Simulate real-time data sync
    const syncInterval = setInterval(() => {
      if (!device.isConnected) {
        clearInterval(syncInterval);
        return;
      }

      const mockData: WearableData = {
        heartRate: 60 + Math.random() * 40,
        steps: Math.floor(Math.random() * 1000),
        batteryLevel: 20 + Math.random() * 80,
        timestamp: Date.now(),
        deviceId: device.id
      };

      this.processWearableData(mockData);
    }, 5000);
  }

  private processWearableData(data: WearableData): void {
    // Check for emergency conditions
    this.checkEmergencyConditions(data);
    
    // Notify callbacks
    this.dataCallbacks.forEach(callback => callback(data));
    
    // Store data
    this.storeWearableData(data);
  }

  private checkEmergencyConditions(data: WearableData): void {
    // Heart rate anomaly detection
    if (data.heartRate && (data.heartRate > 120 || data.heartRate < 50)) {
      const trigger: EmergencyTrigger = {
        type: 'heart_rate_anomaly',
        severity: data.heartRate > 150 || data.heartRate < 40 ? 'critical' : 'medium',
        data: { heartRate: data.heartRate },
        timestamp: data.timestamp
      };
      this.triggerEmergency(trigger);
    }

    // Low battery warning
    if (data.batteryLevel && data.batteryLevel < 10) {
      Alert.alert('Low Battery', 'Your wearable device battery is critically low');
    }
  }

  private triggerEmergency(trigger: EmergencyTrigger): void {
    this.emergencyCallbacks.forEach(callback => callback(trigger));
  }

  onDataReceived(callback: (data: WearableData) => void): void {
    this.dataCallbacks.push(callback);
  }

  onEmergencyTrigger(callback: (trigger: EmergencyTrigger) => void): void {
    this.emergencyCallbacks.push(callback);
  }

  getConnectedDevices(): WearableDevice[] {
    return Array.from(this.connectedDevices.values());
  }

  private async storeWearableData(data: WearableData): Promise<void> {
    try {
      await supabase.from('wearable_data').insert([data]);
    } catch (error) {
      console.error('Failed to store wearable data:', error);
    }
  }
}

export default WearableService;