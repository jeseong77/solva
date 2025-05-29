// app/ProblemEditorScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react"; // useCallback 추가
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router"; // useFocusEffect 추가
import { useAppStore } from "@/store/store";
import { Problem, ProblemStatus } from "@/types";
import { useShallow } from "zustand/react/shallow";
import { Ionicons } from "@expo/vector-icons";
import SubProblemList from "@/components/SubProblemList"; // SubProblemList 컴포넌트 import

const basicButtonStyle = {
  paddingVertical: 10,
  paddingHorizontal: 15,
  borderWidth: 1,
  borderColor: "#000",
  alignItems: "center" as "center",
  marginVertical: 5,
  flexDirection: "row" as "row",
  justifyContent: "center" as "center",
};
const basicButtonTextStyle = {
  color: "#000",
  fontSize: 16,
  marginLeft: 5,
};

export default function ProblemEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    problemId?: string;
    parentId?: string;
  }>();

  const { getProblemById, addProblem, updateProblem } = useAppStore(
    useShallow((state) => ({
      getProblemById: state.getProblemById,
      addProblem: state.addProblem,
      updateProblem: state.updateProblem,
    }))
  );

  const [currentProblem, setCurrentProblem] = useState<
    Problem | null | undefined
  >(undefined);
  const [parentProblemTitle, setParentProblemTitle] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProblemStatus>("active");
  const [isLoading, setIsLoading] = useState(true);

  const isEditing = !!params.problemId;

  // 데이터 로딩 및 상태 설정 로직을 함수로 분리
  const loadData = useCallback(() => {
    setIsLoading(true);
    let problemToEdit: Problem | undefined | null = null;

    if (isEditing && params.problemId) {
      console.log("[Editor] Editing existing problem:", params.problemId);
      problemToEdit = getProblemById(params.problemId);
      setCurrentProblem(problemToEdit || null);
      if (problemToEdit) {
        setTitle(problemToEdit.title);
        setDescription(problemToEdit.description || "");
        setStatus(problemToEdit.status);
        if (problemToEdit.parentId) {
          const parent = getProblemById(problemToEdit.parentId);
          setParentProblemTitle(parent?.title || "");
        } else {
          setParentProblemTitle("");
        }
      } else {
        console.warn(
          "[Editor] Problem to edit not found in store:",
          params.problemId
        );
        // 문제 못 찾으면 새 문제 모드로 전환하거나 에러 처리
        setCurrentProblem(null);
        setTitle("");
        setDescription("");
        setStatus("active");
      }
    } else if (params.parentId) {
      console.log(
        "[Editor] Adding new sub-problem for parent:",
        params.parentId
      );
      const parent = getProblemById(params.parentId);
      setParentProblemTitle(parent?.title || "상위 문제 없음");
      setCurrentProblem(null);
      setTitle(""); // 새 하위 문제이므로 필드 초기화
      setDescription("");
      setStatus("active");
    } else {
      console.log("[Editor] Adding new top-level problem");
      setCurrentProblem(null);
      setParentProblemTitle("");
      setTitle("");
      setDescription("");
      setStatus("active");
    }
    setIsLoading(false);
  }, [isEditing, params.problemId, params.parentId, getProblemById]);

  // 초기 로딩
  useEffect(() => {
    loadData();
  }, [loadData]); // loadData는 useCallback으로 메모이즈됨

  // 화면 포커스 시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      console.log("[Editor] Screen focused. Reloading data.");
      loadData(); // 화면이 포커스될 때마다 데이터 로드/갱신
      return () => {
        // 화면을 벗어날 때 정리할 내용이 있다면 여기에 작성
        console.log("[Editor] Screen unfocused.");
      };
    }, [loadData]) // loadData 의존성
  );

  const subProblems = useMemo(() => {
    if (currentProblem?.id) {
      // currentProblem이 있고, id가 있어야 childProblemIds를 사용
      const problemFromStore = getProblemById(currentProblem.id); // 항상 최신 스토어 상태에서 가져옴
      if (
        problemFromStore?.childProblemIds &&
        problemFromStore.childProblemIds.length > 0
      ) {
        return problemFromStore.childProblemIds
          .map((id) => getProblemById(id))
          .filter(Boolean) as Problem[];
      }
    }
    return [];
  }, [currentProblem, getProblemById, useAppStore((state) => state.problems)]); // problems 배열이 변경될 때도 재계산되도록 추가

  const isProblemTerminal = currentProblem?.id
    ? subProblems.length === 0
    : !params.parentId; // 새 문제(id없음)인데 parentId도 없으면 종점으로 간주

  const handleSaveProblem = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Problem title is required.");
      return;
    }
    if (description.length > 500) {
      Alert.alert("Error", "Problem description cannot exceed 500 chars.");
      return;
    }

    let result: Problem | null = null;
    // childProblemIds는 Problem 객체 내에 이미 있으므로, 저장 시에는 직접 수정하지 않음.
    // addProblem 또는 updateProblem 액션 내부에서 newProblem 생성 시 또는 updatedFullProblem 생성 시
    // currentProblem에서 가져온 childProblemIds가 사용됨.
    const problemDetailsToSave = {
      title: title.trim(),
      description: description.trim(),
      status: status,
    };

    if (isEditing && currentProblem) {
      const updatedFullProblem: Problem = {
        ...currentProblem, // 기존 id, parentId, childProblemIds, projectId 등 유지
        ...problemDetailsToSave,
      };
      result = await updateProblem(updatedFullProblem);
    } else {
      const newProblemData = {
        ...problemDetailsToSave,
        parentId: params.parentId || null,
        // 새 문제이므로 projectId는 아직 없음, childProblemIds는 스토어에서 []로 초기화
      };
      result = await addProblem(newProblemData);
    }

    if (result) {
      Alert.alert(
        "Success",
        `Problem successfully ${isEditing ? "updated" : "added"}.`
      );
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    } else {
      Alert.alert(
        "Error",
        `Failed to ${isEditing ? "update" : "add"} problem.`
      );
    }
  };

  const handleNavigateToAddSubproblem = (parentId: string) => {
    router.push({ pathname: "/ProblemEditorScreen", params: { parentId } });
  };

  const handleNavigateToEditSubproblem = (problemId: string) => {
    router.push({ pathname: "/ProblemEditorScreen", params: { problemId } });
  };

  const handleManageProject = () => {
    Alert.alert("준비 중", "프로젝트 관리 기능은 준비 중입니다.");
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {parentProblemTitle ? (
            <Text style={styles.parentTitleText}>
              Parent: {parentProblemTitle}
            </Text>
          ) : (
            <View style={styles.placeholderParentTitle} />
          )}
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Problem title (required)"
          />
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={(text) => setDescription(text.slice(0, 500))}
            placeholder="Description (optional, max 500 chars)"
            multiline
            maxLength={500}
          />

          {/* 하위 문제 섹션: SubProblemList 컴포넌트 사용 */}
          {currentProblem?.id && ( // 현재 문제가 DB에 저장된 상태(ID가 있는)일 때만 하위 문제 관리 가능
            <SubProblemList
              subProblems={subProblems}
              currentProblemId={currentProblem.id}
              onPressSubProblemItem={handleNavigateToEditSubproblem}
              onPressAddSubProblem={handleNavigateToAddSubproblem}
            />
          )}

          {isProblemTerminal && currentProblem?.id && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Solution Approach</Text>
              <TouchableOpacity
                style={[basicButtonStyle, styles.manageProjectButton]}
                onPress={handleManageProject}
              >
                <Ionicons
                  name={
                    currentProblem.projectId
                      ? "pencil-outline"
                      : "rocket-outline"
                  }
                  size={18}
                  color="#000"
                />
                <Text style={basicButtonTextStyle}>
                  {currentProblem.projectId
                    ? "Manage Project"
                    : "Start Project"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.grayArea}>
            <Text style={styles.grayAreaText}>Future activity/comments.</Text>
          </View>
        </ScrollView>

        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={[basicButtonStyle, styles.saveButton]}
            onPress={handleSaveProblem}
          >
            <Ionicons name="save-outline" size={18} color="#fff" />
            <Text style={[basicButtonTextStyle, styles.saveButtonText]}>
              Save Problem
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles --- (이전과 동일)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  keyboardAvoidingView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContentContainer: { padding: 15, paddingBottom: 80 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  parentTitleText: {
    fontSize: 14,
    color: "gray",
    marginBottom: 10,
    fontStyle: "italic",
  },
  placeholderParentTitle: { height: 20, marginBottom: 10 },
  titleInput: {
    fontSize: 22,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 8,
    marginBottom: 20,
  },
  descriptionInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eee",
    padding: 10,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
    borderRadius: 5,
  },
  section: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    borderRadius: 5,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  // subProblemItem, addButton 스타일은 SubProblemList.tsx로 이동 (또는 공유 스타일로 분리)
  manageProjectButton: { backgroundColor: "#e6ffe6", marginTop: 10 },
  grayArea: {
    flexGrow: 1,
    minHeight: 100,
    backgroundColor: "#f5f5f5",
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    marginTop: 10,
  },
  grayAreaText: { color: "#aaa", fontStyle: "italic" },
  saveButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 34 : 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  saveButton: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  saveButtonText: { color: "#fff", fontSize: 16, marginLeft: 5 },
});
