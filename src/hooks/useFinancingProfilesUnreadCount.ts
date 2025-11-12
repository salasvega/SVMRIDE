import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useFinancingProfilesUnreadCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { count: profileCount, error } = await supabase
        .from('user_financing_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');

      if (error) {
        console.error('Error fetching financing profiles count:', error);
      } else {
        setCount(profileCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread financing profiles count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  return { count, loading, refresh: fetchUnreadCount };
}
