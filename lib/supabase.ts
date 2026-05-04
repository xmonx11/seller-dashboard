import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = 'https://brzhpcgbmjcdltyojyyp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyemhwY2dibWpjZGx0eW9qeXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MDE1MTQsImV4cCI6MjA5MzE3NzUxNH0.HKvqQdhROm4A4Qh-c2dXgAgVCtnoJSDF6mQkcP86fTM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});