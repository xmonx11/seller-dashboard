// ================================================================
// app/(drawer)/(tabs)/index.tsx
// Seller Analytics Dashboard — Main Screen
// ================================================================

import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions
} from 'react-native';
import Svg, {
  Path, Polyline, Rect, Circle, Line, Text as SvgText
} from 'react-native-svg';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useAuthStore } from '../../../store/authStore';
import { useAnalyticsStore } from '../../../store/analyticsStore';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W  = SCREEN_W - 64;

export default function Dashboard() {
  const { user }                                            = useAuthStore();
  const { snapshots, forecast, topProducts, loading, error, fetchAnalytics } = useAnalyticsStore();
  const [days, setDays]           = useState(7);
  const [refreshing, setRefreshing] = useState(false);
  const navigation                = useNavigation();

  // Re-fetch whenever days toggle changes or user changes
  useEffect(() => {
    if (user?.id) fetchAnalytics(user.id, days);
  }, [days, user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.id) await fetchAnalytics(user.id, days);
    setRefreshing(false);
  };

  // ── Derived stats ────────────────────────────────────────────────
  const totalRevenue = snapshots.reduce((sum, s) => sum + s.revenue, 0);
  const totalUnits   = snapshots.reduce((sum, s) => sum + s.units_sold, 0);

  // Period-over-period change: compare first half vs second half of snapshots
  const half     = Math.floor(snapshots.length / 2);
  const firstRev = snapshots.slice(0, half).reduce((s, x) => s + x.revenue, 0);
  const lastRev  = snapshots.slice(half).reduce((s, x) => s + x.revenue, 0);
  const revChange = firstRev > 0
    ? (((lastRev - firstRev) / firstRev) * 100).toFixed(1)
    : '0.0';

  const firstOrd = snapshots.slice(0, half).reduce((s, x) => s + x.units_sold, 0);
  const lastOrd  = snapshots.slice(half).reduce((s, x) => s + x.units_sold, 0);
  const ordChange = firstOrd > 0
    ? (((lastOrd - firstOrd) / firstOrd) * 100).toFixed(1)
    : '0.0';

  // ── Chart data ───────────────────────────────────────────────────
  const lineData = snapshots.map((s) => ({
    label: s.snapshot_date.slice(5),
    value: s.revenue,
  }));

  const barData = snapshots.slice(-7).map((s) => ({
    label: s.snapshot_date.slice(5),
    value: s.revenue,
  }));

  // ── BG colors for top product cards ─────────────────────────────
  const productBgs = ['#DCDCDC', '#2A2A2A', '#C8B8A2', '#A8C5DA', '#D4C5E2'];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1A1A" />
      }
    >
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

        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Circle cx={11} cy={11} r={7} stroke="#1A1A1A" strokeWidth={2} fill="none" />
          <Line x1={16.5} y1={16.5} x2={22} y2={22} stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </View>

      {/* ── Analytics Title + Toggle ── */}
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Analytics</Text>
        <View style={styles.toggle}>
          {[7, 30].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.toggleBtn, days === d && styles.toggleActive]}
              onPress={() => setDays(d)}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, days === d && styles.toggleTextActive]}>
                {d} Days
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Loading State ── */}
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#1A1A1A" style={styles.loader} />

      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => user?.id && fetchAnalytics(user.id, days)}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>

      ) : snapshots.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No sales data yet</Text>
          <Text style={styles.emptySubtext}>Data will appear once orders are processed.</Text>
        </View>

      ) : (
        <>
          {/* ── Stat Cards ── */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TOTAL REVENUE</Text>
              <Text style={styles.statValue}>₱{totalRevenue.toLocaleString()}</Text>
              <View style={styles.changeBadge}>
                <Svg width={10} height={10} viewBox="0 0 10 10">
                  <Polyline
                    points={parseFloat(revChange) >= 0 ? '1,8 5,2 9,8' : '1,2 5,8 9,2'}
                    fill="none"
                    stroke={parseFloat(revChange) >= 0 ? '#22c55e' : '#ef4444'}
                    strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                  />
                </Svg>
                <Text style={[styles.changeText, { color: parseFloat(revChange) >= 0 ? '#22c55e' : '#ef4444' }]}>
                  {parseFloat(revChange) >= 0 ? '+' : ''}{revChange}%
                </Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ORDERS</Text>
              <Text style={styles.statValue}>{totalUnits.toLocaleString()}</Text>
              <View style={styles.changeBadge}>
                <Svg width={10} height={10} viewBox="0 0 10 10">
                  <Polyline
                    points={parseFloat(ordChange) >= 0 ? '1,8 5,2 9,8' : '1,2 5,8 9,2'}
                    fill="none"
                    stroke={parseFloat(ordChange) >= 0 ? '#22c55e' : '#ef4444'}
                    strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                  />
                </Svg>
                <Text style={[styles.changeText, { color: parseFloat(ordChange) >= 0 ? '#22c55e' : '#ef4444' }]}>
                  {parseFloat(ordChange) >= 0 ? '+' : ''}{ordChange}%
                </Text>
              </View>
            </View>
          </View>

          {/* ── Revenue Forecast Card ── */}
          <View style={styles.forecastCard}>
            <View>
              <Text style={styles.statLabel}>REVENUE FORECAST</Text>
              <Text style={styles.forecastValue}>₱{Math.round(forecast).toLocaleString()}</Text>
              <Text style={styles.forecastSub}>Projected in {days} days</Text>
            </View>
            {/* Simple trend arrow */}
            <Svg width={32} height={32} viewBox="0 0 24 24">
              <Polyline
                points={forecast > totalRevenue / snapshots.length
                  ? '4,20 12,8 20,14'
                  : '4,8 12,16 20,10'}
                fill="none"
                stroke={forecast > totalRevenue / snapshots.length ? '#22c55e' : '#ef4444'}
                strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              />
            </Svg>
          </View>

          {/* ── Performance Line Chart ── */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Performance</Text>
              <Svg width={16} height={4} viewBox="0 0 16 4">
                <Circle cx={2} cy={2} r={1.5} fill="#aaa" />
                <Circle cx={8} cy={2} r={1.5} fill="#aaa" />
                <Circle cx={14} cy={2} r={1.5} fill="#aaa" />
              </Svg>
            </View>
            <PerformanceChart data={lineData} width={CHART_W} height={100} />
          </View>

          {/* ── Sales Distribution Bar Chart ── */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Sales Distribution</Text>
            <SalesBarChart data={barData} width={CHART_W} height={80} />
          </View>

          {/* ── Top Products — from Supabase (not hardcoded) ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Products</Text>
              <TouchableOpacity>
                <Text style={styles.viewAll}>View All ›</Text>
              </TouchableOpacity>
            </View>

            {topProducts.length === 0 ? (
              <Text style={styles.emptySubtext}>No product data yet.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {topProducts.map((p, i) => (
                  <TopProductCard
                    key={p.product_id}
                    name={p.name}
                    sales={p.units_sold}
                    revenue={p.revenue}
                    bg={productBgs[i % productBgs.length]}
                  />
                ))}
              </ScrollView>
            )}
          </View>

          <View style={{ height: 32 }} />
        </>
      )}
    </ScrollView>
  );
}

// ── Performance Line Chart (hand-coded SVG) ──────────────────────
function PerformanceChart({
  data, width, height,
}: {
  data: { label: string; value: number }[];
  width: number;
  height: number;
}) {
  if (!data.length) return null;

  const pL = 8, pR = 8, pT = 10, pB = 24;
  const cW = width - pL - pR;
  const cH = height - pT - pB;
  const max = Math.max(...data.map((d) => d.value), 1);

  const pts = data.map((d, i) => ({
    x: pL + (i / Math.max(data.length - 1, 1)) * cW,
    y: pT + cH - (d.value / max) * cH,
    label: d.label,
  }));

  // Cubic bezier curve through all points
  const curvePath = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = pts[i - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 3;
    const cp2x = prev.x + (2 * (pt.x - prev.x)) / 3;
    return `${acc} C ${cp1x},${prev.y} ${cp2x},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  const areaPath    = `${curvePath} L ${pts[pts.length - 1].x},${pT + cH} L ${pL},${pT + cH} Z`;
  const labelEvery  = Math.max(1, Math.ceil(data.length / 7));

  return (
    <Svg width={width} height={height}>
      <Line x1={pL} y1={pT + cH} x2={width - pR} y2={pT + cH} stroke="#F0F0F0" strokeWidth={0.5} />
      <Path d={areaPath} fill="#1A1A1A" fillOpacity={0.05} />
      <Path d={curvePath} fill="none" stroke="#1A1A1A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3} fill="#fff" stroke="#1A1A1A" strokeWidth={1.5} />
      ))}
      {pts.map((p, i) =>
        i % labelEvery === 0 ? (
          <SvgText key={i} x={p.x} y={height - 4} fontSize={8} fill="#bbb" textAnchor="middle">
            {p.label}
          </SvgText>
        ) : null
      )}
    </Svg>
  );
}

// ── Sales Bar Chart (hand-coded SVG) ─────────────────────────────
function SalesBarChart({
  data, width, height,
}: {
  data: { label: string; value: number }[];
  width: number;
  height: number;
}) {
  if (!data.length) return null;

  const pL = 8, pR = 8, pT = 4, pB = 22;
  const cW  = width - pL - pR;
  const cH  = height - pT - pB;
  const max = Math.max(...data.map((d) => d.value), 1);
  const gap = cW / data.length;
  const bW  = gap * 0.55;

  return (
    <Svg width={width} height={height}>
      <Line x1={pL} y1={pT + cH} x2={width - pR} y2={pT + cH} stroke="#F0F0F0" strokeWidth={0.5} />
      {data.map((d, i) => {
        const bH = Math.max((d.value / max) * cH, 2);
        const x  = pL + i * gap + (gap - bW) / 2;
        const y  = pT + cH - bH;
        return (
          <Rect key={i} x={x} y={y} width={bW} height={bH} fill="#1A1A1A" rx={3} />
        );
      })}
      {data.map((d, i) => {
        const x = pL + i * gap + gap / 2;
        // Only show every other label if too many bars
        if (data.length > 5 && i % 2 !== 0) return null;
        return (
          <SvgText key={i} x={x} y={height - 4} fontSize={8} fill="#bbb" textAnchor="middle">
            {d.label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// ── Top Product Card ──────────────────────────────────────────────
function TopProductCard({
  name, sales, revenue, bg,
}: {
  name: string;
  sales: number;
  revenue: number;
  bg: string;
}) {
  return (
    <View style={styles.productCard}>
      <View style={[styles.productImg, { backgroundColor: bg }]} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{name}</Text>
        <Text style={styles.productSales}>{sales} Sales</Text>
        <Text style={styles.productRevenue}>₱{revenue.toLocaleString()}</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F5F5F5', paddingHorizontal: 20 },
  navbar:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 56, marginBottom: 20 },
  brand:            { fontSize: 13, fontWeight: '700', letterSpacing: 2, color: '#1A1A1A' },
  titleRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  pageTitle:        { fontSize: 26, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.5 },
  toggle:           { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 999, padding: 3, borderWidth: 0.5, borderColor: '#E0E0E0', gap: 2 },
  toggleBtn:        { paddingHorizontal: 13, paddingVertical: 5, borderRadius: 999 },
  toggleActive:     { backgroundColor: '#1A1A1A' },
  toggleText:       { fontSize: 10, fontWeight: '700', color: '#999', letterSpacing: 0.3 },
  toggleTextActive: { color: '#fff' },
  loader:           { marginTop: 60 },
  errorBox:         { alignItems: 'center', marginTop: 40, gap: 12 },
  errorText:        { fontSize: 13, color: '#FF3B30', textAlign: 'center' },
  retryBtn:         { backgroundColor: '#1A1A1A', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999 },
  retryText:        { color: '#fff', fontWeight: '600', fontSize: 13 },
  emptyBox:         { alignItems: 'center', marginTop: 60, paddingHorizontal: 32, gap: 8 },
  emptyTitle:       { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  emptySubtext:     { fontSize: 13, color: '#aaa', textAlign: 'center', lineHeight: 20 },
  statsRow:         { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard:         { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: '#E0E0E0' },
  statLabel:        { fontSize: 9, color: '#aaa', fontWeight: '600', letterSpacing: 0.8, marginBottom: 6 },
  statValue:        { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 5 },
  changeBadge:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
  changeText:       { fontSize: 10, fontWeight: '600' },
  forecastCard:     { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forecastValue:    { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 2 },
  forecastSub:      { fontSize: 11, color: '#aaa' },
  chartCard:        { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: '#E0E0E0', marginBottom: 12 },
  chartHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  chartTitle:       { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  section:          { marginBottom: 12 },
  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle:     { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  viewAll:          { fontSize: 10, fontWeight: '600', color: '#1A1A1A' },
  productCard:      { width: 140, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: '#E0E0E0', marginRight: 10 },
  productImg:       { height: 90, width: '100%' },
  productInfo:      { padding: 10 },
  productName:      { fontSize: 11, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
  productSales:     { fontSize: 10, color: '#aaa' },
  productRevenue:   { fontSize: 10, color: '#1A1A1A', fontWeight: '600', marginTop: 2 },
});