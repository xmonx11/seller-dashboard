import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { router, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useAuthStore } from '../../../store/authStore';

export default function Profile() {
  const { user, profile, signOut } = useAuthStore();
  const navigation = useNavigation();
  const [signingOut, setSigningOut] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    setShowSignOutModal(false);
    await signOut();
    router.replace('/(auth)/login');
  };

  const initials = (profile?.full_name ?? user?.email ?? 'S')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Nav Bar ── */}
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
            <Svg width={18} height={14} viewBox="0 0 18 14">
              <Rect width={18} height={2} rx={1} fill="#1A1A1A" />
              <Rect y={6} width={18} height={2} rx={1} fill="#1A1A1A" />
              <Rect y={12} width={18} height={2} rx={1} fill="#1A1A1A" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.brand}>47TH ST</Text>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={3}
              stroke="#1A1A1A" strokeWidth={1.8} />
            <Path
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
              stroke="#1A1A1A" strokeWidth={1.8}
              strokeLinecap="round" strokeLinejoin="round"
            />
          </Svg>
        </View>

        {/* ── Avatar + Name ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.fullName}>
            {profile?.full_name ?? 'Seller'}
          </Text>
          <Text style={styles.emailText}>{user?.email ?? ''}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {(profile?.role ?? 'seller').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── Account Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.menuCard}>
            <MenuRow label="Full Name" value={profile?.full_name ?? '—'} />
            <Divider />
            <MenuRow label="Email" value={user?.email ?? '—'} />
            <Divider />
            <MenuRow
              label="Role"
              value={(profile?.role ?? 'seller').charAt(0).toUpperCase()
                + (profile?.role ?? 'seller').slice(1)}
            />
          </View>
        </View>

        {/* ── Store Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STORE</Text>
          <View style={styles.menuCard}>
            <MenuRow label="Shop Name" value={profile?.shop_name ?? '47TH ST'} />
            <Divider />
            <MenuRow label="Category" value={profile?.product_category ?? '—'} />
            <Divider />
            <MenuRow label="Phone" value={profile?.phone_number ?? '—'} />
            <Divider />
            <MenuRow label="Plan" value="Seller" />
          </View>
        </View>

        {/* ── Support ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SUPPORT</Text>
          <View style={styles.menuCard}>
            <MenuRow label="Help Center" tappable />
            <Divider />
            <MenuRow label="Privacy Policy" tappable />
            <Divider />
            <MenuRow label="Terms of Service" tappable />
          </View>
        </View>

        {/* ── Sign Out Button ── */}
        <TouchableOpacity
          style={[styles.signOutBtn, signingOut && styles.signOutBtnDisabled]}
          onPress={() => setShowSignOutModal(true)}
          disabled={signingOut}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutText}>
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>47TH ST v1.0.0</Text>
        <View style={{ height: 80 }} />
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
                <Path
                  d="M16 17l5-5-5-5"
                  stroke="#1A1A1A" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round"
                />
                <Path
                  d="M21 12H9"
                  stroke="#1A1A1A" strokeWidth={2}
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

function MenuRow({
  label, value, tappable = false, onPress,
}: {
  label: string;
  value?: string;
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
      <Text style={styles.menuLabel}>{label}</Text>
      <View style={styles.menuRight}>
        {value && (
          <Text style={styles.menuValue} numberOfLines={1}>{value}</Text>
        )}
        {tappable && (
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 18l6-6-6-6"
              stroke="#ccc" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round"
            />
          </Svg>
        )}
      </View>
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  navbar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 56, paddingBottom: 8,
  },
  brand: { fontSize: 13, fontWeight: '700', letterSpacing: 2, color: '#1A1A1A' },
  avatarSection: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#1A1A1A', justifyContent: 'center',
    alignItems: 'center', marginBottom: 4,
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  fullName: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.3 },
  emailText: { fontSize: 13, color: '#888' },
  roleBadge: {
    backgroundColor: '#F0F0F0', paddingHorizontal: 12,
    paddingVertical: 4, borderRadius: 999, marginTop: 4,
  },
  roleText: { fontSize: 10, fontWeight: '700', color: '#888', letterSpacing: 1 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#aaa',
    letterSpacing: 1.5, marginBottom: 8,
  },
  menuCard: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 0.5, borderColor: '#E0E0E0', overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
  },
  menuLabel: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuValue: { fontSize: 13, color: '#888', maxWidth: 160 },
  divider: { height: 0.5, backgroundColor: '#F0F0F0', marginHorizontal: 16 },
  signOutBtn: {
    marginHorizontal: 20, paddingVertical: 15, borderRadius: 999,
    borderWidth: 1, borderColor: '#1A1A1A', alignItems: 'center', marginBottom: 12,
  },
  signOutBtnDisabled: { opacity: 0.5 },
  signOutText: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', letterSpacing: 0.5 },
  version: { textAlign: 'center', fontSize: 11, color: '#ccc', letterSpacing: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  modalIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18, fontWeight: '700',
    color: '#1A1A1A', letterSpacing: -0.3,
  },
  modalMessage: {
    fontSize: 13, color: '#888',
    textAlign: 'center', lineHeight: 20,
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row', gap: 12,
    width: '100%', marginTop: 8,
  },
  modalCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 999,
    borderWidth: 1, borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14, fontWeight: '600', color: '#888',
  },
  modalConfirm: {
    flex: 1, paddingVertical: 14, borderRadius: 999,
    backgroundColor: '#1A1A1A', alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14, fontWeight: '700', color: '#fff',
  },
});