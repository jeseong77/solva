// src/app/(tabs)/index.tsx
import ProblemList from "@/components/ProblemList";
import { useAppStore } from "@/store/store";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  // 스토어에서 projects 및 fetchProjects 추가
  const {
    problems,
    tasks,
    projects, // projects 상태 추가
    fetchProblems,
    fetchTasks,
    fetchProjects, // fetchProjects 액션 추가
    isLoadingProblems,
    deleteProblem,
  } = useAppStore(
    useShallow((state) => ({
      problems: state.problems,
      tasks: state.tasks,
      projects: state.projects,
      fetchProblems: state.fetchProblems,
      fetchTasks: state.fetchTasks,
      fetchProjects: state.fetchProjects,
      isLoadingProblems: state.isLoadingProblems,
      deleteProblem: state.deleteProblem,
    }))
  );

  useEffect(() => {
    fetchProblems();
    fetchTasks();
    fetchProjects();
  }, [fetchProblems, fetchTasks, fetchProjects]);

  const handleNavigateToEditor = (problemId?: string) => {
    if (problemId) {
      router.push({ pathname: "/ProblemEditor.Screen", params: { problemId } });
    } else {
      router.push({ pathname: "/ProblemEditor.Screen" });
    }
  };

  const handleDeleteProblem = async (problemId: string) => {
    Alert.alert("삭제 확인", "이 문제를 정말 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        onPress: async () => {
          const success = await deleteProblem(problemId);
          if (success) {
            Alert.alert("성공", "문제가 삭제되었습니다.");
          } else {
            Alert.alert("오류", "문제 삭제에 실패했습니다.");
          }
        },
        style: "destructive",
      },
    ]);
  };

  // ProblemGraph 관련 로직 제거됨
  // const rootProblemForGraph = problems.find((p) => p.parentId === null);

  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContentContainer}
      >
        <ProblemList
          problems={problems}
          tasks={tasks}
          projects={projects}
          isLoading={isLoadingProblems}
          onPressProblem={handleNavigateToEditor}
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
    backgroundColor: "#f0f0f0",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  // graphSectionContainer 및 sectionTitle 스타일 제거됨
});
