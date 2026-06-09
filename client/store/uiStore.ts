import { create } from 'zustand';

interface UiState {
  isSidebarOpen: boolean;
  isLoading: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  isSidebarOpen: true,
  isLoading: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setLoading: (isLoading) => set({ isLoading }),
}));
