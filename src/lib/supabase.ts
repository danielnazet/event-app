import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://toqnbquylflwxxqoiykd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcW5icXV5bGZsd3h4cW9peWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NDYxOTUsImV4cCI6MjA1NzUyMjE5NX0.7STB7rbvJHz3Cg7332E3-p6nd6bgceggvG-9Vby547s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 