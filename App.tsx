import { WebView } from 'react-native-webview';
import { useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { StyleSheet, SafeAreaView } from 'react-native';

export default function App() {
  // 안드로이드에서 위치 권한 요청
  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: '위치 권한 필요',
              message: '지도 기능을 사용하기 위해 위치 권한이 필요합니다.',
              buttonNeutral: '나중에 묻기',
              buttonNegative: '취소',
              buttonPositive: '허용',
            }
          );
          console.log('위치 권한 상태:', granted);
        } catch (err) {
          console.warn(err);
        }
      }
    };

    requestLocationPermission();
  }, []);

  const INJECTED_JAVASCRIPT = `
    (function() {
      navigator.geolocation.getCurrentPosition(
        function(position) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type: 'location', position}));
          console.log('위치 정보 가져오기 성공');
        },
        function(error) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type: 'error', error}));
          console.log('위치 정보 가져오기 실패: ' + error.message);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
      true;
    })();
  `;

  return (
    <WebView
      source={{ uri: 'https://smc101lab.com' }}
      geolocationEnabled={true}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
      onError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.error('WebView error: ', nativeEvent);
      }}
      injectedJavaScript={INJECTED_JAVASCRIPT}
      onMessage={(event) => {
        console.log('WebView message received:', event.nativeEvent.data);
      }}
    />
  );
}
