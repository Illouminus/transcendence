interface ImportMetaEnv {
    readonly VITE_YOUR_URL: string;
    readonly VITE_REALM: string;
    readonly VITE_CLIENT_ID: string;
    readonly VITE_CLIENT_SECRET: string;
    readonly VITE_API_URL: string;
    readonly VITE_AUTH_URL: string;
    readonly VITE_BASE_URL: string;
    readonly VITE_WS_BASE: string;
    readonly VITE_WS_USER_PORT: number;
    readonly VITE_WS_GAME_PORT: number;
    readonly VITE_WS_CHAT_PORT: number;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }