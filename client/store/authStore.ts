import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Workspace } from '../lib/types';

interface AuthState {
  user: User | null;
  token: string | null;
  workspace: Workspace | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setWorkspace: (workspace: Workspace | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      workspace: null,
      setUser: (user) => set({ user }),
      setToken: (token) => {
        set({ token });
        if (typeof window !== 'undefined') {
          if (token) {
            localStorage.setItem('crm_token', token);
          } else {
            localStorage.removeItem('crm_token');
          }
        }
      },
      setWorkspace: (workspace) => set({ workspace }),
      logout: () => {
        set({ user: null, token: null, workspace: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('crm_token');
        }
      },
    }),
    {
      name: 'crm_auth', // Key used in localStorage for store persistence
    }
  )
);
