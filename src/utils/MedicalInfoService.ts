import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../app/lib/supabase';

export interface MedicalInfo {
  id?: string;
  bloodType?: string;
  allergies: string[];
  medications: string[];
  medicalConditions: string[];
  emergencyInstructions?: string;
  doctorName?: string;
  doctorPhone?: string;
  insuranceInfo?: string;
  emergencyMedication?: string;
  medicalAlertBracelet: boolean;
  organDonor: boolean;
  emergencyContactMedical?: string;
  preferredHospital?: string;
  medicalNotes?: string;
  height?: string;
  weight?: string;
  emergencyProcedures?: string[];
  chronicConditions?: string[];
  surgicalHistory?: string[];
  immunizations?: string[];
  lastUpdated?: Date;
}

class MedicalInfoService {
  private static instance: MedicalInfoService;
  private medicalInfo: MedicalInfo | null = null;

  static getInstance(): MedicalInfoService {
    if (!MedicalInfoService.instance) {
      MedicalInfoService.instance = new MedicalInfoService();
    }
    return MedicalInfoService.instance;
  }

  async updateMedicalInfo(info: Partial<MedicalInfo>): Promise<void> {
    const currentInfo = await this.getMedicalInfo();
    this.medicalInfo = {
      ...currentInfo,
      ...info,
      lastUpdated: new Date()
    };
    
    await AsyncStorage.setItem('medical_info', JSON.stringify(this.medicalInfo));
    await this.syncWithSupabase();
  }

  async getMedicalInfo(): Promise<MedicalInfo> {
    if (!this.medicalInfo) {
      await this.loadMedicalInfo();
    }
    return this.medicalInfo || this.getDefaultMedicalInfo();
  }

  async addAllergy(allergy: string): Promise<void> {
    const info = await this.getMedicalInfo();
    if (!info.allergies.includes(allergy)) {
      info.allergies.push(allergy);
      await this.updateMedicalInfo(info);
    }
  }

  async removeAllergy(allergy: string): Promise<void> {
    const info = await this.getMedicalInfo();
    info.allergies = info.allergies.filter(a => a !== allergy);
    await this.updateMedicalInfo(info);
  }

  async addMedication(medication: string): Promise<void> {
    const info = await this.getMedicalInfo();
    if (!info.medications.includes(medication)) {
      info.medications.push(medication);
      await this.updateMedicalInfo(info);
    }
  }

  async removeMedication(medication: string): Promise<void> {
    const info = await this.getMedicalInfo();
    info.medications = info.medications.filter(m => m !== medication);
    await this.updateMedicalInfo(info);
  }

  async addMedicalCondition(condition: string): Promise<void> {
    const info = await this.getMedicalInfo();
    if (!info.medicalConditions.includes(condition)) {
      info.medicalConditions.push(condition);
      await this.updateMedicalInfo(info);
    }
  }

  async getEmergencyMedicalSummary(): Promise<string> {
    const info = await this.getMedicalInfo();
    let summary = '';
    
    if (info.bloodType) summary += `Blood Type: ${info.bloodType}\n`;
    if (info.allergies.length > 0) summary += `Allergies: ${info.allergies.join(', ')}\n`;
    if (info.medications.length > 0) summary += `Medications: ${info.medications.join(', ')}\n`;
    if (info.medicalConditions.length > 0) summary += `Conditions: ${info.medicalConditions.join(', ')}\n`;
    if (info.emergencyInstructions) summary += `Instructions: ${info.emergencyInstructions}\n`;
    if (info.doctorName) summary += `Doctor: ${info.doctorName} (${info.doctorPhone})\n`;
    if (info.preferredHospital) summary += `Preferred Hospital: ${info.preferredHospital}\n`;
    
    return summary;
  }

  private getDefaultMedicalInfo(): MedicalInfo {
    return {
      allergies: [],
      medications: [],
      medicalConditions: [],
      medicalAlertBracelet: false,
      organDonor: false,
      emergencyProcedures: [],
      chronicConditions: [],
      surgicalHistory: [],
      immunizations: []
    };
  }

  private async loadMedicalInfo(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('medical_info');
      this.medicalInfo = stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load medical info:', error);
      this.medicalInfo = null;
    }
  }

  private async syncWithSupabase(): Promise<void> {
    if (!this.medicalInfo) return;

    try {
      const { error } = await supabase
        .from('medical_info')
        .upsert({
          user_id: 'current_user',
          blood_type: this.medicalInfo.bloodType,
          allergies: this.medicalInfo.allergies,
          medications: this.medicalInfo.medications,
          medical_conditions: this.medicalInfo.medicalConditions,
          emergency_instructions: this.medicalInfo.emergencyInstructions,
          doctor_name: this.medicalInfo.doctorName,
          doctor_phone: this.medicalInfo.doctorPhone,
          insurance_info: this.medicalInfo.insuranceInfo,
          emergency_medication: this.medicalInfo.emergencyMedication,
          medical_alert_bracelet: this.medicalInfo.medicalAlertBracelet,
          organ_donor: this.medicalInfo.organDonor,
          emergency_contact_medical: this.medicalInfo.emergencyContactMedical,
          preferred_hospital: this.medicalInfo.preferredHospital,
          medical_notes: this.medicalInfo.medicalNotes,
          last_updated: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to sync medical info:', error);
      }
    } catch (error) {
      console.error('Medical sync error:', error);
    }
  }
}

export default MedicalInfoService;