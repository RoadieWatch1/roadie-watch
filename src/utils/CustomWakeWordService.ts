import { supabase } from '@/app/lib/supabase';
import { VoiceRecognitionService } from './VoiceRecognitionService';

export interface CustomWakeWord {
  id: string;
  phrase: string;
  modelPath?: string;
  isActive: boolean;
  sensitivity: number;
  trainingComplete: boolean;
}

export interface TrainingSession {
  id: string;
  wakeWordId: string;
  recordings: number;
  completedAt?: string;
  accuracy: number;
}

export class CustomWakeWordService {
  private voiceService: VoiceRecognitionService;
  private customWords: CustomWakeWord[] = [];
  private isTraining = false;

  constructor(voiceService: VoiceRecognitionService) {
    this.voiceService = voiceService;
  }

  async createCustomWakeWord(phrase: string): Promise<CustomWakeWord> {
    const wakeWord: CustomWakeWord = {
      id: Date.now().toString(),
      phrase: phrase.toLowerCase().trim(),
      isActive: false,
      sensitivity: 0.5,
      trainingComplete: false
    };

    try {
      const { data, error } = await supabase
        .from('voice_patterns')
        .insert({
          phrase_detected: wakeWord.phrase,
          is_custom: true,
          sensitivity: wakeWord.sensitivity,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      wakeWord.id = data.id;
      this.customWords.push(wakeWord);

      return wakeWord;
    } catch (error) {
      console.error('Failed to create custom wake word:', error);
      throw error;
    }
  }

  async startTrainingSession(wakeWordId: string): Promise<TrainingSession> {
    const wakeWord = this.customWords.find(w => w.id === wakeWordId);
    if (!wakeWord) throw new Error('Wake word not found');

    this.isTraining = true;

    const session: TrainingSession = {
      id: Date.now().toString(),
      wakeWordId,
      recordings: 0,
      accuracy: 0
    };

    try {
      const { data, error } = await supabase
        .from('voice_training_sessions')
        .insert({
          wake_word_id: wakeWordId,
          recordings_count: 0,
          started_at: new Date().toISOString(),
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      session.id = data.id;

      return session;
    } catch (error) {
      console.error('Failed to start training session:', error);
      throw error;
    }
  }

  async recordTrainingPhrase(sessionId: string, audioData: number[]): Promise<void> {
    try {
      const features = this.extractAudioFeatures(audioData);

      await supabase.functions.invoke('picovoice-integration', {
        body: {
          action: 'train_phrase',
          sessionId,
          audioFeatures: features,
          timestamp: new Date().toISOString()
        }
      });

      const { data: currentSession, error } = await supabase
        .from('voice_training_sessions')
        .select('recordings_count')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      const newCount = (currentSession?.recordings_count ?? 0) + 1;

      await supabase
        .from('voice_training_sessions')
        .update({ recordings_count: newCount })
        .eq('id', sessionId);

    } catch (error) {
      console.error('Failed to record training phrase:', error);
      throw error;
    }
  }

  private extractAudioFeatures(audioData: number[]): number[] {
    const features: number[] = [];
    const windowSize = 256;

    for (let i = 0; i < audioData.length - windowSize; i += windowSize) {
      const window = audioData.slice(i, i + windowSize);
      const energy = window.reduce((sum, val) => sum + val * val, 0) / windowSize;
      features.push(energy);
    }

    return features;
  }

  async completeTraining(sessionId: string): Promise<boolean> {
    try {
      const { data: session } = await supabase
        .from('voice_training_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (!session || session.recordings_count < 5) {
        throw new Error('Insufficient training data');
      }

      const { data, error } = await supabase.functions.invoke('picovoice-integration', {
        body: {
          action: 'create_custom_model',
          sessionId,
          minAccuracy: 0.8
        }
      });

      if (error) throw error;

      const wakeWord = this.customWords.find(w => w.id === session.wake_word_id);
      if (wakeWord) {
        wakeWord.trainingComplete = true;
        wakeWord.modelPath = data.modelPath;
      }

      await supabase
        .from('voice_training_sessions')
        .update({
          completed_at: new Date().toISOString(),
          accuracy: data.accuracy
        })
        .eq('id', sessionId);

      // ✅ Auto-activate the wake word immediately
      await this.activateCustomWakeWord(session.wake_word_id);

      this.isTraining = false;
      return true;
    } catch (error) {
      console.error('Failed to complete training:', error);
      this.isTraining = false;
      return false;
    }
  }

  async activateCustomWakeWord(wakeWordId: string): Promise<void> {
    const wakeWord = this.customWords.find(w => w.id === wakeWordId);
    if (!wakeWord || !wakeWord.trainingComplete) {
      throw new Error('Wake word not ready for activation');
    }

    wakeWord.isActive = true;

    const currentConfig = this.voiceService.isCurrentlyListening();
    if (currentConfig) {
      this.voiceService.updateConfig({
        triggerPhrases: [...this.getActivePhrases(), wakeWord.phrase]
      });
    }
  }

  getActivePhrases(): string[] {
    return this.customWords
      .filter(w => w.isActive && w.trainingComplete)
      .map(w => w.phrase);
  }

  async loadUserWakeWords(): Promise<CustomWakeWord[]> {
    try {
      const { data, error } = await supabase
        .from('voice_patterns')
        .select('*')
        .eq('is_custom', true)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      this.customWords = data.map(d => ({
        id: d.id,
        phrase: d.phrase_detected,
        isActive: d.is_active || false,
        sensitivity: d.sensitivity,
        trainingComplete: d.training_complete || false,
        modelPath: d.model_path
      }));

      return this.customWords;
    } catch (error) {
      console.error('Failed to load user wake words:', error);
      return [];
    }
  }

  isCurrentlyTraining(): boolean {
    return this.isTraining;
  }
}
