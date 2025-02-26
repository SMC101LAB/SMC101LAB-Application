import { useState, RefObject } from 'react';
import * as FileSystem from 'expo-file-system';
import { WebView } from 'react-native-webview';

interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
  type: string;
  fileName: string;
  dataUrl: string;
}

export function useProcessImages(webViewRef: RefObject<WebView>) {
  const [currentImagesCount, setCurrentImagesCount] = useState(0);

  // 이미지 처리 함수
  const processSelectedImages = async (assets: any[]) => {
    try {
      const processedImages = await Promise.all(
        assets.map(async (asset) => {
          try {
            // Base64로 인코딩
            const base64 = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });

            // 파일타입 MineType 수정
            const getCorrectMimeType = (fileName: any) => {
              const extension = fileName.split('.').pop()?.toLowerCase() || '';
              switch (extension) {
                case 'png':
                  return 'image/png';
                case 'gif':
                  return 'image/gif';
                case 'jpg':
                case 'jpeg':
                default:
                  return 'image/jpeg';
              }
            };
            const correctMimeType = getCorrectMimeType(
              asset.fileName || `image_${Date.now()}.jpg`
            );

            return {
              uri: asset.uri,
              width: asset.width,
              height: asset.height,
              type: correctMimeType,
              fileName: asset.fileName || `image_${Date.now()}.jpg`,
              dataUrl: `data:${correctMimeType};base64,${base64}`,
            };
          } catch (error) {
            console.error('이미지 처리 중 오류:', error);
            return null;
          }
        })
      );

      // null이 아닌 이미지만 필터링
      const validImages = processedImages.filter(
        (img) => img !== null
      ) as ProcessedImage[];

      // 현재 이미지 수 업데이트
      const newCount = Math.min(currentImagesCount + validImages.length, 5);
      setCurrentImagesCount(newCount);

      // 중요: 여기서 한 번만 메시지 전송
      if (validImages.length > 0) {
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: 'IMAGES_SELECTED',
            images: validImages,
          })
        );
      }

      return validImages;
    } catch (error) {
      console.error('이미지 처리 중 오류:', error);
      return [];
    }
  };

  const getSelectionLimit = () => {
    return 5 - currentImagesCount;
  };

  return {
    currentImagesCount,
    setCurrentImagesCount,
    processSelectedImages,
    getSelectionLimit,
  };
}
