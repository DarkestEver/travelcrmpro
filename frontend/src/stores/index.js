import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth store
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => set({ token }),
      
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      
      updateUser: (updates) => set((state) => ({
        user: { ...state.user, ...updates },
      })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Notification store
export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  
  setNotifications: (notifications) => {
    const unread = notifications.filter(n => !n.read).length;
    set({ notifications, unreadCount: unread });
  },
  
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
  })),
  
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n =>
      n._id === id ? { ...n, read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
  
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),
  
  removeNotification: (id) => set((state) => {
    const notification = state.notifications.find(n => n._id === id);
    const wasUnread = notification && !notification.read;
    
    return {
      notifications: state.notifications.filter(n => n._id !== id),
      unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    };
  }),
  
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));

// UI preferences store
export const usePreferencesStore = create(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      currency: 'USD',
      language: 'en',
      
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setDateFormat: (dateFormat) => set({ dateFormat }),
      setTimeFormat: (timeFormat) => set({ timeFormat }),
      setCurrency: (currency) => set({ currency }),
      setLanguage: (language) => set({ language }),
      
      updatePreferences: (updates) => set(updates),
    }),
    {
      name: 'preferences-storage',
    }
  )
);

// Search store
export const useSearchStore = create((set) => ({
  isOpen: false,
  query: '',
  recentSearches: [],
  
  openSearch: () => set({ isOpen: true }),
  closeSearch: () => set({ isOpen: false, query: '' }),
  setQuery: (query) => set({ query }),
  
  addRecentSearch: (search) => set((state) => ({
    recentSearches: [
      search,
      ...state.recentSearches.filter(s => s !== search).slice(0, 9),
    ],
  })),
  
  clearRecentSearches: () => set({ recentSearches: [] }),
}));

// Modal store (for managing multiple modals)
export const useModalStore = create((set) => ({
  modals: {}, // { modalName: { isOpen: boolean, data: any } }
  
  openModal: (modalName, data = null) => set((state) => ({
    modals: {
      ...state.modals,
      [modalName]: { isOpen: true, data },
    },
  })),
  
  closeModal: (modalName) => set((state) => ({
    modals: {
      ...state.modals,
      [modalName]: { isOpen: false, data: null },
    },
  })),
  
  isModalOpen: (modalName) => {
    const state = useModalStore.getState();
    return state.modals[modalName]?.isOpen || false;
  },
  
  getModalData: (modalName) => {
    const state = useModalStore.getState();
    return state.modals[modalName]?.data || null;
  },
}));

// Filter store (for persistent filters across pages)
export const useFilterStore = create(
  persist(
    (set) => ({
      filters: {}, // { pageName: { filterKey: filterValue } }
      
      setFilter: (page, key, value) => set((state) => ({
        filters: {
          ...state.filters,
          [page]: {
            ...state.filters[page],
            [key]: value,
          },
        },
      })),
      
      setFilters: (page, filters) => set((state) => ({
        filters: {
          ...state.filters,
          [page]: filters,
        },
      })),
      
      clearFilters: (page) => set((state) => ({
        filters: {
          ...state.filters,
          [page]: {},
        },
      })),
      
      clearAllFilters: () => set({ filters: {} }),
    }),
    {
      name: 'filters-storage',
    }
  )
);

// Cache store (for temporary data caching)
export const useCacheStore = create((set, get) => ({
  cache: {}, // { key: { data: any, timestamp: number, ttl: number } }
  
  setCache: (key, data, ttl = 300000) => { // Default 5 minutes TTL
    const timestamp = Date.now();
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: { data, timestamp, ttl },
      },
    }));
  },
  
  getCache: (key) => {
    const state = get();
    const cached = state.cache[key];
    
    if (!cached) return null;
    
    const now = Date.now();
    const age = now - cached.timestamp;
    
    // Check if cache is still valid
    if (age > cached.ttl) {
      // Remove expired cache
      set((state) => {
        const newCache = { ...state.cache };
        delete newCache[key];
        return { cache: newCache };
      });
      return null;
    }
    
    return cached.data;
  },
  
  invalidateCache: (key) => set((state) => {
    const newCache = { ...state.cache };
    delete newCache[key];
    return { cache: newCache };
  }),
  
  clearCache: () => set({ cache: {} }),
}));

// Sidebar/Navigation store
export const useNavigationStore = create((set) => ({
  activeRoute: '/',
  breadcrumbs: [],
  
  setActiveRoute: (route) => set({ activeRoute: route }),
  
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
  
  addBreadcrumb: (breadcrumb) => set((state) => ({
    breadcrumbs: [...state.breadcrumbs, breadcrumb],
  })),
}));

export default {
  useAuthStore,
  useNotificationStore,
  usePreferencesStore,
  useSearchStore,
  useModalStore,
  useFilterStore,
  useCacheStore,
  useNavigationStore,
};
