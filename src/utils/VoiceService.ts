import { Alert } from 'react-native';

export interface VoiceCommand {
  action: 'activate' | 'cancel' | 'safe' | 'help' | 'emergency' | 'police' | 'fire' | 'medical';
  confidence: number;
  type?: 'emergency' | 'medical' | 'fire' | 'police';
}

class VoiceService {
  private static instance: VoiceService;
  private isListening = false;
  private onCommandCallback?: (command: VoiceCommand) => void;
  
  // Enhanced vocabulary
  private commands: Record<string, string[]> = {
    activate: ['activate', 'emergency', 'help me', 'sos', 'panic'],
    cancel: ['cancel', 'stop', 'nevermind', 'false alarm'],
    safe: ['safe', 'okay', 'all good', 'im fine'],
    help: ['help', 'assistance', 'need help'],
    emergency: ['emergency', '911', 'urgent'],
    police: ['police', 'cops', 'law enforcement'],
    fire: ['fire', 'fire department', 'burning'],
    medical: ['medical', 'ambulance', 'doctor', 'hurt', 'injured']
  };

  private commandTypes: Record<string, VoiceCommand['type']> = {
    emergency: 'emergency',
    police: 'police',
    fire: 'fire',
    medical: 'medical'
  };

  static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Microphone Permission',
        'Allow access to microphone for voice commands?',
        [
          { text: 'Deny', onPress: () => resolve(false) },
          { text: 'Allow', onPress: () => resolve(true) }
        ]
      );
    });
  }

  async startListening(onCommand: (command: VoiceCommand) => void): Promise<void> {
    if (this.isListening) return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Cannot start voice recognition without microphone access.');
      return;
    }

    this.isListening = true;
    this.onCommandCallback = onCommand;
    console.log('Enhanced voice recognition started');
  }

  // Simulate voice command recognition
  simulateVoiceCommand(text: string): void {
    if (!this.isListening || !this.onCommandCallback) return;
    
    const lowerText = text.toLowerCase();
    
    for (const [action, keywords] of Object.entries(this.commands)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          this.onCommandCallback({
            action: action as VoiceCommand['action'],
            confidence: 0.9,
            type: this.commandTypes[action] // Map action to type where applicable
          });
          return;
        }
      }
    }
  }

  stopListening(): void {
    this.isListening = false;
    this.onCommandCallback = undefined;
    console.log('Voice recognition stopped');
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }
}

export default VoiceService;