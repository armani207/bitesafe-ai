import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useRealtimeSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    // Subscribe to meals table changes
    const mealsChannel = supabase
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
    const glucoseChannel = supabase
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

    return () => {
      supabase.removeChannel(mealsChannel);
      supabase.removeChannel(glucoseChannel);
    };
  }, [user, queryClient]);
}
