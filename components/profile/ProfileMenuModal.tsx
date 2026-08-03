/**
 * TopBar avatar menu — same identity card as the profile page, in AppAlert chrome.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ProfileIdentityCard,
  displayNameFromEmail,
  formatProfileDate,
} from '@/components/profile/ProfileIdentityCard';
import { IconButton } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { card, colors, spacing } from '@/theme';

const DIALOG_MS = 200;
const NO_TEAM_LABEL = 'No Team Assigned';

type ProfileMenuModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email?: string | null;
  showProfile?: boolean;
  onProfile?: () => void;
  onSignOut: () => void;
};

export function ProfileMenuModal({
  open,
  onOpenChange,
  email,
  showProfile = false,
  onProfile,
  onSignOut,
}: ProfileMenuModalProps) {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [mounted, setMounted] = useState(false);
  const [teamName, setTeamName] = useState<string | null>(null);
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(0)).current;
  const closingRef = useRef(false);

  useEffect(() => {
    const loadTeamName = async () => {
      if (!user?.id || !currentWorkspaceId) {
        setTeamName(null);
        return;
      }

      const { data } = await supabase
        .from('team_members')
        .select('teams:team_id(name)')
        .eq('agent_id', user.id)
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_active', true)
        .maybeSingle();

      setTeamName((data?.teams as { name?: string | null } | null)?.name ?? null);
    };

    void loadTeamName();
  }, [user?.id, currentWorkspaceId]);

  useEffect(() => {
    if (open) {
      closingRef.current = false;
      setMounted(true);
      overlayAnim.setValue(0);
      panelAnim.setValue(0);
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: DIALOG_MS,
          useNativeDriver: true,
        }),
        Animated.timing(panelAnim, {
          toValue: 1,
          duration: DIALOG_MS,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!mounted || closingRef.current) return;
    closingRef.current = true;
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: DIALOG_MS,
        useNativeDriver: true,
      }),
      Animated.timing(panelAnim, {
        toValue: 0,
        duration: DIALOG_MS,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
        closingRef.current = false;
      }
    });
  }, [open, mounted, overlayAnim, panelAnim]);

  const dismiss = () => onOpenChange(false);

  const panelScale = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });
  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            opacity: overlayAnim,
          }}
        />

        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={dismiss}
          accessibilityLabel="Dismiss"
        />

        <Animated.View
          style={{
            width: '78%',
            maxWidth: 320,
            opacity: panelAnim,
            transform: [{ scale: panelScale }, { translateY: panelTranslateY }],
            zIndex: 1,
            elevation: 16,
          }}
        >
          <View style={[card.container, { padding: 0 }]}>
            <ProfileIdentityCard
              withCard={false}
              name={displayNameFromEmail(email)}
              dateLabel={formatProfileDate()}
              subtitle={teamName?.trim() || NO_TEAM_LABEL}
            />

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                gap: spacing.lg,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
              }}
            >
              {showProfile && onProfile ? (
                <IconButton
                  accessibilityLabel="Profile"
                  onPress={() => {
                    dismiss();
                    onProfile();
                  }}
                  style={{ backgroundColor: colors.primaryLight }}
                >
                  <Ionicons name="person-outline" size={22} color={colors.primary} />
                </IconButton>
              ) : null}

              <IconButton
                accessibilityLabel="Sign Out"
                onPress={() => {
                  dismiss();
                  onSignOut();
                }}
                style={{ backgroundColor: '#FFE5E3' }}
              >
                <Ionicons name="log-out-outline" size={22} color={colors.destructive} />
              </IconButton>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
