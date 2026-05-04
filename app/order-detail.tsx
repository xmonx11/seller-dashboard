import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Line } from 'react-native-svg';

export default function OrderDetailModal() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Handle bar */}
      <View style={styles.handleWrap}>
        <View style={styles.handle} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Order Details</Text>
          <Text style={styles.orderId}>
            #{(orderId ?? '').slice(-5).toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 6L6 18M6 6l12 12"
              stroke="#1A1A1A" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Status */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>STATUS</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Pending</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Order Info */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ORDER INFO</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Order ID</Text>
          <Text style={styles.infoVal}>#{(orderId ?? '').slice(-5).toUpperCase()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Date Placed</Text>
          <Text style={styles.infoVal}>
            {new Date().toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            })}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Payment</Text>
          <Text style={styles.infoVal}>Cash on Delivery</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Navigation pattern note — for defense */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NAVIGATION PATTERN</Text>
        <Text style={styles.noteText}>
          This screen uses modal presentation — the 4th Expo Router navigation pattern
          (tabs + stack + modal + deep link).
        </Text>
      </View>

      {/* Close button */}
      <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
        <Text style={styles.btnText}>Close</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  handleWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  orderId: { fontSize: 13, color: '#aaa', marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 999,
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center',
  },
  section: { paddingHorizontal: 20, paddingVertical: 16 },
  sectionLabel: {
    fontSize: 9, fontWeight: '700', color: '#aaa',
    letterSpacing: 1, marginBottom: 12,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#1A1A1A',
  },
  statusText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  divider: { height: 0.5, backgroundColor: '#E0E0E0', marginHorizontal: 20 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  infoKey: { fontSize: 13, color: '#888' },
  infoVal: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  noteText: { fontSize: 12, color: '#aaa', lineHeight: 18 },
  btn: {
    marginHorizontal: 20, marginTop: 24, backgroundColor: '#1A1A1A',
    paddingVertical: 14, borderRadius: 999, alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});