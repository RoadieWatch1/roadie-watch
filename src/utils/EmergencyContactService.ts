import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../app/lib/supabase';
import MedicalInfoService from './MedicalInfoService';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  isPrimary: boolean;
  medicalInfo?: string;
  notificationPreference: 'sms' | 'call' | 'both';
  priority: number;
  canAccessMedicalInfo: boolean;
  languages?: string[];
}

export interface NotificationResult {
  contactId: string;
  success: boolean;
  methods: string[];
  timestamp: Date;
  error?: string;
}

class EmergencyContactService {
  private static instance: EmergencyContactService;
  private contacts: EmergencyContact[] = [];
  private medicalService = MedicalInfoService.getInstance();

  static getInstance(): EmergencyContactService {
    if (!EmergencyContactService.instance) {
      EmergencyContactService.instance = new EmergencyContactService();
    }
    return EmergencyContactService.instance;
  }

  async addEmergencyContact(contact: Omit<EmergencyContact, 'id'>): Promise<string> {
    const newContact: EmergencyContact = {
      ...contact,
      id: Date.now().toString(),
      priority: contact.priority || this.contacts.length + 1
    };

    this.contacts.push(newContact);
    await this.saveContacts();
    await this.syncWithSupabase();
    
    return newContact.id;
  }

  async updateEmergencyContact(id: string, updates: Partial<EmergencyContact>): Promise<void> {
    const index = this.contacts.findIndex(c => c.id === id);
    if (index !== -1) {
      this.contacts[index] = { ...this.contacts[index], ...updates };
      await this.saveContacts();
      await this.syncWithSupabase();
    }
  }

