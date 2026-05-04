import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, Image, Modal, Pressable,
  ScrollView, Alert
} from 'react-native';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product_id: string;
  product: {
    name: string;
    category: string;
    image_url: string | null;
  };
};

type Order = {
  id: string;
  total_amount: number;
  status: OrderStatus;
  ordered_at: string;
  items: OrderItem[];
};

const PAGE_SIZE = 10;

export default function BuyerOrders() {
  const { user } = useAuthStore();

  const [orders, setOrders]           = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [page, setPage]               = useState(0);
  const [hasMore, setHasMore]         = useState(true);

  // Bottom sheet state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelling, setCancelling]       = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchOrders(0, true);
    }, [])
  );

  const fetchOrders = async (pageNum: number, reset: boolean) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setError('Session expired. Please log in again.');
        return;
      }

      const from = pageNum * PAGE_SIZE;
      const to   = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          ordered_at,
          order_items (
            id,
            quantity,
            unit_price,
            product_id,
            products (
              name,
              category,
              image_url
            )
          )
        `)
        .eq('buyer_id', authUser.id)
        .order('ordered_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const mapped: Order[] = (data ?? []).map((o: any) => ({
        id: o.id,
        total_amount: o.total_amount,
        status: o.status,
        ordered_at: o.ordered_at,
        items: (o.order_items ?? []).map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.unit_price,
          product_id: item.product_id,
          product: {
            name: item.products?.name ?? 'Product',
            category: item.products?.category ?? '',
            image_url: item.products?.image_url ?? null,
          },
        })),
      }));

      if (reset) setOrders(mapped);
      else setOrders((prev) => [...prev, ...mapped]);

      setHasMore((data?.length ?? 0) === PAGE_SIZE);
      setPage(pageNum);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(0, true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading && orders.length > 0) {
      fetchOrders(page + 1, false);
    }
  };

  // ── Cancel Order ──
  const handleCancelOrder = () => {
    if (!selectedOrder) return;

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? Stock will be restored.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: confirmCancel,
        },
      ]
    );
  };

  const confirmCancel = async () => {
    if (!selectedOrder) return;
    setCancelling(true);
    try {
      // 1. Update order status to cancelled
      const { error: cancelErr } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', selectedOrder.id);
      if (cancelErr) throw cancelErr;

      // 2. Restore stock for each item via RPC
      for (const item of selectedOrder.items) {
        const { error: stockErr } = await supabase.rpc('restore_stock', {
          product_id: item.product_id,
          amount: item.quantity,
        });
        if (stockErr) throw stockErr;
      }

      // 3. Update local state — no need to re-fetch
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id ? { ...o, status: 'cancelled' } : o
        )
      );
      setSelectedOrder((prev) =>
        prev ? { ...prev, status: 'cancelled' } : null
      );
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── Nav Bar ── */}
      <View style={styles.navbar}>
        <Svg width={18} height={14} viewBox="0 0 18 14">
          <Rect width={18} height={2} rx={1} fill="#1A1A1A" />
          <Rect y={6} width={18} height={2} rx={1} fill="#1A1A1A" />
          <Rect y={12} width={18} height={2} rx={1} fill="#1A1A1A" />
        </Svg>
        <Text style={styles.brand}>47TH ST</Text>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Circle cx={11} cy={11} r={7} stroke="#1A1A1A" strokeWidth={2} fill="none" />
          <Line x1={16.5} y1={16.5} x2={22} y2={22}
            stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1A1A" />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}

        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Order History</Text>
            <Text style={styles.pageSubtitle}>Review and track your curated purchases.</Text>
          </View>
        }

        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
              <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                stroke="#ddd" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M14 2v6h6" stroke="#ddd" strokeWidth={1.5}
                strokeLinecap="round" strokeLinejoin="round" />
              <Line x1={8} y1={13} x2={16} y2={13} stroke="#ddd" strokeWidth={1.5} strokeLinecap="round" />
              <Line x1={8} y1={17} x2={16} y2={17} stroke="#ddd" strokeWidth={1.5} strokeLinecap="round" />
            </Svg>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtext}>
              Your order history will appear here once you make a purchase.
            </Text>
            <TouchableOpacity
              style={styles.shopBtn}
              onPress={() => router.push('/(buyer)/home')}
              activeOpacity={0.8}
            >
              <Text style={styles.shopBtnText}>START SHOPPING</Text>
            </TouchableOpacity>
          </View>
        }

        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => setSelectedOrder(item)}
          />
        )}

        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color="#1A1A1A" style={{ marginVertical: 16 }} />
          ) : orders.length > 0 ? (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={loadMore}
              activeOpacity={0.8}
              disabled={!hasMore}
            >
              <Text style={[styles.loadMoreText, !hasMore && styles.loadMoreTextDisabled]}>
                {hasMore ? 'LOAD MORE ORDERS' : 'ALL ORDERS LOADED'}
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {error && (
        <View style={styles.errorToast}>
          <Text style={styles.errorToastText}>{error}</Text>
        </View>
      )}

      {/* ── Bottom Sheet Modal ── */}
      <Modal
        visible={!!selectedOrder}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalOverlay}>
          {/* Tap outside to close */}
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedOrder(null)} />

          {selectedOrder && (
            <View style={styles.sheet}>
              {/* Handle bar */}
              <View style={styles.sheetHandle} />

              {/* Sheet Header */}
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetOrderNum}>
                    ORDER #EST-{selectedOrder.id.slice(-5).toUpperCase()}
                  </Text>
                  <Text style={styles.sheetDate}>
                    {new Date(selectedOrder.ordered_at).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </Text>
                </View>
                <StatusBadge status={selectedOrder.status} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sheetScroll}
              >
                {/* ── Items Section ── */}
                <Text style={styles.sheetSectionLabel}>ITEMS ORDERED</Text>
                <View style={styles.sheetCard}>
                  {selectedOrder.items.map((item, idx) => (
                    <View key={item.id}>
                      <View style={styles.sheetItem}>
                        <View style={styles.sheetItemImg}>
                          {item.product.image_url ? (
                            <Image
                              source={{ uri: item.product.image_url }}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={{ flex: 1, backgroundColor: '#E8E8E8' }} />
                          )}
                        </View>
                        <View style={styles.sheetItemInfo}>
                          <Text style={styles.sheetItemName} numberOfLines={1}>
                            {item.product.name}
                          </Text>
                          <Text style={styles.sheetItemMeta}>
                            {item.product.category} · Qty {item.quantity}
                          </Text>
                        </View>
                        <Text style={styles.sheetItemPrice}>
                          ₱{(item.price * item.quantity).toLocaleString('en-PH', {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                      </View>
                      {idx < selectedOrder.items.length - 1 && (
                        <View style={styles.itemDivider} />
                      )}
                    </View>
                  ))}
                </View>

                {/* ── Order Summary ── */}
                <Text style={styles.sheetSectionLabel}>ORDER TOTAL</Text>
                <View style={styles.sheetCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Amount</Text>
                    <Text style={styles.summaryValue}>
                      ₱{selectedOrder.total_amount.toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                </View>

                {/* ── Status Info ── */}
                <Text style={styles.sheetSectionLabel}>STATUS</Text>
                <View style={styles.sheetCard}>
                  <View style={styles.statusRow}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: statusColor(selectedOrder.status) }
                    ]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.statusTitle}>
                        {statusLabel(selectedOrder.status)}
                      </Text>
                      <Text style={styles.statusSub}>
                        {statusMessage(selectedOrder.status)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* ── Cancel Button — only if pending ── */}
                {selectedOrder.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
                    onPress={handleCancelOrder}
                    disabled={cancelling}
                    activeOpacity={0.85}
                  >
                    {cancelling ? (
                      <ActivityIndicator color="#C62828" />
                    ) : (
                      <>
                        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                          <Circle cx={12} cy={12} r={10}
                            stroke="#C62828" strokeWidth={1.8} />
                          <Line x1={15} y1={9} x2={9} y2={15}
                            stroke="#C62828" strokeWidth={1.8} strokeLinecap="round" />
                          <Line x1={9} y1={9} x2={15} y2={15}
                            stroke="#C62828" strokeWidth={1.8} strokeLinecap="round" />
                        </Svg>
                        <Text style={styles.cancelBtnText}>CANCEL ORDER</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Already cancelled note */}
                {selectedOrder.status === 'cancelled' && (
                  <View style={styles.cancelledNote}>
                    <Text style={styles.cancelledNoteText}>
                      This order has been cancelled. Stock has been restored.
                    </Text>
                  </View>
                )}

                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ── Helpers ──
function statusColor(status: OrderStatus) {
  return {
    pending:   '#F59E0B',
    shipped:   '#3B82F6',
    delivered: '#22C55E',
    cancelled: '#EF4444',
  }[status] ?? '#888';
}

function statusLabel(status: OrderStatus) {
  return {
    pending:   'Order Placed',
    shipped:   'On the Way',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }[status] ?? status;
}

function statusMessage(status: OrderStatus) {
  return {
    pending:   'Your order is being prepared. Estimated arrival: 3–5 days.',
    shipped:   'Your order is out for delivery. Estimated arrival: 1–2 days.',
    delivered: 'Your order has been delivered. Thank you!',
    cancelled: 'Your order was cancelled. Stock has been restored.',
  }[status] ?? '';
}

// ── Order Card ──
function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const date = new Date(order.ordered_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const orderNum  = `#EST-${order.id.slice(-5).toUpperCase()}`;
  const firstItem = order.items[0];

  const footerMessage: Record<OrderStatus, string> = {
    pending:   'Estimated Arrival: 3-5 days',
    shipped:   'Estimated Arrival: 1-2 days',
    delivered: 'Paid via your selected method',
    cancelled: 'Refunded to original payment method',
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardOrderLabel}>ORDER {orderNum}</Text>
          <Text style={styles.cardDate}>{date}</Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      {firstItem && (
        <View style={styles.cardProduct}>
          <View style={styles.cardImg}>
            {firstItem.product.image_url ? (
              <Image
                source={{ uri: firstItem.product.image_url }}
                style={styles.cardImgInner}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.cardImgInner, { backgroundColor: '#E8E8E8' }]} />
            )}
          </View>
          <View style={styles.cardProductInfo}>
            <Text style={styles.cardProductName} numberOfLines={1}>
              {firstItem.product.name}
            </Text>
            <Text style={styles.cardProductMeta}>{firstItem.product.category}</Text>
          </View>
          <Text style={styles.cardPrice}>
            ₱{(firstItem.price * firstItem.quantity)
              .toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      )}

      {order.items.length > 1 && (
        <Text style={styles.moreItems}>
          +{order.items.length - 1} more item{order.items.length - 1 > 1 ? 's' : ''}
        </Text>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.footerMsg}>{footerMessage[order.status]}</Text>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path d="M9 18l6-6-6-6" stroke="#aaa" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    </TouchableOpacity>
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
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  navbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8,
  },
  brand: { fontSize: 13, fontWeight: '700', letterSpacing: 2, color: '#1A1A1A' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { paddingBottom: 20, gap: 4 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: '#888' },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginTop: 8 },
  emptySubtext: { fontSize: 13, color: '#aaa', textAlign: 'center', lineHeight: 20 },
  shopBtn: {
    marginTop: 8, backgroundColor: '#1A1A1A',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999,
  },
  shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 12, letterSpacing: 1 },

  // Order card
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 0.5, borderColor: '#E0E0E0', gap: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardOrderLabel: { fontSize: 11, fontWeight: '700', color: '#aaa', letterSpacing: 0.8, marginBottom: 2 },
  cardDate: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  cardProduct: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardImg: { width: 56, height: 56, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F0F0F0' },
  cardImgInner: { width: '100%', height: '100%' },
  cardProductInfo: { flex: 1, gap: 3 },
  cardProductName: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  cardProductMeta: { fontSize: 11, color: '#888' },
  cardPrice: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  moreItems: { fontSize: 11, color: '#aaa', fontWeight: '500' },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 0.5, borderTopColor: '#F0F0F0', paddingTop: 10,
  },
  footerMsg: { fontSize: 11, color: '#888', fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  loadMoreBtn: {
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 0.5, borderColor: '#1A1A1A',
    borderRadius: 999, marginTop: 4,
  },
  loadMoreText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A', letterSpacing: 1 },
  loadMoreTextDisabled: { color: '#aaa' },
  errorToast: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    backgroundColor: '#1A1A1A', padding: 14, borderRadius: 12, alignItems: 'center',
  },
  errorToastText: { color: '#fff', fontSize: 13, fontWeight: '500' },

  // Modal / Bottom sheet
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 20,
  },
  sheetOrderNum: { fontSize: 11, fontWeight: '700', color: '#aaa', letterSpacing: 0.8, marginBottom: 3 },
  sheetDate: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  sheetScroll: { paddingHorizontal: 20, paddingBottom: 32 },
  sheetSectionLabel: {
    fontSize: 9, fontWeight: '700', color: '#aaa',
    letterSpacing: 1.5, marginBottom: 8, marginTop: 4,
  },
  sheetCard: {
    backgroundColor: '#F8F8F8', borderRadius: 14,
    borderWidth: 0.5, borderColor: '#E0E0E0',
    padding: 14, marginBottom: 16,
  },
  sheetItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetItemImg: {
    width: 48, height: 48, borderRadius: 8,
    overflow: 'hidden', backgroundColor: '#E8E8E8',
  },
  sheetItemInfo: { flex: 1, gap: 3 },
  sheetItemName: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  sheetItemMeta: { fontSize: 11, color: '#888' },
  sheetItemPrice: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  itemDivider: { height: 0.5, backgroundColor: '#E0E0E0', marginVertical: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: '#888' },
  summaryValue: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  statusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  statusTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
  statusSub: { fontSize: 12, color: '#888', lineHeight: 18 },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 999,
    borderWidth: 1.5, borderColor: '#C62828', marginTop: 4,
  },
  cancelBtnDisabled: { opacity: 0.5 },
  cancelBtnText: { fontSize: 12, fontWeight: '700', color: '#C62828', letterSpacing: 1 },
  cancelledNote: {
    backgroundColor: '#FFEBEE', borderRadius: 12,
    padding: 14, marginTop: 4,
  },
  cancelledNoteText: { fontSize: 12, color: '#C62828', textAlign: 'center', lineHeight: 18 },
});