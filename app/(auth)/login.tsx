import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

export default function Login() {
  // useState holds the value of each input field.
  // Every time user types, React re-renders with new value.
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading } = useAuthStore();

  const handleLogin = async () => {
    // Client-side validation before hitting the network
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    try {
      await signIn(email, password);
      // replace() so user can't press back to return to login
      router.replace('/(drawer)/(tabs)');
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
    }
  };

  const handleGoogleLogin = async () => {
    // signInWithOAuth triggers Supabase Google OAuth flow
    // It opens a browser window for Google sign-in
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) Alert.alert('Google Login Failed', error.message);
  };

  return (
    // KeyboardAvoidingView prevents keyboard from covering inputs
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        // keyboardShouldPersistTaps lets user tap button
        // without first dismissing keyboard
      >
        {/* ── Brand Header ── */}
        <Text style={styles.brand}>47TH ST</Text>
        <Text style={styles.subtitle}>
          Enter your credentials to access{'\n'}your seller dashboard.
        </Text>

        {/* ── Segmented Toggle ── */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, tab === 'login' && styles.toggleActive]}
            onPress={() => setTab('login')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, tab === 'login' && styles.toggleTextActive]}>
              LOGIN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, tab === 'register' && styles.toggleActive]}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, tab === 'register' && styles.toggleTextActive]}>
              REGISTER
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Form Fields ── */}
        <View style={styles.form}>
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

          <View style={styles.passwordRow}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity>
              <Text style={styles.forgot}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        {/* ── Sign In Button ── */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>SIGN IN</Text>
          }
        </TouchableOpacity>

        {/* ── Divider ── */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── Google Button ── */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleLogin}
          activeOpacity={0.8}
        >
          {/* Inline SVG-style Google G using Text — no library needed */}
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleText}>CONTINUE WITH GOOGLE</Text>
        </TouchableOpacity>

        {/* ── Footer ── */}
        <Text style={styles.footer}>
          By signing in, you agree to our Terms and{'\n'}Privacy Policy
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 48,
  },

  // Brand
  brand: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },

  // Toggle
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 999,
    padding: 4,
    marginBottom: 28,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#1A1A1A',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#999',
  },
  toggleTextActive: {
    color: '#fff',
  },

  // Form
  form: {
    marginBottom: 20,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 13,
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 14,
  },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgot: {
    fontSize: 11,
    color: '#888',
  },

  // Buttons
  button: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 2,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    fontSize: 11,
    color: '#999',
  },

  // Google
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    borderRadius: 999,
    paddingVertical: 13,
    marginBottom: 24,
  },
  googleIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },

  // Footer
  footer: {
    fontSize: 10,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 16,
  },
});