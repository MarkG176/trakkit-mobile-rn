import AsyncStorage from '@react-native-async-storage/async-storage';

const tourSeenKey = (userId: string, workspaceId: string) =>
  `trakkit_app_tour_seen:${userId}:${workspaceId}`;

export async function hasSeenAppTour(userId: string, workspaceId: string): Promise<boolean> {
  const value = await AsyncStorage.getItem(tourSeenKey(userId, workspaceId));
  return value === '1';
}

export async function markAppTourSeen(userId: string, workspaceId: string): Promise<void> {
  await AsyncStorage.setItem(tourSeenKey(userId, workspaceId), '1');
}
