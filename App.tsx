import React, { useRef, useState } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import {
  Platform,
  PermissionsAndroid,
  Alert,
  Linking,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import * as Location from 'expo-location';

export default function App() {
  const [gpsLoading, setGpsLoading] = useState(false);
  const webViewRef = useRef<WebView>(null);

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

  // 웹과 메시지를 주고 받는 핸들러
  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === 'GPS_PERMISSIONS') {
        console.log('위치 권한 요청 받음');

        // 기기 위치 서비스 허용 여부 확인
        const servicesEnabled = await checkLocation();
        if (!servicesEnabled) return;

        // 앱 위치 정보 접근 권한 요청, 확인
        const permissionsGranted = await requestPermissions();
        if (!permissionsGranted) return;

        // 사용자 위치 정보 수집 및 웹으로 전송
        getLocation();
      }
    } catch (error) {
      console.error('메시지 처리 오류:', error);
    }
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: 'https://smc101lab.com' }}
      onMessage={handleMessage}
      geolocationEnabled={true}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
      onError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.error('WebView error: ', nativeEvent);
      }}
      injectedJavaScript={`
          console.log = function(message) {
            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'console.log', message: message}));
          };
          console.error = function(message) {
            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'console.error', message: message}));
          };
          console.warn = function(message) {
            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'console.warn', message: message}));
          };
          true;
        `}
    />
  );
}
