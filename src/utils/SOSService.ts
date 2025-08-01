import { Alert } from 'react-native';
import { supabase } from '@/app/lib/supabase';
import LocationService from './LocationService';
import EmergencyContactService from './EmergencyContactService';
import EmergencyDialService from './EmergencyDialService';
import WearableService from './WearableService';

export interface SOSActivation {
  id: string;
  userId: string;
  timestamp: number;
  location?: { latitude: number; longitude: number };
  triggerType: 'manual' | 'automatic' | 'wearable' | 'geofence';
  status: 'active' | 'resolved' | 'cancelled';
  emergencyServicesCalled: boolean;
}

class SOSService {
  private static instance: SOSService;
  private isSOSActive = false;
  private currentActivation: SOSActivation | null = null;
  private locationService = LocationService.getInstance();
  private emergencyContactService = EmergencyContactService.getInstance();
  private emergencyDialService = EmergencyDialService.getInstance();
  private wearableService = WearableService.getInstance();

  static getInstance(): SOSService {
    if (!SOSService.instance) {
      SOSService.instance = new SOSService();
    }
    return SOSService.instance;
  }

  async activateSOS(triggerType: SOSActivation['triggerType'] = 'manual'): Promise<boolean> {
    if (this.isSOSActive) {
      Alert.alert('SOS Already Active', 'Emergency services are already being contacted.');
      return false;
    }

    try {
      // Get current location
      const location = await this.locationService.getCurrentLocation();
      if (!location) {
        throw new Error('Unable to get location');
      }
      
      // Create SOS activation record
      const activation: SOSActivation = {
        id: `sos_${Date.now()}`,
        userId: 'current-user',
        timestamp: Date.now(),
        location: { latitude: location.latitude, longitude: location.longitude },
        triggerType,
        status: 'active',
        emergencyServicesCalled: false
      };

      this.currentActivation = activation;
      this.isSOSActive = true;

      // Store activation in database
      await supabase.from('sos_activations').insert([activation]);

      // Start emergency procedures
      await this.executeEmergencyProcedures(activation);

      return true;
    } catch (error) {
      console.error('SOS activation failed:', error);
      Alert.alert('SOS Error', 'Failed to activate emergency services');
      return false;
    }
  }
  private async executeEmergencyProcedures(activation: SOSActivation): Promise<void> {
    try {
      // 1. Notify emergency contacts with location and medical info
      await this.emergencyContactService.notifyEmergencyContacts(
        `Emergency SOS activated at ${new Date(activation.timestamp).toLocaleString()}`,
        activation.location,
        'SOS_ACTIVATED'
      );

      // 2. Start location tracking
      // @ts-ignore
      this.locationService.startLocationTracking((location) => {
        // @ts-ignore
        this.emergencyContactService.shareLocationWithContacts(location);
      });

      // 3. Show emergency services dialog
      Alert.alert(
        'Emergency Services',
        'SOS Activated! Contact emergency services now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call 911', 
            onPress: async () => {
              // @ts-ignore
              const called = await this.emergencyDialService.dialEmergencyServices('emergency', activation.location);
              if (called && this.currentActivation) {
                this.currentActivation.emergencyServicesCalled = true;
                await supabase.from('sos_activations')
                  .update({ emergency_services_called: true })
                  .eq('id', this.currentActivation.id);
              }
            }
          }
        ]
      );

      // 4. Monitor wearable devices for additional data
      this.wearableService.onEmergencyTrigger((trigger) => {
        this.emergencyContactService.notifyEmergencyContacts(
          `Health emergency detected: ${trigger.type}`,
          activation.location,
          'HEALTH_ALERT'
        );
      });

    } catch (error) {
      console.error('Emergency procedures failed:', error);
    }
  }

  async deactivateSOS(): Promise<void> {
    if (!this.isSOSActive || !this.currentActivation) return;

    try {
      // Update activation status
      this.currentActivation.status = 'resolved';
      await supabase.from('sos_activations')
        .update({ status: 'resolved' })
        .eq('id', this.currentActivation.id);

      // Stop location tracking
      this.locationService.stopLocationTracking();

      // Notify contacts that emergency is resolved
      await this.emergencyContactService.notifyEmergencyContacts(
        'Emergency situation has been resolved',
        this.currentActivation.location,
        'SOS_RESOLVED'
      );

      this.isSOSActive = false;
      this.currentActivation = null;

      Alert.alert('SOS Deactivated', 'Emergency services have been notified that the situation is resolved.');
    } catch (error) {
      console.error('SOS deactivation failed:', error);
    }
  }

  getSOSStatus(): { isActive: boolean; activation: SOSActivation | null } {
    return {
      isActive: this.isSOSActive,
      activation: this.currentActivation
    };
  }
}

export default SOSService;