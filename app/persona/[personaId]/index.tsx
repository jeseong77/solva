import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAppStore } from "@/store/store";
import { Persona } from "@/types";
import { useShallow } from "zustand/react/shallow";
import { Ionicons } from "@expo/vector-icons";
// import * as ImagePicker from 'expo-image-picker'; // 이미지 선택 기능 구현 시 필요

const debounceTimeout = React.createRef<ReturnType<typeof setTimeout> | null>();

export default function PersonaDetailScreen() {
  const router = useRouter();
  const { personaId } = useLocalSearchParams<{ personaId: string }>();

  const { getPersonaById, updatePersona } = useAppStore(
    useShallow((state) => ({
      getPersonaById: state.getPersonaById,
      updatePersona: state.updatePersona,
    }))
  );

  // 컴포넌트 상태
  const [persona, setPersona] = useState<Persona | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [personaGoals, setPersonaGoals] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const hasUnsavedChanges = useRef(false);

  // 데이터 로딩
  useEffect(() => {
    const personaData = getPersonaById(personaId);
    if (personaData) {
      setPersona(personaData);
      setTitle(personaData.title);
      setDescription(personaData.description || "");
      setPersonaGoals(personaData.personaGoals || "");
    } else {
      Alert.alert("오류", "페르소나 정보를 찾을 수 없습니다.");
      if (router.canGoBack()) router.back();
    }
    setIsLoading(false);
    hasUnsavedChanges.current = false;
  }, [personaId, getPersonaById]);

  // 자동 저장 로직
  const autoSave = useCallback(async () => {
    if (!hasUnsavedChanges.current || !persona) return;

    setIsSaving(true);
    hasUnsavedChanges.current = false;

    const updatedPersona: Persona = {
      ...persona,
      title: title.trim(),
      description: description.trim(),
      personaGoals: personaGoals.trim(),
    };

    const result = await updatePersona(updatedPersona);
    if (result) {
      console.log(`[PersonaEditor] Persona auto-updated: ${result.title}`);
    } else {
      console.error("[PersonaEditor] Auto-update failed");
      hasUnsavedChanges.current = true;
    }
    setIsSaving(false);
  }, [persona, title, description, personaGoals, updatePersona]);

  useEffect(() => {
    if (isLoading || !hasUnsavedChanges.current) return;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      autoSave();
    }, 1500); // 1.5초 디바운스

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [title, description, personaGoals, isLoading, autoSave]);

  const createFieldChangeHandler =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (value: string) => {
      setter(value);
      hasUnsavedChanges.current = true;
    };
  const handleTitleChange = createFieldChangeHandler(setTitle);
  const handleDescriptionChange = createFieldChangeHandler(setDescription);
  const handleGoalsChange = createFieldChangeHandler(setPersonaGoals);

  // 이미지/아이콘 변경 핸들러 (추후 구현)
  const handleAvatarPress = () => {
    Alert.alert(
      "프로필 사진 변경",
      "이미지 또는 아이콘을 선택하는 기능은 준비 중입니다."
    );
    // ImagePicker.launchImageLibraryAsync(...) 로직 추가 가능
  };

  // 로딩 중 UI
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Loading..." }} />
        <ActivityIndicator style={{ flex: 1 }} size="large" />
      </SafeAreaView>
    );
  }

  // 페르소나 못 찾았을 때 UI
  if (!persona) {
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
          title: title, // 헤더 제목을 동적으로 설정
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              {isSaving && <ActivityIndicator size="small" color="#007AFF" />}
              <TouchableOpacity
                onPress={() => Alert.alert("More Options")}
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarTouchable}
            onPress={handleAvatarPress}
          >
            <View
              style={[
                styles.avatar,
                { backgroundColor: persona.color || "#cccccc" },
              ]}
            >
              {persona.avatarImageUri ? (
                // <Image source={{ uri: persona.avatarImageUri }} style={styles.avatarImage} />
                <Text>IMG</Text> // 실제 Image 컴포넌트로 대체
              ) : persona.icon ? (
                <Ionicons
                  name={persona.icon as any}
                  size={40}
                  color={"#ffffff"}
                />
              ) : (
                <Ionicons name="person" size={40} color={"#ffffff"} />
              )}
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={16} color="#333" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Persona Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={handleTitleChange}
          placeholder="페르소나의 이름을 입력하세요"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={handleDescriptionChange}
          placeholder="이 페르소나에 대한 설명을 적어주세요"
          multiline
        />

        <Text style={styles.label}>Goals as this Persona</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={personaGoals}
          onChangeText={handleGoalsChange}
          placeholder="이 페르소나로서 이루고 싶은 목표들을 자유롭게 적어보세요"
          multiline
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
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
  moreButton: {
    marginLeft: 10,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarTouchable: {
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "#eee",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 16,
    marginBottom: 20,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
});
