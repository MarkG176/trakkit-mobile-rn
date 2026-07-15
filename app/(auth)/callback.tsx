import { useEffect } from 'react';
import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { createSessionFromUrl } from '@/utils/oauth';
import { LoadingSpinner } from '@/components/ui';
import { colors } from '@/theme';

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
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <LoadingSpinner label="Signing in" />
    </View>
  );
}
