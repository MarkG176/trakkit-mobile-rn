import { useState } from 'react';
import { View, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PermissionGuidance } from '@/components/PermissionGuidance';
import { Button } from '@/components/ui';
import { radius, spacing } from '@/theme';

interface CameraCaptureProps {
  onCapture: (uri: string) => void;
  label?: string;
}

export function CameraCapture({ onCapture, label = 'Take photo' }: CameraCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  const capture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setDenied(true);
      return;
    }
    setDenied(false);

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0]) {
      setPreview(result.assets[0].uri);
      onCapture(result.assets[0].uri);
    }
  };

  if (denied) {
    return <PermissionGuidance type="camera" onRetry={capture} />;
  }

  return (
    <View>
      {preview ? (
        <Image
          source={{ uri: preview }}
          style={{
            width: 128,
            height: 128,
            borderRadius: radius.full,
            alignSelf: 'center',
            marginBottom: spacing.md,
          }}
        />
      ) : null}
      <Button onPress={capture}>{label}</Button>
    </View>
  );
}
