import { User } from './user.js';

export interface AuthResponse {
  user: User;
  message?: string;
}
