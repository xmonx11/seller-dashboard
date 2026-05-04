import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Image, Alert
} from 'react-native';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';
import { useCartStore } from '../../../store/cartStore';

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image_url: string | null;
};

const SIZES = ['Small', 'Medium', 'Large'];

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [product, setProduct]       = useState<Product | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [related, setRelated]       = useState<Product[]>([]);
  const [quantity, setQuantity]     = useState(1);
  const [size, setSize]             = useState('Medium');
  const [wishlisted, setWishlisted] = useState(false);
  const [expanded, setExpanded]     = useState<string | null>(null);

  const addItem = useCartStore((s) => s.addItem);

  // ✅ Re-fetch every time the screen gains focus so stock is always fresh
  useFocusEffect(
    useCallback(() => {
      if (id) fetchProduct();
    }, [id])
  );

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setProduct(data);

      const { data: rel } = await supabase
        .from('products')
        .select('id, name, price, image_url, category, stock')
        .eq('category', data.category)
        .neq('id', id)
        .limit(4);
      setRelated(rel ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Re-fetch stock from DB so buyer sees the latest count
  const refreshStock = async () => {
    if (!product) return;
    const { data } = await supabase
      .from('products')
      .select('stock')
      .eq('id', product.id)
      .single();
    if (data) {
      setProduct((prev) => prev ? { ...prev, stock: data.stock } : prev);
      // Reset quantity if it now exceeds remaining stock
      setQuantity((q) => Math.min(q, data.stock || 1));
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      id:        product.id,
      name:      product.name,
      price:     product.price,
      image_url: product.image_url,
      stock:     product.stock,
      quantity,
    });

    Alert.alert(
      'Added to Bag',
      `${quantity}x ${product.name} has been added to your shopping bag.`,
      [
        {
          text: 'Continue Shopping',
          style: 'cancel',
          // ✅ Refresh stock when buyer stays on page
          onPress: refreshStock,
        },
        {
          text: 'View Bag',
          onPress: () => router.push('/(buyer)/cart'),
        },
      ]
    );
  };

  const toggleExpand = (section: string) => {
    setExpanded((prev) => (prev === section ? null : section));
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorWrap}>
        <Text style={styles.errorText}>{error ?? 'Product not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchProduct}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isSoldOut = product.stock === 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Product Image ── */}
        <View style={styles.imageWrap}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M5 12l7 7M5 12l7-7"
                stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/(buyer)/cart')} activeOpacity={0.8}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                stroke="#1A1A1A" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              <Line x1={3} y1={6} x2={21} y2={6} stroke="#1A1A1A" strokeWidth={1.8} strokeLinecap="round" />
              <Path d="M16 10a4 4 0 01-8 0" stroke="#1A1A1A" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* ── Product Info ── */}
        <View style={styles.infoSection}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.collectionLabel}>NEW COLLECTION</Text>
              <Text style={styles.productName}>{product.name}</Text>
            </View>
            <View style={styles.priceWrap}>
              <Text style={styles.price}>
                ₱{product.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </Text>
              <View style={styles.ratingRow}>
                <Svg width={12} height={12} viewBox="0 0 24 24">
                  <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="#1A1A1A" stroke="#1A1A1A" strokeWidth={1} />
                </Svg>
                <Text style={styles.ratingText}>4.9</Text>
                <Text style={styles.reviewCount}>(94)</Text>
              </View>
            </View>
          </View>

          {/* ✅ Stock indicator — reflects live DB value */}
          <View style={styles.stockRow}>
            <View style={[styles.stockDot, { backgroundColor: isSoldOut ? '#ef4444' : '#22c55e' }]} />
            <Text style={styles.stockLabel}>
              {isSoldOut ? 'Out of stock' : `${product.stock} in stock`}
            </Text>
          </View>

          <View style={styles.descSection}>
            <Text style={styles.descLabel}>DESCRIPTION</Text>
            <Text style={styles.descText}>
              A premium quality {product.name.toLowerCase()} from our{' '}
              {product.category} collection. Designed with attention to
              detail and crafted for lasting quality.
            </Text>
          </View>

          {/* Size selector */}
          <View style={styles.sizeSection}>
            <Text style={styles.sizeLabel}>SIZE</Text>
            <View style={styles.sizeRow}>
              {SIZES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sizePill, size === s && styles.sizePillActive]}
                  onPress={() => setSize(s)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.sizeText, size === s && styles.sizeTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quantity selector — capped at product.stock */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>QUANTITY</Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                activeOpacity={0.8}
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Line x1={5} y1={12} x2={19} y2={12} stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>

              <Text style={styles.quantityValue}>{quantity}</Text>

              {/* Plus capped at product.stock */}
              <TouchableOpacity
                style={[styles.quantityBtn, quantity >= product.stock && styles.quantityBtnDisabled]}
                onPress={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                activeOpacity={quantity >= product.stock ? 1 : 0.8}
                disabled={quantity >= product.stock}
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Line x1={12} y1={5} x2={12} y2={19}
                    stroke={quantity >= product.stock ? '#ccc' : '#1A1A1A'}
                    strokeWidth={2} strokeLinecap="round" />
                  <Line x1={5} y1={12} x2={19} y2={12}
                    stroke={quantity >= product.stock ? '#ccc' : '#1A1A1A'}
                    strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>

          <AccordionRow
            label="Material & Care"
            expanded={expanded === 'material'}
            onPress={() => toggleExpand('material')}
            content="Premium materials sourced responsibly. Hand wash cold, lay flat to dry. Do not bleach. Iron on low heat if needed."
          />
          <AccordionRow
            label="Shipping & Returns"
            expanded={expanded === 'shipping'}
            onPress={() => toggleExpand('shipping')}
            content="Free standard shipping on orders over ₱2,000. Express delivery available. Returns accepted within 30 days."
          />

          {related.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>COMPLETE THE LOOK</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScroll}>
                {related.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.relatedCard}
                    onPress={() => router.push(`/(buyer)/product/${item.id}`)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.relatedImgWrap}>
                      {item.image_url
                        ? <Image source={{ uri: item.image_url }} style={styles.relatedImg} resizeMode="cover" />
                        : <View style={styles.relatedImgPlaceholder} />}
                    </View>
                    <Text style={styles.relatedName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.relatedPrice}>
                      ₱{item.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* ── Sticky Add to Cart ── */}
      <View style={styles.stickyBar}>
        <TouchableOpacity
          style={[styles.addToCartBtn, isSoldOut && styles.addToCartBtnDisabled]}
          onPress={handleAddToCart}
          disabled={isSoldOut}
          activeOpacity={0.85}
        >
          <Text style={styles.addToCartText}>
            {isSoldOut
              ? 'OUT OF STOCK'
              : `ADD TO CART — ₱${(product.price * quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AccordionRow({ label, expanded, onPress, content }: {
  label: string; expanded: boolean; onPress: () => void; content: string;
}) {
  return (
    <View style={styles.accordion}>
      <TouchableOpacity style={styles.accordionHeader} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.accordionLabel}>{label}</Text>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d={expanded ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}
            stroke="#aaa" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>
      {expanded && <Text style={styles.accordionContent}>{content}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { paddingBottom: 0 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 13, color: '#FF3B30' },
  retryBtn: { backgroundColor: '#1A1A1A', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  imageWrap: { height: 360, backgroundColor: '#E8E8E8', position: 'relative' },
  productImage: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#DCDCDC' },
  backBtn: {
    position: 'absolute', top: 52, left: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center',
  },
  cartBtn: {
    position: 'absolute', top: 52, right: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center',
  },
  infoSection: { backgroundColor: '#F5F5F5', paddingHorizontal: 20, paddingTop: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  collectionLabel: { fontSize: 9, fontWeight: '700', color: '#aaa', letterSpacing: 1.5, marginBottom: 4 },
  productName: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.5, maxWidth: 180 },
  priceWrap: { alignItems: 'flex-end', gap: 4 },
  price: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 11, fontWeight: '600', color: '#1A1A1A' },
  reviewCount: { fontSize: 11, color: '#aaa' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  stockDot: { width: 7, height: 7, borderRadius: 4 },
  stockLabel: { fontSize: 12, color: '#888', fontWeight: '500' },
  descSection: { marginBottom: 20, gap: 8 },
  descLabel: { fontSize: 9, fontWeight: '700', color: '#aaa', letterSpacing: 1.5 },
  descText: { fontSize: 13, color: '#555', lineHeight: 20 },
  sizeSection: { marginBottom: 20, gap: 10 },
  sizeLabel: { fontSize: 9, fontWeight: '700', color: '#aaa', letterSpacing: 1.5 },
  sizeRow: { flexDirection: 'row', gap: 8 },
  sizePill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#E0E0E0' },
  sizePillActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  sizeText: { fontSize: 12, fontWeight: '600', color: '#888' },
  sizeTextActive: { color: '#fff' },
  quantitySection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  quantityLabel: { fontSize: 9, fontWeight: '700', color: '#aaa', letterSpacing: 1.5 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  quantityBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#E0E0E0',
    justifyContent: 'center', alignItems: 'center',
  },
  quantityBtnDisabled: { opacity: 0.3 },
  quantityValue: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', minWidth: 20, textAlign: 'center' },
  accordion: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, borderWidth: 0.5, borderColor: '#E0E0E0', overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  accordionLabel: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  accordionContent: { fontSize: 12, color: '#666', lineHeight: 18, paddingHorizontal: 16, paddingBottom: 16 },
  relatedSection: { marginTop: 24, marginBottom: 8 },
  relatedTitle: { fontSize: 9, fontWeight: '700', color: '#aaa', letterSpacing: 1.5, marginBottom: 12 },
  relatedScroll: { gap: 10 },
  relatedCard: { width: 130, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: '#E0E0E0' },
  relatedImgWrap: { height: 100, backgroundColor: '#F0F0F0' },
  relatedImg: { width: '100%', height: '100%' },
  relatedImgPlaceholder: { width: '100%', height: '100%', backgroundColor: '#E8E8E8' },
  relatedName: { fontSize: 11, fontWeight: '600', color: '#1A1A1A', padding: 8, paddingBottom: 2 },
  relatedPrice: { fontSize: 11, fontWeight: '700', color: '#1A1A1A', paddingHorizontal: 8, paddingBottom: 8 },
  stickyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#F5F5F5', paddingHorizontal: 20,
    paddingVertical: 14, paddingBottom: 28,
    borderTopWidth: 0.5, borderTopColor: '#E0E0E0',
  },
  addToCartBtn: { backgroundColor: '#1A1A1A', paddingVertical: 16, borderRadius: 999, alignItems: 'center' },
  addToCartBtnDisabled: { backgroundColor: '#ccc' },
  addToCartText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
});