import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { VoiceActivationProvider } from '../src/components/VoiceActivationProvider';

export default function RootLayout() {
  return (
    <VoiceActivationProvider>
      <StatusBar style="light" backgroundColor="#000" translucent={true} />
      <Stack
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000' },
          gestureEnabled: true,  // Enable swipe-back
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="flash" />
        <Stack.Screen name="title" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="signin" />
        <Stack.Screen name="payment" />
        <Stack.Screen name="welcomeback" />
        <Stack.Screen name="silent" />
        <Stack.Screen name="namegroup" />
        <Stack.Screen name="invitecode" />
        <Stack.Screen name="followers" />
        <Stack.Screen name="sos" />
        <Stack.Screen name="livetracking" />
      </Stack>
    </VoiceActivationProvider>
  );
}