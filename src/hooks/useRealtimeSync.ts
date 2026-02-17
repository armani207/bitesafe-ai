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
        queryClient.invalidateQueries({ queryKey: ['meals', user.id] });
      }
    });
  }, [user, queryClient]);

  useEffect(() => {
    if (!user) return;

    const userId = user.id;
    let mealsChannel: ReturnType<typeof supabase.channel>;
    let glucoseChannel: ReturnType<typeof supabase.channel>;

    try {
      mealsChannel = supabase
        .channel('meals-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meals',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          toast.success('Meal logged and synced to cloud', {
            icon: '☁️',
            duration: 3000,
          });
          queryClient.invalidateQueries({ queryKey: ['meals', userId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'meals',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['meals', userId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'meals',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['meals', userId] });
        }
      )
      .subscribe();

      glucoseChannel = supabase
      .channel('glucose-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'glucose_readings',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          toast.success('Glucose reading saved to cloud', {
            icon: '📊',
            duration: 3000,
          });
          queryClient.invalidateQueries({ queryKey: ['glucose_readings', userId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'glucose_readings',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['glucose_readings', userId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'glucose_readings',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['glucose_readings', userId] });
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
