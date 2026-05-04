import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

// ── Icons ──
function AnalyticsIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProductsIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={3} y1={6} x2={21} y2={6} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M16 10a4 4 0 01-8 0"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function OrdersIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
      <Rect x={14} y={3} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
      <Rect x={3} y={14} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
      <Rect x={14} y={14} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={7} r={4} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

// ── Nav items config ──
const NAV_ITEMS = [
  { label: 'Analytics',  href: '/(drawer)/(tabs)',          Icon: AnalyticsIcon,  match: /^\/(drawer\/)?\(tabs\)\/?$/ },
  { label: 'Products',   href: '/(drawer)/(tabs)/products', Icon: ProductsIcon,   match: /products/ },
  { label: 'Orders',     href: '/(drawer)/(tabs)/orders',   Icon: OrdersIcon,     match: /orders/ },
  { label: 'Profile',    href: '/(drawer)/(tabs)/profile',  Icon: ProfileIcon,    match: /profile/ },
];

function DrawerContent() {
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {/* Brand */}
      <View style={styles.brand}>
        <Text style={styles.brandText}>47TH ST</Text>
        <Text style={styles.brandSub}>Seller Dashboard</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Nav Items */}
      <View style={styles.nav}>
        {NAV_ITEMS.map(({ label, href, Icon, match }) => {
          const active = match.test(pathname);
          return (
            <TouchableOpacity
              key={label}
              style={[styles.item, active && styles.itemActive]}
              onPress={() => router.push(href as any)}
              activeOpacity={0.7}
            >
              <Icon color={active ? '#1A1A1A' : '#aaa'} />
              <Text style={[styles.itemText, active && styles.itemTextActive]}>
                {label}
              </Text>
              {active && <View style={styles.activePill} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.divider} />
        <Text style={styles.footerText}>v1.0.0</Text>
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={() => <DrawerContent />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            backgroundColor: '#F5F5F5',
            width: 240,
          },
          // On web, show drawer permanently on the side
          drawerType: Platform.OS === 'web' ? 'permanent' : 'front',
        }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{ drawerLabel: 'Analytics' }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#F5F5F5',
  },
  brand: { paddingHorizontal: 8, marginBottom: 24 },
  brandText: { fontSize: 18, fontWeight: '700', letterSpacing: 2, color: '#1A1A1A' },
  brandSub: { fontSize: 11, color: '#aaa', marginTop: 4, letterSpacing: 0.5 },
  divider: { height: 0.5, backgroundColor: '#E0E0E0', marginBottom: 16 },
  nav: { gap: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    position: 'relative',
  },
  itemActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemText: { fontSize: 13, fontWeight: '600', color: '#aaa' },
  itemTextActive: { color: '#1A1A1A' },
  activePill: {
    position: 'absolute',
    right: 12,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1A1A1A',
  },
  footer: { marginTop: 'auto' },
  footerText: { fontSize: 10, color: '#ccc', paddingHorizontal: 8, marginTop: 12 },
});