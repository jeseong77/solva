// components/objective/ObjectiveEdit.tsx

import { pickAndSaveImage } from "@/lib/imageUtils";
import { useAppStore } from "@/store/store";
import { Gap, Objective, ObjectiveType } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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

export default function ObjectiveEdit() {
  const router = useRouter();
  const { objectiveId } = useLocalSearchParams<{ objectiveId?: string }>();
  const isEditMode = !!objectiveId;

  const {
    getObjectiveById,
    addObjective,
    updateObjective,
    fetchGaps,
    addGap,
    allGaps,
  } = useAppStore(
    useShallow((state) => ({
      getObjectiveById: state.getObjectiveById,
      addObjective: state.addObjective,
      updateObjective: state.updateObjective,
      fetchGaps: state.fetchGaps,
      addGap: state.addGap,
      allGaps: state.gaps,
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
  // ✅ [추가] 생성 모드에서 Gaps를 임시 저장할 로컬 상태
  const [localGaps, setLocalGaps] = useState<Partial<Gap>[]>([]);

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
        // 생성 모드 진입 시 모든 상태 초기화
        setTitle("");
        setDescription("");
        setObjectiveGoals("");
        setCoverImageUri(undefined);
        setAvatarImageUri(undefined);
        setType("persona");
        setLocalGaps([]);
      }
      setIsLoading(false);
    }, [objectiveId, isEditMode, getObjectiveById, fetchGaps])
  );

  // ✅ [추가] 화면에 표시될 Gaps 목록 (수정 모드에서는 스토어, 생성 모드에서는 로컬 상태)
  const gapsToDisplay = useMemo(
    () =>
      isEditMode
        ? allGaps.filter((g) => g.objectiveId === objectiveId)
        : localGaps,
    [allGaps, objectiveId, isEditMode, localGaps]
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

    const commonData = {
      type,
      title: title.trim(),
      description: description.trim(),
      objectiveGoals: objectiveGoals.trim(),
      coverImageUri,
      avatarImageUri,
    };
    let objectiveResult: Objective | null = null;

    if (isEditMode && objectiveId) {
      const original = getObjectiveById(objectiveId);
      if (original)
        objectiveResult = await updateObjective({ ...original, ...commonData });
    } else {
      objectiveResult = await addObjective(commonData);
      // ✅ 생성 모드일 때, Objective 저장 후 로컬 Gaps를 DB에 저장
      if (objectiveResult) {
        for (const gap of localGaps) {
          await addGap({
            objectiveId: objectiveResult.id,
            title: gap.title || "",
            idealState: gap.idealState || "",
            currentState: gap.currentState || "",
          });
        }
      }
    }

    setIsSaving(false);
    if (objectiveResult) {
      Alert.alert("성공", `"${objectiveResult.title}" 목표가 저장되었습니다.`);
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

          {/* ✅ [변경] 타입 선택 UI 로직 수정 */}
          <View style={styles.typeSelectorContainer}>
            {isEditMode ? (
              <View style={[styles.typeButton, styles.typeButtonSelected]}>
                <Text style={styles.typeButtonTextSelected}>
                  {type === "persona" ? "페르소나" : "프로덕트"}
                </Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === "persona" && styles.typeButtonSelected,
                  ]}
                  onPress={() => setType("persona")}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === "persona" && styles.typeButtonTextSelected,
                    ]}
                  >
                    페르소나
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === "product" && styles.typeButtonSelected,
                  ]}
                  onPress={() => setType("product")}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === "product" && styles.typeButtonTextSelected,
                    ]}
                  >
                    프로덕트
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* ✅ [변경] FormRow를 중앙 정렬 TextInput으로 변경 */}
          <View style={styles.formWrapper}>
            <View style={styles.formContainer}>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="이름"
                placeholderTextColor="#adb5bd"
              />
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="소개"
                placeholderTextColor="#adb5bd"
                multiline
              />
            </View>
          </View>

          {/* ✅ [변경] Gap 리스트 섹션을 항상 표시 */}
          <View style={styles.gapSection}>
            <Text style={styles.sectionDescription}>
              목표의 이상적인 상태와 현실을 정의하여 그 차이를 명확히 하세요. 이
              차이가 당신이 해결해야 할 '문제'가 됩니다.
            </Text>
            <GapList
              objectiveId={objectiveId}
              gaps={gapsToDisplay}
              setGaps={setLocalGaps}
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
    paddingTop: 16,
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
  formWrapper: {
    marginTop: 16,
    paddingBottom: 16,
  },
  formContainer: {
    width: "100%",
    alignItems: "center", // 자식 요소를 중앙 정렬
  },
  // ✅ [변경] 중앙 정렬된 이름 입력 스타일
  titleInput: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212529",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  // ✅ [변경] 중앙 정렬된 소개 입력 스타일
  descriptionInput: {
    fontSize: 16,
    color: "#495057",
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 24,
  },
  gapSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
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
