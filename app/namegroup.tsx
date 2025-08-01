import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SparkleBackground } from '../src/components/SparkleBackground';

export default function NameGroupScreen() {
  const [groupName, setGroupName] = useState('');

  return (
    <View style={styles.container}>
      <SparkleBackground>
        <View style={styles.content}>
          <Text style={styles.title}>Name Your Group</Text>
          <Text style={styles.subtitle}>Create your safety network</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter group name"
            placeholderTextColor="#666"
            value={groupName}
            onChangeText={setGroupName}
          />

          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/invitecode')}
          >
            <Text style={styles.buttonText}>CREATE GROUP</Text>
          </TouchableOpacity>
        </View>
      </SparkleBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#CCCCCC', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: '#444', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#FFFFFF', marginBottom: 30 },
  button: { backgroundColor: '#FF6B6B', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});