import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Image, RefreshControl
} from 'react-native';
import Svg, { Path, Line, Rect, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image_url: string | null;
  seller_id: string;
};

type Filter = 'active' | 'out_of_stock';

const PAGE_SIZE = 10; // ✅ load 10 products at a time

export default function Products() {
  const { user } = useAuthStore();

  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false); // ✅ pagination loading
  const [error, setError]             = useState<string | null>(null);
  const [filter, setFilter]           = useState<Filter>('active');
  const [page, setPage]               = useState(0); // ✅ current page
  const [hasMore, setHasMore]         = useState(true); // ✅ more pages?

  useEffect(() => {
    if (user?.id) fetchProducts(0);
  }, [user?.id]);

  // ✅ fetchProducts accepts pageNum — 0 = fresh load, 1+ = load more
  const fetchProducts = async (pageNum = 0) => {
    if (pageNum === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user!.id)
        .order('name', { ascending: true })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1); // ✅ pagination range

      if (error) throw error;

      if (pageNum === 0) {
        // Fresh load — replace all products
        setProducts(data ?? []);
      } else {
        // Load more — append to existing list
        setProducts((prev) => [...prev, ...(data ?? [])]);
      }

      // If we got less than PAGE_SIZE, no more pages left
      setHasMore((data ?? []).length === PAGE_SIZE);
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
    await fetchProducts(0); // ✅ reset to page 0 on refresh
    setRefreshing(false);
  };

  // ✅ Called when user scrolls to 20% from bottom
  const loadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    fetchProducts(page + 1);
  };

  const activeProducts = products.filter((p) => p.stock > 0);
  const outOfStock     = products.filter((p) => p.stock === 0);
  const displayed      = filter === 'active' ? activeProducts : outOfStock;

  return (
    <View style={styles.container}>

      {/* ── Top Nav Bar ── */}
      <View style={styles.navbar}>
        <Svg width={18} height={14} viewBox="0 0 18 14">
          <Rect width={18} height={2} rx={1} fill="#1A1A1A" />
          <Rect y={6} width={18} height={2} rx={1} fill="#1A1A1A" />
          <Rect y={12} width={18} height={2} rx={1} fill="#1A1A1A" />
        </Svg>
        <Text style={styles.brand}>47TH ST</Text>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Circle cx={11} cy={11} r={7} stroke="#1A1A1A" strokeWidth={2} />
          <Line x1={16.5} y1={16.5} x2={22} y2={22}
            stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </View>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.merchantLabel}>MERCHANT PORTAL</Text>
        <Text style={styles.pageTitle}>Inventory</Text>
      </View>

      {/* ── Filter Pills ── */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'active' && styles.filterPillActive]}
          onPress={() => setFilter('active')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
            Active ({activeProducts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, filter === 'out_of_stock' && styles.filterPillActive]}
          onPress={() => setFilter('out_of_stock')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterText, filter === 'out_of_stock' && styles.filterTextActive]}>
            Out of Stock ({outOfStock.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Loading State ── */}
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#1A1A1A" style={styles.loader} />

      ) : error ? (
        /* ── Error State ── */
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchProducts(0)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>

      ) : (
        /* ── Product List ── */
        <FlatList
          data={displayed}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1A1A1A"
            />
          }
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.2}
          onEndReached={loadMore} // ✅ triggers loadMore when near bottom

          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>
                {filter === 'active' ? 'No active products' : 'No out of stock products'}
              </Text>
              <Text style={styles.emptySubtext}>
                {filter === 'active'
                  ? 'Add your first product using the + button.'
                  : 'All products are currently in stock.'}
              </Text>
            </View>
          }

          renderItem={({ item }) => (
            <ProductCard product={item} />
          )}

          // ✅ Show spinner at bottom when loading more pages
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color="#1A1A1A"
                style={{ paddingVertical: 16 }}
              />
            ) : null
          }
        />
      )}

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/product/new')}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Line x1={12} y1={5} x2={12} y2={19}
            stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
          <Line x1={5} y1={12} x2={19} y2={12}
            stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      </TouchableOpacity>
    </View>
  );
}

// ── Product Card ──
function ProductCard({ product }: { product: Product }) {
  const isSoldOut = product.stock === 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push('/product/new')}
    >
      <View style={styles.cardImageWrap}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.cardImagePlaceholder} />
        )}
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.cardCategory} numberOfLines={1}>{product.category}</Text>
        <Text style={styles.cardPrice}>
          ₱{product.price.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      </View>

      <View style={styles.cardRight}>
        {isSoldOut ? (
          <Text style={styles.soldOut}>Sold Out</Text>
        ) : (
          <Text style={styles.stockText}>
            Stock: {String(product.stock).padStart(2, '0')}
          </Text>
        )}
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 18l6-6-6-6"
            stroke="#ccc" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round"
          />
        </Svg>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ──
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  navbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8, backgroundColor: '#F5F5F5',
  },
  brand: { fontSize: 13, fontWeight: '700', letterSpacing: 2, color: '#1A1A1A' },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  merchantLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1.5, color: '#aaa', marginBottom: 4 },
  pageTitle: { fontSize: 30, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.5 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  filterPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#E0E0E0',
  },
  filterPillActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#888' },
  filterTextActive: { color: '#fff' },
  loader: { marginTop: 60 },
  errorBox: { alignItems: 'center', marginTop: 40, gap: 12 },
  errorText: { fontSize: 13, color: '#FF3B30', textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#1A1A1A', paddingHorizontal: 24,
    paddingVertical: 10, borderRadius: 999,
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  emptyBox: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  emptySubtext: { fontSize: 13, color: '#aaa', textAlign: 'center', lineHeight: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, padding: 12, marginBottom: 10,
    borderWidth: 0.5, borderColor: '#E0E0E0', gap: 12,
  },
  cardImageWrap: { width: 64, height: 64, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F0F0F0' },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#E8E8E8' },
  cardInfo: { flex: 1, gap: 3 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  cardCategory: { fontSize: 12, color: '#888' },
  cardPrice: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  stockText: { fontSize: 11, fontWeight: '500', color: '#888' },
  soldOut: { fontSize: 11, fontWeight: '700', color: '#FF3B30' },
  fab: {
    position: 'absolute', bottom: 90, right: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
});