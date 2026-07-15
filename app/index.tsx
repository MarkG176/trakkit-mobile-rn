import { View } from 'react-native';
import { LoadingSpinner } from '@/components/ui';
import { colors } from '@/theme';

/** Placeholder while AuthGate routes to login or the role-specific shell. */
export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <LoadingSpinner label="Starting TraKKiT" />
    </View>
  );
}
