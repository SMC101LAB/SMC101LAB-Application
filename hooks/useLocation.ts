import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';
import { useState, RefObject } from 'react';
import { WebView } from 'react-native-webview';

export function useLocation(webViewRef: RefObject<WebView>) {
  const [gpsLoading, setGpsLoading] = useState(false);

  // 위치 서비스 허용 여부 확인
  const checkLocation = async () => {
    const isEnabled = await Location.hasServicesEnabledAsync();
    if (!isEnabled) {
      Alert.alert(
        '위치 서비스 사용',
        '위치 서비스를 사용할 수 없습니다. "기기의 설정 > 개인 정보 보호" 에서 위치서비스를 켜주세요.',
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

  // 앱의 위치 접근 권한 요청
  const requestPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        '위치 정보 접근 거부',
        '위치 권한이 필요합니다.',
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

  // 사용자 위치 정보 수집 및 웹으로 전송
  const getLocation = async () => {
    try {
      setGpsLoading(true);
      let locationSubscription = await Location.watchPositionAsync(
        {
          distanceInterval: 1,
          accuracy: Location.Accuracy.Highest,
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          if (webViewRef.current) {
            webViewRef.current.postMessage(
              JSON.stringify({ latitude, longitude })
            );
          }
        }
      );

      // 컴포넌트가 언마운트될 때 구독 해제를 위해 반환하면 좋습니다
      return locationSubscription;
    } catch (error) {
      console.error('위치 정보 획득 오류:', error);
    } finally {
      setGpsLoading(false);
    }
  };

  return { gpsLoading, checkLocation, requestPermissions, getLocation };
}
