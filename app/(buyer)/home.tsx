import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, TextInput, RefreshControl,
  ScrollView
} from 'react-native';
import Svg, { Circle, Line, Path, Rect, Polyline } from 'react-native-svg';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image_url: string | null;
};

// Category filter pills — All Items + unique categories
const CATEGORIES = ['All Items', 'Furniture', 'Lighting', 'Decor', 'Textiles'];

const PAGE_SIZE = 10;

export default function Home() {
  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('All Items');
  const [page, setPage]               = useState(0);
  const [hasMore, setHasMore]         = useState(true);
  // wishlist = set of product IDs the user has hearted
  // Using local state for now — can be persisted to Supabase later
  const [wishlist, setWishlist]       = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProducts(0, true);
  }, [category]); // re-fetch when category changes

  const fetchProducts = async (pageNum: number, reset: boolean) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const from = pageNum * PAGE_SIZE;
      const to   = from + PAGE_SIZE - 1;

      // Build query — filter by category if not "All Items"
      let query = supabase
        .from('products')
        .select('id, name, price, stock, category, image_url')
        .gt('stock', 0)
        .order('name', { ascending: true })
        .range(from, to);

      // Only add category filter if not showing all
      if (category !== 'All Items') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (reset) {
        setProducts(data ?? []);
      } else {
        setProducts((prev) => [...prev, ...(data ?? [])]);
      }

      setHasMore((data?.length ?? 0) === PAGE_SIZE);
      setPage(pageNum);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(0, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchProducts(page + 1, false);
    }
  };

  // Toggle heart/wishlist for a product
  const toggleWishlist = (id: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Client-side search filter on top of paginated results
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>

      {/* ── Nav Bar ──────────────────────────────────── */}
      <View style={styles.navbar}>
        <Svg width={18} height={14} viewBox="0 0 18 14">
          <Rect width={18} height={2} rx={1} fill="#1A1A1A" />
          <Rect y={6} width={18} height={2} rx={1} fill="#1A1A1A" />
          <Rect y={12} width={18} height={2} rx={1} fill="#1A1A1A" />
        </Svg>
        <Text style={styles.brand}>47TH ST</Text>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Circle cx={11} cy={11} r={7}
            stroke="#1A1A1A" strokeWidth={2} />
          <Line x1={16.5} y1={16.5} x2={22} y2={22}
            stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1A1A1A"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}

        // ── List Header — Search + Categories + Hero + Section Title ──
        ListHeaderComponent={
          <View>
            {/* Search Bar */}
            <View style={styles.searchWrap}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Circle cx={11} cy={11} r={7}
                  stroke="#aaa" strokeWidth={2} />
                <Line x1={16.5} y1={16.5} x2={22} y2={22}
                  stroke="#aaa" strokeWidth={2} strokeLinecap="round" />
              </Svg>
              <TextInput
                style={styles.searchInput}
                placeholder="Search curated collections..."
                placeholderTextColor="#bbb"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
            </View>

            {/* Category Filter Pills — horizontal scroll */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryContent}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    category === cat && styles.categoryPillActive,
                  ]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.categoryText,
                    category === cat && styles.categoryTextActive,
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── Hero Banner ─────────────────────────── */}
            {/* Dark card with title + subtitle + CTA button */}
            <TouchableOpacity
              style={styles.heroBanner}
              activeOpacity={0.9}
            >
              {/* Dark overlay background */}
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>
                  The Winter{'\n'}Anthology
                </Text>
                <Text style={styles.heroSubtitle}>
                  A curated selection of objects designed to evoke
                  tranquility and structural elegance during the
                  colder months.
                </Text>
                <View style={styles.heroBtn}>
                  <Text style={styles.heroBtnText}>DISCOVER NOW</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* ── New Arrivals Section Title ───────────── */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionLabel}>NEW ARRIVALS</Text>
                <Text style={styles.sectionTitle}>Season Essentials</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
          </View>
        }

        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              size="small"
              color="#1A1A1A"
              style={{ marginVertical: 16 }}
            />
          ) : null
        }

        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtext}>
                Try a different search or category.
              </Text>
            </View>
          ) : null
        }

        renderItem={({ item }) => (
          <ProductCard
            product={item}
            wishlisted={wishlist.has(item.id)}
            onWishlist={() => toggleWishlist(item.id)}
          />
        )}
      />

      {/* ── Full screen loader — only on first load ── */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1A1A1A" />
        </View>
      )}

      {/* ── Error State ──────────────────────────────── */}
      {error && !loading && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchProducts(0, true)}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Product Card Component ──────────────────────────────────────
function ProductCard({
  product,
  wishlisted,
  onWishlist,
}: {
  product: Product;
  wishlisted: boolean;
  onWishlist: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.85}
      onPress={() => router.push(`/(buyer)/product/${product.id}`)}
    >
      {/* Product image */}
      <View style={styles.productImgWrap}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.productImg}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImgPlaceholder} />
        )}

        {/* Heart / wishlist button — top right of image */}
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={onWishlist}
          activeOpacity={0.8}
          // stopPropagation — prevent card tap when tapping heart
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path
              d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
              fill={wishlisted ? '#1A1A1A' : 'none'}
              stroke="#1A1A1A"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Product info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productPrice}>
          ₱{product.price.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Nav
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#F5F5F5',
  },
  brand: {
    fontSize: 13, fontWeight: '700',
    letterSpacing: 2, color: '#1A1A1A',
  },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 13,
    color: '#1A1A1A',
  },

  // Categories
  categoryScroll: { marginBottom: 16 },
  categoryContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  categoryPillActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  categoryTextActive: {
    color: '#fff',
  },

  // Hero Banner
  heroBanner: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    marginBottom: 24,
    height: 200,
    justifyContent: 'flex-end',
  },
  heroContent: {
    padding: 20,
    gap: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  heroSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 16,
  },
  heroBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 4,
  },
  heroBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 1,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#aaa',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  viewAll: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  row: { gap: 10, marginBottom: 10 },

  // Product card
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  productImgWrap: {
    height: 160,
    backgroundColor: '#F0F0F0',
    position: 'relative',
  },
  productImg: { width: '100%', height: '100%' },
  productImgPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: '#E8E8E8',
  },

  // Heart button
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  productInfo: { padding: 12, gap: 4 },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 16,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },

  // Error
  errorBox: {
    position: 'absolute',
    top: 200, left: 0, right: 0,
    alignItems: 'center', gap: 12,
  },
  errorText: { fontSize: 13, color: '#FF3B30' },
  retryBtn: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  // Empty
  emptyBox: { alignItems: 'center', marginTop: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  emptySubtext: { fontSize: 13, color: '#aaa', textAlign: 'center' },
});