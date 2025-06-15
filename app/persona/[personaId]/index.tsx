import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
} from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useAppStore } from "@/store/store";
import { Persona } from "@/types";
import { useShallow } from "zustand/react/shallow";
import { Ionicons } from "@expo/vector-icons";
import { pickAndSaveImage } from "@/lib/imageUtils";

const debounceTimeout = React.createRef<ReturnType<typeof setTimeout> | null>();

export default function PersonaDetailScreen() {
  const router = useRouter();
  const { personaId } = useLocalSearchParams<{ personaId: string }>();

  // deletePersona 액션을 스토어에서 가져옵니다.
  const { getPersonaById, updatePersona, deletePersona } = useAppStore(
    useShallow((state) => ({
      getPersonaById: state.getPersonaById,
      updatePersona: state.updatePersona,
      deletePersona: state.deletePersona, // 추가
    }))
  );

  const [persona, setPersona] = useState<Persona | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [personaGoals, setPersonaGoals] = useState("");
  const [avatarImageUri, setAvatarImageUri] = useState<string | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const hasUnsavedChanges = useRef(false);

  const loadData = useCallback(() => {
    // ... (loadData 로직은 이전과 동일) ...
    const personaData = getPersonaById(personaId);
    if (personaData) {
      setPersona(personaData);
      setTitle(personaData.title);
      setDescription(personaData.description || "");
      setPersonaGoals(personaData.personaGoals || "");
      setAvatarImageUri(personaData.avatarImageUri);
    } else if (!isLoading) {
      Alert.alert("오류", "페르소나 정보를 찾을 수 없습니다.");
      if (router.canGoBack()) router.back();
    }
    setIsLoading(false);
    hasUnsavedChanges.current = false;
  }, [personaId, getPersonaById]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const autoSave = useCallback(async () => {
    // ... (autoSave 로직은 이전과 동일) ...
    if (!hasUnsavedChanges.current || !persona) return;
    setIsSaving(true);
    hasUnsavedChanges.current = false;
    const updatedPersona: Persona = {
      ...persona,
      title: title.trim(),
      description: description.trim(),
      personaGoals: personaGoals.trim(),
      avatarImageUri: avatarImageUri,
    };
    const result = await updatePersona(updatedPersona);
    if (result) {
      setPersona(result);
    } else {
      hasUnsavedChanges.current = true;
    }
    setIsSaving(false);
  }, [
    persona,
    title,
    description,
    personaGoals,
    avatarImageUri,
    updatePersona,
  ]);

  useEffect(() => {
    // ... (자동 저장 useEffect는 이전과 동일) ...
    if (isLoading || !hasUnsavedChanges.current) return;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      autoSave();
    }, 1500);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [title, description, personaGoals, avatarImageUri, isLoading, autoSave]);

  const createFieldChangeHandler =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (value: string) => {
      setter(value);
      hasUnsavedChanges.current = true;
    };
  const handleTitleChange = createFieldChangeHandler(setTitle);
  const handleDescriptionChange = createFieldChangeHandler(setDescription);
  const handleGoalsChange = createFieldChangeHandler(setPersonaGoals);
  const handleAvatarPress = async () => {
    /* ... (이전과 동일) ... */
    const newImageUri = await pickAndSaveImage();
    if (newImageUri) {
      setAvatarImageUri(newImageUri);
      hasUnsavedChanges.current = true;
    }
  };

  // --- 삭제 로직 시작 ---
  // "더보기" 메뉴 클릭 시 실행될 함수
  const handleMoreOptions = () => {
    Alert.alert(
      "추가 작업",
      "이 페르소나에 대해 어떤 작업을 하시겠습니까?",
      [
        {
          text: "페르소나 삭제",
          onPress: () => showDeleteConfirmation(), // 삭제 확인 Alert 호출
          style: "destructive", // iOS에서 빨간색으로 표시
        },
        {
          text: "취소",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  // 삭제 최종 확인 Alert
  const showDeleteConfirmation = () => {
    if (!persona) return;
    Alert.alert(
      `"${persona.title}" 삭제`,
      "이 페르소나와 연결된 모든 문제(Problem), 목표(Objective), 규칙(Rule) 등이 함께 삭제됩니다. 정말 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          onPress: () => handleDeletePersona(), // 실제 삭제 함수 호출
          style: "destructive",
        },
      ]
    );
  };

  // 실제 삭제 액션을 실행하는 함수
  const handleDeletePersona = async () => {
    if (!persona) return;
    const success = await deletePersona(persona.id);
    if (success) {
      Alert.alert("성공", "페르소나가 삭제되었습니다.");
      // 삭제 후 홈 화면 등으로 이동
      router.replace("/(tabs)");
    } else {
      Alert.alert("오류", "페르소나 삭제에 실패했습니다.");
    }
  };
  // --- 삭제 로직 끝 ---

  if (isLoading) {
    // ... (로딩 UI는 이전과 동일) ...
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Loading..." }} />
        <View style={styles.centeredMessageContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!persona) {
    // ... (페르소나 없음 UI는 이전과 동일) ...
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Error" }} />
        <View style={styles.centeredMessageContainer}>
          <Text>Persona not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: title,
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              {isSaving && <ActivityIndicator size="small" color="#007AFF" />}
              <TouchableOpacity
                onPress={handleMoreOptions} // "더보기" 메뉴 핸들러 연결
                style={styles.moreButton}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={24}
                  color="#007AFF"
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {/* ... (아바타 및 입력 필드 JSX는 이전과 동일) ... */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarTouchable}
              onPress={handleAvatarPress}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: persona.color || "#e9ecef" },
                ]}
              >
                {avatarImageUri ? (
                  <Image
                    source={{ uri: avatarImageUri }}
                    style={styles.avatarImage}
                  />
                ) : persona.icon ? (
                  <Ionicons
                    name={persona.icon as any}
                    size={48}
                    color={"#495057"}
                  />
                ) : (
                  <Ionicons name="person" size={48} color={"#495057"} />
                )}
              </View>
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={16} color="#343a40" />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Persona Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={handleTitleChange}
          />
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={handleDescriptionChange}
            multiline
          />
          <Text style={styles.label}>Goals as this Persona</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={personaGoals}
            onChangeText={handleGoalsChange}
            multiline
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (스타일 정의는 이전과 동일)
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollView: { flex: 1 },
  contentContainer: { padding: 20 },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  moreButton: { marginLeft: 10 },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatarTouchable: { position: "relative" },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 50 },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
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
});