  async removeEmergencyContact(id: string): Promise<void> {
    this.contacts = this.contacts.filter(c => c.id !== id);
    await this.saveContacts();
    await this.syncWithSupabase();
  }

  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    if (this.contacts.length === 0) {
      await this.loadContacts();
    }
    return this.contacts.sort((a, b) => a.priority - b.priority);
  }

  async getPrimaryContacts(): Promise<EmergencyContact[]> {
    const contacts = await this.getEmergencyContacts();
    return contacts.filter(c => c.isPrimary);
  }

  async notifyEmergencyContacts(
    message: string, 
    location?: {latitude: number; longitude: number},
    emergencyType?: string,
    includeMedicalInfo: boolean = true
  ): Promise<NotificationResult[]> {
    const contacts = await this.getEmergencyContacts();
    const results: NotificationResult[] = [];
    
    let medicalSummary = '';
    if (includeMedicalInfo) {
      medicalSummary = await this.medicalService.getEmergencyMedicalSummary();
    }

    const locationText = location 
      ? `Location: https://maps.google.com/?q=${location.latitude},${location.longitude}` 
      : '';

    // Notify primary contacts first
    const primaryContacts = contacts.filter(c => c.isPrimary);
    const secondaryContacts = contacts.filter(c => !c.isPrimary);

    for (const contact of primaryContacts) {
      const result = await this.sendEnhancedNotification(
        contact, 
        message, 
        locationText, 
        medicalSummary, 
        emergencyType,
        true // isPriority
      );
      results.push(result);
    }

    // Wait 30 seconds before notifying secondary contacts
    setTimeout(async () => {
      for (const contact of secondaryContacts) {
        const result = await this.sendEnhancedNotification(
          contact, 
          message, 
          locationText, 
          medicalSummary, 
          emergencyType,
          false
        );
        results.push(result);
      }
    }, 30000);

    return results;
  }

  async sendMedicalAlert(
    medicalEmergency: string,
    location?: {latitude: number; longitude: number}
  ): Promise<NotificationResult[]> {
    const medicalContacts = this.contacts.filter(c => c.canAccessMedicalInfo);
    const medicalInfo = await this.medicalService.getEmergencyMedicalSummary();
    
    const message = `🚨 MEDICAL EMERGENCY: ${medicalEmergency}\n\nMEDICAL INFO:\n${medicalInfo}`;
    
    return this.notifyEmergencyContacts(message, location, 'medical', true);
  }

  async sendFamilyNotification(
    message: string,
    notificationType: 'check-in' | 'safety-alert' | 'location-update'
  ): Promise<void> {
    const familyContacts = this.contacts.filter(c => 
      c.relationship.toLowerCase().includes('family') ||
      c.relationship.toLowerCase().includes('parent') ||
      c.relationship.toLowerCase().includes('spouse') ||
      c.relationship.toLowerCase().includes('sibling')
    );

    for (const contact of familyContacts) {
      await this.sendNotification(contact, `${message}\n\nType: ${notificationType}`);
    }
  }

  private async sendEnhancedNotification(
    contact: EmergencyContact,
    message: string,
    locationText: string,
    medicalInfo: string,
    emergencyType?: string,
    isPriority: boolean = false
  ): Promise<NotificationResult> {
    try {
      const fullMessage = `${isPriority ? '🚨 PRIORITY EMERGENCY 🚨' : '⚠️ EMERGENCY ALERT'}\n\n${message}\n\n${locationText}`;
      
      const medicalData = contact.canAccessMedicalInfo ? medicalInfo : '';
      
      const { data, error } = await supabase.functions.invoke('emergency-notification', {
        body: {
          contactId: contact.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          message: fullMessage,
          preference: contact.notificationPreference,
          medicalInfo: medicalData,
          emergencyType,
          isPriority,
          location: locationText ? { text: locationText } : null
        }
      });

      if (error) throw error;

      // Log notification
      await this.logNotification(contact.id, fullMessage, 'sent');

      return {
        contactId: contact.id,
        success: true,
        methods: this.getNotificationMethods(contact.notificationPreference),
        timestamp: new Date()
      };
    } catch (error: any) {
      console.error(`Failed to notify ${contact.name}:`, error);
      
      await this.logNotification(contact.id, message, 'failed', error.message);
      
      return {
        contactId: contact.id,
        success: false,
        methods: [],
        timestamp: new Date(),
        error: error.message
      };
    }
  }

  private async sendNotification(contact: EmergencyContact, message: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('emergency-notification', {
        body: {
          contactId: contact.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          message,
          preference: contact.notificationPreference
        }
      });

      if (error) throw error;
    } catch (error: any) {
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  }

  private getNotificationMethods(preference: string): string[] {
    switch (preference) {
      case 'sms': return ['SMS'];
      case 'call': return ['Call'];
      case 'both': return ['SMS', 'Call'];
      default: return [];
    }
  }

  private async logNotification(
    contactId: string, 
    message: string, 
    status: string, 
    error?: string
  ): Promise<void> {
    try {
      await supabase
        .from('emergency_notifications')
        .insert({
          user_id: 'current_user',
          contact_id: contactId,
          notification_type: 'emergency',
          message,
          status,
          sent_at: status === 'sent' ? new Date().toISOString() : null
        });
    } catch (err: any) {
      console.error('Failed to log notification:', err.message);
    }
  }

  private async saveContacts(): Promise<void> {
    await AsyncStorage.setItem('emergency_contacts', JSON.stringify(this.contacts));
  }

  private async loadContacts(): Promise<void> {
    const stored = await AsyncStorage.getItem('emergency_contacts');
    this.contacts = stored ? JSON.parse(stored) : [];
  }

  private async syncWithSupabase(): Promise<void> {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .upsert(this.contacts.map(contact => ({
          id: contact.id,
          user_id: 'current_user',
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          relationship: contact.relationship,
          is_primary: contact.isPrimary,
          medical_info: contact.medicalInfo,
          notification_preference: contact.notificationPreference,
          priority: contact.priority,
          can_access_medical_info: contact.canAccessMedicalInfo,
          languages: contact.languages
        })));

      if (error) {
        console.error('Failed to sync contacts:', error);
      }
    } catch (error: any) {
      console.error('Sync error:', error.message);
    }
  }
}

export default EmergencyContactService;