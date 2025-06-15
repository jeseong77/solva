// components/persona/PersonaEdit.tsx

import { useAppStore } from "@/store/store";
import { Persona } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
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
} from "react-native";
import { useShallow } from "zustand/react/shallow";
import { pickAndSaveImage } from "@/lib/imageUtils";

export default function PersonaEdit() {
  const router = useRouter();
  // ✅ URL로부터 personaId를 가져옵니다. 없으면 undefined가 됩니다.
  const { personaId } = useLocalSearchParams<{ personaId?: string }>();
  const isEditMode = !!personaId; // ✅ personaId 존재 여부로 수정 모드를 판단합니다.

  const { getPersonaById, addPersona, updatePersona, deletePersona } =
    useAppStore(
      useShallow((state) => ({
        getPersonaById: state.getPersonaById,
        addPersona: state.addPersona,
        updatePersona: state.updatePersona,
        deletePersona: state.deletePersona,
      }))
    );

  // --- 상태 관리 ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [personaGoals, setPersonaGoals] = useState("");
  const [avatarImageUri, setAvatarImageUri] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(isEditMode); // ✅ 수정 모드일 때만 로딩 시작
  const [isSaving, setIsSaving] = useState(false);

  // --- 데이터 로딩 (수정 모드 전용) ---
  useFocusEffect(
    useCallback(() => {
      if (isEditMode && personaId) {
        const personaData = getPersonaById(personaId);
        if (personaData) {
          setTitle(personaData.title);
          setDescription(personaData.description || "");
          setPersonaGoals(personaData.personaGoals || "");
          setAvatarImageUri(personaData.avatarImageUri);
        } else {
          Alert.alert("오류", "페르소나 정보를 찾을 수 없습니다.");
          if (router.canGoBack()) router.back();
        }
        setIsLoading(false);
      }
    }, [personaId, isEditMode, getPersonaById])
  );

  // --- 핸들러 함수 ---
  const handleAvatarPress = async () => {
    const newImageUri = await pickAndSaveImage();
    if (newImageUri) {
      setAvatarImageUri(newImageUri);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("이름 필요", "페르소나의 이름은 필수 항목입니다.");
      return;
    }
    setIsSaving(true);

    let result: Persona | null = null;

    if (isEditMode && personaId) {
      // ✅ 수정 모드 저장 로직
      const originalPersona = getPersonaById(personaId);
      if (originalPersona) {
        result = await updatePersona({
          ...originalPersona,
          title: title.trim(),
          description: description.trim(),
          personaGoals: personaGoals.trim(),
          avatarImageUri: avatarImageUri,
        });
      }
    } else {
      // ✅ 생성 모드 저장 로직
      result = await addPersona({
        title: title.trim(),
        description: description.trim() || undefined,
        personaGoals: personaGoals.trim() || undefined,
        avatarImageUri: avatarImageUri,
      });
    }

    setIsSaving(false);

    if (result) {
      Alert.alert("성공", `"${result.title}" 페르소나가 저장되었습니다.`);
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)");
    } else {
      Alert.alert("오류", "페르소나 저장에 실패했습니다.");
    }
  };

  const handleDelete = () => {
    if (!isEditMode || !personaId) return;
    Alert.alert(
      `"${title}" 삭제`,
      "이 페르소나와 연결된 모든 데이터가 함께 삭제됩니다. 정말 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          onPress: async () => {
            const success = await deletePersona(personaId);
            if (success) {
              Alert.alert("성공", "페르소나가 삭제되었습니다.");
              router.replace("/(tabs)");
            } else {
              Alert.alert("오류", "페르소나 삭제에 실패했습니다.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // --- 로딩 및 에러 UI ---
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "로딩 중..." }} />
        <View style={styles.centeredMessageContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // --- 메인 UI ---
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          // ✅ 헤더 동적 설정
          title: isEditMode ? title : "새 페르소나 생성",
          headerRight: () =>
            isEditMode ? ( // ✅ 수정 모드일 때만 '더보기' 버튼 표시
              <TouchableOpacity
                onPress={handleDelete}
                style={{ marginRight: 16 }}
              >
                <Ionicons name="trash-outline" size={24} color="#ff3b30" />
              </TouchableOpacity>
            ) : null,
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {/* 아바타 섹션 */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarTouchable}
              onPress={handleAvatarPress}
            >
              <View style={[styles.avatar, { backgroundColor: "#e9ecef" }]}>
                {avatarImageUri ? (
                  <Image
                    source={{ uri: avatarImageUri }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Ionicons name="camera" size={40} color={"#adb5bd"} />
                )}
              </View>
              <Text style={styles.avatarHelpText}>탭하여 이미지 변경</Text>
            </TouchableOpacity>
          </View>

          {/* 입력 필드 (생성/수정 공통) */}
          <Text style={styles.label}>페르소나 이름</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="예: 개발자, 학생, 운동하는 나"
          />
          <Text style={styles.label}>설명 (선택)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="이 페르소나를 한 문장으로 설명해보세요."
            multiline
          />
          <Text style={styles.label}>이 페르소나의 목표 (선택)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={personaGoals}
            onChangeText={setPersonaGoals}
            placeholder="이 페르소나로서 이루고 싶은 것들을 자유롭게 적어보세요."
            multiline
          />
        </ScrollView>

        {/* ✅ 하단 저장 버튼 (생성/수정 공통) */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? "저장 중..." : "변경사항 저장"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ✅ 두 파일의 스타일을 통합
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollView: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarSection: { alignItems: "center", marginBottom: 30 },
  avatarTouchable: { alignItems: "center" },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e9ecef",
    borderWidth: 1,
    borderColor: "#dee2e6",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarHelpText: { marginTop: 8, fontSize: 12, color: "#6c757d" },
  label: { fontSize: 16, fontWeight: "600", color: "#495057", marginBottom: 8 },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 16,
    marginBottom: 20,
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#ffffff",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
});
