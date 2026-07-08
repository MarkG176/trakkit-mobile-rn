import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PermissionGuidance } from '@/components/PermissionGuidance';

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
      {preview && (
        <Image source={{ uri: preview }} className="mb-3 h-32 w-32 self-center rounded-full" />
      )}
      <TouchableOpacity className="rounded-xl bg-blue-600 px-4 py-3" onPress={capture}>
        <Text className="text-center font-semibold text-white">{label}</Text>
      </TouchableOpacity>
    </View>
  );
}
