import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

const CATEGORIES = [
  'Apparel', 'Footwear', 'Accessories', 'Bags',
  'Jewelry', 'Home & Decor', 'Beauty', 'Electronics',
];

export default function RegisterSeller() {
  const [fullName, setFullName]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone]                     = useState('');
  const [shopName, setShopName]               = useState('');
  const [shopDesc, setShopDesc]               = useState('');
  const [category, setCategory]               = useState('');
  const [loading, setLoading]                 = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword
      || !phone || !shopName || !category) {
      Alert.alert('Incomplete', 'Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create auth user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (signUpError) throw signUpError;
      if (!data.user) throw new Error('No user returned from sign up.');

      // Step 2: Insert into users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id:               data.user.id,
          email,
          full_name:        fullName,
          role:             'seller',
          phone_number:     phone,
          shop_name:        shopName,
          shop_description: shopDesc,
          product_category: category,
        });
      if (userError && userError.code !== '23505') throw userError;

      // Step 3: Insert into sellers table ← THE FIX
      const { error: sellerError } = await supabase
        .from('sellers')
        .insert({
          user_id:     data.user.id,
          shop_name:   shopName,
          description: shopDesc,
        });
      if (sellerError && sellerError.code !== '23505') throw sellerError;

      Alert.alert(
        'Seller Account Created!',
        `Welcome to 47TH ST, ${shopName}! Please check your email to confirm your account.`,
        [{ text: 'Go to Login', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.brand}>47TH ST</Text>
        <Text style={styles.subtitle}>
          Create your seller account and{'\n'}start selling today.
        </Text>

        <View style={styles.sellerBadge}>
          <Text style={styles.sellerBadgeText}>SELLER ACCOUNT</Text>
        </View>

        {/* ── Account Information ── */}
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.formCard}>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Juan dela Cruz"
              placeholderTextColor="#bbb"
              value={fullName}
              onChangeText={setFullName}
              autoComplete="name"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              placeholderTextColor="#bbb"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="min. 8 characters"
              placeholderTextColor="#bbb"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm Password <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[
                styles.input,
                confirmPassword.length > 0 &&
                  password !== confirmPassword &&
                  styles.inputError,
              ]}
              placeholder="re-enter password"
              placeholderTextColor="#bbb"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
            />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="09XX XXX XXXX"
              placeholderTextColor="#bbb"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>
        </View>

        {/* ── Store Information ── */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Store Information</Text>
        <View style={styles.formCard}>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Shop Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Juan's Boutique"
              placeholderTextColor="#bbb"
              value={shopName}
              onChangeText={setShopName}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Shop Description <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell buyers what you sell..."
              placeholderTextColor="#bbb"
              value={shopDesc}
              onChangeText={setShopDesc}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Product Category <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.categoryHint}>Select your main product category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryPill, category === cat && styles.categoryPillActive]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>CREATE SELLER ACCOUNT</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backText}>Register as buyer instead</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          By signing up, you agree to our Terms and{'\n'}Privacy Policy
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 24 },
  brand: { fontSize: 28, fontWeight: '700', letterSpacing: 4, color: '#1A1A1A', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  sellerBadge: { alignSelf: 'center', backgroundColor: '#1A1A1A', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, marginBottom: 24 },
  sellerBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#aaa', letterSpacing: 1.5, marginBottom: 10, textTransform: 'uppercase' },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: '#E0E0E0', gap: 14, marginBottom: 4 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#1A1A1A' },
  required: { color: '#FF3B30', fontSize: 12 },
  optional: { color: '#aaa', fontSize: 11, fontWeight: '400' },
  input: { backgroundColor: '#F8F8F8', borderWidth: 0.5, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 14, color: '#1A1A1A' },
  inputError: { borderColor: '#FF3B30', borderWidth: 1 },
  errorText: { fontSize: 11, color: '#FF3B30' },
  textArea: { height: 80, paddingTop: 12 },
  categoryHint: { fontSize: 11, color: '#aaa', marginBottom: 6 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F5F5F5', borderWidth: 0.5, borderColor: '#E0E0E0' },
  categoryPillActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  categoryText: { fontSize: 12, fontWeight: '500', color: '#666' },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
  button: { backgroundColor: '#1A1A1A', paddingVertical: 15, borderRadius: 999, alignItems: 'center', marginTop: 20, marginBottom: 14 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1.5 },
  backText: { textAlign: 'center', fontSize: 13, color: '#888', marginBottom: 16 },
  footer: { fontSize: 10, color: '#aaa', textAlign: 'center', lineHeight: 16 },
});