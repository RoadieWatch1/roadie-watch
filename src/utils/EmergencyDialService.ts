import { Alert, Linking } from 'react-native';
import { supabase } from '@/app/lib/supabase';

export interface EmergencyServiceConfig {
  country: string;
  emergencyNumber: string;
  policeNumber?: string;
  fireNumber?: string;
  medicalNumber?: string;
}

export interface EmergencyCall {
  id: string;
  userId: string;
  serviceType: 'emergency' | 'police' | 'fire' | 'medical';
  phoneNumber: string;
  timestamp: number;
  location?: { latitude: number; longitude: number };
  status: 'initiated' | 'connected' | 'completed' | 'failed';
}

class EmergencyDialService {
  private static instance: EmergencyDialService;
  private emergencyConfigs: Record<string, EmergencyServiceConfig> = {
    US: { country: 'US', emergencyNumber: '911', policeNumber: '911', fireNumber: '911', medicalNumber: '911' },
    UK: { country: 'UK', emergencyNumber: '999', policeNumber: '999', fireNumber: '999', medicalNumber: '999' },
    EU: { country: 'EU', emergencyNumber: '112', policeNumber: '112', fireNumber: '112', medicalNumber: '112' }
  };

  static getInstance(): EmergencyDialService {
    if (!EmergencyDialService.instance) {
      EmergencyDialService.instance = new EmergencyDialService();
    }
    return EmergencyDialService.instance;
  }

  async dialEmergency(
    location?: { latitude: number; longitude: number }
  ): Promise<boolean> {
    return this.dialEmergencyServices('emergency', location);
  }

  async dialPolice(
    location?: { latitude: number; longitude: number }
  ): Promise<boolean> {
    return this.dialEmergencyServices('police', location);
  }

  async dialMedical(
    location?: { latitude: number; longitude: number }
  ): Promise<boolean> {
    return this.dialEmergencyServices('medical', location);
  }

  async dialFire(
    location?: { latitude: number; longitude: number }
  ): Promise<boolean> {
    return this.dialEmergencyServices('fire', location);
  }

  private async dialEmergencyServices(
    serviceType: 'emergency' | 'police' | 'fire' | 'medical' = 'emergency',
    location?: { latitude: number; longitude: number }
  ): Promise<boolean> {
    try {
      const config = this.emergencyConfigs.US; // TODO: Detect country dynamically
      const phoneNumber = this.getServiceNumber(config, serviceType);
      
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id || 'anonymous';
      
      const emergencyCall: Omit<EmergencyCall, 'id'> = {
        userId,
        serviceType,
        phoneNumber,
        timestamp: Date.now(),
        location,
        status: 'initiated'
      };

      // Log emergency call and get ID
      const callId = await this.logEmergencyCall(emergencyCall);

      // Show confirmation dialog
      return new Promise((resolve) => {
        Alert.alert(
          'Emergency Call',
          `Call ${phoneNumber} (${serviceType.toUpperCase()}) now?`,
          [
            { text: 'Cancel', onPress: () => resolve(false) },
            { 
              text: 'Call Now', 
              onPress: async () => {
                const success = await this.makeEmergencyCall(phoneNumber, callId);
                resolve(success);
              }
            }
          ]
        );
      });
    } catch (error) {
      console.error('Emergency dial error:', error);
      return false;
    }
  }

  private getServiceNumber(config: EmergencyServiceConfig, serviceType: string): string {
    switch (serviceType) {
      case 'police': return config.policeNumber || config.emergencyNumber;
      case 'fire': return config.fireNumber || config.emergencyNumber;
      case 'medical': return config.medicalNumber || config.emergencyNumber;
      default: return config.emergencyNumber;
    }
  }

  private async makeEmergencyCall(phoneNumber: string, callId: string): Promise<boolean> {
    try {
      const canCall = await Linking.canOpenURL(`tel:${phoneNumber}`);
      if (canCall) {
        await Linking.openURL(`tel:${phoneNumber}`);
        await this.updateCallStatus(callId, 'connected');
        return true;
      } else {
        await this.updateCallStatus(callId, 'failed');
        Alert.alert('Error', 'Unable to make emergency call');
        return false;
      }
    } catch (error) {
      await this.updateCallStatus(callId, 'failed');
      console.error('Call error:', error);
      return false;
    }
  }

  private async logEmergencyCall(callData: Omit<EmergencyCall, 'id'>): Promise<string> {
    try {
      const { data, error } = await supabase.from('emergency_calls').insert([callData]).select('id');
      if (error) throw error;
      return data?.[0]?.id || '';
    } catch (error) {
      console.error('Failed to log emergency call:', error);
      return '';
    }
  }

  private async updateCallStatus(callId: string, status: EmergencyCall['status']): Promise<void> {
    if (!callId) return;
    try {
      const { error } = await supabase
        .from('emergency_calls')
        .update({ status })
        .eq('id', callId);
      if (error) throw error;
    } catch (error) {
      console.error('Failed to update call status:', error);
    }
  }
}

export default EmergencyDialService;