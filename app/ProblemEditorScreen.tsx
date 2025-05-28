// app/ProblemEditorScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppStore } from "@/store/store";
import { Problem, ProblemStatus, Task } from "@/types"; // Task 타입 추가
import { useShallow } from "zustand/react/shallow";

const basicButtonStyle = {
  paddingVertical: 10,
  paddingHorizontal: 15,
  borderWidth: 1,
  borderColor: "#000",
  alignItems: "center" as "center",
  marginVertical: 5,
};
const basicButtonTextStyle = {
  color: "#000",
  fontSize: 16,
};

export default function ProblemEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    problemId?: string;
    parentId?: string;
  }>();

  const { getProblemById, addProblem, updateProblem, tasks, fetchTasks } =
    useAppStore(
      // tasks와 fetchTasks 추가
      useShallow((state) => ({
        getProblemById: state.getProblemById,
        addProblem: state.addProblem,
        updateProblem: state.updateProblem,
        tasks: state.tasks, // 전체 Task 목록
        fetchTasks: state.fetchTasks, // Task 가져오기 액션
      }))
    );

  const [currentProblem, setCurrentProblem] = useState<
    Problem | null | undefined
  >(undefined);
  const [parentProblemTitle, setParentProblemTitle] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProblemStatus>("active");
  const [isTerminal, setIsTerminal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isEditing = !!params.problemId;

  useEffect(() => {
    setIsLoading(true);
    let problemToEdit: Problem | undefined | null = null;
    let parentOfProblemToEdit: Problem | undefined | null = null;
    let parentForNewSubProblem: Problem | undefined | null = null;

    if (isEditing && params.problemId) {
      problemToEdit = getProblemById(params.problemId);
      setCurrentProblem(problemToEdit || null);
      if (problemToEdit) {
        setTitle(problemToEdit.title);
        setDescription(problemToEdit.description || "");
        setStatus(problemToEdit.status);
        setIsTerminal(
          !problemToEdit.childProblemIds ||
            problemToEdit.childProblemIds.length === 0
        );
        if (problemToEdit.parentId) {
          parentOfProblemToEdit = getProblemById(problemToEdit.parentId);
          setParentProblemTitle(parentOfProblemToEdit?.title || "");
        } else {
          setParentProblemTitle("");
        }
        // 현재 문제에 대한 Task 들도 가져오기
        fetchTasks(params.problemId);
      }
    } else if (params.parentId) {
      parentForNewSubProblem = getProblemById(params.parentId);
      setParentProblemTitle(parentForNewSubProblem?.title || "상위 문제 없음");
      setCurrentProblem(null);
      setIsTerminal(true);
    } else {
      setCurrentProblem(null);
      setParentProblemTitle("");
      setIsTerminal(true);
    }
    setIsLoading(false);
  }, [
    params.problemId,
    params.parentId,
    getProblemById,
    isEditing,
    fetchTasks,
  ]);

  const subProblems = useMemo(() => {
    if (
      currentProblem &&
      currentProblem.childProblemIds &&
      currentProblem.childProblemIds.length > 0
    ) {
      return currentProblem.childProblemIds
        .map((id) => getProblemById(id))
        .filter(Boolean) as Problem[];
    }
    return [];
  }, [currentProblem, getProblemById]);

  // 현재 문제에 연결된 Task 목록
  const currentProblemTasks = useMemo(() => {
    if (currentProblem?.id) {
      return tasks.filter((task) => task.problemId === currentProblem.id);
    }
    return [];
  }, [currentProblem, tasks]);

  const canToggleTerminal = subProblems.length === 0;

  const handleSaveProblem = async () => {
    // ... (이전과 동일한 저장 로직) ...
    if (!title.trim()) {
      Alert.alert("Error", "Problem title is required.");
      return;
    }
    if (description.length > 500) {
      Alert.alert("Error", "Problem description cannot exceed 500 characters.");
      return;
    }

    let result: Problem | null = null;
    const problemDetailsToSave = {
      title: title.trim(),
      description: description.trim(),
      status: status,
    };

    if (isEditing && currentProblem) {
      const updatedFullProblem: Problem = {
        ...currentProblem,
        ...problemDetailsToSave,
        // 만약 isTerminal 상태가 DB에 저장되어야 한다면, 여기서 currentProblem에 반영해야 함
        // 예: childProblemIds: isTerminal ? [] : currentProblem.childProblemIds (주의: 단순 예시)
      };
      result = await updateProblem(updatedFullProblem);
    } else {
      const newProblemData = {
        ...problemDetailsToSave,
        parentId: params.parentId || null,
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

  const handleAddSubproblem = () => {
    // ... (이전과 동일) ...
    if (currentProblem?.id) {
      router.push({
        pathname: "/ProblemEditorScreen",
        params: { parentId: currentProblem.id },
      });
    } else {
      Alert.alert(
        "Error",
        "Please save the current problem before adding a sub-problem."
      );
    }
  };

  const handleAddTask = () => {
    if (currentProblem?.id) {
      Alert.alert("Add Task", `Add task for problem: ${currentProblem.title}`);
      // TODO: Navigate to TaskEditorScreen or open Add Task Modal
      // router.push({ pathname: "/TaskEditorScreen", params: { problemId: currentProblem.id } });
    } else {
      Alert.alert("Error", "Cannot add task to an unsaved problem.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading problem data...</Text>
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
          {/* ... (Parent Problem, Title, Description Input - 이전과 동일) ... */}
          {parentProblemTitle ? (
            <Text style={styles.parentTitleText}>
              Parent Problem: {parentProblemTitle}
            </Text>
          ) : (
            <View style={styles.placeholderParentTitle} />
          )}

          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter problem title (required)"
          />

          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={(text) => setDescription(text.slice(0, 500))}
            placeholder="Enter problem description (optional, max 500 chars)"
            multiline
            maxLength={500}
          />

          {/* Sub-problems Section - 이전과 동일, 단 isTerminal이 true면 비활성화 또는 숨김 처리 가능 */}
          {!isTerminal && ( // isTerminal이 true가 아닐 때만 하위 문제 섹션 표시
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sub-problems</Text>
              {subProblems.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  style={styles.subProblemItem}
                  onPress={() =>
                    router.push({
                      pathname: "/ProblemEditorScreen",
                      params: { problemId: sub.id },
                    })
                  }
                >
                  <Text>{sub.title}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[basicButtonStyle, styles.addButton]}
                onPress={handleAddSubproblem}
                disabled={!currentProblem?.id}
              >
                <Text style={basicButtonTextStyle}>Add Sub-problem</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Terminal Toggle Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                basicButtonStyle,
                isTerminal
                  ? styles.terminalButtonActive
                  : styles.terminalButtonInactive,
                !canToggleTerminal &&
                  !isEditing &&
                  styles.terminalButtonDisabled, // 새 문제이거나 자식이 없으면 활성화
                !canToggleTerminal &&
                  isEditing &&
                  styles.terminalButtonDisabled, // 기존 문제인데 자식이 있으면 비활성화
              ]}
              onPress={() => {
                if (
                  canToggleTerminal ||
                  (isEditing && subProblems.length === 0)
                ) {
                  setIsTerminal((prev) => !prev);
                }
              }}
              disabled={isEditing && !canToggleTerminal} // 수정 중이고 자식이 있으면 토글 불가
            >
              <Text style={basicButtonTextStyle}>
                {isTerminal
                  ? "Terminal (Tasks Active)"
                  : "Definining Sub-problems"}
              </Text>
            </TouchableOpacity>
            {!canToggleTerminal &&
              isEditing && ( // 수정 중이고, 자식이 있을 때만 이 메시지 표시
                <Text style={styles.infoText}>
                  Cannot set as terminal if sub-problems exist. Delete
                  sub-problems first.
                </Text>
              )}
          </View>

          {/* Tasks Section - isTerminal이 true이고, 토글이 가능했거나 이미 Terminal 상태일 때 표시 */}
          {isTerminal && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tasks</Text>
              {currentProblemTasks.length > 0 ? (
                currentProblemTasks.map((task) => (
                  <View key={task.id} style={styles.taskItem}>
                    <Text>
                      {task.title} ({task.status})
                    </Text>
                    {/* TODO: Task 편집/삭제 버튼 등 추가 */}
                  </View>
                ))
              ) : (
                <Text style={styles.infoText}>
                  No tasks yet for this problem.
                </Text>
              )}
              <TouchableOpacity
                style={[basicButtonStyle, styles.addTaskButton]}
                onPress={handleAddTask}
                disabled={!currentProblem?.id} // 현재 문제가 저장된 상태여야 Task 추가 가능
              >
                <Text style={basicButtonTextStyle}>Add Task</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Gray Area - 이전과 동일 */}
          <View style={styles.grayArea}>
            <Text style={styles.grayAreaText}>
              Future activity log or comments will appear here.
            </Text>
          </View>
        </ScrollView>

        {/* Save Button Container - 이전과 동일 */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={[basicButtonStyle, styles.saveButton]}
            onPress={handleSaveProblem}
          >
            <Text style={[basicButtonTextStyle, styles.saveButtonText]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles --- (기존 스타일에 taskItem, addTaskButton 추가)
const styles = StyleSheet.create({
  // ... (이전 스타일 대부분 동일)
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
    marginBottom: 15,
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
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  subProblemItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  addButton: { backgroundColor: "#f0f0f0", marginTop: 10 },
  terminalButtonActive: { backgroundColor: "#e6ffe6", borderColor: "green" },
  terminalButtonInactive: { backgroundColor: "#f0f0f0" },
  terminalButtonDisabled: {
    backgroundColor: "#ddd",
    borderColor: "#aaa",
    opacity: 0.7,
  }, // opacity 추가
  infoText: { fontSize: 12, color: "gray", marginTop: 5 },
  taskItem: {
    // Task 항목 스타일
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0", // subProblemItem보다 연한 구분선
  },
  addTaskButton: {
    // Add Task 버튼 스타일
    backgroundColor: "#e0f7fa", // 약간 다른 배경색
    marginTop: 10,
  },
  grayArea: {
    flexGrow: 1,
    minHeight: 100,
    backgroundColor: "#f5f5f5",
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
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
  saveButtonText: { color: "#fff", fontSize: 16 },
});
