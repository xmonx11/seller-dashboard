import { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Image
} from 'react-native';
import Svg, { Path, Line, Rect, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { useCartStore } from '../../store/cartStore';

export default function Cart() {
  const { items, removeItem, updateQuantity, totalAmount, clearCart } = useCartStore();
  const [promoCode, setPromoCode] = useState('');

  const subtotal = totalAmount();
  const shipping = subtotal >= 2000 ? 0 : 150;
  const tax      = subtotal * 0.12;
  const total    = subtotal + shipping + tax;

  return (
    <View style={styles.container}>

      {/* ── Nav Bar ── */}
      <View style={styles.navbar}>
        <Svg width={18} height={14} viewBox="0 0 18 14">
          <Rect width={18} height={2} rx={1} fill="#1A1A1A" />
          <Rect y={6} width={18} height={2} rx={1} fill="#1A1A1A" />
          <Rect y={12} width={18} height={2} rx={1} fill="#1A1A1A" />
        </Svg>
        <Text style={styles.brand}>47TH ST</Text>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Circle cx={11} cy={11} r={7} stroke="#1A1A1A" strokeWidth={2} />
          <Line x1={16.5} y1={16.5} x2={22} y2={22}
            stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}

        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Your Shopping Bag</Text>
            <Text style={styles.pageSubtitle}>
              Review your selections for the ultimate curated wardrobe.
            </Text>
          </View>
        }

        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
              <Path
                d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                stroke="#ddd" strokeWidth={1.5}
                strokeLinecap="round" strokeLinejoin="round"
              />
              <Line x1={3} y1={6} x2={21} y2={6}
                stroke="#ddd" strokeWidth={1.5} strokeLinecap="round" />
              <Path d="M16 10a4 4 0 01-8 0"
                stroke="#ddd" strokeWidth={1.5}
                strokeLinecap="round" strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.emptyTitle}>Your bag is empty</Text>
            <Text style={styles.emptySubtext}>
              Add items from the collection to get started.
            </Text>
            <TouchableOpacity
              style={styles.shopBtn}
              onPress={() => router.push('/(buyer)/home')}
              activeOpacity={0.8}
            >
              <Text style={styles.shopBtnText}>BROWSE COLLECTION</Text>
            </TouchableOpacity>
          </View>
        }

        renderItem={({ item }) => {
          const atMax = item.quantity >= item.stock; // ✅ Check if at stock limit

          return (
            <View style={styles.card}>
              <View style={styles.cardImg}>
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.cardImgInner}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.cardImgInner, { backgroundColor: '#E8E8E8' }]} />
                )}
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.cardMeta}>
                      ₱{item.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </Text>
                    {/* ✅ Show stock warning when at max */}
                    {atMax && (
                      <Text style={styles.stockWarning}>
                        Max stock reached ({item.stock})
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Line x1={18} y1={6} x2={6} y2={18}
                        stroke="#aaa" strokeWidth={2} strokeLinecap="round" />
                      <Line x1={6} y1={6} x2={18} y2={18}
                        stroke="#aaa" strokeWidth={2} strokeLinecap="round" />
                    </Svg>
                  </TouchableOpacity>
                </View>

                <View style={styles.cardBottom}>
                  <View style={styles.qtyRow}>
                    {/* Minus */}
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      activeOpacity={0.8}
                    >
                      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                        <Line x1={5} y1={12} x2={19} y2={12}
                          stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" />
                      </Svg>
                    </TouchableOpacity>

                    <Text style={styles.qtyValue}>{item.quantity}</Text>

                    {/* ✅ Plus — disabled when at stock limit */}
                    <TouchableOpacity
                      style={[styles.qtyBtn, atMax && styles.qtyBtnDisabled]}
                      onPress={() => {
                        if (!atMax) updateQuantity(item.id, item.quantity + 1);
                      }}
                      activeOpacity={atMax ? 1 : 0.8}
                    >
                      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                        <Line x1={12} y1={5} x2={12} y2={19}
                          stroke={atMax ? '#ccc' : '#1A1A1A'} strokeWidth={2} strokeLinecap="round" />
                        <Line x1={5} y1={12} x2={19} y2={12}
                          stroke={atMax ? '#ccc' : '#1A1A1A'} strokeWidth={2} strokeLinecap="round" />
                      </Svg>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.itemTotal}>
                    ₱{(item.price * item.quantity).toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}

        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.footer}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>
                    ₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Shipping</Text>
                  <Text style={styles.summaryValue}>
                    {shipping === 0 ? 'Free' : `₱${shipping.toFixed(2)}`}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Estimated Tax (12%)</Text>
                  <Text style={styles.summaryValue}>
                    ₱{tax.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.checkoutBtn}
                onPress={() => router.push('/(buyer)/checkout')}
                activeOpacity={0.85}
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                    stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={styles.checkoutText}>PROCEED TO CHECKOUT</Text>
              </TouchableOpacity>

              <Text style={styles.secureText}>Secure Payment Guaranteed</Text>

              <View style={styles.promoRow}>
                <Text style={styles.promoLabel}>Have a promotional code?</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.promoLink}>Enter Code</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  navbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8,
  },
  brand: { fontSize: 13, fontWeight: '700', letterSpacing: 2, color: '#1A1A1A' },
  header: { paddingBottom: 20, gap: 4 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: '#888' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginTop: 8 },
  emptySubtext: { fontSize: 13, color: '#aaa', textAlign: 'center', lineHeight: 20 },
  shopBtn: { marginTop: 8, backgroundColor: '#1A1A1A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
  shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16,
    padding: 12, marginBottom: 10, borderWidth: 0.5, borderColor: '#E0E0E0', gap: 12,
  },
  cardImg: { width: 80, height: 80, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F0F0F0' },
  cardImgInner: { width: '100%', height: '100%' },
  cardContent: { flex: 1, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1, gap: 3 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  cardMeta: { fontSize: 12, color: '#888' },
  // ✅ Stock warning style
  stockWarning: { fontSize: 10, color: '#FF9500', fontWeight: '600', marginTop: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F5F5F5', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 0.5, borderColor: '#E0E0E0',
  },
  qtyBtn: { width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  // ✅ Disabled plus button style
  qtyBtnDisabled: { opacity: 0.3 },
  qtyValue: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', minWidth: 16, textAlign: 'center' },
  itemTotal: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  footer: { marginTop: 8, gap: 12 },
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18,
    borderWidth: 0.5, borderColor: '#E0E0E0', gap: 12,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: '#888' },
  summaryValue: { fontSize: 13, color: '#1A1A1A', fontWeight: '500' },
  summaryDivider: { height: 0.5, backgroundColor: '#E0E0E0', marginVertical: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  totalValue: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  checkoutBtn: {
    backgroundColor: '#1A1A1A', paddingVertical: 16, borderRadius: 999,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  checkoutText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  secureText: { textAlign: 'center', fontSize: 11, color: '#aaa' },
  promoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  promoLabel: { fontSize: 13, color: '#888' },
  promoLink: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
});