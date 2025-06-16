// components/persona/PersonaEdit.tsx

import { useAppStore } from "@/store/store";
import { Persona } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"; // ❌ Stack 제거
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ImageBackground,
} from "react-native";
import { useShallow } from "zustand/react/shallow";
import { pickAndSaveImage } from "@/lib/imageUtils";

export default function PersonaEdit() {
  const router = useRouter();
  const { personaId } = useLocalSearchParams<{ personaId?: string }>();
  const isEditMode = !!personaId;

  const { getPersonaById, addPersona, updatePersona, deletePersona } =
    useAppStore(
      useShallow((state) => ({
        getPersonaById: state.getPersonaById,
        addPersona: state.addPersona,
        updatePersona: state.updatePersona,
        deletePersona: state.deletePersona,
      }))
    );

  // --- 상태 관리 (모두 동일) ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [personaGoals, setPersonaGoals] = useState("");
  const [coverImageUri, setCoverImageUri] = useState<string | undefined>();
  const [avatarImageUri, setAvatarImageUri] = useState<string | undefined>();
  const [icon, setIcon] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [isCoverViewerVisible, setCoverViewerVisible] = useState(false);

  // --- 데이터 로딩 (모두 동일) ---
  useFocusEffect(
    useCallback(() => {
      if (isEditMode && personaId) {
        const data = getPersonaById(personaId);
        if (data) {
          setTitle(data.title);
          setDescription(data.description || "");
          setPersonaGoals(data.personaGoals || "");
          setCoverImageUri(data.coverImageUri);
          setAvatarImageUri(data.avatarImageUri);
          setIcon(data.icon);
        } else {
          Alert.alert("오류", "페르소나 정보를 찾을 수 없습니다.");
          if (router.canGoBack()) router.back();
        }
      }
      setIsLoading(false);
    }, [personaId, isEditMode, getPersonaById])
  );

  // --- 핸들러 ---
  const handleCoverImageChange = async () => {
    const newImageUri = await pickAndSaveImage();
    if (newImageUri) setCoverImageUri(newImageUri);
  };

  const handleAvatarPress = () => {
    Alert.alert("아바타 변경", "어떤 형태로 아바타를 설정하시겠어요?", [
      {
        text: "사진으로 변경",
        onPress: async () => {
          const newImageUri = await pickAndSaveImage();
          if (newImageUri) {
            setAvatarImageUri(newImageUri);
            setIcon(undefined);
          }
        },
      },
      {
        text: "아이콘으로 변경",
        onPress: () => alert("아이콘 피커 구현 필요"),
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          setAvatarImageUri(undefined);
          setIcon(undefined);
        },
      },
      { text: "취소", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("이름 필요", "페르소나의 이름은 필수 항목입니다.");
      return;
    }
    setIsSaving(true);
    let result: Persona | null = null;
    const commonData = {
      title: title.trim(),
      description: description.trim(),
      personaGoals: personaGoals.trim(),
      coverImageUri,
      avatarImageUri,
      icon,
    };

    if (isEditMode && personaId) {
      const original = getPersonaById(personaId);
      if (original)
        result = await updatePersona({ ...original, ...commonData });
    } else {
      result = await addPersona(commonData);
    }

    setIsSaving(false);
    if (result) {
      Alert.alert("성공", `"${result.title}" 페르소나가 저장되었습니다.`);
      if (router.canGoBack()) router.back();
    } else {
      Alert.alert("오류", "저장에 실패했습니다.");
    }
  };
  const handleDelete = () => {
    /* ... */
  };

  if (isLoading) {
    return (
      <View style={styles.centeredMessageContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ❌ Stack.Screen 제거 */}

      {/* ✅ [추가] 커스텀 헤더 구현 */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={26} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? "페르소나 편집" : "새 페르소나"}
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.headerSaveButton}>
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
          <View style={styles.coverContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => coverImageUri && setCoverViewerVisible(true)}
            >
              <ImageBackground
                source={coverImageUri ? { uri: coverImageUri } : undefined}
                style={styles.coverArea}
              >
                {!coverImageUri && (
                  <Ionicons name="image-outline" size={32} color="#ced4da" />
                )}
              </ImageBackground>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editCoverButton}
              onPress={handleCoverImageChange}
            >
              <Ionicons name="camera-outline" size={16} color="#495057" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
            >
              <View style={styles.avatar}>
                {avatarImageUri ? (
                  <Image
                    source={{ uri: avatarImageUri }}
                    style={styles.avatarImage}
                  />
                ) : icon ? (
                  <Ionicons name={icon as any} size={48} color="#495057" />
                ) : (
                  <Ionicons name="happy-outline" size={48} color="#adb5bd" />
                )}
              </View>
            </TouchableOpacity>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="페르소나 이름..."
              placeholderTextColor="#ced4da"
            />
          </View>

          <View style={styles.contentSection}>
            <View style={styles.divider} />
            <Text style={styles.label}>설명</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="이 페르소나를 한 문장으로 설명해보세요."
              multiline
            />
            <Text style={styles.label}>이 페르소나의 목표</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={personaGoals}
              onChangeText={setPersonaGoals}
              placeholder="이 페르소나로서 이루고 싶은 목표..."
              multiline
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={isCoverViewerVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.viewerContainer}>
          <TouchableOpacity
            style={styles.viewerCloseButton}
            onPress={() => setCoverViewerVisible(false)}
          >
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>
          <Image
            source={{ uri: coverImageUri }}
            style={styles.viewerImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// 스타일 시트
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // ✅ [추가] 커스텀 헤더 스타일
  customHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 44,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#212529",
  },
  scrollView: { flex: 1 },
  headerSaveButton: { fontSize: 17, fontWeight: "600", color: "#007AFF" },
  // ✅ [수정] Cover
  coverContainer: {
    // 이 View가 자식 컴포넌트의 absolute 위치 기준이 됨
  },
  coverArea: {
    height: 150,
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
  },
  editCoverButton: {
    position: "absolute", // ✅ 부모(coverContainer) 기준 절대 위치
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 6,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  // Profile
  profileSection: { paddingHorizontal: 16, marginTop: -40 },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  titleInput: {
    fontSize: 28,
    fontWeight: "bold",
    paddingTop: 16,
    color: "#212529",
  },
  // Content
  contentSection: { paddingHorizontal: 16, paddingTop: 8 },
  divider: { height: 1, backgroundColor: "#e9ecef"},
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#868e96",
    marginBottom: 12,
    marginTop: 16,
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    color: "#343a40",
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  // Viewer Modal
  viewerContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerImage: {
    width: "100%",
    height: "100%",
  },
  viewerCloseButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 20,
    right: 20,
    zIndex: 1,
  },
});
