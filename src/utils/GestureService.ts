import { Alert } from 'react-native';

export interface GestureEvent {
  type: 'shake' | 'panic_tap';
  timestamp: number;
  intensity?: number;
}

class GestureService {
  private listeners: ((event: GestureEvent) => void)[] = [];
  private shakeCount = 0;
  private lastShake = 0;

  // Simulate shake detection with button press for now
  simulateShake() {
    const now = Date.now();
    if (now - this.lastShake > 1000) {
      this.shakeCount = 0;
    }
    
    this.shakeCount++;
    this.lastShake = now;
    
    if (this.shakeCount >= 3) {
      this.triggerGesture({
        type: 'shake',
        timestamp: now,
        intensity: this.shakeCount
      });
      this.shakeCount = 0;
    }
  }

  simulatePanicTap() {
    this.triggerGesture({
      type: 'panic_tap',
      timestamp: Date.now()
    });
  }

  private triggerGesture(event: GestureEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  addListener(callback: (event: GestureEvent) => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: (event: GestureEvent) => void) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  startListening() {
    // In a real app, this would start device motion sensors
    console.log('Gesture listening started');
  }

  stopListening() {
    console.log('Gesture listening stopped');
  }
}

export default new GestureService();