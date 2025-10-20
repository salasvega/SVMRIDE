import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useUnreadCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const tables = [
        'contact_submissions',
        'trade_in_submissions',
        'custom_search_submissions',
        'financing_submissions'
      ];

      let totalCount = 0;

      for (const table of tables) {
        const { count: tableCount, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('status', 'new');

        if (error) {
          console.error(`Error fetching count from ${table}:`, error);
        } else {
          totalCount += tableCount || 0;
        }
      }

      setCount(totalCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
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
