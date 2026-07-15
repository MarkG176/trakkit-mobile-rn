import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { PermissionRequestDialog } from '@/components/PermissionRequestDialog';
import { isPermissionDismissed } from '@/utils/permissionUtils';

const PROMPT_TYPES = ['camera', 'location', 'storage'] as const;

interface PermissionRequestProviderProps {
  children: ReactNode;
}

export function PermissionRequestProvider({ children }: PermissionRequestProviderProps) {
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user || checked) return;

    let cancelled = false;

    const evaluate = async () => {
      const dismissed = await Promise.all(PROMPT_TYPES.map((type) => isPermissionDismissed(type)));
      if (!cancelled && !dismissed.every(Boolean)) {
        setShowDialog(true);
      }
      if (!cancelled) setChecked(true);
    };

    evaluate();
    return () => {
      cancelled = true;
    };
  }, [user, checked]);

  return (
    <>
      <PermissionRequestDialog
        visible={showDialog}
        onClose={() => setShowDialog(false)}
        onDismiss={() => setShowDialog(false)}
      />
      {children}
    </>
  );
}
