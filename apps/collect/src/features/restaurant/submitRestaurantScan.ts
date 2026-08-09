// apps/collect/src/features/restaurant/submitRestaurantScan.ts
import { ID } from 'appwrite';
import { databases } from '../../api/client';
import { getISOYearWeek } from '@datainsight/shared';
import type { ScanRestaurant } from '@datainsight/shared';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_COLLECTION_SCANS_RESTAURANT;

type ScanRestaurantInput = Omit<ScanRestaurant, 'timestamp' | 'year' | 'week_number' | 'day_of_week'>;

export async function submitRestaurantScan(input: ScanRestaurantInput): Promise<void> {
  const now = new Date();
  const { year, week_number, day_of_week } = getISOYearWeek(now);

  const payload: ScanRestaurant = {
    ...input,
    timestamp: now.toISOString(),
    year,
    week_number,
    day_of_week,
  };

  await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), payload);
}