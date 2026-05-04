import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal
} from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export default function BuyerProfile() {
  const { user, profile, signOut } = useAuthStore();
  const [signingOut, setSigningOut] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [wishlistCount, setWishlistCount] = useState<number | null>(null);

  // Initials from full name
  const initials = (profile?.full_name ?? user?.email ?? 'B')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Fetch orders and wishlist counts on mount
  useEffect(() => {
    if (!user) return;
    fetchCounts();
  }, [user]);

  const fetchCounts = async () => {
    // Orders count
    const { count: oCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('buyer_id', user.id);
    setOrdersCount(oCount ?? 0);

    // Wishlist count
    const { count: wCount } = await supabase
      .from('wishlists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    setWishlistCount(wCount ?? 0);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    setShowSignOutModal(false);
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Nav Bar ── */}
        <View style={styles.navbar}>
          <Svg width={18} height={14} viewBox="0 0 18 14">
            <Rect width={18} height={2} rx={1} fill="#1A1A1A" />
            <Rect y={6} width={18} height={2} rx={1} fill="#1A1A1A" />
            <Rect y={12} width={18} height={2} rx={1} fill="#1A1A1A" />
          </Svg>
          <Text style={styles.brand}>47TH ST</Text>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={3} stroke="#1A1A1A" strokeWidth={1.8} />
            <Path
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
              stroke="#1A1A1A" strokeWidth={1.8}
              strokeLinecap="round" strokeLinejoin="round"
            />
          </Svg>
        </View>

        {/* ── Avatar + Name ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.editBadge}>
              <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                  stroke="#fff" strokeWidth={2.5}
                  strokeLinecap="round" strokeLinejoin="round"
                />
                <Path
                  d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                  stroke="#fff" strokeWidth={2.5}
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </Svg>
            </View>
          </View>
          <Text style={styles.fullName}>{profile?.full_name ?? 'Member'}</Text>
          <Text style={styles.memberSince}>
            Premium Member since {new Date(user?.created_at ?? Date.now()).getFullYear()}
          </Text>
        </View>

        {/* ── Stats Row — Orders + Wishlist ── */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/(buyer)/orders')}
            activeOpacity={0.8}
          >
            <Text style={styles.statLabel}>ORDERS</Text>
            <Text style={styles.statValue}>
              {ordersCount === null ? '—' : ordersCount}
            </Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity style={styles.statCard} activeOpacity={0.8}>
            <Text style={styles.statLabel}>WISHLIST</Text>
            <Text style={styles.statValue}>
              {wishlistCount === null ? '—' : wishlistCount}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Account Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT SETTINGS</Text>
          <View style={styles.menuCard}>

            {/* ← NOW NAVIGATES to personal-information screen */}
            <MenuRow
              label="Personal Information"
              icon={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                    stroke="#888" strokeWidth={1.8}
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                  <Circle cx={12} cy={7} r={4} stroke="#888" strokeWidth={1.8} />
                </Svg>
              }
              tappable
              onPress={() => router.push('/(buyer)/personal-information')}
            />
            <Divider />

            <MenuRow
              label="Order History"
              icon={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                    stroke="#888" strokeWidth={1.8}
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                  <Line x1={3} y1={6} x2={21} y2={6}
                    stroke="#888" strokeWidth={1.8} strokeLinecap="round" />
                  <Path d="M16 10a4 4 0 01-8 0"
                    stroke="#888" strokeWidth={1.8}
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                </Svg>
              }
              tappable
              onPress={() => router.push('/(buyer)/orders')}
            />
            <Divider />

            <MenuRow
              label="Payment Methods"
              icon={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Rect x={1} y={4} width={22} height={16} rx={2}
                    stroke="#888" strokeWidth={1.8} />
                  <Line x1={1} y1={10} x2={23} y2={10}
                    stroke="#888" strokeWidth={1.8} />
                </Svg>
              }
              tappable
            />
            <Divider />

            <MenuRow
              label="Notifications"
              icon={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                    stroke="#888" strokeWidth={1.8}
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                </Svg>
              }
              tappable
            />
            <Divider />

            <MenuRow
              label="Security & Privacy"
              icon={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                    stroke="#888" strokeWidth={1.8}
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                </Svg>
              }
              tappable
            />
          </View>
        </View>

        {/* ── Logout Button ── */}
        <TouchableOpacity
          style={[styles.logoutBtn, signingOut && styles.logoutBtnDisabled]}
          onPress={() => setShowSignOutModal(true)}
          disabled={signingOut}
          activeOpacity={0.85}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
              stroke="#fff" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round"
            />
            <Polyline points="16,17 21,12 16,7"
              stroke="#fff" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round"
            />
            <Line x1={21} y1={12} x2={9} y2={12}
              stroke="#fff" strokeWidth={2} strokeLinecap="round"
            />
          </Svg>
          <Text style={styles.logoutText}>
            {signingOut ? 'SIGNING OUT...' : 'LOGOUT'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>v2.4.0 · Premium Member Portal</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Sign Out Modal ── */}
      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
                  stroke="#1A1A1A" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round"
                />
                <Path d="M16 17l5-5-5-5" stroke="#1A1A1A" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round"
                />
                <Path d="M21 12H9" stroke="#1A1A1A" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to{'\n'}sign out of your account?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowSignOutModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={handleSignOut}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MenuRow({ label, icon, tappable = false, onPress }: {
  label: string;
  icon?: React.ReactNode;
  tappable?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuRow}
      onPress={onPress}
      activeOpacity={tappable || onPress ? 0.6 : 1}
      disabled={!tappable && !onPress}
    >
      <View style={styles.menuIcon}>{icon}</View>
      <Text style={styles.menuLabel}>{label}</Text>
      {tappable && (
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path d="M9 18l6-6-6-6" stroke="#ccc" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  navbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8,
  },
  brand: { fontSize: 13, fontWeight: '700', letterSpacing: 2, color: '#1A1A1A' },
  avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#1A1A1A', borderWidth: 2, borderColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  fullName: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.3 },
  memberSince: { fontSize: 12, color: '#888' },
  statsRow: {
    flexDirection: 'row', marginHorizontal: 20,
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 0.5, borderColor: '#E0E0E0',
    marginBottom: 24, overflow: 'hidden',
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4 },
  statDivider: { width: 0.5, backgroundColor: '#E0E0E0' },
  statLabel: { fontSize: 9, fontWeight: '700', color: '#aaa', letterSpacing: 1.5 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#aaa',
    letterSpacing: 1.5, marginBottom: 10,
  },
  menuCard: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 0.5, borderColor: '#E0E0E0', overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 14,
  },
  menuIcon: { width: 20, alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  divider: { height: 0.5, backgroundColor: '#F0F0F0', marginHorizontal: 16 },
  logoutBtn: {
    marginHorizontal: 20, paddingVertical: 15, borderRadius: 999,
    backgroundColor: '#1A1A1A', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12,
  },
  logoutBtnDisabled: { opacity: 0.5 },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1.5 },
  version: { textAlign: 'center', fontSize: 11, color: '#ccc', letterSpacing: 0.5 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 24,
    padding: 28, width: '100%', alignItems: 'center', gap: 8,
  },
  modalIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.3 },
  modalMessage: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  modalCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 999,
    borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#888' },
  modalConfirm: {
    flex: 1, paddingVertical: 14, borderRadius: 999,
    backgroundColor: '#1A1A1A', alignItems: 'center',
  },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});