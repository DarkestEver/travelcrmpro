/**
 * Customer Authentication Store
 * Zustand store for customer authentication state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCustomerAuthStore = create(
  persist(
    (set, get) => ({
      customerUser: null,
      customerToken: null,
      isAuthenticated: false,

      /**
       * Set customer auth data
       */
      setCustomerAuth: (user, token) => {
        set({
          customerUser: user,
          customerToken: token,
          isAuthenticated: true,
        });
        localStorage.setItem('customerToken', token);
        localStorage.setItem('customerUser', JSON.stringify(user));
      },

      /**
       * Clear customer auth data
       */
      clearCustomerAuth: () => {
        set({
          customerUser: null,
          customerToken: null,
          isAuthenticated: false,
        });
        localStorage.removeItem('customerToken');
        localStorage.removeItem('customerUser');
      },

      /**
       * Update customer profile
       */
      updateCustomerProfile: (updates) => {
        const currentUser = get().customerUser;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates };
          set({ customerUser: updatedUser });
          localStorage.setItem('customerUser', JSON.stringify(updatedUser));
        }
      },

      /**
       * Get customer token
       */
      getCustomerToken: () => {
        return get().customerToken || localStorage.getItem('customerToken');
      },

      /**
       * Check if customer is authenticated
       */
      isCustomerAuthenticated: () => {
        const token = get().getCustomerToken();
        return !!token;
      },
    }),
    {
      name: 'customer-auth-storage',
    }
  )
);
