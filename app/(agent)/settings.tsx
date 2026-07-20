// [CRM-0101] Settings — language, background location, notifications placeholder
import { useEffect, useState, type ReactNode } from 'react';
import { Switch, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bell, Globe, MapPin } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { useAgentStatus } from '@/providers/AgentStatusProvider';
import { useLanguage, type Language } from '@/hooks/useLanguage';
import { startBackgroundTracking, stopBackgroundTracking } from '@/tasks/backgroundLocation';
import { PermissionGuidance } from '@/components/PermissionGuidance';
import { AppText, Card, Screen } from '@/components/ui';
import { colors, spacing } from '@/theme';

const BG_PREF_KEY = 'trakkit_bg_location_enabled';
const NOTIF_PREF_KEY = 'trakkit_notifications_enabled';

function SettingsRow({
  icon,
  title,
  description,
  value,
  onValueChange,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <Card style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            backgroundColor: colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <AppText style={{ fontWeight: '600', marginBottom: 4 }}>{title}</AppText>
          <AppText variant="secondary" style={{ marginBottom: spacing.sm }}>
            {description}
          </AppText>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={value ? colors.primary : colors.mutedForeground}
        />
      </View>
    </Card>
  );
}

export default function SettingsScreen() {
  const { isCheckedIn } = useAgentStatus();
  const { language, setLanguage, t } = useLanguage();
  const [bgEnabled, setBgEnabled] = useState(false);
  const [bgDenied, setBgDenied] = useState(false);
  const [notifications, setNotifications] = useState(false);

  useEffect(() => {
    void (async () => {
      const [bg, notif] = await Promise.all([
        AsyncStorage.getItem(BG_PREF_KEY),
        AsyncStorage.getItem(NOTIF_PREF_KEY),
      ]);
      setBgEnabled(bg === '1');
      setNotifications(notif === '1');
    })();
  }, []);

  const toggleLanguage = (on: boolean) => {
    const next: Language = on ? 'sw' : 'en';
    setLanguage(next);
  };

  const toggleBackground = async (on: boolean) => {
    setBgDenied(false);
    if (on) {
      if (isCheckedIn) {
        const ok = await startBackgroundTracking();
        if (!ok) {
          setBgDenied(true);
          setBgEnabled(false);
          await AsyncStorage.setItem(BG_PREF_KEY, '0');
          return;
        }
      }
      setBgEnabled(true);
      await AsyncStorage.setItem(BG_PREF_KEY, '1');
    } else {
      await stopBackgroundTracking();
      setBgEnabled(false);
      await AsyncStorage.setItem(BG_PREF_KEY, '0');
    }
  };

  const toggleNotifications = async (on: boolean) => {
    setNotifications(on);
    await AsyncStorage.setItem(NOTIF_PREF_KEY, on ? '1' : '0');
  };

  return (
    <ComponentGate code="CRM-0101">
      <Screen scroll>
        <SettingsRow
          icon={<Globe size={20} color={colors.primary} />}
          title={t('language')}
          description={
            language === 'en'
              ? 'English · Tap to switch to Kiswahili'
              : 'Kiswahili · Gusa kubadilisha kwa English'
          }
          value={language === 'sw'}
          onValueChange={toggleLanguage}
        />

        <SettingsRow
          icon={<MapPin size={20} color={colors.primary} />}
          title="Background location"
          description="Tracks your position during active shifts for supervisor visibility."
          value={bgEnabled}
          onValueChange={toggleBackground}
        />
        {bgDenied ? (
          <PermissionGuidance type="background-location" onRetry={() => toggleBackground(true)} />
        ) : null}

        <SettingsRow
          icon={<Bell size={20} color={colors.primary} />}
          title={t('notifications')}
          description="Coming soon — preference is saved locally for now."
          value={notifications}
          onValueChange={toggleNotifications}
        />
      </Screen>
    </ComponentGate>
  );
}
