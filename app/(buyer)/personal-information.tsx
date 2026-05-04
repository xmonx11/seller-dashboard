import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Alert, Modal
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

// ── Validation helpers ──
const isValidName = (v: string) => /^[a-zA-Z\s.'-]+$/.test(v.trim());
const isValidPhone = (v: string) => /^(\+63|0)[\s-]?9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/.test(v.trim());
const isValidPostal = (v: string) => /^\d{4}$/.test(v.trim());

export default function PersonalInformation() {
  const { profile, updateProfile } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Pre-fill from saved profile
  const [fullName, setFullName]     = useState(profile?.full_name ?? '');
  const [phone, setPhone]           = useState(profile?.phone_number ?? '');
  const [street, setStreet]         = useState(profile?.address_street ?? '');
  const [city, setCity]             = useState(profile?.address_city ?? '');
  const [postalCode, setPostalCode] = useState(profile?.address_postal ?? '');

  // Error states
  const [errors, setErrors] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
  });

  // Track original values to detect changes
  const [original] = useState({
    fullName: profile?.full_name ?? '',
    phone: profile?.phone_number ?? '',
    street: profile?.address_street ?? '',
    city: profile?.address_city ?? '',
    postalCode: profile?.address_postal ?? '',
  });

  const hasChanges =
    fullName !== original.fullName ||
    phone !== original.phone ||
    street !== original.street ||
    city !== original.city ||
    postalCode !== original.postalCode;

  // ── Per-field validation ──
  const validate = () => {
    const newErrors = { fullName: '', phone: '', street: '', city: '', postalCode: '' };
    let valid = true;

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
      valid = false;
    } else if (!isValidName(fullName)) {
      newErrors.fullName = 'Name must contain letters only.';
      valid = false;
    }

    if (phone.trim() && !isValidPhone(phone)) {
      newErrors.phone = 'Enter a valid PH number (e.g. +63 912 345 6789).';
      valid = false;
    }

    if (postalCode.trim() && !isValidPostal(postalCode)) {
      newErrors.postalCode = 'Postal code must be 4 digits.';
      valid = false;
    }

    // City & street: no numbers allowed
    if (city.trim() && /\d/.test(city)) {
      newErrors.city = 'City must not contain numbers.';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone_number: phone.trim(),
        address_street: street.trim(),
        address_city: city.trim(),
        address_postal: postalCode.trim(),
      });
      setShowSuccessModal(true);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Name: block numbers & special chars ──
  const handleNameChange = (v: string) => {
    const filtered = v.replace(/[^a-zA-Z\s.'-]/g, '');
    setFullName(filtered);
    if (errors.fullName) setErrors(p => ({ ...p, fullName: '' }));
  };

  // ── Phone: allow only +, digits, spaces, dashes ──
  const handlePhoneChange = (v: string) => {
    const filtered = v.replace(/[^\d\s+\-]/g, '');
    setPhone(filtered);
    if (errors.phone) setErrors(p => ({ ...p, phone: '' }));
  };

  // ── City: block numbers ──
  const handleCityChange = (v: string) => {
    const filtered = v.replace(/[0-9]/g, '');
    setCity(filtered);
    if (errors.city) setErrors(p => ({ ...p, city: '' }));
  };

  // ── Postal: digits only, max 4 ──
  const handlePostalChange = (v: string) => {
    const filtered = v.replace(/[^\d]/g, '').slice(0, 4);
    setPostalCode(filtered);
    if (errors.postalCode) setErrors(p => ({ ...p, postalCode: '' }));
  };

  return (
    <View style={styles.container}>
      {/* ── Nav Bar ── */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M5 12l7 7M5 12l7-7"
              stroke="#1A1A1A" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.brand}>47TH ST</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Personal Information</Text>
        <Text style={styles.pageSubtitle}>
          This information will be used to autofill your checkout address.
        </Text>

        {/* ── Basic Info ── */}
        <Text style={styles.sectionLabel}>BASIC INFO</Text>
        <View style={styles.card}>
          <Field
            label="Full Name"
            value={fullName}
            onChange={handleNameChange}
            placeholder="Juan dela Cruz"
            error={errors.fullName}
          />
          <Separator />
          <Field
            label="Phone Number"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="+63 912 345 6789"
            keyboardType="phone-pad"
            error={errors.phone}
          />
        </View>

        {/* ── Saved Address ── */}
        <Text style={styles.sectionLabel}>SAVED ADDRESS</Text>
        <Text style={styles.sectionHint}>
          This address will appear as an option during checkout.
        </Text>
        <View style={styles.card}>
          <Field
            label="Street Address"
            value={street}
            onChange={(v) => { setStreet(v); }}
            placeholder="123 Rizal Street, Brgy. Poblacion"
            error={errors.street}
          />
          <Separator />
          <Field
            label="City"
            value={city}
            onChange={handleCityChange}
            placeholder="Davao City"
            error={errors.city}
          />
          <Separator />
          <Field
            label="Postal Code"
            value={postalCode}
            onChange={handlePostalChange}
            placeholder="8000"
            keyboardType="numeric"
            maxLength={4}
            error={errors.postalCode}
          />
        </View>

        {/* ── Save Button ── */}
        <TouchableOpacity
          style={[styles.saveBtn, (!hasChanges || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Success Modal ── */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 6L9 17l-5-5"
                  stroke="#1A1A1A" strokeWidth={2.5}
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.modalTitle}>Changes Saved</Text>
            <Text style={styles.modalMessage}>
              Your personal information{'\n'}has been updated successfully.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setShowSuccessModal(false);
                router.back();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Reusable field component ──
function Field({
  label, value, onChange, placeholder, keyboardType = 'default', maxLength, error
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
  maxLength?: number;
  error?: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, !!error && styles.inputError]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#bbb"
        keyboardType={keyboardType}
        autoCapitalize="words"
        maxLength={maxLength}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  navbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8,
  },
  brand: { fontSize: 13, fontWeight: '700', letterSpacing: 2, color: '#1A1A1A' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.5, marginBottom: 6 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 24, lineHeight: 20 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#aaa',
    letterSpacing: 1.5, marginBottom: 8,
  },
  sectionHint: { fontSize: 12, color: '#aaa', marginBottom: 10, marginTop: -4 },
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 0.5, borderColor: '#E0E0E0',
    paddingHorizontal: 16, marginBottom: 24,
  },
  fieldGroup: { paddingVertical: 14 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#aaa', letterSpacing: 1, marginBottom: 6 },
  input: { fontSize: 14, color: '#1A1A1A', paddingVertical: 0 },
  inputError: { borderBottomWidth: 1, borderBottomColor: '#FF4444' },
  errorText: { fontSize: 11, color: '#FF4444', marginTop: 4 },
  separator: { height: 0.5, backgroundColor: '#F0F0F0' },
  saveBtn: {
    backgroundColor: '#1A1A1A', paddingVertical: 16,
    borderRadius: 999, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 24,
    padding: 28, width: '100%', alignItems: 'center', gap: 8,
  },
  modalIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#F5F5F5', justifyContent: 'center',
    alignItems: 'center', marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.3 },
  modalMessage: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  modalBtn: {
    width: '100%', paddingVertical: 15, borderRadius: 999,
    backgroundColor: '#1A1A1A', alignItems: 'center', marginTop: 8,
  },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
});