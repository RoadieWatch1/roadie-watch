import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SparkleBackground } from '../src/components/SparkleBackground';

export default function WelcomeBackScreen() {
  return (
    <View style={styles.container}>
      <SparkleBackground>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to Roadie Watch</Text>
          <Text style={styles.subtitle}>Your security network is ready</Text>
          
          <View style={styles.featuresContainer}>
            <Text style={styles.featureText}>✓ Premium subscription active</Text>
            <Text style={styles.featureText}>✓ Emergency SOS ready</Text>
            <Text style={styles.featureText}>✓ Live tracking enabled</Text>
            <Text style={styles.featureText}>✓ Watcher network available</Text>
          </View>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/silent')}
          >
            <Text style={styles.buttonText}>CONTINUE SETUP</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.sosButton}
            onPress={() => router.push('/sos')}
          >
            <Text style={styles.sosButtonText}>EMERGENCY SOS</Text>
          </TouchableOpacity>
        </View>
      </SparkleBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#CCCCCC', textAlign: 'center', marginBottom: 40 },
  featuresContainer: { backgroundColor: 'rgba(42, 42, 42, 0.8)', padding: 20, borderRadius: 8, marginBottom: 30 },
  featureText: { color: '#CCCCCC', fontSize: 14, marginBottom: 8 },
  button: { backgroundColor: '#FF6B6B', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  sosButton: { backgroundColor: '#FF0000', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  sosButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});