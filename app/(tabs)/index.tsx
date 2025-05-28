// src/app/(tabs)/index.tsx
import ProblemList from "@/components/ProblemList";
import { useAppStore } from "@/store/store";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { useShallow } from "zustand/react/shallow";

export default function HomeScreen() {
  const router = useRouter();

  const {
    problems,
    tasks,
    fetchProblems,
    fetchTasks,
    isLoadingProblems,
    deleteProblem,
  } = useAppStore(
    useShallow((state) => ({
      problems: state.problems,
      tasks: state.tasks,
      fetchProblems: state.fetchProblems,
      fetchTasks: state.fetchTasks,
      isLoadingProblems: state.isLoadingProblems,
      deleteProblem: state.deleteProblem,
    }))
  );

  useEffect(() => {
    fetchProblems();
    fetchTasks();
  }, [fetchProblems, fetchTasks]);

  const handleNavigateToEditor = (problemId?: string) => {
    if (problemId) {
      router.push({ pathname: "/ProblemEditorScreen", params: { problemId } });
    } else {
      // "Add Problem" 버튼 클릭 시 problemId 없이 호출됨 (새 최상위 문제)
      router.push({ pathname: "/ProblemEditorScreen" });
    }
  };

  const handleDeleteProblem = async (problemId: string) => {
    Alert.alert(
      // 스토어 액션 호출 전에 여기서 최종 확인하거나, ProblemListItem에서 바로 스토어 액션 호출도 가능
      "삭제 확인",
      "이 문제를 정말 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          onPress: async () => {
            const success = await deleteProblem(problemId);
            if (success) {
              // fetchProblems(); // 목록을 다시 로드하거나, Zustand가 상태를 업데이트하므로 필요 없을 수 있음
              Alert.alert("성공", "문제가 삭제되었습니다.");
            } else {
              Alert.alert("오류", "문제 삭제에 실패했습니다.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContentContainer}
      >
        <ProblemList
          problems={problems}
          tasks={tasks}
          isLoading={isLoadingProblems}
          onPressProblem={(problemId) => handleNavigateToEditor(problemId)}
          onPressAddProblem={() => handleNavigateToEditor()}
          allProblemsForContext={problems}
          onDeleteProblem={handleDeleteProblem}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContentContainer: {
    paddingVertical: 16, // ScrollView 전체 내용의 상하 여백
    flexGrow: 1, // 내용이 적을 때도 ProblemList의 messageContainer가 중앙에 올 수 있도록
  },
});
