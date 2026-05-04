import { create } from 'zustand';
import { supabase } from '../lib/supabase';

type Profile = {
  id: string;
  email: string;
  role: 'buyer' | 'seller';
  full_name: string;
  phone_number?: string;
  shop_name?: string;
  shop_description?: string;
  product_category?: string;
  // ← NEW: address fields for buyer
  address_name?: string;
  address_street?: string;
  address_city?: string;
  address_postal?: string;
};

type AuthState = {
  user: any;
  profile: Profile | null;
  loading: boolean;
  loadUser: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  // ← NEW: update profile in store + Supabase
  updateProfile: (fields: Partial<Profile>) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: false,

  loadUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        set({ user, profile });
      }
    } catch (e) {
      console.log('loadUser error:', e);
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        set({ user: data.user, profile, loading: false });
      }
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  signUp: async (email, password, fullName) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            role: 'buyer',
          });
        if (insertError && insertError.code !== '23505') throw insertError;
      }
      set({ loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  // Updates profile both in Supabase and local store
  updateProfile: async (fields) => {
    const { user, profile } = get();
    if (!user || !profile) return;
    try {
      const { error } = await supabase
        .from('users')
        .update(fields)
        .eq('id', user.id);
      if (error) throw error;
      // Merge new fields into local profile state
      set({ profile: { ...profile, ...fields } });
    } catch (e) {
      console.log('updateProfile error:', e);
      throw e;
    }
  },
}));