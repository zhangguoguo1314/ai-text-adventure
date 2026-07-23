import { create } from 'zustand';

interface AppState {
  balance: { permanent: number; temp: number };
  selectedModel: number | null;
  sidebarCollapsed: boolean;
  updateBalance: (permanent: number, temp: number) => void;
  setSelectedModel: (id: number) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  balance: { permanent: 0, temp: 0 },
  selectedModel: null,
  sidebarCollapsed: false,
  updateBalance: (permanent, temp) => set({ balance: { permanent, temp } }),
  setSelectedModel: (id) => set({ selectedModel: id }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
