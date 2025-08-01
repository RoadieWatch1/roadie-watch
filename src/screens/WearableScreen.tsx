import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import WearableService, { WearableDevice, WearableData, EmergencyTrigger } from '../utils/WearableService';

const WearableScreen: React.FC = () => {
  const [devices, setDevices] = useState<WearableDevice[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<WearableDevice[]>([]);
  const [latestData, setLatestData] = useState<WearableData | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const wearableService = WearableService.getInstance();

  useEffect(() => {
    loadConnectedDevices();
    setupDataListener();
    setupEmergencyListener();
  }, []);

  const loadConnectedDevices = () => {
    const connected = wearableService.getConnectedDevices();
    setConnectedDevices(connected);
  };

  const setupDataListener = () => {
    wearableService.onDataReceived((data: WearableData) => {
      setLatestData(data);
    });
  };

  const setupEmergencyListener = () => {
    wearableService.onEmergencyTrigger((trigger: EmergencyTrigger) => {
      Alert.alert(
        'Emergency Alert',
        `${trigger.type.replace('_', ' ')} detected! Severity: ${trigger.severity}`,
        [
          { text: 'Dismiss' },
          { text: 'Call Emergency', onPress: () => handleEmergencyTrigger(trigger) }
        ]
      );
    });
  };

  const handleEmergencyTrigger = (trigger: EmergencyTrigger) => {
    // Handle emergency trigger - could integrate with EmergencyDialService
    console.log('Emergency triggered:', trigger);
  };

  const scanForDevices = async () => {
    setIsScanning(true);
    try {
      const foundDevices = await wearableService.scanForDevices();
      setDevices(foundDevices);
    } catch (error) {
      Alert.alert('Error', 'Failed to scan for devices');
    } finally {
      setIsScanning(false);
    }
  };

  const connectDevice = async (device: WearableDevice) => {
    try {
      const success = await wearableService.connectDevice(device);
      if (success) {
        loadConnectedDevices();
        Alert.alert('Success', `Connected to ${device.name}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to device');
    }
  };

  const disconnectDevice = async (deviceId: string) => {
    try {
      await wearableService.disconnectDevice(deviceId);
      loadConnectedDevices();
      Alert.alert('Success', 'Device disconnected');
    } catch (error) {
      Alert.alert('Error', 'Failed to disconnect device');
    }
  };

  const getDeviceIcon = (type: WearableDevice['type']) => {
    switch (type) {
      case 'apple_watch': return '⌚';
      case 'fitbit': return '🏃';
      case 'garmin': return '🏃‍♂️';
      case 'samsung_watch': return '⌚';
      default: return '📱';
    }
  };

  const getHealthStatus = (data: WearableData | null) => {
    if (!data || !data.heartRate) return 'No data';
    
    if (data.heartRate > 100) return 'High';
    if (data.heartRate < 60) return 'Low';
    return 'Normal';
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Wearable Devices</Text>

      {/* Connected Devices */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connected Devices</Text>
        {connectedDevices.length === 0 ? (
          <Text style={styles.emptyText}>No devices connected</Text>
        ) : (
          connectedDevices.map((device) => (
            <View key={device.id} style={styles.deviceCard}>
              <Text style={styles.deviceIcon}>{getDeviceIcon(device.type)}</Text>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={styles.deviceStatus}>Connected</Text>
                {device.batteryLevel && (
                  <Text style={styles.batteryLevel}>Battery: {device.batteryLevel}%</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.disconnectButton}
                onPress={() => disconnectDevice(device.id)}
              >
                <Text style={styles.disconnectButtonText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Latest Health Data */}
      {latestData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Health Data</Text>
          <View style={styles.healthCard}>
            <View style={styles.healthRow}>
              <Text style={styles.healthLabel}>Heart Rate:</Text>
              <Text style={styles.healthValue}>
                {latestData.heartRate} BPM ({getHealthStatus(latestData)})
              </Text>
            </View>
            <View style={styles.healthRow}>
              <Text style={styles.healthLabel}>Steps:</Text>
              <Text style={styles.healthValue}>{latestData.steps}</Text>
            </View>
            <View style={styles.healthRow}>
              <Text style={styles.healthLabel}>Battery:</Text>
              <Text style={styles.healthValue}>{latestData.batteryLevel}%</Text>
            </View>
            <Text style={styles.timestamp}>
              Last updated: {new Date(latestData.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        </View>
      )}

      {/* Available Devices */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Devices</Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={scanForDevices}
            disabled={isScanning}
          >
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Scanning...' : 'Scan'}
            </Text>
          </TouchableOpacity>
        </View>

        {devices.length === 0 ? (
          <Text style={styles.emptyText}>No devices found. Tap scan to search.</Text>
        ) : (
          devices.map((device) => (
            <View key={device.id} style={styles.deviceCard}>
              <Text style={styles.deviceIcon}>{getDeviceIcon(device.type)}</Text>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={styles.deviceStatus}>Available</Text>
              </View>
              <TouchableOpacity
                style={styles.connectButton}
                onPress={() => connectDevice(device)}
              >
                <Text style={styles.connectButtonText}>Connect</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  emptyText: { textAlign: 'center', color: '#666', fontStyle: 'italic' },
  deviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10 },
  deviceIcon: { fontSize: 24, marginRight: 15 },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  deviceStatus: { fontSize: 14, color: '#666' },
  batteryLevel: { fontSize: 12, color: '#999' },
  connectButton: { backgroundColor: '#34C759', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
  connectButtonText: { color: 'white', fontWeight: '600' },
  disconnectButton: { backgroundColor: '#FF3B30', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
  disconnectButtonText: { color: 'white', fontWeight: '600' },
  scanButton: { backgroundColor: '#007AFF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
  scanButtonText: { color: 'white', fontWeight: '600' },
  healthCard: { backgroundColor: 'white', padding: 15, borderRadius: 10 },
  healthRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  healthLabel: { fontSize: 14, color: '#666' },
  healthValue: { fontSize: 14, fontWeight: '600' },
  timestamp: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 10 }
});

export default WearableScreen;