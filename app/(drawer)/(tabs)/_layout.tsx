import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native'; // ✅ add Platform
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { router } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProductsIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={3} y1={6} x2={21} y2={6} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M16 10a4 4 0 01-8 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function OrdersIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
      <Rect x={14} y={3} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
      <Rect x={3} y={14} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
      <Rect x={14} y={14} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={7} r={4} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function ActiveDot() {
  return <View style={styles.dot} />;
}

export default function TabsLayout() {
  const { profile } = useAuthStore();

  useEffect(() => {
    if (profile && profile.role === 'buyer') {
      router.replace('/(buyer)/home');
    }
  }, [profile]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // ✅ Hide bottom nav on web, show on mobile
        tabBarStyle: Platform.OS === 'web'
          ? { display: 'none' }
          : {
              backgroundColor: '#fff',
              borderTopWidth: 0.5,
              borderTopColor: '#E8E8E8',
              height: 64,
              paddingBottom: 10,
              paddingTop: 8,
              elevation: 0,
              shadowOpacity: 0,
            },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#1A1A1A',
        tabBarInactiveTintColor: '#bbb',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrap}>
              <HomeIcon color={color} />
              {focused && <ActiveDot />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrap}>
              <ProductsIcon color={color} />
              {focused && <ActiveDot />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrap}>
              <OrdersIcon color={color} />
              {focused && <ActiveDot />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrap}>
              <ProfileIcon color={color} />
              {focused && <ActiveDot />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', gap: 4 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#1A1A1A' },
});