export interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
}
