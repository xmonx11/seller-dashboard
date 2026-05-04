import { useEffect, useState, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const { loadUser, user, profile } = useAuthStore();
  const hydrate = useCartStore((s) => s.hydrate);
  const [initialized, setInitialized] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    const init = async () => {
      await loadUser();
      await hydrate();
      setInitialized(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      hasRedirected.current = false;
      router.replace('/(auth)/login');
      return;
    }
    if (!profile) return;
    if (hasRedirected.current) return;
    hasRedirected.current = true;

    if (profile.role === 'buyer') {
      router.replace('/(buyer)/home');
    } else {
     router.replace('/(drawer)/(tabs)');// ✅ changed from /(tabs)
    }
  }, [initialized, user, profile]);

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(drawer)" options={{ headerShown: false }} /> {/* ✅ changed */}
      <Stack.Screen name="(buyer)" options={{ headerShown: false }} />
      <Stack.Screen
        name="order-detail"
        options={{ presentation: 'modal', headerShown: false }}
      />
    </Stack>
  );
}