import { supabase } from '../../app/lib/supabase';

export interface WakeWordModel {
  phrase: string;
  modelId: string;
  sensitivity: number;
  created: string;
}

export interface PhraseValidation {
  phrase: string;
  valid: boolean;
  recommendation: string;
}

class PicovoiceService {
  private static instance: PicovoiceService;

  static getInstance(): PicovoiceService {
    if (!PicovoiceService.instance) {
      PicovoiceService.instance = new PicovoiceService();
    }
    return PicovoiceService.instance;
  }

  async validatePhrases(phrases: string[]): Promise<PhraseValidation[]> {
    try {
      const { data, error } = await supabase.functions.invoke('picovoice-integration', {
        body: { 
          action: 'validate_phrases', 
          phrases,
          userId: 'current_user' 
        }
      });

      if (error) throw error;

      return data.validatedPhrases || [];
    } catch (error) {
      console.error('Phrase validation error:', error);
      
      // Fallback validation
      return phrases.map(phrase => ({
        phrase,
        valid: phrase.length >= 3 && phrase.length <= 50,
        recommendation: phrase.length < 3 ? 'Too short' : phrase.length > 50 ? 'Too long' : 'Valid'
      }));
    }
  }

  async createWakeWordModels(phrases: string[]): Promise<WakeWordModel[]> {
    try {
      const { data, error } = await supabase.functions.invoke('picovoice-integration', {
        body: { 
          action: 'create_wake_words', 
          phrases,
          userId: 'current_user' 
        }
      });

      if (error) throw error;

      return data.models || [];
    } catch (error) {
      console.error('Wake word model creation error:', error);
      
      // Fallback models
      return phrases.map((phrase, index) => ({
        phrase,
        modelId: `fallback_${index}`,
        sensitivity: 0.8,
        created: new Date().toISOString()
      }));
    }
  }

  async testVoiceActivation(phrases: string[]): Promise<{
    success: boolean;
    testPhrase: string;
    detected: boolean;
    confidence: number;
    message: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('picovoice-integration', {
        body: { 
          action: 'test_activation', 
          phrases,
          userId: 'current_user' 
        }
      });

      if (error) throw error;

      return {
        success: data.success,
        testPhrase: data.testPhrase,
        detected: data.detected,
        confidence: data.confidence,
        message: data.message
      };
    } catch (error) {
      console.error('Voice activation test error:', error);
      
      return {
        success: false,
        testPhrase: phrases[0] || 'test phrase',
        detected: false,
        confidence: 0,
        message: 'Test failed - using fallback detection'
      };
    }
  }

  async optimizePhrases(phrases: string[]): Promise<string[]> {
    // Optimize phrases for better voice recognition
    return phrases.map(phrase => {
      // Convert to lowercase
      let optimized = phrase.toLowerCase().trim();
      
      // Remove extra spaces
      optimized = optimized.replace(/\s+/g, ' ');
      
      // Ensure minimum length
      if (optimized.length < 3) {
        optimized = `${optimized} help`;
      }
      
      return optimized;
    });
  }

  getRecommendedPhrases(): string[] {
    return [
      'roadie help me',
      'what are you doing', 
      'please stop',
      'emergency mode',
      'call for help',
      'i need assistance'
    ];
  }

  isPhraseOptimal(phrase: string): boolean {
    const length = phrase.length;
    const wordCount = phrase.split(' ').length;
    
    return length >= 8 && length <= 25 && wordCount >= 2 && wordCount <= 5;
  }
}

export default PicovoiceService;