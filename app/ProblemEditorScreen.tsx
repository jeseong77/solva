// app/ProblemEditorScreen.tsx
import SubProblemList from "@/components/SubProblemList";
import { useAppStore } from "@/store/store";
import { Problem, ProblemStatus } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const basicButtonStyle = {
  paddingVertical: 10,
  paddingHorizontal: 15,
  borderWidth: 1,
  borderColor: "#000", // 기본 검은색 테두리
  alignItems: "center" as "center",
  marginVertical: 5,
  flexDirection: "row" as "row",
  justifyContent: "center" as "center",
  backgroundColor: '#f0f0f0', // 기본 버튼 배경색 (비활성화 느낌)
};
const basicButtonDisabledStyle = {
  borderColor: "#ccc", // 비활성화 시 테두리 색
  backgroundColor: '#f5f5f5', // 비활성화 시 배경색
};
const basicButtonTextStyle = {
  color: "#000", // 기본 텍스트 색상
  fontSize: 16,
  marginLeft: 5,
};
const basicButtonTextDisabledStyle = {
  color: "#aaa", // 비활성화 시 텍스트 색상
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

  const [currentProblem, setCurrentProblem] = useState<Problem | null | undefined>(undefined);
  const [parentProblemTitle, setParentProblemTitle] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProblemStatus>("active");
  const [isLoading, setIsLoading] = useState(true);

  const isEditing = !!params.problemId;

  const loadData = useCallback(() => {
    setIsLoading(true);
    let problemToEdit: Problem | undefined | null = null;
    if (isEditing && params.problemId) {
      problemToEdit = getProblemById(params.problemId);
      setCurrentProblem(problemToEdit || null);
      if (problemToEdit) {
        setTitle(problemToEdit.title);
        setDescription(problemToEdit.description || "");
        setStatus(problemToEdit.status);
        if (problemToEdit.parentId) {
          const parent = getProblemById(problemToEdit.parentId);
          setParentProblemTitle(parent?.title || "");
        } else { setParentProblemTitle(""); }
      } else {
        setCurrentProblem(null); setTitle(""); setDescription(""); setStatus("active");
      }
    } else if (params.parentId) {
      const parent = getProblemById(params.parentId);
      setParentProblemTitle(parent?.title || "상위 문제 없음");
      setCurrentProblem(null); setTitle(""); setDescription(""); setStatus("active");
    } else {
      setCurrentProblem(null); setParentProblemTitle(""); setTitle(""); setDescription(""); setStatus("active");
    }
    setIsLoading(false);
  }, [isEditing, params.problemId, params.parentId, getProblemById]);

  useEffect(() => { loadData(); }, [loadData]);
  useFocusEffect(useCallback(() => { loadData(); return () => { }; }, [loadData]));

  const subProblems = useMemo(() => {
    if (currentProblem?.id) {
      const problemFromStore = getProblemById(currentProblem.id);
      if (problemFromStore?.childProblemIds && problemFromStore.childProblemIds.length > 0) {
        return problemFromStore.childProblemIds.map((id) => getProblemById(id)).filter(Boolean) as Problem[];
      }
    }
    return [];
  }, [currentProblem, getProblemById, useAppStore((state) => state.problems)]);

  const isProblemTerminal = currentProblem?.id ? subProblems.length === 0 : !params.parentId;
  const isProblemSaved = !!currentProblem?.id; // 현재 문제가 저장된 상태인지 (ID 유무로 판단)

  const handleSaveProblem = async () => {
    // ... (이전과 동일한 저장 로직) ...
    if (!title.trim()) { Alert.alert("Error", "Problem title is required."); return; }
    if (description.length > 500) { Alert.alert("Error", "Problem description cannot exceed 500 chars."); return; }
    let result: Problem | null = null;
    const problemDetailsToSave = { title: title.trim(), description: description.trim(), status: status };
    if (isEditing && currentProblem) {
      const updatedFullProblem: Problem = { ...currentProblem, ...problemDetailsToSave };
      result = await updateProblem(updatedFullProblem);
    } else {
      const newProblemData = { ...problemDetailsToSave, parentId: params.parentId || null };
      result = await addProblem(newProblemData);
    }
    if (result) {
      Alert.alert("Success", `Problem successfully ${isEditing ? "updated" : "added"}.`);
      if (!isEditing && result.id) { // 새 문제 저장 성공 시, currentProblem 상태 업데이트하여 버튼 활성화 유도
        setCurrentProblem(result);
      }
      if (router.canGoBack()) { router.back(); } else { router.replace("/"); }
    } else {
      Alert.alert("Error", `Failed to ${isEditing ? "update" : "add"} problem.`);
    }
  };

  const handleNavigateToAddSubproblem = (parentId: string) => {
    router.push({ pathname: "/ProblemEditorScreen", params: { parentId } });
  };

  const handleNavigateToEditSubproblem = (problemId: string) => {
    router.push({ pathname: "/ProblemEditorScreen", params: { problemId } });
  };

  const handleManageProject = () => {
    if (!isProblemSaved) {
      Alert.alert("Info", "Please save the problem first to manage its solution approach.");
      return;
    }
    Alert.alert("준비 중", "프로젝트 관리 기능은 준비 중입니다.");
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#0000ff" /><Text>Loading...</Text></View>
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
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
          {parentProblemTitle ? <Text style={styles.parentTitleText}>Parent: {parentProblemTitle}</Text> : <View style={styles.placeholderParentTitle} />}
          <TextInput style={styles.titleInput} value={title} onChangeText={setTitle} placeholder="Problem title (required)" />
          <TextInput style={styles.descriptionInput} value={description} onChangeText={(text) => setDescription(text.slice(0, 500))} placeholder="Description (optional, max 500 chars)" multiline maxLength={500} />

          {/* 하위 문제 섹션: 항상 표시, 버튼은 isProblemSaved에 따라 활성화/비활성화 */}
          <SubProblemList
            subProblems={subProblems}
            currentProblemId={currentProblem?.id || ''} // currentProblem.id가 없을 경우 대비
            isParentProblemSaved={isProblemSaved} // 이 prop 전달
            onPressSubProblemItem={handleNavigateToEditSubproblem}
            onPressAddSubProblem={handleNavigateToAddSubproblem}
          />

          {/* 문제 해결 방법 정의 섹션: 항상 표시, 버튼은 isProblemSaved 및 isProblemTerminal에 따라 활성화/비활성화 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solution Approach</Text>
            <TouchableOpacity
              style={[
                basicButtonStyle,
                styles.manageProjectButton,
                (!isProblemSaved || !isProblemTerminal) && basicButtonDisabledStyle // 조건부 비활성화 스타일
              ]}
              onPress={handleManageProject}
              disabled={!isProblemSaved || !isProblemTerminal} // 조건부 비활성화
            >
              <Ionicons
                name={currentProblem?.projectId ? "pencil-outline" : "rocket-outline"}
                size={18}
                color={(!isProblemSaved || !isProblemTerminal) ? "#aaa" : "#000"} // 조건부 아이콘 색상
              />
              <Text style={[
                basicButtonTextStyle,
                (!isProblemSaved || !isProblemTerminal) && basicButtonTextDisabledStyle // 조건부 텍스트 비활성화 스타일
              ]}>
                {currentProblem?.projectId ? "Manage Project" : "Start Project"}
              </Text>
            </TouchableOpacity>
            {isProblemSaved && !isProblemTerminal && (
              <Text style={styles.infoText}>Define sub-problems first or mark as terminal to start a project.</Text>
            )}
          </View>

          <View style={styles.grayArea}><Text style={styles.grayAreaText}>Future activity/comments.</Text></View>
        </ScrollView>

        <View style={styles.saveButtonContainer}>
          <TouchableOpacity style={[basicButtonStyle, styles.saveButton]} onPress={handleSaveProblem}>
            <Ionicons name="save-outline" size={18} color="#fff" />
            <Text style={[basicButtonTextStyle, styles.saveButtonText]}>Save Problem</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff"
  },
  keyboardAvoidingView: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  scrollContentContainer: {
    padding: 15,
    paddingBottom: 80
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  parentTitleText: {
    fontSize: 14,
    color: "gray",
    marginBottom: 10,
    fontStyle: "italic"
  },
  placeholderParentTitle: {
    height: 20,
    marginBottom: 10
  },
  titleInput: {
    fontSize: 22,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 8,
    marginBottom: 20
  },
  descriptionInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eee",
    padding: 10,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderRadius: 5
  },
  section: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 5
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10
  },
  addButton: {
    backgroundColor: '#e9e9e9',
    marginTop: 10
  },
  manageProjectButton: {
    backgroundColor: '#e6ffe6',
    marginTop: 10
  },
  infoText: {
    fontSize: 12,
    color: 'gray',
    marginTop: 5,
    textAlign: 'center'
  },
  grayArea: {
    flexGrow: 1,
    minHeight: 100,
    backgroundColor: '#f5f5f5',
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 10
  },
  grayAreaText: {
    color: '#aaa',
    fontStyle: 'italic'
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0, left: 0,
    right: 0,
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  saveButton: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF"
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 5
  },
});