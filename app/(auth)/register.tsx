import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Modal
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

type ModalConfig = {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  onConfirm?: () => void;
};

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signUp, loading } = useAuthStore();

  const [modal, setModal] = useState<ModalConfig>({
    visible: false, type: 'info',
    title: '', message: '',
  });

  const showModal = (
    type: 'success' | 'error' | 'info',
    title: string,
    message: string,
    onConfirm?: () => void
  ) => setModal({ visible: true, type, title, message, onConfirm });

  const hideModal = () => {
    const cb = modal.onConfirm;
    setModal(m => ({ ...m, visible: false, onConfirm: undefined }));
    cb?.();
  };

  const handleRegister = async () => {
    // ── Field validation ────────────────────────
    if (!fullName || !email || !password || !confirmPassword) {
      showModal('error', 'Incomplete Fields',
        'Please fill in all fields before continuing.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showModal('error', 'Invalid Email',
        'Please enter a valid email address (e.g. name@example.com).');
      return;
    }
    if (password.length < 8) {
      showModal('error', 'Password Too Short',
        'Your password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      showModal('error', 'Passwords Don\'t Match',
        'The passwords you entered do not match. Please try again.');
      return;
    }

    try {
      await signUp(email, password, fullName);
      showModal(
        'success',
        'Account Created!',
        'Your account has been successfully created. You can now sign in.',
        () => router.replace('/(auth)/login')
      );
    } catch (e: any) {
      const msg: string = e.message ?? '';

      // ── Map Supabase errors to friendly messages ──
      if (
        msg.includes('already registered') ||
        msg.includes('already been registered') ||
        msg.includes('User already registered') ||
        msg.includes('23505') // duplicate key
      ) {
        showModal(
          'error',
          'Email Already Exists',
          'This email is already registered. Please sign in or use a different email.',
          undefined
        );
      } else if (msg.includes('invalid') || msg.includes('email')) {
        showModal('error', 'Invalid Email',
          'Please enter a valid email address.');
      } else if (msg.includes('weak') || msg.includes('password')) {
        showModal('error', 'Weak Password',
          'Please choose a stronger password with at least 8 characters.');
      } else {
        showModal('error', 'Registration Failed', msg || 'Something went wrong. Please try again.');
      }
    }
  };

  const handleGoogleRegister = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) showModal('error', 'Google Sign Up Failed', error.message);
  };

  const modalIconBg = {
    success: '#1A1A1A',
    error: '#FF3B30',
    info: '#888',
  }[modal.type];

  const modalIcon = {
    success: '✓',
    error: '✕',
    info: '!',
  }[modal.type];

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand ──────────────────────────────── */}
          <Text style={styles.brand}>47TH ST</Text>
          <Text style={styles.subtitle}>
            Create your account to start{'\n'}managing your store.
          </Text>

          {/* ── Toggle ─────────────────────────────── */}
          <View style={styles.toggle}>
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.toggleText}>LOGIN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, styles.toggleActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, styles.toggleTextActive]}>
                REGISTER
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Form ───────────────────────────────── */}
          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Juan dela Cruz"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={setFullName}
              autoComplete="name"
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="min. 8 characters"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[
                styles.input,
                confirmPassword.length > 0 &&
                  password !== confirmPassword &&
                  styles.inputError,
              ]}
              placeholder="re-enter password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
            />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}
          </View>

          {/* ── Create Account Button ──────────────── */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
            }
          </TouchableOpacity>

          {/* ── Divider ────────────────────────────── */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Google Button ──────────────────────── */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleRegister}
            activeOpacity={0.8}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>CONTINUE WITH GOOGLE</Text>
          </TouchableOpacity>

          {/* ── Seller Link ────────────────────────── */}
          <View style={styles.sellerSection}>
            <View style={styles.sellerDivider} />
            <Text style={styles.sellerQuestion}>
              Want to sell on 47TH ST?{' '}
              <Text
                style={styles.sellerLink}
                onPress={() => router.push('/(auth)/register-seller')}
              >
                Register here
              </Text>
            </Text>
          </View>

          <Text style={styles.footer}>
            By signing up, you agree to our Terms and{'\n'}Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Modal ──────────────────────────────────── */}
      <Modal
        visible={modal.visible}
        transparent
        animationType="fade"
        onRequestClose={hideModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconWrap, { backgroundColor: modalIconBg }]}>
              <Text style={styles.modalIconText}>{modalIcon}</Text>
            </View>
            <Text style={styles.modalTitle}>{modal.title}</Text>
            <Text style={styles.modalMessage}>{modal.message}</Text>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: modalIconBg }]}
              onPress={hideModal}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnText}>
                {modal.type === 'success' ? 'GO TO LOGIN' : 'TRY AGAIN'}
              </Text>
            </TouchableOpacity>
            {/* Extra option for already registered */}
            {modal.title === 'Email Already Exists' && (
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  setModal(m => ({ ...m, visible: false }));
                  router.replace('/(auth)/login');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalSecondaryText}>Go to Login instead</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scroll: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: 28, paddingVertical: 48,
  },
  brand: {
    fontSize: 28, fontWeight: '700', letterSpacing: 4,
    color: '#1A1A1A', textAlign: 'center', marginBottom: 8,
  },
  subtitle: {
    fontSize: 13, color: '#888', textAlign: 'center',
    lineHeight: 20, marginBottom: 28,
  },
  toggle: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 999, padding: 4, marginBottom: 28,
    borderWidth: 0.5, borderColor: '#E0E0E0',
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
  toggleActive: { backgroundColor: '#1A1A1A' },
  toggleText: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: '#999' },
  toggleTextActive: { color: '#fff' },
  form: { marginBottom: 20, gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  input: {
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#E0E0E0',
    borderRadius: 10, padding: 13, fontSize: 14, color: '#1A1A1A', marginBottom: 14,
  },
  inputError: { borderColor: '#FF3B30', borderWidth: 1 },
  errorText: { fontSize: 11, color: '#FF3B30', marginTop: -10, marginBottom: 10 },
  button: {
    backgroundColor: '#1A1A1A', paddingVertical: 15,
    borderRadius: 999, alignItems: 'center', marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 2 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: '#E0E0E0' },
  dividerText: { fontSize: 11, color: '#999' },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#E0E0E0',
    borderRadius: 999, paddingVertical: 13, marginBottom: 8,
  },
  googleIcon: { fontSize: 14, fontWeight: '700', color: '#4285F4' },
  googleText: { fontSize: 12, fontWeight: '600', color: '#1A1A1A', letterSpacing: 0.5 },
  sellerSection: { alignItems: 'center', gap: 12, marginBottom: 24, marginTop: 8 },
  sellerDivider: { width: '100%', height: 0.5, backgroundColor: '#E0E0E0' },
  sellerQuestion: { fontSize: 13, color: '#888', textAlign: 'center' },
  sellerLink: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', textDecorationLine: 'underline' },
  footer: { fontSize: 10, color: '#aaa', textAlign: 'center', lineHeight: 16 },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    width: '100%', alignItems: 'center', gap: 8,
  },
  modalIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  modalIconText: { fontSize: 22, color: '#fff', fontWeight: '700' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.3 },
  modalMessage: {
    fontSize: 13, color: '#888', textAlign: 'center',
    lineHeight: 20, marginBottom: 8,
  },
  modalBtn: {
    paddingVertical: 14, borderRadius: 999,
    alignItems: 'center', width: '100%', marginTop: 8,
  },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1.5 },
  modalSecondaryBtn: { paddingVertical: 8, marginTop: 4 },
  modalSecondaryText: { fontSize: 13, color: '#888', textDecorationLine: 'underline' },
});