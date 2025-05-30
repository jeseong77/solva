// app/ProblemEditorScreen.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useAppStore } from "@/store/store";
import { Problem, ProblemStatus } from "@/types";
import { useShallow } from "zustand/react/shallow";
import { Ionicons } from "@expo/vector-icons";
import SubProblemList from "@/components/SubProblemList";

const basicButtonStyle = {
  paddingVertical: 10, paddingHorizontal: 15, borderWidth: 1, borderColor: "#000",
  alignItems: "center" as "center", marginVertical: 5, flexDirection: "row" as "row",
  justifyContent: "center" as "center", backgroundColor: '#f0f0f0',
};
const basicButtonDisabledStyle = { borderColor: "#ccc", backgroundColor: '#f5f5f5', opacity: 0.5 };
const basicButtonTextStyle = { color: "#000", fontSize: 16, marginLeft: 5 };
const basicButtonTextDisabledStyle = { color: "#aaa" };

const debounceTimeout = React.createRef<ReturnType<typeof setTimeout> | null>();

export default function ProblemEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ problemId?: string; parentId?: string }>();

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
  const [isSaving, setIsSaving] = useState(false);

  const isEditingInitially = !!params.problemId;
  const hasUnsavedChanges = useRef(false);

  const loadData = useCallback(() => {
    // ... (loadData 로직은 이전 답변과 동일)
    setIsLoading(true);
    let problemToEdit: Problem | undefined | null = null;
    if (isEditingInitially && params.problemId) {
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
        setCurrentProblem(null); setTitle(params.parentId ? "New Sub-Problem" : "New Problem");
        setDescription(""); setStatus("active");
        // Alert.alert("Error", "Problem not found. Creating a new problem instead."); // 필요시 주석 해제
      }
    } else if (params.parentId) {
      const parent = getProblemById(params.parentId);
      setParentProblemTitle(parent?.title || "Parent not found");
      setCurrentProblem(null); setTitle(""); setDescription(""); setStatus("active");
    } else {
      setCurrentProblem(null); setParentProblemTitle(""); setTitle(""); setDescription(""); setStatus("active");
    }
    setIsLoading(false);
    hasUnsavedChanges.current = false;
  }, [isEditingInitially, params.problemId, params.parentId, getProblemById]);

  useEffect(() => { loadData(); }, [loadData]);
  useFocusEffect(useCallback(() => { loadData(); return () => { }; }, [loadData]));

  const autoSaveProblem = useCallback(async (newTitle: string, newDescription: string) => {
    // ... (autoSaveProblem 로직은 이전 답변과 동일) ...
    if (!newTitle.trim() && !isEditingInitially && !currentProblem?.id) { return; }
    setIsSaving(true);
    hasUnsavedChanges.current = false;
    let currentProblemExists = currentProblem && currentProblem.id;

    if (currentProblemExists) {
      const problemToSave = {
        ...currentProblem!, title: newTitle.trim() || currentProblem!.title,
        description: newDescription.trim(), status: status,
      };
      const result = await updateProblem(problemToSave as Problem);
      if (result) console.log("[Editor] Problem auto-updated:", result.title);
      else console.error("[Editor] Auto-update failed");
    } else {
      const newProblemData = {
        title: newTitle.trim(), description: newDescription.trim(),
        parentId: params.parentId || null, status: status,
      };
      const result = await addProblem(newProblemData);
      if (result) {
        setCurrentProblem(result);
        console.log("[Editor] Problem auto-added:", result.title);
      } else console.error("[Editor] Auto-add failed");
    }
    setIsSaving(false);
  }, [currentProblem, title, description, status, params.parentId, addProblem, updateProblem, isEditingInitially]); // title, description 추가

  useEffect(() => {
    // ... (자동 저장 useEffect 로직은 이전 답변과 동일) ...
    if (isLoading) return;
    if (!hasUnsavedChanges.current && title === (currentProblem?.title || "")) {
      if (!title && !currentProblem?.id && !params.parentId && !isEditingInitially) return;
    }
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      if (hasUnsavedChanges.current || (currentProblem?.id && (title.trim() !== currentProblem.title || description.trim() !== (currentProblem.description || ""))) || (!currentProblem?.id && (title.trim() || description.trim()))) {
        autoSaveProblem(title, description);
      }
    }, 1000);
    return () => { if (debounceTimeout.current) clearTimeout(debounceTimeout.current); };
  }, [title, description, autoSaveProblem, isLoading, currentProblem]); // 의존성 배열에서 params.parentId, isEditingInitially 제거

  const handleTitleChange = (newText: string) => { setTitle(newText); hasUnsavedChanges.current = true; };
  const handleDescriptionChange = (newText: string) => { setDescription(newText.slice(0, 500)); hasUnsavedChanges.current = true; };

  const subProblems = useMemo(() => { /* ... (이전과 동일) ... */
    if (currentProblem?.id) {
      const problemFromStore = getProblemById(currentProblem.id);
      if (problemFromStore?.childProblemIds && problemFromStore.childProblemIds.length > 0) {
        return problemFromStore.childProblemIds.map((id) => getProblemById(id)).filter(Boolean) as Problem[];
      }
    }
    return [];
  }, [currentProblem, getProblemById, useAppStore((state) => state.problems)]);

  const isProblemSaved = !!currentProblem?.id;
  const isProblemTerminal = isProblemSaved && subProblems.length === 0;
  const canAddSubProblem = isProblemSaved || title.trim().length > 0;

  const handleNavigateToAddSubproblem = (parentId: string) => { /* ... (이전과 동일) ... */
    if (!parentId && currentProblem?.id) parentId = currentProblem.id;
    if (parentId) { router.push({ pathname: "/ProblemEditorScreen", params: { parentId } }); }
    else { Alert.alert("Info", "Please enter a title for the current problem to enable adding sub-problems."); }
  };
  const handleNavigateToEditSubproblem = (problemId: string) => { /* ... (이전과 동일) ... */
    router.push({ pathname: "/ProblemEditorScreen", params: { problemId } });
  };

  // --- handleManageProject 함수 수정 ---
  const handleManageProject = async () => {
    if (!isProblemSaved || !currentProblem?.id) {
      Alert.alert("Info", "Please save the problem first to start or manage its project.");
      return;
    }

    // 자동 저장이 진행 중일 수 있으므로, 현재 내용을 강제로 한 번 저장 시도 (선택적)
    // 또는 마지막 자동 저장을 신뢰하고 바로 네비게이션
    if (hasUnsavedChanges.current) {
      await autoSaveProblem(title, description);
      // autoSaveProblem 후 currentProblem이 업데이트 될 수 있으므로, 최신 ID 사용
      if (!currentProblem.id && !getProblemById(currentProblem.id!)?.id) { // ID가 여전히 없다면 (첫 저장 실패 등)
        Alert.alert("Error", "Failed to save the current problem before proceeding.");
        return;
      }
    }

    const problemForProject = getProblemById(currentProblem.id); // 최신 problem 정보 가져오기

    if (problemForProject?.projectId) {
      console.log(`[Editor] Navigating to edit Project: ${problemForProject.projectId} for Problem: ${problemForProject.id}`);
      router.push({ pathname: "/ProjectEditorScreen", params: { projectId: problemForProject.projectId, problemId: problemForProject.id } });
    } else {
      console.log(`[Editor] Navigating to create new Project for Problem: ${problemForProject?.id}`);
      router.push({ pathname: "/ProjectEditorScreen", params: { problemId: problemForProject!.id } });
    }
  };
  // --- 수정 끝 ---

  if (isLoading) { /* ... (이전과 동일) ... */
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: "Loading..." }} />
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#0000ff" /><Text>Loading...</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: title || (params.parentId ? "New Sub-Problem" : (isEditingInitially ? "Edit Problem" : "New Problem")),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={{ paddingHorizontal: Platform.OS === 'ios' ? 0 : 10 }}>
              <Ionicons name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"} size={28} color="#007AFF" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => Alert.alert("More Options", "More options here.")} style={{ marginRight: 16 }}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
          {parentProblemTitle ? <Text style={styles.parentTitleText}>Parent: {parentProblemTitle}</Text> : <Text style={styles.parentTitleText}>{(isEditingInitially && !params.parentId) ? "Top-level Problem" : (params.parentId ? "" : "New Top-level Problem")}</Text>}
          <TextInput style={styles.titleInput} value={title} onChangeText={handleTitleChange} placeholder="Problem title (required)" />
          <TextInput style={styles.descriptionInput} value={description} onChangeText={handleDescriptionChange} placeholder="Description (optional, max 500 chars)" multiline maxLength={500} />

          {isProblemSaved && (
            <SubProblemList
              subProblems={subProblems}
              currentProblemId={currentProblem.id as string}
              isParentProblemSaved={isProblemSaved}
              onPressSubProblemItem={handleNavigateToEditSubproblem}
              onPressAddSubProblem={handleNavigateToAddSubproblem}
            />
          )}

          {isProblemTerminal && isProblemSaved && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Solution Approach</Text>
              <TouchableOpacity
                style={[basicButtonStyle, styles.manageProjectButton, (!isProblemTerminal || !isProblemSaved) && basicButtonDisabledStyle]} // disabled 조건에 isProblemSaved 추가
                onPress={handleManageProject}
                disabled={!isProblemTerminal || !isProblemSaved} // disabled 조건에 isProblemSaved 추가
              >
                <Ionicons name={currentProblem?.projectId ? "pencil-outline" : "rocket-outline"} size={18} color={(!isProblemTerminal || !isProblemSaved) ? "#aaa" : "#000"} />
                <Text style={[basicButtonTextStyle, (!isProblemTerminal || !isProblemSaved) && basicButtonTextDisabledStyle]}>
                  {currentProblem?.projectId ? "Manage Project" : "Start Project"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.grayArea}><Text style={styles.grayAreaText}>Future activity/comments.</Text></View>
        </ScrollView>
        {isSaving && <ActivityIndicator style={styles.savingIndicator} size="small" color="#007AFF" />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  // ... (이전 스타일과 거의 동일, 필요한 부분만 남김) ...
  safeArea: { flex: 1, backgroundColor: "#fff" },
  keyboardAvoidingView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContentContainer: { padding: 15, paddingBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  parentTitleText: { fontSize: 14, color: "gray", marginBottom: 10, fontStyle: "italic" },
  placeholderParentTitle: { height: 20, marginBottom: 10 }, // 이 스타일은 거의 사용 안 함
  titleInput: { fontSize: 22, fontWeight: "bold", borderBottomWidth: 1, borderColor: "#ccc", paddingVertical: 8, marginBottom: 20 },
  descriptionInput: { fontSize: 16, borderWidth: 1, borderColor: "#eee", padding: 10, minHeight: 100, textAlignVertical: 'top', marginBottom: 20, borderRadius: 5 },
  section: { marginBottom: 20, padding: 10, borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 5 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  manageProjectButton: { backgroundColor: '#e6ffe6', marginTop: 10 },
  grayArea: { flexGrow: 1, minHeight: 100, backgroundColor: '#f5f5f5', padding: 15, justifyContent: 'center', alignItems: 'center', borderRadius: 5, marginTop: 10 },
  grayAreaText: { color: '#aaa', fontStyle: 'italic' },
  savingIndicator: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, right: 20, zIndex: 10 },
});