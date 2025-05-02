export const BASE_URL = import.meta.env.VITE_BASE_URL;
const WS_BASE = import.meta.env.VITE_WS_BASE;

export const AUTH_URL = `${BASE_URL}/auth`;
export const USER_URL = `${BASE_URL}/user`;
export const API_URL = `${BASE_URL}/api`;

export const WS_USER_URL =
  import.meta.env.VITE_WS_USER_PORT
    ? `${WS_BASE}:${import.meta.env.VITE_WS_USER_PORT}/ws`
    : `${WS_BASE}/ws/user`;

export const WS_GAME_URL =
  import.meta.env.VITE_WS_GAME_PORT
    ? `${WS_BASE}:${import.meta.env.VITE_WS_GAME_PORT}/ws`
    : `${WS_BASE}/ws/game`;

export const WS_CHAT_URL =
  import.meta.env.VITE_WS_CHAT_PORT
    ? `${WS_BASE}:${import.meta.env.VITE_WS_CHAT_PORT}/ws`
    : `${WS_BASE}/ws/chat`;