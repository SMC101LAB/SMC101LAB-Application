import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

export function useImagePicker() {
  // 사진 라이브러리 접근 권한 요청
  const requestPhotoPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        '사진 접근 권한 거부',
        '사진 접근 권한이 필요합니다.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '설정으로 이동',
            onPress: () => {
              Linking.openSettings();
            },
          },
        ],
        { cancelable: false }
      );
      return false;
    }
    return true;
  };

  // 갤러리 열기 함수
  const openGallery = async (
    options: {
      selectionLimit?: number;
      allowsEditing?: boolean;
    } = {}
  ) => {
    try {
      // iOS에서는 설정에 따라 선택 제한을 조정
      const selectionLimit =
        Platform.OS === 'ios'
          ? options.selectionLimit && options.selectionLimit > 0
            ? options.selectionLimit
            : undefined
          : options.selectionLimit || 5;

      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? false,
        aspect: [4, 3],
        quality: 1,
        allowsMultipleSelection: true,
      };

      // 선택 제한이 있는 경우만 설정 (일부 기기에서 호환성 문제가 있을 수 있음)
      if (selectionLimit && selectionLimit > 0) {
        pickerOptions.selectionLimit = selectionLimit;
      }

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      console.log(
        'ImagePicker 결과:',
        result.canceled ? '취소됨' : '이미지 선택됨'
      );
      return result;
    } catch (error) {
      console.error('갤러리 열기 오류:', error);
      Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
      return null;
    }
  };

  return {
    requestPhotoPermissions,
    openGallery,
  };
}
