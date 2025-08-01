import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '@/app/lib/supabase';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
}

export interface GeofenceZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  type: 'safe_zone' | 'danger_zone' | 'work' | 'home' | 'school';
  isActive: boolean;
  notifications: boolean;
}

export interface GeofenceEvent {
  zoneId: string;
  eventType: 'enter' | 'exit';
  location: LocationData;
  timestamp: number;
}

export interface LocationOptions {
  accuracy?: Location.LocationAccuracy;
  timeInterval?: number;
  distanceInterval?: number;
}

class LocationService {
  private static instance: LocationService;
  private subscription: Location.LocationSubscription | null = null;
  private locationCallback: ((location: LocationData) => void) | null = null;
  private geofences: Map<string, GeofenceZone> = new Map();
  private geofenceCallbacks: ((event: GeofenceEvent) => void)[] = [];
  private lastLocation: LocationData | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Location access is required for safety tracking and geofencing.');
      return false;
    }

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== 'granted') {
        Alert.alert('Background Permission Denied', 'Background location access enhances safety features.');
      }
    }
    return true;
  }

  async getCurrentLocation(options?: LocationOptions): Promise<LocationData | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: options?.accuracy ?? Location.LocationAccuracy.High,
      });
      
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
        timestamp: position.timestamp,
        address: await this.reverseGeocode(position.coords.latitude, position.coords.longitude)
      };
      
      this.lastLocation = locationData;
      return locationData;
    } catch (error) {
      console.error('Failed to get current location:', error);
      Alert.alert('Location Error', 'Unable to fetch current location. Please try again.');
      return null;
    }
  }

  startContinuousTracking(options?: LocationOptions): void {
    this.startLocationTracking((location) => {
      this.checkGeofences(location);
      if (this.locationCallback) {
        this.locationCallback(location);
      }
    }, options);
  }

  private async startLocationTracking(callback: (location: LocationData) => void, options?: LocationOptions): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    this.locationCallback = callback;
    this.subscription = await Location.watchPositionAsync(
      {
        accuracy: options?.accuracy ?? Location.LocationAccuracy.High,
        timeInterval: options?.timeInterval ?? 5000,
        distanceInterval: options?.distanceInterval ?? 10
      },
      async (position: Location.LocationObject) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? undefined,
          timestamp: position.timestamp,
          address: await this.reverseGeocode(position.coords.latitude, position.coords.longitude)
        };
        
        this.checkGeofences(location);
        this.lastLocation = location;
        callback(location);
      }
    );
  }

  stopLocationTracking(): void {
    this.subscription?.remove();
    this.subscription = null;
    this.locationCallback = null;
  }

  async addGeofence(zone: Omit<GeofenceZone, 'id'>): Promise<string> {
    const id = `geofence_${Date.now()}`;
    const geofence: GeofenceZone = { ...zone, id };
    
    this.geofences.set(id, geofence);
    
    try {
      const { error } = await supabase.from('geofence_zones').insert([geofence]);
      if (error) throw error;
    } catch (error) {
      console.error('Failed to save geofence:', error);
      Alert.alert('Geofence Error', 'Failed to add geofence. Please try again.');
    }
    
    return id;
  }

  async removeGeofence(zoneId: string): Promise<void> {
    this.geofences.delete(zoneId);
    try {
      const { error } = await supabase.from('geofence_zones').delete().eq('id', zoneId);
      if (error) throw error;
    } catch (error) {
      console.error('Failed to remove geofence:', error);
      Alert.alert('Geofence Error', 'Failed to remove geofence. Please try again.');
    }
  }

  private checkGeofences(currentLocation: LocationData): void {
    this.geofences.forEach((zone) => {
      if (!zone.isActive) return;

      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        zone.latitude,
        zone.longitude
      );

      const isInside = distance <= zone.radius;
      const wasInside = this.lastLocation ? 
        this.calculateDistance(
          this.lastLocation.latitude,
          this.lastLocation.longitude,
          zone.latitude,
          zone.longitude
        ) <= zone.radius : false;

      if (isInside && !wasInside) {
        this.triggerGeofenceEvent(zone.id, 'enter', currentLocation);
      } else if (!isInside && wasInside) {
        this.triggerGeofenceEvent(zone.id, 'exit', currentLocation);
      }
    });
  }

  private async triggerGeofenceEvent(zoneId: string, eventType: 'enter' | 'exit', location: LocationData): Promise<void> {
    const event: GeofenceEvent = {
      zoneId,
      eventType,
      location,
      timestamp: Date.now()
    };

    this.geofenceCallbacks.forEach(callback => callback(event));
    
    try {
      const { error } = await supabase.from('geofence_events').insert([event]);
      if (error) throw error;
    } catch (error) {
      console.error('Failed to log geofence event:', error);
    }
  }

  onGeofenceEvent(callback: (event: GeofenceEvent) => void): void {
    this.geofenceCallbacks.push(callback);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result.length > 0) {
        const { street, city, region, postalCode } = result[0];
        return [street, city, region, postalCode].filter(Boolean).join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  getGeofences(): GeofenceZone[] {
    return Array.from(this.geofences.values());
  }
}

export default LocationService;