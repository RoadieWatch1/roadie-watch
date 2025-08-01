import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  StyleSheet
} from 'react-native';
import MedicalInfoService, { MedicalInfo } from '../utils/MedicalInfoService';

const MedicalInfoScreen: React.FC = () => {
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newCondition, setNewCondition] = useState('');

  const medicalService = MedicalInfoService.getInstance();

  useEffect(() => {
    loadMedicalInfo();
  }, []);

  const loadMedicalInfo = async () => {
    try {
      const info = await medicalService.getMedicalInfo();
      setMedicalInfo(info);
    } catch (error) {
      console.error('Failed to load medical info:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = async (field: keyof MedicalInfo, value: any) => {
    if (!medicalInfo) return;
    
    const updated = { ...medicalInfo, [field]: value };
    setMedicalInfo(updated);
    await medicalService.updateMedicalInfo({ [field]: value });
  };

  const addAllergy = async () => {
    if (newAllergy.trim()) {
      await medicalService.addAllergy(newAllergy.trim());
      setNewAllergy('');
      loadMedicalInfo();
    }
  };

  const addMedication = async () => {
    if (newMedication.trim()) {
      await medicalService.addMedication(newMedication.trim());
      setNewMedication('');
      loadMedicalInfo();
    }
  };

  const addCondition = async () => {
    if (newCondition.trim()) {
      await medicalService.addMedicalCondition(newCondition.trim());
      setNewCondition('');
      loadMedicalInfo();
    }
  };

  const removeItem = (type: 'allergies' | 'medications' | 'medicalConditions', item: string) => {
    Alert.alert(
      'Remove Item',
      `Remove ${item}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (type === 'allergies') {
              await medicalService.removeAllergy(item);
            } else if (type === 'medications') {
              await medicalService.removeMedication(item);
            } else if (type === 'medicalConditions') {
              // @ts-ignore
              await medicalService.removeMedicalCondition(item);
            }
            loadMedicalInfo();
          }
        }
      ]
    );
  };

  if (loading || !medicalInfo) {
    return (
      <View style={styles.container}>
        <Text>Loading medical information...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Medical Information</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Blood Type</Text>
          <TextInput
            style={styles.input}
            value={medicalInfo.bloodType || ''}
            onChangeText={(text) => updateField('bloodType', text)}
            placeholder="e.g., A+, O-, AB+"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Height</Text>
          <TextInput
            style={styles.input}
            value={medicalInfo.height || ''}
            onChangeText={(text) => updateField('height', text)}
            placeholder="e.g., 5'8&quot;, 172cm"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Weight</Text>
          <TextInput
            style={styles.input}
            value={medicalInfo.weight || ''}
            onChangeText={(text) => updateField('weight', text)}
            placeholder="e.g., 150 lbs, 68 kg"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Allergies</Text>
        <View style={styles.addItemContainer}>
          <TextInput
            style={[styles.input, styles.addInput]}
            value={newAllergy}
            onChangeText={setNewAllergy}
            placeholder="Add allergy"
          />
          <TouchableOpacity style={styles.addButton} onPress={addAllergy}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        {medicalInfo.allergies.map((allergy, index) => (
          <TouchableOpacity
            key={index}
            style={styles.listItem}
            onLongPress={() => removeItem('allergies', allergy)}
          >
            <Text>{allergy}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Medications</Text>
        <View style={styles.addItemContainer}>
          <TextInput
            style={[styles.input, styles.addInput]}
            value={newMedication}
            onChangeText={setNewMedication}
            placeholder="Add medication"
          />
          <TouchableOpacity style={styles.addButton} onPress={addMedication}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        {medicalInfo.medications.map((medication, index) => (
          <TouchableOpacity
            key={index}
            style={styles.listItem}
            onLongPress={() => removeItem('medications', medication)}
          >
            <Text>{medication}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Conditions</Text>
        <View style={styles.addItemContainer}>
          <TextInput
            style={[styles.input, styles.addInput]}
            value={newCondition}
            onChangeText={setNewCondition}
            placeholder="Add condition"
          />
          <TouchableOpacity style={styles.addButton} onPress={addCondition}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        {medicalInfo.medicalConditions.map((condition, index) => (
          <TouchableOpacity
            key={index}
            style={styles.listItem}
            onLongPress={() => removeItem('medicalConditions', condition)}
          >
            <Text>{condition}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Doctor Name</Text>
          <TextInput
            style={styles.input}
            value={medicalInfo.doctorName || ''}
            onChangeText={(text) => updateField('doctorName', text)}
            placeholder="Primary care physician"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Doctor Phone</Text>
          <TextInput
            style={styles.input}
            value={medicalInfo.doctorPhone || ''}
            onChangeText={(text) => updateField('doctorPhone', text)}
            placeholder="Doctor's phone number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Preferred Hospital</Text>
          <TextInput
            style={styles.input}
            value={medicalInfo.preferredHospital || ''}
            onChangeText={(text) => updateField('preferredHospital', text)}
            placeholder="Preferred emergency hospital"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Information</Text>
        
        <View style={styles.switchContainer}>
          <Text style={styles.label}>Medical Alert Bracelet</Text>
          <Switch
            value={medicalInfo.medicalAlertBracelet}
            onValueChange={(value) => updateField('medicalAlertBracelet', value)}
          />
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Organ Donor</Text>
          <Switch
            value={medicalInfo.organDonor}
            onValueChange={(value) => updateField('organDonor', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Emergency Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={medicalInfo.emergencyInstructions || ''}
            onChangeText={(text) => updateField('emergencyInstructions', text)}
            placeholder="Special instructions for emergency responders"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Insurance Information</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={medicalInfo.insuranceInfo || ''}
            onChangeText={(text) => updateField('insuranceInfo', text)}
            placeholder="Insurance provider and policy details"
            multiline
            numberOfLines={3}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addItemContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  addInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  listItem: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
});

export default MedicalInfoScreen;