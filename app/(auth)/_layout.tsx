import { Stack } from 'expo-router';

// Stack navigator manages the login → register navigation.
// headerShown: false removes the default header on all auth screens
// so we have full control over the UI.
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}