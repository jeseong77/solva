// components/profile/ProfileEdit.tsx (가정된 파일 경로)

import { pickAndSaveImage } from "@/lib/imageUtils";
import { useAppStore } from "@/store/store";
import { User, UserLink } from "@/types";
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

// 재사용 가능한 입력 필드 행 컴포넌트
const FormRow = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  autoCapitalize = "none",
  keyboardType = "default",
  numberOfLines,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "url" | "email-address";
  numberOfLines?: number; // ✅ multiline을 위해 추가
}) => (
  <View style={[styles.formRow, multiline && styles.formRowMultiline]}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.inputMultiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#adb5bd"
      multiline={multiline}
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
      numberOfLines={numberOfLines}
      autoCorrect={false}
      textContentType={keyboardType === "url" ? "URL" : "none"}
    />
  </View>
);

const LINK_PLATFORMS: UserLink["platform"][] = [
  "website",
  "github",
  "linkedin",
  "twitter",
  "instagram",
];

export default function ProfileEdit() {
  const router = useRouter();

  const { user, updateUser } = useAppStore(
    useShallow((state) => ({
      user: state.user,
      updateUser: state.updateUser,
    }))
  );

  // --- UI 및 데이터 상태 관리 ---
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [introduction, setIntroduction] = useState(""); // ✅ 자기소개 상태 추가
  const [location, setLocation] = useState(""); // ✅ 지역 상태 추가
  const [links, setLinks] = useState<Record<string, string>>({});
  const [avatarImageUri, setAvatarImageUri] = useState<string | undefined>();
  const [coverImageUri, setCoverImageUri] = useState<string | undefined>();

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- 데이터 로딩 ---
  useFocusEffect(
    useCallback(() => {
      if (user) {
        setDisplayName(user.displayName);
        setBio(user.bio || "");
        setIntroduction(user.introduction || ""); // ✅ 자기소개 로딩 추가
        setLocation(user.location || ""); // ✅ 지역 로딩 추가
        setAvatarImageUri(user.avatarImageUri);
        setCoverImageUri(user.coverImageUri);

        const existingLinks = user.links?.reduce((acc, link) => {
          acc[link.platform] = link.url;
          return acc;
        }, {} as Record<string, string>);
        setLinks(existingLinks || {});
      }
      setHasChanges(false);
    }, [user])
  );

  // --- 핸들러 함수 ---
  const createChangeHandler =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (value: string) => {
      setter(value);
      setHasChanges(true);
    };

  const handleLinkChange = (platform: string, url: string) => {
    setLinks((prev) => ({ ...prev, [platform]: url }));
    setHasChanges(true);
  };

  const handleAvatarImageChange = async () => {
    const newUri = await pickAndSaveImage();
    if (newUri) {
      setAvatarImageUri(newUri);
      setHasChanges(true);
    }
  };

  const handleCoverImageChange = async () => {
    const newUri = await pickAndSaveImage();
    if (newUri) {
      setCoverImageUri(newUri);
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

    const updatedLinks = Object.entries(links)
      .map(([platform, url]) => {
        if (url && url.trim()) {
          const existingLink = user.links?.find((l) => l.platform === platform);
          return {
            id: existingLink?.id || platform,
            platform: platform as UserLink["platform"],
            url: url.trim(),
          };
        }
        return null;
      })
      .filter((l): l is UserLink => l !== null);

    const updatedUser: User = {
      ...user,
      displayName: displayName.trim(),
      bio: bio.trim(),
      introduction: introduction.trim(), // ✅ 저장 데이터에 자기소개 포함
      location: location.trim(), // ✅ 저장 데이터에 지역 포함
      avatarImageUri,
      coverImageUri,
      links: updatedLinks,
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

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
            {isSaving ? "저장중..." : "저장"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleCoverImageChange}
          >
            <ImageBackground
              source={coverImageUri ? { uri: coverImageUri } : undefined}
              style={styles.coverImage}
            >
              {!coverImageUri && (
                <Feather name="image" size={32} color="rgba(0,0,0,0.3)" />
              )}
              <View style={styles.coverEditIcon}>
                <Feather name="camera" size={16} color="#343a40" />
              </View>
            </ImageBackground>
          </TouchableOpacity>

          <View style={styles.profileHeader}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleAvatarImageChange}
            >
              {avatarImageUri ? (
                <Image
                  source={{ uri: avatarImageUri }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Feather name="user" size={40} color="#adb5bd" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <FormRow
              label="이름"
              value={displayName}
              onChangeText={createChangeHandler(setDisplayName)}
              placeholder="이름을 입력하세요"
              autoCapitalize="words"
            />
            <FormRow
              label="소개"
              value={bio}
              onChangeText={createChangeHandler(setBio)}
              placeholder="자신을 한 문장으로 표현해보세요"
            />
            {/* ✅ [추가] 자기소개 필드 */}
            <FormRow
              label="자기소개"
              value={introduction}
              onChangeText={createChangeHandler(setIntroduction)}
              placeholder="자신에 대해 더 자세히 알려주세요"
            />
            {/* ✅ [추가] 지역 필드 */}
            <FormRow
              label="지역"
              value={location}
              onChangeText={createChangeHandler(setLocation)}
              placeholder="활동 지역 (예: Seoul, Korea)"
            />

            {/* 링크 입력 필드 */}
            {LINK_PLATFORMS.map((platform) => (
              <FormRow
                key={platform}
                label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                value={links[platform] || ""}
                onChangeText={(url) => handleLinkChange(platform, url)}
                placeholder={`${platform} URL`}
                keyboardType="url"
              />
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  customHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
  },
  headerButton: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  headerSaveButton: { fontSize: 16, fontWeight: "bold", color: "#007AFF" },
  headerSaveButtonDisabled: { color: "#adb5bd" },
  coverImage: {
    height: 220,
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
  },
  coverEditIcon: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 8,
    borderRadius: 20,
  },
  profileHeader: {
    paddingHorizontal: 16,
    marginTop: -45,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#40c057",
    backgroundColor: "#e9ecef",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 45,
    backgroundColor: "#f1f3f5",
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    paddingLeft: 16,
    marginTop: 24,
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
    paddingRight: 16,
  },
  // ✅ [추가] 멀티라인 행을 위한 스타일
  formRowMultiline: {
    alignItems: "flex-start",
  },
  label: {
    width: 90,
    fontSize: 16,
    color: "#212529",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#212529",
  },
  // ✅ [추가] 멀티라인 입력을 위한 스타일
  inputMultiline: {
    textAlignVertical: "top", // 안드로이드에서 텍스트를 상단에 정렬
  },
});
