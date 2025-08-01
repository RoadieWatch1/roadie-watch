import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  Switch,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import { SparkleBackground } from '../components/SparkleBackground';
import LocationService, { GeofenceZone, GeofenceEvent } from '../utils/LocationService';
import { useVoiceActivation } from '../components/VoiceActivationProvider';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const GeofenceScreen: React.FC = () => {
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newZone, setNewZone] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius: 100,
    type: 'safe_zone' as GeofenceZone['type'],
    isActive: true,
    notifications: true,
  });
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [lastEvent, setLastEvent] = useState<GeofenceEvent | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const { isEnabled: voiceEnabled } = useVoiceActivation();
  const addFormAnim = useSharedValue(0);

  const locationService = LocationService.getInstance();

  useEffect(() => {
    loadGeofences();
    setupGeofenceListener();
    updateCurrentLocation();
  }, []);

  useEffect(() => {
    addFormAnim.value = withSpring(showAddForm ? 1 : 0);
  }, [showAddForm]);

  const loadGeofences = useCallback(() => {
    const geofences = locationService.getGeofences();
    setZones(geofences);
    if (geofences.length > 0 && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: geofences[0].latitude,
        longitude: geofences[0].longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, []);

  const setupGeofenceListener = () => {
    locationService.onGeofenceEvent((event: GeofenceEvent) => {
      setLastEvent(event);
      const zone = zones.find((z) => z.id === event.zoneId);
      if (zone && zone.notifications) {
        Alert.alert(
          'Geofence Alert',
          `You ${event.eventType === 'enter' ? 'entered' : 'left'} ${zone.name} (${zone.type.replace('_', ' ')})`,
          [{ text: 'OK' }]
        );
      }
    });
  };

  const updateCurrentLocation = async () => {
    const loc = await locationService.getCurrentLocation();
    if (loc) {
      setCurrentLocation({ latitude: loc.latitude, longitude: loc.longitude });
    }
  };

  const validateCoordinates = (lat: string, lng: string): boolean => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    return (
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  };

  const saveGeofence = async () => {
    const { name, latitude, longitude, radius } = newZone;

    if (!name || !latitude || !longitude) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!validateCoordinates(latitude, longitude)) {
      Alert.alert('Invalid Coordinates', 'Latitude must be between -90 and 90.\nLongitude between -180 and 180.');
      return;
    }

    try {
      if (editingZoneId) {
        // Update existing zone (since service doesn't have update, remove and add new)
        locationService.removeGeofence(editingZoneId);
      }
      
      await locationService.addGeofence({
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius,
        type: newZone.type,
        isActive: newZone.isActive,
        notifications: newZone.notifications,
      });

      setNewZone({ name: '', latitude: '', longitude: '', radius: 100, type: 'safe_zone', isActive: true, notifications: true });
      setShowAddForm(false);
      setEditingZoneId(null);
      loadGeofences();
      Alert.alert('Success', `Geofence zone ${editingZoneId ? 'updated' : 'added'} successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save geofence zone');
    }
  };

  const editGeofence = (zone: GeofenceZone) => {
    setNewZone({
      name: zone.name,
      latitude: zone.latitude.toString(),
      longitude: zone.longitude.toString(),
      radius: zone.radius,
      type: zone.type,
      isActive: zone.isActive,
      notifications: zone.notifications,
    });
    setEditingZoneId(zone.id);
    setShowAddForm(true);
  };

  const toggleZoneActive = (zoneId: string, active: boolean) => {
    const updatedZones = zones.map(zone => 
      zone.id === zoneId ? { ...zone, isActive: active } : zone
    );
    setZones(updatedZones);
    // Note: Since service doesn't persist toggles, implement if needed
  };

  const toggleZoneNotifications = (zoneId: string, notifications: boolean) => {
    const updatedZones = zones.map(zone => 
      zone.id === zoneId ? { ...zone, notifications } : zone
    );
    setZones(updatedZones);
  };

  const removeGeofence = (zoneId: string) => {
    Alert.alert('Remove Geofence', 'Are you sure you want to remove this geofence zone?', [
      { text: 'Cancel' },
      {
        text: 'Remove',
        onPress: () => {
          locationService.removeGeofence(zoneId);
          loadGeofences();
        },
      },
    ]);
  };

  const useCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (!location) {
        Alert.alert('Error', 'Could not retrieve location.');
        return;
      }

      setNewZone((prev) => ({
        ...prev,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
      }));

      mapRef.current?.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const getCircleColor = (type: GeofenceZone['type']) => {
    switch (type) {
      case 'safe_zone': return 'rgba(76, 175, 80, 0.3)'; // Enhanced green
      case 'danger_zone': return 'rgba(244, 67, 54, 0.3)'; // Enhanced red
      case 'home': return 'rgba(33, 150, 243, 0.3)'; // Blue
      case 'work': return 'rgba(255, 193, 7, 0.3)'; // Yellow
      case 'school': return 'rgba(156, 39, 176, 0.3)'; // Purple
      default: return 'rgba(0, 122, 255, 0.3)'; // Default blue
    }
  };

  const getStrokeColor = (type: GeofenceZone['type']) => {
    switch (type) {
      case 'safe_zone': return '#4CAF50';
      case 'danger_zone': return '#F44336';
      case 'home': return '#2196F3';
      case 'work': return '#FFC107';
      case 'school': return '#9C27B0';
      default: return '#007AFF';
    }
  };

  const getMarkerIcon = (type: GeofenceZone['type']) => {
    switch (type) {
      case 'safe_zone': return '✅';
      case 'danger_zone': return '⚠️';
      case 'home': return '🏠';
      case 'work': return '🏢';
      case 'school': return '🏫';
      default: return '📍';
    }
  };

  const animatedFormStyle = useAnimatedStyle(() => ({
    opacity: addFormAnim.value,
    transform: [{ scale: addFormAnim.value }],
  }));

  return (
    <SparkleBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>🌐 Geofence Zones</Text>
        <Text style={styles.subtitle}>Define safety boundaries for automatic alerts</Text>

        {voiceEnabled && <Text style={styles.voiceInfo}>🎤 Voice-Activated: Say "Add safe zone here"</Text>}

        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(!showAddForm)}>
          <Text style={styles.addButtonText}>{showAddForm ? 'Cancel Addition' : 'Add New Zone'}</Text>
        </TouchableOpacity>

        <Animated.View style={[styles.form, animatedFormStyle]}>
          <TextInput
            style={styles.input}
            placeholder="Zone Name (e.g., Home)"
            value={newZone.name}
            onChangeText={(text) => setNewZone((prev) => ({ ...prev, name: text }))}
          />

          <View style={styles.locationRow}>
            <TextInput
              style={[styles.input, styles.locationInput]}
              placeholder="Latitude"
              value={newZone.latitude}
              onChangeText={(text) => setNewZone((prev) => ({ ...prev, latitude: text }))}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.locationInput]}
              placeholder="Longitude"
              value={newZone.longitude}
              onChangeText={(text) => setNewZone((prev) => ({ ...prev, longitude: text }))}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity style={styles.locationButton} onPress={useCurrentLocation}>
            <Text style={styles.locationButtonText}>📍 Use Current Location</Text>
          </TouchableOpacity>

          <Text style={styles.sliderLabel}>Radius: {newZone.radius} meters</Text>
          <Slider
            style={styles.slider}
            minimumValue={50}
            maximumValue={1000}
            step={10}
            value={newZone.radius}
            onValueChange={(value: number) => setNewZone((prev) => ({ ...prev, radius: value }))}
            minimumTrackTintColor="#FF6B35"
            maximumTrackTintColor="#333"
            thumbTintColor="#FF6B35"
          />

          <Picker
            selectedValue={newZone.type}
            style={styles.picker}
            onValueChange={(value) => setNewZone((prev) => ({ ...prev, type: value as GeofenceZone['type'] }))}
          >
            <Picker.Item label="Safe Zone ✅" value="safe_zone" />
            <Picker.Item label="Danger Zone ⚠️" value="danger_zone" />
            <Picker.Item label="Home 🏠" value="home" />
            <Picker.Item label="Work 🏢" value="work" />
            <Picker.Item label="School 🏫" value="school" />
          </Picker>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Active</Text>
            <Switch
              value={newZone.isActive}
              onValueChange={(value) => setNewZone((prev) => ({ ...prev, isActive: value }))}
              trackColor={{ false: '#333', true: '#FF6B35' }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Notifications</Text>
            <Switch
              value={newZone.notifications}
              onValueChange={(value) => setNewZone((prev) => ({ ...prev, notifications: value }))}
              trackColor={{ false: '#333', true: '#FF6B35' }}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveGeofence}>
            <Text style={styles.saveButtonText}>{editingZoneId ? 'Update Zone' : 'Save Zone'}</Text>
          </TouchableOpacity>
        </Animated.View>

        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation?.latitude || 37.78825,
            longitude: currentLocation?.longitude || -122.4324,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          mapType="hybrid" // More creative map view
          customMapStyle={darkMapStyle} // Add custom dark style for consistency
        >
          {zones.map((zone) => (
            <React.Fragment key={zone.id}>
              <Marker
                coordinate={{ latitude: zone.latitude, longitude: zone.longitude }}
                title={zone.name}
                description={`${zone.type.replace('_', ' ')} - ${zone.radius}m`}
              >
                <Text style={styles.markerIcon}>{getMarkerIcon(zone.type)}</Text>
              </Marker>
              <Circle
                center={{ latitude: zone.latitude, longitude: zone.longitude }}
                radius={zone.radius}
                strokeColor={getStrokeColor(zone.type)}
                strokeWidth={2}
                fillColor={getCircleColor(zone.type)}
              />
            </React.Fragment>
          ))}
        </MapView>

        {lastEvent && (
          <View style={styles.lastEvent}>
            <Text style={styles.lastEventText}>
              Last Event: {lastEvent.eventType.toUpperCase()} {zones.find(z => z.id === lastEvent.zoneId)?.name || 'Unknown'}
            </Text>
          </View>
        )}

        <View style={styles.zonesList}>
          {zones.map((zone) => (
            <TouchableOpacity key={zone.id} style={styles.zoneCard} onPress={() => editGeofence(zone)}>
              <Text style={styles.zoneName}>{getMarkerIcon(zone.type)} {zone.name}</Text>
              <Text style={styles.zoneDetails}>
                Type: {zone.type.replace('_', ' ')} • Radius: {zone.radius} m
              </Text>
              <Text style={styles.zoneLocation}>
                {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}
              </Text>
              <View style={styles.zoneSwitches}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Active</Text>
                  <Switch
                    value={zone.isActive}
                    onValueChange={(value) => toggleZoneActive(zone.id, value)}
                    trackColor={{ false: '#333', true: '#FF6B35' }}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Notify</Text>
                  <Switch
                    value={zone.notifications}
                    onValueChange={(value) => toggleZoneNotifications(zone.id, value)}
                    trackColor={{ false: '#333', true: '#FF6B35' }}
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.removeButton} onPress={() => removeGeofence(zone.id)} activeOpacity={0.7}>
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SparkleBackground>
  );
};

// Custom dark map style for consistency with app theme
const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#212121' }],
  },
  {
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#212121' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#181818' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1b1b1b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#2c2c2c' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8a8a' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#373737' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3c3c3c' }],
  },
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry',
    stylers: [{ color: '#4e4e4e' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3d3d3d' }],
  },
];

export default GeofenceScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  contentContainer: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FF6B35', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#888', textAlign: 'center', marginBottom: 20 },
  voiceInfo: { fontSize: 14, color: '#4CAF50', textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
  addButton: { backgroundColor: '#FF6B35', padding: 15, borderRadius: 10, marginBottom: 20 },
  addButtonText: { color: 'white', textAlign: 'center', fontSize: 16, fontWeight: '600' },
  form: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  input: { backgroundColor: '#333', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#444' },
  locationRow: { flexDirection: 'row', gap: 10 },
  locationInput: { flex: 1 },
  locationButton: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, marginBottom: 15 },
  locationButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  sliderLabel: { color: '#ccc', marginBottom: 5 },
  slider: { width: '100%', marginBottom: 15 },
  picker: { backgroundColor: '#333', color: '#fff', marginBottom: 15, borderRadius: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  switchLabel: { color: '#fff', fontSize: 16 },
  saveButton: { backgroundColor: '#FF6B35', padding: 15, borderRadius: 8 },
  saveButtonText: { color: 'white', textAlign: 'center', fontSize: 16, fontWeight: '600' },
  map: { height: 300, marginBottom: 20, borderRadius: 15, borderWidth: 1, borderColor: '#333' },
  lastEvent: { backgroundColor: '#333', padding: 15, borderRadius: 10, marginBottom: 20 },
  lastEventText: { color: '#FF6B35', fontSize: 16, textAlign: 'center' },
  zonesList: { gap: 15 },
  zoneCard: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#333' },
  zoneName: { fontSize: 18, fontWeight: 'bold', color: '#FF6B35', marginBottom: 5 },
  zoneDetails: { fontSize: 14, color: '#888', marginBottom: 5 },
  zoneLocation: { fontSize: 12, color: '#666', marginBottom: 10 },
  zoneSwitches: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  removeButton: { backgroundColor: '#FF4444', padding: 10, borderRadius: 8, alignSelf: 'flex-end' },
  removeButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  markerIcon: { fontSize: 24 },
});