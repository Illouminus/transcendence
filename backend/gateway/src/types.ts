export interface AuthUser {
  user: {
    id: number;
    is_verified: boolean;
    two_factor_enabled: boolean;
    is_google_auth: boolean;
    email: string;
  }
}


export interface UserProfile {
    id: number;
    username: string;
    avatarUrl: string;
    wins: number;
    losses: number;
    achievements: string[];
    email: string;
}

export interface Profile {
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
  two_factor_enabled: boolean;
  is_google_auth: boolean;
  avatar: string;
  wins: number;
  losses: number;
  achievements: string[];
}