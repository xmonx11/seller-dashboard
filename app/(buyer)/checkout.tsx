import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Modal
} from 'react-native';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

type Step = 'shipping' | 'payment' | 'review';
type PaymentMethod = 'card' | 'gcash' | 'cod';

export default function Checkout() {
  const { user, profile } = useAuthStore();
  const { items, totalAmount, clearCart } = useCartStore();

  const [step, setStep] = useState<Step>('shipping');
  const [placing, setPlacing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  const hasSavedAddress = !!(
    profile?.address_street &&
    profile?.address_city &&
    profile?.address_postal
  );

  const [fullName, setFullName]     = useState(profile?.full_name ?? '');
  const [street, setStreet]         = useState(profile?.address_street ?? '');
  const [city, setCity]             = useState(profile?.address_city ?? '');
  const [postalCode, setPostalCode] = useState(profile?.address_postal ?? '');
  const [usingSaved, setUsingSaved] = useState(hasSavedAddress);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  const subtotal = totalAmount();
  const shipping = subtotal >= 2000 ? 0 : 150;
  const tax      = subtotal * 0.12;
  const total    = subtotal + shipping + tax;

  const applySavedAddress = () => {
    setFullName(profile?.full_name ?? '');
    setStreet(profile?.address_street ?? '');
    setCity(profile?.address_city ?? '');
    setPostalCode(profile?.address_postal ?? '');
    setUsingSaved(true);
  };

  const clearAddress = () => {
    setFullName('');
    setStreet('');
    setCity('');
    setPostalCode('');
    setUsingSaved(false);
  };

  const handleShippingNext = () => {
    if (!fullName.trim() || !street.trim() || !city.trim() || !postalCode.trim()) return;
    setStep('payment');
  };

  const handlePaymentNext = () => setStep('review');

  const handlePlaceOrder = async () => {
    if (!items.length) return;
    setPlacing(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.replace('/(auth)/login'); return; }

      // 1. Create the order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          buyer_id: authUser.id,
          total_amount: total,
          status: 'pending',
        })
        .select()
        .single();
      if (orderErr) throw orderErr;

      // 2. Insert order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(orderItems);
      if (itemsErr) throw itemsErr;

      // 3. Decrement stock via RPC (SECURITY DEFINER bypasses RLS)
      for (const item of items) {
        const { error: stockErr } = await supabase.rpc('decrement_stock', {
          product_id: item.id,
          amount: item.quantity,
        });
        if (stockErr) throw stockErr;
      }

      clearCart();
      setOrderId(order.id.slice(-5).toUpperCase());
      setShowSuccess(true);
    } catch (e: any) {
      console.error('Order placement failed:', e);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* ── Success Modal ── */}
      <Modal visible={showSuccess} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successCircle}>
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <Polyline points="20,6 9,17 4,12" stroke="#fff" strokeWidth={2.5}
                  strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={styles.modalTitle}>Order placed!</Text>
            <Text style={styles.modalSubtext}>
              Your order <Text style={styles.modalOrderNum}>#EST-{orderId}</Text>
            </Text>
            <Text style={styles.modalSubtext}>has been placed successfully.</Text>
            <View style={styles.modalDivider} />
            <TouchableOpacity
              style={styles.modalBtnPrimary}
              onPress={() => { setShowSuccess(false); router.replace('/(buyer)/orders'); }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnPrimaryText}>VIEW ORDERS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalBtnSecondary}
              onPress={() => { setShowSuccess(false); router.replace('/(buyer)/home'); }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnSecondaryText}>CONTINUE SHOPPING</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Nav Bar ── */}
      <View style={styles.navbar}>
        <TouchableOpacity
          onPress={() => {
            if (step === 'payment') setStep('shipping');
            else if (step === 'review') setStep('payment');
            else router.back();
          }}
          activeOpacity={0.7}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5M5 12l7 7M5 12l7-7"
              stroke="#1A1A1A" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.brand}>47TH ST</Text>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
            stroke="#1A1A1A" strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" />
          <Line x1={3} y1={6} x2={21} y2={6}
            stroke="#1A1A1A" strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M16 10a4 4 0 01-8 0"
            stroke="#1A1A1A" strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>

      {/* ── Progress Bar ── */}
      <View style={styles.progressBar}>
        {(['shipping', 'payment', 'review'] as Step[]).map((s, i) => {
          const isActive = s === step;
          const isDone = (
            (s === 'shipping' && (step === 'payment' || step === 'review')) ||
            (s === 'payment' && step === 'review')
          );
          return (
            <View key={s} style={styles.progressItem}>
              {i > 0 && (
                <View style={[styles.progressLine, isDone && styles.progressLineDone]} />
              )}
              <View style={[
                styles.progressDot,
                isActive && styles.progressDotActive,
                isDone && styles.progressDotDone,
              ]}>
                {isDone ? (
                  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                    <Polyline points="20,6 9,17 4,12" stroke="#fff" strokeWidth={3}
                      strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                ) : (
                  <View style={[
                    styles.progressDotInner,
                    isActive && styles.progressDotInnerActive,
                  ]} />
                )}
              </View>
              <Text style={[styles.progressLabel, isActive && styles.progressLabelActive]}>
                {s.toUpperCase()}
              </Text>
            </View>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.pageTitle}>Checkout</Text>

        {/* ── STEP 1: SHIPPING ── */}
        {step === 'shipping' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>

            {hasSavedAddress && (
              <View style={styles.savedAddressCard}>
                <View style={styles.savedAddressInfo}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"
                      stroke="#1A1A1A" strokeWidth={1.8}
                      strokeLinecap="round" strokeLinejoin="round"
                    />
                    <Circle cx={12} cy={10} r={3}
                      stroke="#1A1A1A" strokeWidth={1.8} />
                  </Svg>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.savedAddressLabel}>Saved Address</Text>
                    <Text style={styles.savedAddressText} numberOfLines={1}>
                      {profile?.address_street}, {profile?.address_city} {profile?.address_postal}
                    </Text>
                  </View>
                </View>
                {usingSaved ? (
                  <TouchableOpacity onPress={clearAddress} activeOpacity={0.7}>
                    <Text style={styles.savedAddressToggle}>Change</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={applySavedAddress} activeOpacity={0.7}>
                    <Text style={styles.savedAddressToggle}>Use this</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.formCard}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Juan dela Cruz"
                  placeholderTextColor="#bbb"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Street Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123 Rizal Street"
                  placeholderTextColor="#bbb"
                  value={street}
                  onChangeText={setStreet}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Davao City"
                  placeholderTextColor="#bbb"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Postal Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="8000"
                  placeholderTextColor="#bbb"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        )}

        {/* ── STEP 2: PAYMENT ── */}
        {step === 'payment' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.formCard}>
              <PaymentOption
                label="Credit or Debit Card" sublabel="Ending in 4242"
                selected={paymentMethod === 'card'}
                onSelect={() => setPaymentMethod('card')}
                icon={
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Rect x={1} y={4} width={22} height={16} rx={2}
                      stroke="#1A1A1A" strokeWidth={1.8} />
                    <Line x1={1} y1={10} x2={23} y2={10}
                      stroke="#1A1A1A" strokeWidth={1.8} />
                  </Svg>
                }
              />
              <View style={styles.optionDivider} />
              <PaymentOption
                label="GCash"
                selected={paymentMethod === 'gcash'}
                onSelect={() => setPaymentMethod('gcash')}
                icon={
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Circle cx={12} cy={12} r={10}
                      stroke="#1A1A1A" strokeWidth={1.8} />
                    <Path d="M12 8v8M8 12h8"
                      stroke="#1A1A1A" strokeWidth={1.8} strokeLinecap="round" />
                  </Svg>
                }
              />
              <View style={styles.optionDivider} />
              <PaymentOption
                label="Cash on Delivery"
                selected={paymentMethod === 'cod'}
                onSelect={() => setPaymentMethod('cod')}
                icon={
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Rect x={2} y={6} width={20} height={12} rx={2}
                      stroke="#1A1A1A" strokeWidth={1.8} />
                    <Circle cx={12} cy={12} r={3}
                      stroke="#1A1A1A" strokeWidth={1.8} />
                  </Svg>
                }
              />
            </View>
          </View>
        )}

        {/* ── STEP 3: REVIEW ── */}
        {step === 'review' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping To</Text>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewValue}>{fullName}</Text>
              <Text style={styles.reviewMeta}>{street}, {city} {postalCode}</Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Payment</Text>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewValue}>
                {paymentMethod === 'card' ? 'Credit / Debit Card'
                  : paymentMethod === 'gcash' ? 'GCash'
                  : 'Cash on Delivery'}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
              Items ({items.length})
            </Text>
            <View style={styles.reviewCard}>
              {items.map((item) => (
                <View key={item.id} style={styles.reviewItem}>
                  <Text style={styles.reviewItemName} numberOfLines={1}>
                    {item.name} × {item.quantity}
                  </Text>
                  <Text style={styles.reviewItemPrice}>
                    ₱{(item.price * item.quantity).toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Order Summary ── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>
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
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* ── CTA Buttons ── */}
        {step === 'shipping' && (
          <TouchableOpacity style={styles.ctaBtn} onPress={handleShippingNext} activeOpacity={0.85}>
            <Text style={styles.ctaText}>CONTINUE TO PAYMENT</Text>
          </TouchableOpacity>
        )}
        {step === 'payment' && (
          <TouchableOpacity style={styles.ctaBtn} onPress={handlePaymentNext} activeOpacity={0.85}>
            <Text style={styles.ctaText}>REVIEW ORDER</Text>
          </TouchableOpacity>
        )}
        {step === 'review' && (
          <TouchableOpacity
            style={[styles.ctaBtn, placing && styles.ctaBtnDisabled]}
            onPress={handlePlaceOrder}
            disabled={placing}
            activeOpacity={0.85}
          >
            {placing
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaText}>PLACE ORDER</Text>
            }
          </TouchableOpacity>
        )}

        <Text style={styles.termsText}>
          By placing an order, you agree to our Terms of Service.
        </Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function PaymentOption({ label, sublabel, selected, onSelect, icon }: {
  label: string; sublabel?: string;
  selected: boolean; onSelect: () => void;
  icon: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.paymentOption} onPress={onSelect} activeOpacity={0.8}>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentLabel}>{label}</Text>
        {sublabel && <Text style={styles.paymentSublabel}>{sublabel}</Text>}
      </View>
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 24,
    padding: 28, width: '100%', alignItems: 'center',
  },
  successCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#1A1A1A', justifyContent: 'center',
    alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  modalSubtext: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },
  modalOrderNum: { fontWeight: '700', color: '#1A1A1A' },
  modalDivider: { height: 0.5, backgroundColor: '#E0E0E0', width: '100%', marginVertical: 20 },
  modalBtnPrimary: {
    backgroundColor: '#1A1A1A', paddingVertical: 14, borderRadius: 999,
    alignItems: 'center', width: '100%', marginBottom: 10,
  },
  modalBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  modalBtnSecondary: {
    backgroundColor: 'transparent', paddingVertical: 14, borderRadius: 999,
    alignItems: 'center', width: '100%', borderWidth: 0.5, borderColor: '#E0E0E0',
  },
  modalBtnSecondaryText: { color: '#888', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  navbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8,
  },
  brand: { fontSize: 13, fontWeight: '700', letterSpacing: 2, color: '#1A1A1A' },
  progressBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  progressItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  progressLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0', marginHorizontal: 4 },
  progressLineDone: { backgroundColor: '#1A1A1A' },
  progressDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E0E0E0',
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  progressDotActive: { borderColor: '#1A1A1A' },
  progressDotDone: { borderColor: '#1A1A1A', backgroundColor: '#1A1A1A' },
  progressDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E0E0E0' },
  progressDotInnerActive: { backgroundColor: '#1A1A1A' },
  progressLabel: { fontSize: 8, fontWeight: '700', color: '#bbb', letterSpacing: 0.8, marginLeft: 4 },
  progressLabelActive: { color: '#1A1A1A' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.5, marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  savedAddressCard: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 0.5, borderColor: '#E0E0E0',
    padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  savedAddressInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  savedAddressLabel: { fontSize: 10, fontWeight: '700', color: '#aaa', letterSpacing: 1 },
  savedAddressText: { fontSize: 12, color: '#1A1A1A', marginTop: 2 },
  savedAddressToggle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  formCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 0.5, borderColor: '#E0E0E0', gap: 14,
  },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#888' },
  input: {
    backgroundColor: '#F8F8F8', borderWidth: 0.5, borderColor: '#E0E0E0',
    borderRadius: 10, padding: 12, fontSize: 14, color: '#1A1A1A',
  },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E0E0E0',
    justifyContent: 'center', alignItems: 'center',
  },
  radioOuterSelected: { borderColor: '#1A1A1A' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1A1A1A' },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  paymentSublabel: { fontSize: 11, color: '#aaa', marginTop: 1 },
  optionDivider: { height: 0.5, backgroundColor: '#F0F0F0' },
  reviewCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 0.5, borderColor: '#E0E0E0', gap: 4,
  },
  reviewValue: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  reviewMeta: { fontSize: 12, color: '#888' },
  reviewItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0',
  },
  reviewItemName: { fontSize: 13, color: '#1A1A1A', flex: 1 },
  reviewItemPrice: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 0.5, borderColor: '#E0E0E0', gap: 10, marginBottom: 16,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: '#888' },
  summaryValue: { fontSize: 13, color: '#1A1A1A' },
  summaryDivider: { height: 0.5, backgroundColor: '#E0E0E0' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  ctaBtn: {
    backgroundColor: '#1A1A1A', paddingVertical: 16,
    borderRadius: 999, alignItems: 'center', marginBottom: 12,
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  termsText: { textAlign: 'center', fontSize: 11, color: '#aaa', lineHeight: 16 },
});