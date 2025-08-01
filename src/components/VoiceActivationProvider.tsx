import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo
} from 'react';
import { useRouter } from 'expo-router';
import VoiceActivationService from '../utils/VoiceActivationService';

interface VoiceActivationContextType {
  isListening: boolean;
  isEnabled: boolean;
  triggerPhrases: string[];
  startListening: () => void;
  stopListening: () => void;
  toggleEnabled: () => void;
  updateTriggerPhrases: (phrases: string[]) => void;
}

const VoiceActivationContext = createContext<VoiceActivationContextType | null>(null);

export const useVoiceActivation = () => {
  const context = useContext(VoiceActivationContext);
  if (!context) {
    throw new Error('useVoiceActivation must be used within VoiceActivationProvider');
  }
  return context;
};

export function VoiceActivationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [triggerPhrases, setTriggerPhrases] = useState([
    'roadie help me',
    'please stop',
    'what are you doing'
  ]);

  const voiceService = VoiceActivationService.getInstance();

  useEffect(() => {
    const init = async () => {
      await initializeVoiceActivation();
    };
    init();
    return () => {
      voiceService.cleanup();
    };
  }, []);

  const initializeVoiceActivation = async () => {
    const initialized = await voiceService.initialize();
    if (initialized) {
      const config = voiceService.getConfig();
      setIsEnabled(config.enabled);
      setTriggerPhrases(config.triggerPhrases);
      if (config.enabled) {
        startListening();
      }
    }
  };

  const handleVoiceActivation = useCallback((protocol: string) => {
    console.log(`Voice activation triggered protocol: ${protocol}`);
    switch (protocol) {
      case 'sos':
        router.push('/silent');
        break;
      case 'silent':
        router.push('/silent?mode=silent');
        break;
      case 'location-only':
        router.push('/silent?mode=ping');
        break;
      default:
        console.warn('Unknown protocol from voice trigger:', protocol);
    }
  }, [router]);

  const startListening = useCallback(() => {
    voiceService.startListening(handleVoiceActivation);
    setIsListening(true);
  }, [voiceService, handleVoiceActivation]);

  const stopListening = useCallback(() => {
    voiceService.stopListening();
    setIsListening(false);
  }, [voiceService]);

  const toggleEnabled = useCallback(() => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    voiceService.updateConfig({ enabled: newEnabled });
    if (newEnabled) {
      startListening();
    } else {
      stopListening();
    }
  }, [isEnabled, voiceService, startListening, stopListening]);

  const updateTriggerPhrases = useCallback((phrases: string[]) => {
    setTriggerPhrases(phrases);
    voiceService.updateConfig({ triggerPhrases: phrases });
    if (isListening) {
      stopListening();
      setTimeout(startListening, 100);
    }
  }, [voiceService, isListening, stopListening, startListening]);

  const contextValue = useMemo((): VoiceActivationContextType => ({
    isListening,
    isEnabled,
    triggerPhrases,
    startListening,
    stopListening,
    toggleEnabled,
    updateTriggerPhrases
  }), [
    isListening,
    isEnabled,
    triggerPhrases,
    startListening,
    stopListening,
    toggleEnabled,
    updateTriggerPhrases
  ]);

  return (
    <VoiceActivationContext.Provider value={contextValue}>
      {children}
    </VoiceActivationContext.Provider>
  );
}
