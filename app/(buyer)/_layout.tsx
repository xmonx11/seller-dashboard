import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { useCartStore } from '../../store/cartStore';
import { Text } from 'react-native';

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        stroke={color} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M9 22V12h6v10"
        stroke={color} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function CartIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
        stroke={color} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Line x1={3} y1={6} x2={21} y2={6}
        stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path
        d="M16 10a4 4 0 01-8 0"
        stroke={color} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function OrdersIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke={color} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M14 2v6h6" stroke={color} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={8} y1={13} x2={16} y2={13}
        stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={8} y1={17} x2={16} y2={17}
        stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
        stroke={color} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Circle cx={12} cy={7} r={4}
        stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function ActiveDot() {
  return <View style={styles.dot} />;
}

export default function BuyerLayout() {
  // Get cart item count for badge on cart tab
  const totalItems = useCartStore((s) => s.totalItems());

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
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
        name="home"
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
        name="cart"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrap}>
              <CartIcon color={color} />
              {/* Cart badge — shows item count */}
              {totalItems > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {totalItems > 9 ? '9+' : totalItems}
                  </Text>
                </View>
              )}
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
      {/* Hide these from tab bar */}
<Tabs.Screen name="product/[id]" options={{ href: null }} />
<Tabs.Screen name="checkout" options={{ href: null }} />
<Tabs.Screen name="personal-information" options={{ href: null }} />

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
  iconWrap: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1A1A1A',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#1A1A1A',
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
});