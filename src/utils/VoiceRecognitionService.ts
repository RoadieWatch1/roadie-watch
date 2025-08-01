import { Porcupine, BuiltInKeywords } from '@picovoice/porcupine-react-native';
import { VoiceProcessor } from '@picovoice/react-native-voice-processor';
import { Audio } from 'expo-av';
import { supabase } from '@/app/lib/supabase';

export interface VoiceRecognitionConfig {
  triggerPhrases: string[];
  sensitivity: number;
  enableContinuous: boolean;
  enableFeedback: boolean;
}

class VoiceRecognitionService {
  private porcupine: Porcupine | null = null;
  private isListening = false;
  private config: VoiceRecognitionConfig;
  private onTriggerCallback?: (phrase: string) => void;

  constructor(config: VoiceRecognitionConfig) {
    this.config = config;
  }

  async initialize(accessKey: string): Promise<void> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permission not granted');
      }

      this.porcupine = await Porcupine.fromBuiltInKeywords(
        accessKey,
        [BuiltInKeywords.HEY_GOOGLE, BuiltInKeywords.ALEXA, BuiltInKeywords.COMPUTER],
        undefined,
        [0.5, 0.5, 0.5]
      );

      console.log('Voice recognition initialized');
    } catch (error) {
      console.error('Failed to initialize voice recognition:', error);
      throw error;
    }
  }

  async startListening(onTrigger: (phrase: string) => void): Promise<void> {
    if (this.isListening || !this.porcupine) return;

    this.onTriggerCallback = onTrigger;
    this.isListening = true;

    try {
      VoiceProcessor.instance.addFrameListener(this.processAudioFrame.bind(this));
      await VoiceProcessor.instance.start(4096, 16000);
      console.log('Voice listening started');
    } catch (error) {
      console.error('Failed to start voice listening:', error);
      this.isListening = false;
    }
  }

  async stopListening(): Promise<void> {
    if (!this.isListening) return;

    try {
      VoiceProcessor.instance.removeFrameListener(this.processAudioFrame.bind(this));
      await VoiceProcessor.instance.stop();
      this.isListening = false;
      console.log('Voice listening stopped');
    } catch (error) {
      console.error('Failed to stop voice listening:', error);
    }
  }

  private async processAudioFrame(frame: number[]): Promise<void> {
    if (!this.porcupine || !this.isListening) return;

    try {
      const keywordIndex = await this.porcupine.process(frame);

      if (keywordIndex >= 0) {
        const detectedPhrase = this.getDetectedPhrase(keywordIndex);
        console.log('Wake word detected:', detectedPhrase);

        await this.logVoiceDetection(detectedPhrase);

        if (this.config.enableFeedback) {
          await this.provideFeedback();
        }

        this.onTriggerCallback?.(detectedPhrase);
      }
    } catch (error) {
      console.error('Error processing audio frame:', error);
    }
  }

  private getDetectedPhrase(keywordIndex: number): string {
    const keywords = ['hey google', 'alexa', 'computer'];
    return keywords[keywordIndex] || 'unknown';
  }

  private async provideFeedback(): Promise<void> {
    try {
      const Haptics = await import('expo-haptics');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.log('Haptics not available');
    }
  }

  private async logVoiceDetection(phrase: string): Promise<void> {
    try {
      await supabase.from('voice_patterns').insert({
        phrase_detected: phrase,
        confidence_score: this.config.sensitivity,
        detected_at: new Date().toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id
      });
    } catch (error) {
      console.error('Failed to log voice detection:', error);
    }
  }

  async testPhrase(phrase: string): Promise<boolean> {
    console.log(`Testing phrase: "${phrase}"`);

    if (this.config.triggerPhrases.some(p =>
      phrase.toLowerCase().includes(p.toLowerCase())
    )) {
      await this.logVoiceDetection(phrase);
      this.onTriggerCallback?.(phrase);
      return true;
    }

    return false;
  }

  updateConfig(newConfig: Partial<VoiceRecognitionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  async cleanup(): Promise<void> {
    await this.stopListening();

    if (this.porcupine) {
      await this.porcupine.delete();
      this.porcupine = null;
    }
  }
}

// ✅ Exported as named export to fix import issues
export { VoiceRecognitionService };

