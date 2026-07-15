import { ReactNode, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';
import { colors } from '@/theme';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {children}
    </SafeAreaProvider>
  );
}

export const TAB_BAR_HEIGHT = 64;

export function getTabBarStyle(bottomInset: number) {
  return {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: TAB_BAR_HEIGHT + bottomInset,
    paddingBottom: bottomInset,
  };
}
