import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const TenantBrandingContext = createContext(null);

export const useTenantBranding = () => {
  const context = useContext(TenantBrandingContext);
  if (!context) {
    throw new Error('useTenantBranding must be used within TenantBrandingProvider');
  }
  return context;
};

export const TenantBrandingProvider = ({ children }) => {
  const [brandingApplied, setBrandingApplied] = useState(false);

  // Check if user is authenticated (has token)
  const hasToken = () => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('auth-token');
    return !!token;
  };

  // Fetch current tenant settings
  const { data: tenantData, isLoading, error } = useQuery({
    queryKey: ['tenant', 'branding'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/tenants/current');
        return data.data.tenant;
      } catch (err) {
        console.warn('Failed to fetch tenant branding:', err.message);
        // Return default values instead of throwing
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
    // Only fetch when user is authenticated to avoid 401 errors on login page
    enabled: hasToken(),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Apply branding to CSS variables
  useEffect(() => {
    if (tenantData?.settings?.branding) {
      const { primaryColor, secondaryColor } = tenantData.settings.branding;
      
      // Set CSS custom properties for dynamic theming
      const root = document.documentElement;
      
      if (primaryColor) {
        root.style.setProperty('--color-primary', primaryColor);
        root.style.setProperty('--color-primary-rgb', hexToRgb(primaryColor));
      }
      
      if (secondaryColor) {
        root.style.setProperty('--color-secondary', secondaryColor);
        root.style.setProperty('--color-secondary-rgb', hexToRgb(secondaryColor));
      }
      
      setBrandingApplied(true);
    }
  }, [tenantData]);

  // Helper function to convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0, 0, 0';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  };

  const value = {
    tenant: tenantData,
    branding: tenantData?.settings?.branding || {},
    contact: tenantData?.settings?.contact || {},
    isLoading: false, // Never block UI with loading state
    error,
    brandingApplied,
    // Helper getters with fallbacks
    logo: tenantData?.settings?.branding?.logo || null,
    companyName: tenantData?.settings?.branding?.companyName || 'Travel CRM',
    primaryColor: tenantData?.settings?.branding?.primaryColor || '#4F46E5',
    secondaryColor: tenantData?.settings?.branding?.secondaryColor || '#06B6D4',
  };

  return (
    <TenantBrandingContext.Provider value={value}>
      {children}
    </TenantBrandingContext.Provider>
  );
};

export default TenantBrandingContext;
