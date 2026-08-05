import AsyncStorage from '@react-native-async-storage/async-storage';

const disclosureKey = (userId: string, workspaceId: string) =>
  `trakkit_bg_location_disclosure:${userId}:${workspaceId}`;

export async function hasAcknowledgedBackgroundLocationDisclosure(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const value = await AsyncStorage.getItem(disclosureKey(userId, workspaceId));
  return value === '1';
}

export async function markBackgroundLocationDisclosureAcknowledged(
  userId: string,
  workspaceId: string,
): Promise<void> {
  await AsyncStorage.setItem(disclosureKey(userId, workspaceId), '1');
}
