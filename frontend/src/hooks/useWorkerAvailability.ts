import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

export interface WorkerAvailability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export const useWorkerAvailability = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<WorkerAvailability[]>([]);
  const [todayAppointments, setTodayAppointments] = useState([]);

  useEffect(() => {
    if (user) {
      fetchAvailabilityData();
    }
  }, [user]);

  const fetchAvailabilityData = async () => {
    try {
      setLoading(true);

      // Fetch worker availability data from backend
      const response = await apiClient.get(`/worker-availability/${user?.id}`);
      const data = response.data;

      setAvailability(data.availability);
      setTodayAppointments(data.todayAppointments);

    } catch (error) {
      console.error('Error fetching availability data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayNumber: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  };

  const getWeekAvailability = () => {
    const week = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      
      const dayOfWeek = currentDay.getDay();
      const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek);
      
      week.push({
        date: currentDay,
        dayName: getDayName(dayOfWeek),
        shortName: getDayName(dayOfWeek).substring(0, 3),
        availability: dayAvailability,
        isToday: currentDay.toDateString() === today.toDateString()
      });
    }

    return week;
  };

  return {
    loading,
    availability,
    todayAppointments,
    weekAvailability: getWeekAvailability(),
    refetch: fetchAvailabilityData
  };
};