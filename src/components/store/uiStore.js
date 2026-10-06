import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Always force light mode on every page load
document.documentElement.classList.remove('dark');

export const useUIStore = create(
  persist(
    (set) => ({
      theme: 'light',
      language: 'vi',
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      commandPaletteOpen: false,

      setTheme: (theme) => {
        // Force light only — ignore dark requests to keep consistent UI
        set({ theme: 'light' });
        document.documentElement.classList.remove('dark');
      },
      setLanguage: (language) => set({ language }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarMobileOpen: (val) => set({ sidebarMobileOpen: val }),
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
    }),
    {
      name: 'stockpilot-ui',
      partialize: (state) => ({ theme: 'light', language: state.language, sidebarCollapsed: state.sidebarCollapsed }),
      onRehydrateStorage: () => (state) => {
        // After hydrating from localStorage, always enforce light mode
        if (state) {
          state.theme = 'light';
          document.documentElement.classList.remove('dark');
        }
      },
    }
  )
);
