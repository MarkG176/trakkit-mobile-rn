import { useEffect } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { createSessionFromUrl } from '@/utils/oauth';

export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = async (url: string) => {
      try {
        await createSessionFromUrl(url);
      } catch (error) {
        Alert.alert(
          'Sign in failed',
          error instanceof Error ? error.message : 'Could not complete Google sign-in.',
        );
        router.replace('/(auth)/login');
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}
