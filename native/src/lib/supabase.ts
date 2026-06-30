import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// ▼▼▼▼▼ 나중에 이 부분을 실제 Supabase 키로 교체해주세요! ▼▼▼▼▼
const supabaseUrl = 'https://ibspdrfjncacwrpslckb.supabase.co/';
const supabaseAnonKey = 'sb_publishable_91-q_65KaVOQXSlATDVTmw_dJE_QLsk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});