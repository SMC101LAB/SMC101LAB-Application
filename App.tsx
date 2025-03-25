import React, { useRef, useEffect } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useLocation } from './hooks/useLocation';
import { useImagePicker } from './hooks/useImagePicker';
import { useProcessImages } from './hooks/useProcessImages';
import * as SplashScreen from 'expo-splash-screen';

// 스플래시 스크린 자동 숨김 방지
SplashScreen.preventAutoHideAsync();

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const { gpsLoading, checkLocation, requestPermissions, getLocation } =
    useLocation(webViewRef);
  const { requestPhotoPermissions, openGallery } = useImagePicker();
  const { processSelectedImages, getSelectionLimit } =
    useProcessImages(webViewRef);

  // 웹과 메시지를 주고 받는 핸들러
  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === 'GPS_PERMISSIONS') {
        // 기기 위치 서비스 허용 여부 확인
        const servicesEnabled = await checkLocation();
        if (!servicesEnabled) return;

        // 앱 위치 정보 접근 권한 요청, 확인
        const permissionsGranted = await requestPermissions();
        if (!permissionsGranted) return;

        // 사용자 위치 정보 수집 및 웹으로 전송
        getLocation();
      }

      if (message.type === 'PHOTO_PERMISSIONS') {
        const permissionGranted = await requestPhotoPermissions();
        if (!permissionGranted) return;
      }

      if (message.type === 'OPEN_GALLERY') {
        try {
          // 먼저 권한 확인
          const permissionGranted = await requestPhotoPermissions();
          if (!permissionGranted) {
            console.log('사진 권한 거부됨');
            return;
          }

          // 갤러리 열기 및 결과 처리
          const result = await openGallery({
            selectionLimit: getSelectionLimit(), // 최대 5장
            allowsEditing: false,
          });

          if (result && !result.canceled && result.assets) {
            // 이미지 처리 로직을 훅으로 분리
            await processSelectedImages(result.assets);
          }
        } catch (error) {
          console.error('갤러리 열기 오류:', error);
        }
      }
    } catch (error) {
      console.error('메시지 처리 오류:', error);
    }
  };

  // WebView가 로드되면 스플래시 스크린 숨기기
  const handleWebViewLoaded = () => {
    SplashScreen.hideAsync();
    console.log('WebView 로드 완료 - 스플래시 스크린 숨김');
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: 'https://smc101lab.com' }}
      onMessage={handleMessage}
      onLoadEnd={handleWebViewLoaded} // 웹뷰 로드 완료시 호출
      geolocationEnabled={true}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
      onError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.error('WebView error: ', nativeEvent);
      }}
    />
  );
}
