import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cleanupOldMeals } from '@/hooks/useSupabase';
import { toast } from 'sonner';

export function useRealtimeSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const cleanupRan = useRef(false);

  // Run 30-day meal cleanup once per session
  useEffect(() => {
    if (!user || cleanupRan.current) return;
    cleanupRan.current = true;
    cleanupOldMeals(user.id).then((count) => {
      if (count > 0) {
        console.log(`[BiteSafe] Cleaned up ${count} meals older than 30 days`);
        queryClient.invalidateQueries({ queryKey: ['meals'] });
      }
    });
  }, [user, queryClient]);

  useEffect(() => {
    if (!user) return;

    let mealsChannel: ReturnType<typeof supabase.channel>;
    let glucoseChannel: ReturnType<typeof supabase.channel>;

    try {
      // Subscribe to meals table changes
      mealsChannel = supabase
        .channel('meals-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meals',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Meal synced to cloud:', payload);
          toast.success('Meal logged and synced to cloud', {
            icon: '☁️',
            duration: 3000,
          });
          queryClient.invalidateQueries({ queryKey: ['meals'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'meals',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['meals'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'meals',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['meals'] });
        }
      )
      .subscribe();

      // Subscribe to glucose_readings table changes
      glucoseChannel = supabase
      .channel('glucose-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'glucose_readings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Glucose reading synced to cloud:', payload);
          toast.success('Glucose reading saved to cloud', {
            icon: '📊',
            duration: 3000,
          });
          queryClient.invalidateQueries({ queryKey: ['glucose_readings'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'glucose_readings',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['glucose_readings'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'glucose_readings',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['glucose_readings'] });
        }
      )
      .subscribe();
    } catch {
      return;
    }

    return () => {
      if (mealsChannel) supabase.removeChannel(mealsChannel);
      if (glucoseChannel) supabase.removeChannel(glucoseChannel);
    };
  }, [user, queryClient]);
}
