// import React, { useRef, useState, useEffect } from 'react';
// import { View, Text, StyleSheet, ScrollView } from 'react-native';
// import { WebView, WebViewMessageEvent } from 'react-native-webview';
// import { useLocation } from './hooks/useLocation';
// import { useImagePicker } from './hooks/useImagePicker';
// import * as FileSystem from 'expo-file-system';

// export default function App() {
//   const webViewRef = useRef<WebView>(null);
//   const { gpsLoading, checkLocation, requestPermissions, getLocation } =
//     useLocation(webViewRef);
//   const { requestPhotoPermissions, openGallery } = useImagePicker();

//   // Track current image count if you need to limit selections
//   const [currentImagesCount, setCurrentImagesCount] = useState(0);

//   // 웹과 메시지를 주고 받는 핸들러
//   const handleMessage = async (event: WebViewMessageEvent) => {
//     try {
//       const message = JSON.parse(event.nativeEvent.data);

//       if (message.type === 'GPS_PERMISSIONS') {
//         // 기기 위치 서비스 허용 여부 확인
//         const servicesEnabled = await checkLocation();
//         if (!servicesEnabled) return;

//         // 앱 위치 정보 접근 권한 요청, 확인
//         const permissionsGranted = await requestPermissions();
//         if (!permissionsGranted) return;

//         // 사용자 위치 정보 수집 및 웹으로 전송
//         getLocation();
//       }

//       if (message.type === 'PHOTO_PERMISSIONS') {
//         const permissionGranted = await requestPhotoPermissions();
//         if (!permissionGranted) return;
//       }

//       if (message.type === 'OPEN_GALLERY') {
//         try {
//           // 먼저 권한 확인
//           const permissionGranted = await requestPhotoPermissions();
//           if (!permissionGranted) {
//             console.log('사진 권한 거부됨');
//             return;
//           }

//           // 갤러리 열기 및 결과 처리
//           const result = await openGallery({
//             selectionLimit: 5 - currentImagesCount, // 최대 5장
//             allowsEditing: false,
//           });

//           if (result && !result.canceled && result.assets) {
//             try {
//               const processedImages = await Promise.all(
//                 result.assets.map(async (asset) => {
//                   try {
//                     // Base64로 인코딩
//                     const base64 = await FileSystem.readAsStringAsync(
//                       asset.uri,
//                       {
//                         encoding: FileSystem.EncodingType.Base64,
//                       }
//                     );

//                     // 파일타입 MineType 수정
//                     const getCorrectMimeType = (fileName: any) => {
//                       const extension =
//                         fileName.split('.').pop()?.toLowerCase() || '';
//                       switch (extension) {
//                         case 'png':
//                           return 'image/png';
//                         case 'gif':
//                           return 'image/gif';
//                         case 'jpg':
//                         case 'jpeg':
//                         default:
//                           return 'image/jpeg';
//                       }
//                     };
//                     const correctMimeType = getCorrectMimeType(
//                       asset.fileName || `image_${Date.now()}.jpg`
//                     );

//                     return {
//                       uri: asset.uri,
//                       width: asset.width,
//                       height: asset.height,
//                       type: correctMimeType,
//                       fileName: asset.fileName || `image_${Date.now()}.jpg`,
//                       dataUrl: `data:${correctMimeType};base64,${base64}`,
//                     };
//                   } catch (error) {
//                     console.error('이미지 처리 중 오류:', error);
//                     return null;
//                   }
//                 })
//               );

//               // null이 아닌 이미지만 필터링
//               const validImages = processedImages.filter((img) => img !== null);

//               // 현재 이미지 수 업데이트
//               const newCount = Math.min(
//                 currentImagesCount + validImages.length,
//                 5
//               );
//               setCurrentImagesCount(newCount);

//               // 중요: 여기서 한 번만 메시지 전송
//               if (validImages.length > 0) {
//                 webViewRef.current?.postMessage(
//                   JSON.stringify({
//                     type: 'IMAGES_SELECTED',
//                     images: validImages,
//                   })
//                 );
//               }
//             } catch (error) {
//               console.error('이미지 처리 중 오류:', error);
//             }
//           }
//         } catch (error) {
//           console.error('갤러리 열기 오류:', error);
//         }
//       }
//     } catch (error) {
//       console.error('메시지 처리 오류:', error);
//     }
//   };

//   return (
//     <WebView
//       ref={webViewRef}
//       source={{ uri: 'https://smc101lab.com' }}
//       onMessage={handleMessage}
//       geolocationEnabled={true}
//       javaScriptEnabled={true}
//       domStorageEnabled={true}
//       userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"
//       onError={(syntheticEvent) => {
//         const { nativeEvent } = syntheticEvent;
//         console.error('WebView error: ', nativeEvent);
//       }}
//     />
//   );
// }
import React, { useRef, useState } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useLocation } from './hooks/useLocation';
import { useImagePicker } from './hooks/useImagePicker';
import { useProcessImages } from './hooks/useProcessImages';

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
    />
  );
}
