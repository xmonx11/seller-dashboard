import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Alert
} from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export default function AddProduct() {
  const { user } = useAuthStore();

  const [name, setName]           = useState('');
  const [price, setPrice]         = useState('');
  const [stock, setStock]         = useState('');
  const [category, setCategory]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())              e.name     = 'Product name is required';
    if (!price.trim())             e.price    = 'Price is required';
    else if (isNaN(Number(price)) || Number(price) <= 0)
                                   e.price    = 'Enter a valid price';
    if (!stock.trim())             e.stock    = 'Stock is required';
    else if (isNaN(Number(stock)) || Number(stock) < 0)
                                   e.stock    = 'Enter a valid stock number';
    if (!category.trim())          e.category = 'Category is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (!user?.id) {
        Alert.alert('Error', 'Not logged in!');
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          seller_id: user.id,
          name:      name.trim(),
          price:     Number(price),
          stock:     Number(stock),
          category:  category.trim(),
        })
        .select();

      if (error) throw error;
      Alert.alert('Success', 'Product added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error',
        `Code: ${e.code}\nMsg: ${e.message}\nDetails: ${e.details}\nHint: ${e.hint}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Product</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Image Placeholder ── */}
        <TouchableOpacity style={styles.imagePicker} activeOpacity={0.8}>
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
              d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
              stroke="#bbb" strokeWidth={1.8}
              strokeLinecap="round" strokeLinejoin="round"
            />
            <Path
              d="M17 8l-5-5-5 5"
              stroke="#bbb" strokeWidth={1.8}
              strokeLinecap="round" strokeLinejoin="round"
            />
            <Line x1={12} y1={3} x2={12} y2={15}
              stroke="#bbb" strokeWidth={1.8} strokeLinecap="round"
            />
          </Svg>
          <Text style={styles.imagePickerText}>Upload Photo</Text>
          <Text style={styles.imagePickerSub}>JPG, PNG up to 5MB</Text>
        </TouchableOpacity>

        {/* ── Form Fields ── */}
        <View style={styles.form}>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PRODUCT NAME</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="e.g. Minimalist Chrono Watch"
              placeholderTextColor="#ccc"
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (errors.name) setErrors((e) => ({ ...e, name: '' }));
              }}
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>PRICE (₱)</Text>
              <TextInput
                style={[styles.input, errors.price && styles.inputError]}
                placeholder="0.00"
                placeholderTextColor="#ccc"
                keyboardType="decimal-pad"
                value={price}
                onChangeText={(t) => {
                  setPrice(t);
                  if (errors.price) setErrors((e) => ({ ...e, price: '' }));
                }}
              />
              {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>STOCK</Text>
              <TextInput
                style={[styles.input, errors.stock && styles.inputError]}
                placeholder="0"
                placeholderTextColor="#ccc"
                keyboardType="number-pad"
                value={stock}
                onChangeText={(t) => {
                  setStock(t);
                  if (errors.stock) setErrors((e) => ({ ...e, stock: '' }));
                }}
              />
              {errors.stock ? <Text style={styles.errorText}>{errors.stock}</Text> : null}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>CATEGORY</Text>
            <TextInput
              style={[styles.input, errors.category && styles.inputError]}
              placeholder="e.g. Accessories, Watches, Bags"
              placeholderTextColor="#ccc"
              value={category}
              onChangeText={(t) => {
                setCategory(t);
                if (errors.category) setErrors((e) => ({ ...e, category: '' }));
              }}
            />
            {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
          </View>

        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Submit Button ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>ADD PRODUCT</Text>
          }
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },

  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 16, fontWeight: '700',
    color: '#1A1A1A', letterSpacing: -0.3,
  },

  scroll: { flex: 1, paddingHorizontal: 20 },

  imagePicker: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  imagePickerText: { fontSize: 14, fontWeight: '600', color: '#bbb' },
  imagePickerSub:  { fontSize: 11, color: '#ccc' },

  form: { gap: 16 },
  row: { flexDirection: 'row', gap: 12 },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 10, fontWeight: '700',
    color: '#aaa', letterSpacing: 1.2,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: '#1A1A1A',
  },
  inputError: { borderColor: '#FF3B30', borderWidth: 1 },
  errorText:  { fontSize: 11, color: '#FF3B30', marginTop: 2 },

  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 16,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 0.5,
    borderTopColor: '#E8E8E8',
  },
  submitBtn: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: {
    color: '#fff', fontWeight: '700',
    fontSize: 13, letterSpacing: 1.5,
  },
});