import { useEffect, useState } from 'react';
import { requestApi } from '../utils/api';

export type TimeSlot = {
  id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  booked_count: number;
  remaining_count: number;
};

export function useTimeSlots() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadTimeSlots() {
      try {
        setLoading(true);
        setErrorMsg('');

        const data = await requestApi<TimeSlot[]>('/api/time-slot');
        if (!ignore) {
          setTimeSlots(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!ignore) {
          setTimeSlots([]);
          setErrorMsg(error instanceof Error ? error.message : '时段加载失败');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadTimeSlots();

    return () => {
      ignore = true;
    };
  }, []);

  return { timeSlots, loading, errorMsg };
}
