import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '@/app/lib/supabase';

interface SafetyProtocol {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  triggerCount: number;
  cooldownMinutes: number;
}

export const VoiceSafetyProtocols: React.FC = () => {
  const [protocols, setProtocols] = useState<SafetyProtocol[]>([
    {
      id: 'false_positive',
      name: 'False Positive Protection',
      description: 'Prevents accidental activations with confirmation delay',
      isEnabled: true,
      triggerCount: 0,
      cooldownMinutes: 5
    },
    {
      id: 'rate_limiting',
      name: 'Rate Limiting',
      description: 'Limits emergency activations to prevent spam',
      isEnabled: true,
      triggerCount: 0,
      cooldownMinutes: 10
    },
    {
      id: 'context_awareness',
      name: 'Context Awareness',
      description: 'Analyzes surrounding audio for genuine emergencies',
      isEnabled: false,
      triggerCount: 0,
      cooldownMinutes: 0
    },
    {
      id: 'multi_phrase',
      name: 'Multi-Phrase Confirmation',
      description: 'Requires multiple trigger phrases for activation',
      isEnabled: false,
      triggerCount: 0,
      cooldownMinutes: 0
    }
  ]);

  const [recentActivations, setRecentActivations] = useState<number>(0);

  useEffect(() => {
    loadProtocolSettings();
    checkRecentActivations();
  }, []);

  const loadProtocolSettings = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('voice_safety_settings')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (data?.voice_safety_settings) {
        const settings = JSON.parse(data.voice_safety_settings);
        setProtocols(prev => prev.map(p => ({
          ...p,
          isEnabled: settings[p.id]?.enabled ?? p.isEnabled,
          cooldownMinutes: settings[p.id]?.cooldown ?? p.cooldownMinutes
        })));
      }
    } catch (error) {
      console.error('Failed to load safety protocols:', error);
    }
  };

  const checkRecentActivations = async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('sos_activations')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .gte('created_at', oneHourAgo);

      if (!error && data) {
        setRecentActivations(data.length);
      }
    } catch (error) {
      console.error('Failed to check recent activations:', error);
    }
  };

  const toggleProtocol = async (protocolId: string) => {
    const updatedProtocols = protocols.map(p =>
      p.id === protocolId ? { ...p, isEnabled: !p.isEnabled } : p
    );
    
    setProtocols(updatedProtocols);

    try {
      const settings = updatedProtocols.reduce((acc, p) => ({
        ...acc,
        [p.id]: { enabled: p.isEnabled, cooldown: p.cooldownMinutes }
      }), {});

      await supabase
        .from('users')
        .update({ voice_safety_settings: JSON.stringify(settings) })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);
    } catch (error) {
      console.error('Failed to save protocol settings:', error);
    }
  };

  const testProtocol = async (protocolId: string) => {
    const protocol = protocols.find(p => p.id === protocolId);
    if (!protocol) return;

    Alert.alert(
      'Test Safety Protocol',
      `Testing ${protocol.name}...`,
      [
        {
          text: 'Simulate Trigger',
          onPress: async () => {
            // Simulate protocol activation
            await supabase.functions.invoke('emergency-notification', {
              body: {
                type: 'safety_protocol_test',
                protocolId,
                userId: (await supabase.auth.getUser()).data.user?.id
              }
            });
            
            Alert.alert('Test Complete', `${protocol.name} protocol tested successfully`);
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Safety Protocols</Text>
      
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Recent Activations (1h): {recentActivations}
        </Text>
      </View>

      {protocols.map(protocol => (
        <View key={protocol.id} style={styles.protocolCard}>
          <View style={styles.protocolHeader}>
            <View style={styles.protocolInfo}>
              <Text style={styles.protocolName}>{protocol.name}</Text>
              <Text style={styles.protocolDescription}>{protocol.description}</Text>
            </View>
            <Switch
              value={protocol.isEnabled}
              onValueChange={() => toggleProtocol(protocol.id)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={protocol.isEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
          
          {protocol.isEnabled && (
            <View style={styles.protocolDetails}>
              <Text style={styles.detailText}>
                Cooldown: {protocol.cooldownMinutes} minutes
              </Text>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => testProtocol(protocol.id)}
              >
                <Text style={styles.testButtonText}>Test Protocol</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333'
  },
  statsContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  statsText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500'
  },
  protocolCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  protocolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  protocolInfo: {
    flex: 1,
    marginRight: 12
  },
  protocolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  protocolDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  protocolDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  detailText: {
    fontSize: 12,
    color: '#888'
  },
  testButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500'
  }
});