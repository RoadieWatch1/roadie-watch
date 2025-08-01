// Voice commands supported:
// "Roadie help me" => Triggers SOS
// "Please stop" => Silent alert
// "What are you doing" => Sends location only
// Spanish: "rodie ayudame", "por favor para", "que haces"
// Arabic: "رودي ساعدني", "رجاءً توقف", "ماذا تفعل"

import { Alert, AppState, AppStateStatus } from 'react-native';
import { supabase } from '../../app/lib/supabase';
import { VoiceRecognitionService } from './VoiceRecognitionService'; // ✅ fixed

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

export interface VoiceActivationConfig {
  triggerPhrases: string[];
  sensitivity: number;
  enabled: boolean;
}

const BACKGROUND_LISTEN_TASK = 'background-voice-listen';

TaskManager.defineTask(BACKGROUND_LISTEN_TASK, async () => {
  try {
    console.log('Background voice listen task executed');
    // Add background listening logic here
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

class VoiceActivationService {
  private static instance: VoiceActivationService;
  private isListening = false;
  private config: VoiceActivationConfig = {
    triggerPhrases: [
      'roadie help me',
      'please stop',
      'what are you doing',
      'rodie ayudame',
      'por favor para',
      'que haces',
      'rudy saedni',
      'rajaan tawqaf',
      'madha tafal',
      'رودي ساعدني',
      'رجاءً توقف',
      'ماذا تفعل',
      'roadie aide moi',
      "s il vous plaît arrêtez",
      'que faites-vous',
      'roadie hilf mir',
      'bitte aufhören',
      'was machst du'
    ],
    sensitivity: 0.8,
    enabled: false
  };
  private phraseMetadata = new Map<string, {language: string, protocol: string}>([
    ['roadie help me', {language: 'english', protocol: 'sos'}],
    ['please stop', {language: 'english', protocol: 'silent'}],
    ['what are you doing', {language: 'english', protocol: 'location-only'}],
    ['rodie ayudame', {language: 'spanish', protocol: 'sos'}],
    ['por favor para', {language: 'spanish', protocol: 'silent'}],
    ['que haces', {language: 'spanish', protocol: 'location-only'}],
    ['rudy saedni', {language: 'arabic', protocol: 'sos'}],
    ['rajaan tawqaf', {language: 'arabic', protocol: 'silent'}],
    ['madha tafal', {language: 'arabic', protocol: 'location-only'}],
    ['رودي ساعدني', {language: 'arabic', protocol: 'sos'}],
    ['رجاءً توقف', {language: 'arabic', protocol: 'silent'}],
    ['ماذا تفعل', {language: 'arabic', protocol: 'location-only'}],
    ['roadie aide moi', {language: 'french', protocol: 'sos'}],
    ["s il vous plaît arrêtez", {language: 'french', protocol: 'silent'}],
    ['que faites-vous', {language: 'french', protocol: 'location-only'}],
    ['roadie hilf mir', {language: 'german', protocol: 'sos'}],
    ['bitte aufhören', {language: 'german', protocol: 'silent'}],
    ['was machst du', {language: 'german', protocol: 'location-only'}],
  ]);
  private onActivationCallback?: (protocol: string) => void;
  private appStateListener?: any;
  private voiceRecognition?: VoiceRecognitionService;

  static getInstance(): VoiceActivationService {
    if (!VoiceActivationService.instance) {
      VoiceActivationService.instance = new VoiceActivationService();
    }
    return VoiceActivationService.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) return false;

      await this.initializeVoiceRecognition();
      this.setupAppStateListener();
      await this.registerBackgroundTask();
      return true;
    } catch (error) {
      console.error('Voice activation initialization failed:', error);
      Alert.alert('Initialization Error', 'Failed to initialize voice activation. Please check permissions.');
      return false;
    }
  }

  private async requestPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Voice Activation Permission',
        'Allow microphone access for emergency voice activation? This enables voice commands like "Roadie Help Me".',
        [
          { text: 'Deny', onPress: () => resolve(false) },
          { text: 'Allow', onPress: () => resolve(true) }
        ]
      );
    });
  }

  private async initializeVoiceRecognition(): Promise<void> {
    try {
      this.voiceRecognition = new VoiceRecognitionService({
        triggerPhrases: this.config.triggerPhrases,
        sensitivity: this.config.sensitivity,
        enableContinuous: true,
        enableFeedback: true
      });

      const { data } = await supabase.functions.invoke('picovoice-integration', {
        body: { body: { action: 'get-access-key' } }
      });

      if (data?.accessKey) {
        await this.voiceRecognition.initialize(data.accessKey);
      } else {
        console.warn('No Picovoice access key available, using fallback');
      }
    } catch (error) {
      console.error('Voice recognition initialization error:', error);
      throw error;
    }
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) {
      matrix[i][0] = i;
    }

    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[a.length][b.length];
  }

  private findMatchingPhrase(detected: string): string | null {
    const lowerDetected = detected.toLowerCase();

    // Exact match first
    for (const phrase of this.phraseMetadata.keys()) {
      if (lowerDetected === phrase.toLowerCase()) {
        return phrase;
      }
    }

    // Fuzzy match with Levenshtein
    let minDist = Infinity;
    let bestPhrase: string | null = null;
    for (const phrase of this.phraseMetadata.keys()) {
      const lowerPhrase = phrase.toLowerCase();
      const dist = this.levenshteinDistance(lowerDetected, lowerPhrase);
      const normDist = dist / Math.max(lowerDetected.length, lowerPhrase.length);
      if (normDist < 0.2 && dist < minDist) {
        minDist = dist;
        bestPhrase = phrase;
      }
    }

    return bestPhrase;
  }

  private async handleWakeWordDetection(detectedPhrase: string): Promise<void> {
    if (!this.onActivationCallback || !this.isListening) return;

    console.log(`Voice activation triggered by: "${detectedPhrase}"`);

    const matchedPhrase = this.findMatchingPhrase(detectedPhrase);
    if (matchedPhrase) {
      const meta = this.phraseMetadata.get(matchedPhrase)!;
      await this.logActivationEvent(detectedPhrase, meta.language);
      this.onActivationCallback(meta.protocol);
    }
  }

  private async logActivationEvent(phrase: string, language: string): Promise<void> {
    try {
      await supabase.from('sos_activations').insert({
        activation_type: 'voice',
        trigger_phrase: phrase,
        language: language,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log voice activation:', error);
    }
  }

  private setupAppStateListener(): void {
    this.appStateListener = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'background' && this.config.enabled) {
          this.maintainBackgroundListening();
        } else if (nextAppState === 'active' && this.config.enabled) {
          this.resumeForegroundListening();
        }
      }
    );
  }

  private async maintainBackgroundListening(): Promise<void> {
    console.log('Maintaining background voice listening...');
    // TODO: Implement background mode switching if needed
  }

  private async resumeForegroundListening(): Promise<void> {
    console.log('Resuming foreground voice listening...');
    // TODO: Implement foreground mode switching if needed
  }

  private async registerBackgroundTask(): Promise<void> {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_LISTEN_TASK, {
        minimumInterval: 900,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    } catch (error) {
      console.error('Failed to register background task:', error);
    }
  }

  async startListening(onActivation: (protocol: string) => void): Promise<void> {
    if (!this.config.enabled || !this.voiceRecognition) {
      console.warn('Voice activation is disabled or not initialized');
      return;
    }

    this.isListening = true;
    this.onActivationCallback = onActivation;

    await this.voiceRecognition.startListening((phrase: string) => {
      this.handleWakeWordDetection(phrase);
    });

    console.log('Voice activation listening for phrases:', this.config.triggerPhrases);
  }

  async stopListening(): Promise<void> {
    this.isListening = false;
    this.onActivationCallback = undefined;

    if (this.voiceRecognition) {
      await this.voiceRecognition.stopListening();
    }

    console.log('Voice activation stopped');
  }

  updateConfig(newConfig: Partial<VoiceActivationConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.voiceRecognition) {
      this.voiceRecognition.updateConfig({
        triggerPhrases: this.config.triggerPhrases,
        sensitivity: this.config.sensitivity
      });
    }

    console.log('Voice activation config updated:', this.config);
  }

  getConfig(): VoiceActivationConfig {
    return { ...this.config };
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  getVoiceRecognitionService(): VoiceRecognitionService | undefined {
    return this.voiceRecognition;
  }

  async cleanup(): Promise<void> {
    await this.stopListening();
    if (this.voiceRecognition) {
      await this.voiceRecognition.cleanup();
    }
    this.appStateListener?.remove();
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_LISTEN_TASK);
  }
}

export default VoiceActivationService;

