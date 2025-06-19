// components/objective/ObjectiveEdit.tsx

import { pickAndSaveImage } from "@/lib/imageUtils";
import { useAppStore } from "@/store/store";
import { Objective, ObjectiveType } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
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
import GapList from "./GapList";

const FormRow = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
}) => (
  <View style={styles.formRow}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#adb5bd"
      multiline={multiline}
    />
  </View>
);

export default function ObjectiveEdit() {
  const router = useRouter();
  const { objectiveId } = useLocalSearchParams<{ objectiveId?: string }>();
  const isEditMode = !!objectiveId;

  const { getObjectiveById, addObjective, updateObjective, fetchGaps } =
    useAppStore(
      useShallow((state) => ({
        getObjectiveById: state.getObjectiveById,
        addObjective: state.addObjective,
        updateObjective: state.updateObjective,
        fetchGaps: state.fetchGaps,
      }))
    );

  // --- 상태 관리 ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objectiveGoals, setObjectiveGoals] = useState("");
  const [coverImageUri, setCoverImageUri] = useState<string | undefined>();
  const [avatarImageUri, setAvatarImageUri] = useState<string | undefined>();
  const [type, setType] = useState<ObjectiveType>("persona");
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [isCoverViewerVisible, setCoverViewerVisible] = useState(false);

  // --- 데이터 로딩 ---
  useFocusEffect(
    useCallback(() => {
      if (isEditMode && objectiveId) {
        const data = getObjectiveById(objectiveId);
        if (data) {
          setTitle(data.title);
          setDescription(data.description || "");
          setObjectiveGoals(data.objectiveGoals || "");
          setCoverImageUri(data.coverImageUri);
          setAvatarImageUri(data.avatarImageUri);
          setType(data.type);
          fetchGaps(objectiveId);
        } else {
          Alert.alert("오류", "목표 정보를 찾을 수 없습니다.");
          if (router.canGoBack()) router.back();
        }
      } else {
        setType("persona");
      }
      setIsLoading(false);
    }, [objectiveId, isEditMode, getObjectiveById, fetchGaps])
  );

  // --- 핸들러 ---
  const handleCoverImageChange = async () => {
    const newImageUri = await pickAndSaveImage();
    if (newImageUri) setCoverImageUri(newImageUri);
  };
  const handleAvatarPress = async () => {
    const newImageUri = await pickAndSaveImage();
    if (newImageUri) setAvatarImageUri(newImageUri);
  };
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("이름 필요", "목표의 이름은 필수 항목입니다.");
      return;
    }
    setIsSaving(true);
    let result: Objective | null = null;
    const commonData = {
      type,
      title: title.trim(),
      description: description.trim(),
      objectiveGoals: objectiveGoals.trim(),
      coverImageUri,
      avatarImageUri,
    };
    if (isEditMode && objectiveId) {
      const original = getObjectiveById(objectiveId);
      if (original)
        result = await updateObjective({ ...original, ...commonData });
    } else {
      result = await addObjective(commonData);
    }
    setIsSaving(false);
    if (result) {
      Alert.alert("성공", `"${result.title}" 목표가 저장되었습니다.`);
      if (router.canGoBack()) router.back();
    } else {
      Alert.alert("오류", "저장에 실패했습니다.");
    }
  };

  if (isLoading && isEditMode) {
    return (
      <View style={styles.centeredMessageContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={26} color="#343a40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? "목표 편집" : "새 목표"}
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.headerSaveButton}>
            {isSaving ? "저장중..." : "저장"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.coverContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => coverImageUri && setCoverViewerVisible(true)}
            >
              <ImageBackground
                source={coverImageUri ? { uri: coverImageUri } : undefined}
                style={styles.coverImage}
              >
                {!coverImageUri && (
                  <Feather name="image" size={40} color="#ced4da" />
                )}
              </ImageBackground>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editCoverButton}
              onPress={handleCoverImageChange}
            >
              <Feather name="camera" size={16} color="#495057" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
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

          <View style={styles.typeSelectorContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === "persona" && styles.typeButtonSelected,
              ]}
              onPress={() => setType("persona")}
              disabled={isEditMode}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === "persona" && styles.typeButtonTextSelected,
                ]}
              >
                페르소나 (인물)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === "product" && styles.typeButtonSelected,
              ]}
              onPress={() => setType("product")}
              disabled={isEditMode}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === "product" && styles.typeButtonTextSelected,
                ]}
              >
                프로덕트 (사물)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <FormRow
              label="이름"
              value={title}
              onChangeText={setTitle}
              placeholder="목표의 이름을 입력하세요"
            />
            <FormRow
              label="소개"
              value={description}
              onChangeText={setDescription}
              placeholder="이 목표를 한 문장으로 설명하세요"
              multiline
            />
            <FormRow
              label="궁극적 목표"
              value={objectiveGoals}
              onChangeText={setObjectiveGoals}
              placeholder="이 목표를 통해 이루고 싶은 궁극적인 모습"
              multiline
            />
          </View>

          {isEditMode && objectiveId && (
            <View style={styles.gapSection}>
              <Text style={styles.sectionTitle}>이상과 현실 (Gaps)</Text>
              <Text style={styles.sectionDescription}>
                현재 목표의 이상적인 상태와 현실을 비교하여 그 차이(Gap)를
                정의하세요. 이 차이가 해결해야 할 문제가 됩니다.
              </Text>
              <GapList objectiveId={objectiveId} />
            </View>
          )}
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
            <Feather name="x" size={32} color="white" />
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
  container: { flex: 1, backgroundColor: "#ffffff" },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  customHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 44,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerButton: { padding: 6 },
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#212529" },
  headerSaveButton: { fontSize: 17, fontWeight: "bold", color: "#2b8a3e" },
  coverContainer: {},
  coverImage: {
    height: 200,
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
  },
  editCoverButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 8,
    borderRadius: 20,
  },
  profileSection: {
    paddingHorizontal: 16,
    marginTop: -60,
    alignItems: "center",
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#40c057",
    backgroundColor: "#e9ecef",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 60 },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
  },
  typeSelectorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 24,
  },
  typeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#e9ecef",
    marginHorizontal: 8,
  },
  typeButtonSelected: {
    backgroundColor: "#2b8a3e",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
  },
  typeButtonTextSelected: {
    color: "#ffffff",
  },
  formContainer: { paddingHorizontal: 16 },
  formRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
  },
  label: { width: 80, fontSize: 16, color: "#495057", paddingTop: 10 },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#212529",
    paddingVertical: 10,
    lineHeight: 24, // ✅ 울렁임 현상 방지를 위해 줄 높이 고정
  },
  gapSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 8,
    borderTopColor: "#f1f3f5",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212529",
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#868e96",
    paddingHorizontal: 16,
    marginBottom: 16,
    lineHeight: 20,
  },
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
