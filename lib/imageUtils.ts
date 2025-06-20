// @/lib/imageUtils.ts
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Alert, Platform } from "react-native";

const imageDirectory = `${FileSystem.documentDirectory}avatars/`;

async function ensureDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(imageDirectory);
  if (!dirInfo.exists) {
    try {
      await FileSystem.makeDirectoryAsync(imageDirectory, {
        intermediates: true,
      });
      console.log("Avatar directory created");
    } catch (error) {
      console.error("Could not create avatar directory.", error);
    }
  }
}

/**
 * 사용자에게 앨범에서 이미지를 선택하도록 요청하고, 임시 URI를 반환합니다.
 * @returns {Promise<string | null>} 선택된 이미지의 임시 URI 또는 null
 */
async function selectImageFromGallery(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "권한 필요",
      "페르소나 이미지를 설정하려면 사진첩 접근 권한이 필요합니다."
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0].uri;
}

/**
 * 임시 URI의 이미지 파일을 앱의 영구 디렉토리로 복사하고, 새 경로를 반환합니다.
 * @param temporaryUri ImagePicker에서 반환된 임시 URI
 * @returns {Promise<string | null>} 앱 내부에 저장된 새 파일의 영구 URI
 */
async function saveImagePermanently(
  temporaryUri: string
): Promise<string | null> {
  await ensureDirExists();
  const filename = `persona-${Date.now()}.jpg`;
  const permanentUri = imageDirectory + filename;

  try {
    await FileSystem.copyAsync({
      from: temporaryUri,
      to: permanentUri,
    });
    return permanentUri;
  } catch (error) {
    console.error("Error saving image permanently:", error);
    Alert.alert("오류", "이미지를 저장하는 데 실패했습니다.");
    return null;
  }
}

/**
 * 최종적으로 컴포넌트에서 호출할 메인 함수입니다.
 * 이미지 선택부터 로컬 저장까지의 과정을 모두 처리합니다.
 * @returns {Promise<string | null>} 최종적으로 DB에 저장될 이미지의 영구 파일 URI 또는 null
 */
export async function pickAndSaveImage(): Promise<string | null> {
  const tempUri = await selectImageFromGallery();
  if (!tempUri) {
    return null; // 사용자가 선택을 취소함
  }

  const permanentUri = await saveImagePermanently(tempUri);
  return permanentUri;
}

export async function pickAndSaveMultipleImages(
  selectionLimit: number = 20
): Promise<string[] | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "권한 필요",
      "이미지를 사용하려면 사진첩 접근 권한이 필요합니다."
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true, // The key option
    quality: 0.8,
    selectionLimit: selectionLimit, // Limit how many can be picked
  });

  if (result.canceled) {
    return null;
  }

  // Use Promise.all to save all selected images concurrently
  const savePromises = result.assets.map((asset) =>
    saveImagePermanently(asset.uri)
  );
  const permanentUris = await Promise.all(savePromises);

  // Filter out any potential nulls if an individual save failed
  return permanentUris.filter((uri): uri is string => uri !== null);
}
