import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SALON_CONFIG } from "@/config/brand";

/**
 * Hook to fetch the business contact phone number dynamically.
 * It tries to fetch the profile of the primary admin.
 * Fallback to SALON_CONFIG if not found or during loading.
 */
export const useBusinessContact = () => {
  const [phone, setPhone] = useState(localStorage.getItem('bizPhone') || SALON_CONFIG.phoneNumber);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminPhone = async () => {
      try {
        const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || "quruxdumar49@gmail.com").split(',').map((e: string) => e.trim().toLowerCase());
        const primaryAdminEmail = adminEmails[0];

        if (primaryAdminEmail) {
          const { data, error } = await supabase
            .from('profiles')
            .select('phone')
            .eq('email', primaryAdminEmail)
            .maybeSingle();

          if (data?.phone && !error) {
            let normalized = data.phone.replace(/\+/g, '').replace(/\s+/g, '');
            if (!normalized.startsWith('252') && normalized.length >= 7) {
              normalized = '252' + normalized;
            }
            setPhone(normalized);
            // Sync with localStorage for quick subsequent loads
            localStorage.setItem('bizPhone', normalized);
          }
        }
      } catch (err) {
        console.error("Error fetching business phone:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminPhone();
  }, []);

  return { phone, loading };
};
