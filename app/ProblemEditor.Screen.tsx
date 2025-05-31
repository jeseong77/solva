// ProblemEditor.Screen.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
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
import { styles } from '@/styles/ProblemEditor.Style';

const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          setParentProblemTitle(parent?.title || "Parent not found"); // 부모 못 찾을 경우 명시
        } else {
          setParentProblemTitle("");
        }
      } else { // 편집 모드지만 ID로 문제를 찾지 못한 경우 (오류 상황 또는 삭제된 문제)
        Alert.alert("Error", "Problem not found. Please check the ID or go back.");
        setCurrentProblem(null);
        setTitle("Error: Problem not found");
        // router.back(); // 또는 이전 화면으로 돌려보내기
      }
    } else if (params.parentId) { // 새 하위 문제 생성
      const parent = getProblemById(params.parentId);
      setParentProblemTitle(parent?.title || "Parent not found");
      setCurrentProblem(null);
      setTitle(""); // 새 문제이므로 제목 비움
      setDescription("");
      setStatus("active");
    } else { // 새 최상위 문제 생성
      setCurrentProblem(null);
      setParentProblemTitle("");
      setTitle(""); // 새 문제이므로 제목 비움
      setDescription("");
      setStatus("active");
    }
    setIsLoading(false);
    hasUnsavedChanges.current = false;
  }, [isEditingInitially, params.problemId, params.parentId, getProblemById]);

  useEffect(() => {
    loadData();
  }, [loadData]); // loadData는 의존성이 거의 변경되지 않으므로 최초 1회 실행과 유사

  useFocusEffect(
    useCallback(() => {
      loadData(); // 화면이 포커스될 때마다 데이터 다시 로드
      return () => {
        // 화면이 포커스를 잃을 때, 자동 저장 타임아웃 정리
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }
      };
    }, [loadData])
  );

  const autoSaveProblem = useCallback(async (newTitle: string, newDescription: string) => {
    const trimmedTitle = newTitle.trim();
    const trimmedDescription = newDescription.trim();

    // 새 문제이고 제목이 없으면 저장하지 않음
    if (!currentProblem?.id && !trimmedTitle && !isEditingInitially && !params.parentId) {
      setIsSaving(false); // isSaving 상태를 false로 확실히 변경
      return;
    }
    // 제목이 비어있으면 저장하지 않음 (기존 문제 업데이트 시에는 기존 제목 유지하도록 할 수 있음)
    if (!trimmedTitle && !currentProblem?.id) {
      setIsSaving(false);
      return;
    }


    setIsSaving(true);
    hasUnsavedChanges.current = false;

    if (currentProblem?.id) { // 기존 문제 업데이트
      const problemToSave: Problem = {
        ...currentProblem,
        title: trimmedTitle || currentProblem.title, // 제목이 비면 기존 제목 유지 (정책에 따라 변경 가능)
        description: trimmedDescription,
        status: status, // status는 별도로 관리될 수 있음
      };
      const result = await updateProblem(problemToSave);
      if (result) {
        console.log("[Editor] Problem auto-updated:", result.title);
        setCurrentProblem(result); // 스토어에서 반환된 최신 객체로 상태 업데이트
      } else {
        console.error("[Editor] Auto-update failed for ID:", currentProblem.id);
        // 실패 시 사용자에게 알림 등을 고려
      }
    } else { // 새 문제 추가
      const newProblemData = {
        title: trimmedTitle,
        description: trimmedDescription,
        parentId: params.parentId || null,
        status: status,
      };
      const result = await addProblem(newProblemData);
      if (result) {
        setCurrentProblem(result); // 새로 추가된 문제 객체로 상태 업데이트
        console.log("[Editor] Problem auto-added:", result.title, "ID:", result.id);
        // 새 문제 저장 후, URL 파라미터에 problemId 추가하여 편집 모드로 전환 (새로고침 시 유지 위함)
        if (!params.problemId) {
          router.setParams({ problemId: result.id });
        }
      } else {
        console.error("[Editor] Auto-add failed");
      }
    }
    setIsSaving(false);
  }, [currentProblem, status, params.parentId, addProblem, updateProblem, isEditingInitially, router]); // title, description 제거 (인자로 받음)

  useEffect(() => {
    if (isLoading) return;

    // 새 문제이고 아직 아무것도 입력 안 했으면 자동 저장 방지
    if (!currentProblem?.id && !title.trim() && !description.trim() && !params.parentId && !isEditingInitially) {
      return;
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      const titleChanged = title.trim() !== (currentProblem?.title || "");
      const descriptionChanged = description.trim() !== (currentProblem?.description || "");

      // 변경 사항이 있거나, 새 문제인데 내용이 입력된 경우 저장
      if (hasUnsavedChanges.current || titleChanged || descriptionChanged || (!currentProblem?.id && (title.trim() || description.trim()))) {
        if (title.trim() || currentProblem?.id) { // 제목이 있거나 기존 문제일 때만 저장
          autoSaveProblem(title, description);
        }
      }
    }, 1200); // 자동 저장 지연 시간 1.2초

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [title, description, autoSaveProblem, isLoading, currentProblem, params.parentId, isEditingInitially]);

  const handleTitleChange = (newText: string) => {
    setTitle(newText);
    hasUnsavedChanges.current = true;
  };

  const handleDescriptionChange = (newText: string) => {
    setDescription(newText.slice(0, 500)); // 글자 수 제한
    hasUnsavedChanges.current = true;
  };

  const subProblems = useMemo(() => {
    if (currentProblem?.id) {
      const problemFromStore = getProblemById(currentProblem.id); // 스토어에서 최신 정보 가져오기
      if (problemFromStore?.childProblemIds && problemFromStore.childProblemIds.length > 0) {
        return problemFromStore.childProblemIds
          .map((id) => getProblemById(id))
          .filter(Boolean) as Problem[]; // filter(Boolean)으로 null/undefined 제거
      }
    }
    return [];
  }, [currentProblem?.id, getProblemById, useAppStore(state => state.problems)]); // currentProblem.id만 의존성으로 두어 id 변경 시 갱신

  const isProblemSaved = !!currentProblem?.id;
  const isProblemTerminal = isProblemSaved && subProblems.length === 0;
  // 현재 문제에 제목이 있거나, 이미 저장된 문제일 경우 하위 문제 추가 가능
  const canAddSubProblem = isProblemSaved || title.trim().length > 0;


  const handleNavigateToAddSubproblem = async () => {
    // 현재 문제에 ID가 없다면 (새 문제), 먼저 자동 저장 시도
    if (!currentProblem?.id) {
      if (title.trim()) {
        await autoSaveProblem(title, description); // 현재 입력 내용으로 저장
        // autoSaveProblem이 currentProblem 상태를 업데이트할 때까지 기다려야 함
        // 임시로 짧은 지연을 주거나, autoSaveProblem이 Promise를 반환하여 ID를 전달하도록 수정
        await new Promise(resolve => setTimeout(resolve, 200)); // 상태 업데이트 대기 (개선 필요)
        if (!currentProblem?.id) { // 여전히 ID가 없다면 (저장 실패 또는 상태 업데이트 지연)
          Alert.alert("Save Error", "Failed to save the current problem. Please try again.");
          return;
        }
      } else {
        Alert.alert("Info", "Please enter a title for the current problem first.");
        return;
      }
    }
    // currentProblem.id가 확실히 있는 상태
    router.push({ pathname: "/ProblemEditor.Screen", params: { parentId: currentProblem!.id } });
  };

  const handleNavigateToEditSubproblem = (problemId: string) => {
    router.push({ pathname: "/ProblemEditor.Screen", params: { problemId } });
  };

  const handleManageProject = async () => {
    if (!currentProblem?.id) { // ID가 없으면 저장 시도
      if (title.trim()) {
        await autoSaveProblem(title, description);
        await new Promise(resolve => setTimeout(resolve, 200)); // 상태 업데이트 대기
        if (!currentProblem?.id) {
          Alert.alert("Save Error", "Failed to save the problem. Cannot manage project.");
          return;
        }
      } else {
        Alert.alert("Info", "Please enter a title and save the problem to manage its project.");
        return;
      }
    }

    const problemForProject = getProblemById(currentProblem.id); // 최신 정보 다시 가져오기

    if (!problemForProject) {
      Alert.alert("Error", "Problem details not found. Please try again.");
      return;
    }

    if (problemForProject.projectId) {
      console.log(`[Editor] Navigating to edit Project: ${problemForProject.projectId} for Problem: ${problemForProject.id}`);
      router.push({ pathname: "/ProjectEditor.Screen", params: { projectId: problemForProject.projectId, problemId: problemForProject.id } });
    } else {
      console.log(`[Editor] Navigating to create new Project for Problem: ${problemForProject.id}`);
      router.push({ pathname: "/ProjectEditor.Screen", params: { problemId: problemForProject.id } });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: "Loading..." }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 10, color: '#555' }}>Loading Problem...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const screenTitle = title.trim() || (params.parentId ? "New Sub-Problem" : (isEditingInitially ? (currentProblem?.title || "Edit Problem") : "New Problem"));

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: screenTitle,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.headerIconButton}>
              <Ionicons name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"} size={28} color="#007AFF" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              {isSaving && <ActivityIndicator size="small" color="#007AFF" style={styles.savingIndicatorInHeader} />}
              <TouchableOpacity onPress={() => Alert.alert("More Options", "Not implemented yet.")} style={styles.headerIconButton}>
                <Ionicons name="ellipsis-horizontal" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} // 헤더 높이에 따라 조정
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled" // 키보드 열린 상태에서 다른 영역 터치 시 키보드 닫기 제어
        >
          {parentProblemTitle ? (
            <Text style={styles.parentTitleText}>Parent: {parentProblemTitle}</Text>
          ) : (
            <Text style={styles.parentTitleText}>
              {(isEditingInitially && !params.parentId && currentProblem) ? "This is a Top-level Problem" : (params.parentId ? "" : "Creating a New Top-level Problem")}
            </Text>
          )}

          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Problem title (required)"
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={handleDescriptionChange}
            placeholder="Description (optional, max 500 chars)"
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            scrollEnabled={false} // 짧은 텍스트 입력 시 내부 스크롤 방지
          />

          {isProblemSaved && currentProblem?.id && (
            <SubProblemList
              subProblems={subProblems}
              currentProblemId={currentProblem.id}
              isParentProblemSaved={isProblemSaved} // 이 prop이 필요한지 확인
              onPressSubProblemItem={handleNavigateToEditSubproblem}
              onPressAddSubProblem={handleNavigateToAddSubproblem} // parentId는 SubProblemList 내부에서 currentProblem.id 사용 가능
            />
          )}
          {/* 새 문제이고 제목이 있을 때 하위 문제 추가 버튼 노출 */}
          {!isProblemSaved && title.trim().length > 0 && (
            <TouchableOpacity
              style={[styles.basicButton, { backgroundColor: '#DDEEFF', marginTop: 10 }]}
              onPress={handleNavigateToAddSubproblem}
            >
              <Ionicons name="add-circle-outline" size={18} color="#007AFF" />
              <Text style={[styles.basicButtonText, { color: "#007AFF" }]}>Add Sub-Problem (auto-saves current)</Text>
            </TouchableOpacity>
          )}


          {isProblemTerminal && isProblemSaved && currentProblem?.id && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Solution Approach</Text>
              <TouchableOpacity
                style={[
                  styles.basicButton,
                  styles.manageProjectButton, // manageProjectButton이 basicButton의 스타일을 확장/덮어쓰도록
                  (!isProblemTerminal || !isProblemSaved) && styles.basicButtonDisabled,
                ]}
                onPress={handleManageProject}
                disabled={!isProblemTerminal || !isProblemSaved}
              >
                <Ionicons
                  name={currentProblem.projectId ? "pencil-outline" : "rocket-outline"}
                  size={18}
                  color={(!isProblemTerminal || !isProblemSaved) ? styles.basicButtonTextDisabled.color : styles.basicButtonText.color}
                />
                <Text style={[
                  styles.basicButtonText,
                  (!isProblemTerminal || !isProblemSaved) && styles.basicButtonTextDisabled,
                ]}>
                  {currentProblem.projectId ? "Manage Project" : "Start Project"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.grayArea}>
            <Text style={styles.grayAreaText}>
              Future activity/comments for this problem (ID: {currentProblem?.id || 'Not saved yet'}).
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}