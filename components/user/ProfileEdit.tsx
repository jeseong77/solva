import { useAppStore } from "@/store/store";
import { User } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";
import { pickAndSaveImage } from "@/lib/imageUtils";

export default function ProfileEdit() {
  const router = useRouter();

  // 스토어에서 현재 user 정보와 updateUser 액션을 가져옵니다.
  const { user, updateUser } = useAppStore(
    useShallow((state) => ({
      user: state.user,
      updateUser: state.updateUser,
    }))
  );

  // --- UI 및 데이터 상태 관리 ---
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [location, setLocation] = useState("");
  const [avatarImageUri, setAvatarImageUri] = useState<string | undefined>();
  const [coverImageUri, setCoverImageUri] = useState<string | undefined>();

  const [hasChanges, setHasChanges] = useState(false); // 변경 여부 감지
  const [isSaving, setIsSaving] = useState(false);

  // --- 데이터 로딩 ---
  // 화면에 들어올 때 스토어의 user 데이터로 상태를 초기화합니다.
  useFocusEffect(
    useCallback(() => {
      if (user) {
        setDisplayName(user.displayName);
        setBio(user.bio || "");
        setIntroduction(user.introduction || "");
        setLocation(user.location || "");
        setAvatarImageUri(user.avatarImageUri);
        setCoverImageUri(user.coverImageUri);
      }
      // 화면에 들어올 때는 변경사항이 없는 상태로 시작
      setHasChanges(false);
    }, [user])
  );

  // --- 핸들러 함수 ---
  // 입력 필드 값이 변경될 때, 상태와 함께 '변경 여부'도 업데이트합니다.
  const createChangeHandler =
    <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (value: T) => {
      setter(value);
      setHasChanges(true);
    };

  const handleDisplayNameChange = createChangeHandler(setDisplayName);
  const handleBioChange = createChangeHandler(setBio);
  const handleIntroductionChange = createChangeHandler(setIntroduction);
  const handleLocationChange = createChangeHandler(setLocation);

  const handleCoverImageChange = async () => {
    const newUri = await pickAndSaveImage();
    if (newUri) {
      setCoverImageUri(newUri);
      setHasChanges(true);
    }
  };

  const handleAvatarImageChange = async () => {
    const newUri = await pickAndSaveImage();
    if (newUri) {
      setAvatarImageUri(newUri);
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      Alert.alert("이름 필요", "이름은 필수 항목입니다.");
      return;
    }

    setIsSaving(true);

    const updatedUser: User = {
      ...user,
      displayName: displayName.trim(),
      bio: bio.trim(),
      introduction: introduction.trim(),
      location: location.trim(),
      avatarImageUri,
      coverImageUri,
      // 링크(links) 수정 기능은 추후 이 곳에 추가
    };

    const result = await updateUser(updatedUser);
    setIsSaving(false);

    if (result) {
      Alert.alert("성공", "프로필이 저장되었습니다.");
      router.back();
    } else {
      Alert.alert("오류", "프로필 저장에 실패했습니다.");
    }
  };

  // User 데이터 로딩 전 UI
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* --- 커스텀 헤더 --- */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Feather name="x" size={24} color="#343a40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 편집</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
        >
          <Text
            style={[
              styles.headerSaveButton,
              (!hasChanges || isSaving) && styles.headerSaveButtonDisabled,
            ]}
          >
            {isSaving ? "저장 중..." : "저장"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          {/* 커버 이미지 */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleCoverImageChange}
          >
            <ImageBackground
              source={coverImageUri ? { uri: coverImageUri } : undefined}
              style={styles.coverImage}
            >
              <Feather name="camera" size={24} color="rgba(255,255,255,0.8)" />
            </ImageBackground>
          </TouchableOpacity>

          {/* 아바타 및 이름 */}
          <View style={styles.profileSection}>
            <TouchableOpacity onPress={handleAvatarImageChange}>
              <View style={styles.avatar}>
                {avatarImageUri ? (
                  <Image
                    source={{ uri: avatarImageUri }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Feather name="user" size={40} color="#adb5bd" />
                )}
              </View>
            </TouchableOpacity>
            <TextInput
              style={styles.inputDisplayName}
              value={displayName}
              onChangeText={handleDisplayNameChange}
              placeholder="이름"
            />
          </View>

          {/* 나머지 입력 필드 */}
          <View style={styles.formSection}>
            <Text style={styles.label}>한 줄 소개 (Bio)</Text>
            <TextInput
              style={styles.input}
              value={bio}
              onChangeText={handleBioChange}
              placeholder="자신을 한 문장으로 표현해보세요"
            />

            <Text style={styles.label}>지역</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={handleLocationChange}
              placeholder="활동 지역 (예: Seoul, Korea)"
            />

            <Text style={styles.label}>자기소개</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={introduction}
              onChangeText={handleIntroductionChange}
              placeholder="자신에 대해 더 자세히 알려주세요"
              multiline
            />
            {/* TODO: 링크 수정 UI 추가 */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  customHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerButton: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  headerSaveButton: { fontSize: 16, fontWeight: "bold", color: "#007AFF" },
  headerSaveButtonDisabled: { color: "#adb5bd" },
  scrollView: { flex: 1 },
  coverImage: {
    width: "100%",
    height: 180, // ✅ 요청하신 높이
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
  },
  profileSection: {
    paddingHorizontal: 16,
    marginTop: -40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f1f3f5",
    borderWidth: 3,
    borderColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  inputDisplayName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
    marginTop: 12,
    borderBottomWidth: 1,
    borderColor: "#dee2e6",
    paddingBottom: 8,
  },
  formSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    color: "#212529",
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
});
