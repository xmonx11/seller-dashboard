// ================================================================
// store/analyticsStore.ts
// Zustand store for seller analytics
// ================================================================

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { forecastRevenue } from '../lib/regression';

// Shape of each daily snapshot (grouped from order_items)
export type Snapshot = {
  snapshot_date: string;
  revenue: number;
  units_sold: number;
};

// Shape of each top product entry
export type TopProduct = {
  product_id: string;
  name: string;
  units_sold: number;
  revenue: number;
};

type AnalyticsState = {
  snapshots: Snapshot[];
  forecast: number;
  topProducts: TopProduct[];
  loading: boolean;
  error: string | null;
  fetchAnalytics: (sellerId: string, days: number) => Promise<void>;
};

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  snapshots:   [],
  forecast:    0,
  topProducts: [],
  loading:     false,
  error:       null,

  fetchAnalytics: async (sellerId: string, days: number) => {
    set({ loading: true, error: null });

    try {
      // ── Date range ──────────────────────────────────────────────
      const from = new Date();
      from.setDate(from.getDate() - days);
      const fromStr = from.toISOString().split('T')[0];

      // ── Step 1: Get seller's product IDs ────────────────────────
      const { data: sellerProducts, error: prodErr } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', sellerId);

      if (prodErr) throw prodErr;

      const productIds = sellerProducts?.map((p) => p.id) ?? [];

      // No products yet → clear everything gracefully
      if (!productIds.length) {
        set({ snapshots: [], forecast: 0, topProducts: [], loading: false });
        return;
      }

      // ── Step 2: Fetch order_items with product name + order date ─
      // products(name) → joins products table to get product name
      // orders!inner(ordered_at) → only items that have a valid order
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          unit_price,
          product_id,
          products(name),
          orders!inner(ordered_at)
        `)
        .in('product_id', productIds)
        .gte('orders.ordered_at', fromStr);

      if (error) throw error;

      // ── Step 3: Group by date for snapshots ─────────────────────
      const grouped: Record<string, { revenue: number; units_sold: number }> = {};

      // ── Step 4: Accumulate per-product totals for Top Products ───
      const productMap: Record<string, { name: string; units_sold: number; revenue: number }> = {};

      for (const item of data ?? []) {
        const date    = (item.orders as any).ordered_at.split('T')[0];
        const revenue = item.quantity * item.unit_price;
        const pid     = item.product_id;
        const pname   = (item.products as any)?.name ?? 'Unknown';

        // Group into daily snapshots
        if (!grouped[date]) grouped[date] = { revenue: 0, units_sold: 0 };
        grouped[date].revenue    += revenue;
        grouped[date].units_sold += item.quantity;

        // Accumulate per-product totals
        if (!productMap[pid]) productMap[pid] = { name: pname, units_sold: 0, revenue: 0 };
        productMap[pid].units_sold += item.quantity;
        productMap[pid].revenue    += revenue;
      }

      // ── Step 5: Convert grouped dates → sorted snapshot array ───
      const snapshots: Snapshot[] = Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([snapshot_date, vals]) => ({
          snapshot_date,
          revenue:    vals.revenue,
          units_sold: vals.units_sold,
        }));

      // ── Step 6: Top Products — sorted by units sold, top 5 ──────
      const topProducts: TopProduct[] = Object.entries(productMap)
        .map(([product_id, vals]) => ({ product_id, ...vals }))
        .sort((a, b) => b.units_sold - a.units_sold)
        .slice(0, 5);

      // ── Step 7: Forecast using dynamic days (NOT hardcoded 30) ──
      // This is what powers the 7-day vs 30-day toggle correctly
      const forecast = forecastRevenue(snapshots, days);

      set({ snapshots, forecast, topProducts, loading: false });

    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },
}));