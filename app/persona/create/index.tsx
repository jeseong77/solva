import React, { useState } from "react";
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
  Image, // Image 컴포넌트 import
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useAppStore } from "@/store/store";
import { Ionicons } from "@expo/vector-icons";
import { pickAndSaveImage } from "@/lib/imageUtils";

export default function CreatePersonaScreen() {
  const router = useRouter();
  const addPersona = useAppStore((state) => state.addPersona);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [personaGoals, setPersonaGoals] = useState("");
  const [avatarImageUri, setAvatarImageUri] = useState<string | undefined>(
    undefined
  ); // 선택된 이미지 URI를 위한 상태

  // 아바타 클릭 시 이미지 선택 및 저장 로직을 실행하는 핸들러
  const handleAvatarPress = async () => {
    const newImageUri = await pickAndSaveImage(); // 이미지 선택 및 저장 함수 호출

    if (newImageUri) {
      setAvatarImageUri(newImageUri); // 상태 업데이트하여 화면에 이미지 표시
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert("이름 필요", "페르소나의 이름은 필수 항목입니다.");
      return;
    }
    setIsSaving(true);
    const result = await addPersona({
      title: title.trim(),
      description: description.trim() || undefined,
      personaGoals: personaGoals.trim() || undefined,
      avatarImageUri: avatarImageUri, // avatarImageUri 상태 값을 함께 전달
      // color, icon 등은 추후 추가
    });
    setIsSaving(false);

    if (result) {
      Alert.alert("성공", `"${result.title}" 페르소나가 생성되었습니다.`);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
    } else {
      Alert.alert("오류", "페르소나 생성에 실패했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "새 페르소나 생성" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {/* 아바타 선택 섹션 */}
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
                  // 이미지가 없을 때 기본 아이콘
                  <Ionicons name="camera" size={40} color={"#adb5bd"} />
                )}
              </View>
              <Text style={styles.avatarHelpText}>탭하여 이미지 변경</Text>
            </TouchableOpacity>
          </View>

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

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreate}
            disabled={isSaving}
          >
            <Ionicons
              name="add"
              size={20}
              color="white"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.createButtonText}>
              {isSaving ? "생성 중..." : "페르소나 생성하기"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 40, // 하단 여백 추가
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarTouchable: {
    alignItems: "center",
  },
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
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarHelpText: {
    marginTop: 8,
    fontSize: 12,
    color: "#6c757d",
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
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#ffffff",
  },
  createButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
