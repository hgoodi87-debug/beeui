/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_NAVER_MAP_CLIENT_ID?: string;
  readonly VITE_RECAPTCHA_SITE_KEY?: string;
  readonly VITE_GOOGLE_CHAT_WEBHOOK_URL?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_ADMIN_AUTH_PROVIDER?: 'firebase' | 'supabase';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
