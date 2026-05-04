import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl
} from 'react-native';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { router, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';

type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';

type Order = {
  id: string;
  buyer_id: string;
  total_amount: number;
  status: OrderStatus;
  ordered_at: string;
  item_count: number;
  first_product_name: string;
  first_product_image: string | null;
};

type Filter = 'all' | 'pending' | 'shipped' | 'delivered';

export default function Orders() {
  const { user } = useAuthStore();
  const navigation = useNavigation();

  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [filter, setFilter]         = useState<Filter>('all');

  useEffect(() => {
    if (user?.id) fetchOrders();
  }, [user?.id]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: sellerProducts, error: prodErr } = await supabase
        .from('products')
        .select('id, name, image_url')
        .eq('seller_id', user!.id);

      if (prodErr) throw prodErr;

      if (!sellerProducts?.length) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const productIds = sellerProducts.map((p) => p.id);

      const { data: items, error: itemErr } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          product_id,
          orders (
            id,
            buyer_id,
            total_amount,
            status,
            ordered_at
          )
        `)
        .in('product_id', productIds)
        .order('id', { ascending: false });

      if (itemErr) throw itemErr;

      const orderMap = new Map<string, Order>();

      items?.forEach((item: any) => {
        const o = item.orders;
        if (!o) return;

        if (orderMap.has(o.id)) {
          orderMap.get(o.id)!.item_count += item.quantity;
        } else {
          const prod = sellerProducts.find((p) => p.id === item.product_id);
          orderMap.set(o.id, {
            id:                  o.id,
            buyer_id:            o.buyer_id,
            total_amount:        o.total_amount,
            status:              o.status,
            ordered_at:          o.ordered_at,
            item_count:          item.quantity,
            first_product_name:  prod?.name ?? 'Product',
            first_product_image: prod?.image_url ?? null,
          });
        }
      });

      const result = Array.from(orderMap.values()).sort(
        (a, b) => new Date(b.ordered_at).getTime() - new Date(a.ordered_at).getTime()
      );

      setOrders(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const displayed = filter === 'all'
    ? orders
    : orders.filter((o) => o.status === filter);

  return (
    <View style={styles.container}>

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
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Circle cx={11} cy={11} r={7} stroke="#1A1A1A" strokeWidth={2} />
          <Line x1={16.5} y1={16.5} x2={22} y2={22}
            stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </View>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Orders</Text>
        <Text style={styles.pageSubtitle}>
          Manage and track your customer shipments.
        </Text>
      </View>

      {/* ── Filter Tabs ── */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'shipped', 'delivered'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All Orders' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Loading ── */}
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#1A1A1A" style={styles.loader} />

      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>

      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1A1A1A"
            />
          }
          onEndReachedThreshold={0.2}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySubtext}>
                {filter === 'all'
                  ? 'Orders will appear here once customers purchase.'
                  : `No ${filter} orders at the moment.`}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <OrderCard order={item} onStatusUpdate={fetchOrders} />
          )}
          ListFooterComponent={
            displayed.length > 0 ? (
              <TouchableOpacity style={styles.viewOlder}>
                <Text style={styles.viewOlderText}>View Older Orders</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M6 9l6 6 6-6"
                    stroke="#1A1A1A" strokeWidth={2}
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}

// ── Order Card ──
function OrderCard({
  order,
  onStatusUpdate,
}: {
  order: Order;
  onStatusUpdate: () => void;
}) {
  const formattedDate = new Date(order.ordered_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const updateStatus = async (newStatus: OrderStatus) => {
    await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id);
    onStatusUpdate();
  };

  const openDetails = () => {
    router.push({
      pathname: '/order-detail',
      params: { orderId: order.id },
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardImg}>
          <View style={[styles.cardImgInner, { backgroundColor: '#E8E8E8' }]} />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardOrderNum}>
              Order #{order.id.slice(-5).toUpperCase()}
            </Text>
            <StatusBadge status={order.status} />
          </View>
          <Text style={styles.cardMeta}>
            Placed on {formattedDate} • {order.item_count}{' '}
            {order.item_count === 1 ? 'Item' : 'Items'}
          </Text>
          <Text style={styles.cardAmount}>
            ₱{order.total_amount.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>

      {order.status === 'pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.8} onPress={openDetails}>
            <Text style={styles.outlineBtnText}>DETAILS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.solidBtn}
            activeOpacity={0.8}
            onPress={() => updateStatus('shipped')}
          >
            <Text style={styles.solidBtnText}>SHIP NOW</Text>
          </TouchableOpacity>
        </View>
      )}

      {order.status === 'shipped' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.8}>
            <Text style={styles.outlineBtnText}>TRACKING</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.8} onPress={openDetails}>
            <Text style={styles.outlineBtnText}>DETAILS</Text>
          </TouchableOpacity>
        </View>
      )}

      {order.status === 'delivered' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.8}>
            <Text style={styles.outlineBtnText}>INVOICE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.8} onPress={openDetails}>
            <Text style={styles.outlineBtnText}>DETAILS</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Status Badge ──
function StatusBadge({ status }: { status: OrderStatus }) {
  const colors: Record<OrderStatus, { bg: string; text: string }> = {
    pending:   { bg: '#1A1A1A', text: '#fff' },
    shipped:   { bg: '#E8F5E9', text: '#2E7D32' },
    delivered: { bg: '#E3F2FD', text: '#1565C0' },
    cancelled: { bg: '#FFEBEE', text: '#C62828' },
  };
  const c = colors[status] ?? colors.pending;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

// ── Styles ──
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  navbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8,
  },
  brand: { fontSize: 13, fontWeight: '700', letterSpacing: 2, color: '#1A1A1A' },
  header: { paddingHorizontal: 20, paddingBottom: 14, gap: 4 },
  pageTitle: { fontSize: 30, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: '#888' },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 8,
    marginBottom: 16, flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#E0E0E0',
  },
  filterPillActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  filterText: { fontSize: 11, fontWeight: '600', color: '#888', letterSpacing: 0.3 },
  filterTextActive: { color: '#fff' },
  loader: { marginTop: 60 },
  errorBox: { alignItems: 'center', marginTop: 40, gap: 12 },
  errorText: { fontSize: 13, color: '#FF3B30', textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#1A1A1A', paddingHorizontal: 24,
    paddingVertical: 10, borderRadius: 999,
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
  emptyBox: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  emptySubtext: { fontSize: 13, color: '#aaa', textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    marginBottom: 10, borderWidth: 0.5, borderColor: '#E0E0E0', gap: 12,
  },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardImg: { width: 60, height: 60, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F0F0F0' },
  cardImgInner: { width: '100%', height: '100%' },
  cardInfo: { flex: 1, gap: 3 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardOrderNum: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  cardMeta: { fontSize: 11, color: '#888', lineHeight: 16 },
  cardAmount: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  actionRow: {
    flexDirection: 'row', gap: 8,
    borderTopWidth: 0.5, borderTopColor: '#F0F0F0', paddingTop: 10,
  },
  outlineBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 999,
    borderWidth: 0.5, borderColor: '#E0E0E0', alignItems: 'center', backgroundColor: '#fff',
  },
  outlineBtnText: { fontSize: 11, fontWeight: '700', color: '#1A1A1A', letterSpacing: 0.5 },
  solidBtn: { flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: '#1A1A1A', alignItems: 'center' },
  solidBtnText: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  viewOlder: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, paddingVertical: 20,
  },
  viewOlderText: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
});