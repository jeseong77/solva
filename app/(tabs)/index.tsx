// app/(tabs)/index.tsx

import ObjectiveList from "@/components/objective/ObjectiveList"; // ✅ [변경] PersonaList -> ObjectiveList
import ProblemList from "@/components/problem/ProblemList";
import ResolvedProblemList from "@/components/problem/ResolvedProblemList";
import SelectWeeklyProblemModal from "@/components/problem/SelectWeeklyProblemModal";
import WeeklyProblemCard from "@/components/problem/WeeklyProblem";
import SessionBox from "@/components/session/SessionBox";
import AddTodoModal from "@/components/todo/AddTodoModal";
import TodoList from "@/components/todo/TodoList";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { useBottomTabOverflow } from "@/components/ui/TabBarBackground";
import { useAppStore } from "@/store/store";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";
import { useShallow } from "zustand/react/shallow";

const getWeekIdentifier = (date: Date): string => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

export default function HomeScreen() {
  const router = useRouter();
  const layout = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
  const bottom = useBottomTabOverflow();

  const [isWeeklySelectModalVisible, setWeeklySelectModalVisible] =
    useState(false);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "solva", title: "Solva" },
    { key: "todo", title: "Todo" },
  ]);
  const [isAddTodoModalVisible, setAddTodoModalVisible] = useState(false);

  // --- 스토어 데이터 및 액션 (Zustand) ---
  // ✅ [변경] Persona -> Objective 관련 상태와 액션으로 모두 변경
  const {
    objectives,
    fetchObjectives,
    selectedObjectiveId,
    setSelectedObjectiveId,
    deleteObjective,
    problems,
    fetchProblems,
    fetchThreads,
    weeklyProblems,
    fetchWeeklyProblems,
    addWeeklyProblem,
    deleteWeeklyProblem,
    fetchTodos,
    addTodo,
  } = useAppStore(
    useShallow((state) => ({
      objectives: state.objectives,
      fetchObjectives: state.fetchObjectives,
      selectedObjectiveId: state.selectedObjectiveId,
      setSelectedObjectiveId: state.setSelectedObjectiveId,
      deleteObjective: state.deleteObjective,
      problems: state.problems,
      fetchProblems: state.fetchProblems,
      fetchThreads: state.fetchThreads,
      weeklyProblems: state.weeklyProblems,
      fetchWeeklyProblems: state.fetchWeeklyProblems,
      addWeeklyProblem: state.addWeeklyProblem,
      deleteWeeklyProblem: state.deleteWeeklyProblem,
      fetchTodos: state.fetchTodos,
      addTodo: state.addTodo,
    }))
  );

  // --- 데이터 로딩 (useEffect / useFocusEffect) ---
  useFocusEffect(
    useCallback(() => {
      fetchObjectives();
      fetchTodos();
    }, [fetchObjectives, fetchTodos])
  );

  useEffect(() => {
    if (selectedObjectiveId) {
      const loadDataForObjective = async () => {
        await Promise.all([
          fetchProblems(selectedObjectiveId),
          fetchWeeklyProblems({ objectiveId: selectedObjectiveId }),
        ]);
        const currentProblems = useAppStore
          .getState()
          .problems.filter((p) => p.objectiveId === selectedObjectiveId);
        for (const problem of currentProblems) {
          await fetchThreads({ problemId: problem.id });
        }
      };
      loadDataForObjective();
    }
  }, [selectedObjectiveId, fetchProblems, fetchWeeklyProblems, fetchThreads]);

  // --- 데이터 가공 (useMemo) ---
  const selectedObjective = useMemo(
    () => objectives.find((p) => p.id === selectedObjectiveId),
    [objectives, selectedObjectiveId]
  );

  const activeProblems = useMemo(
    () =>
      selectedObjectiveId
        ? problems.filter(
            (p) =>
              p.objectiveId === selectedObjectiveId &&
              (p.status === "active" || p.status === "onHold")
          )
        : [],
    [problems, selectedObjectiveId]
  );

  const resolvedProblems = useMemo(
    () =>
      selectedObjectiveId
        ? problems.filter(
            (p) =>
              p.objectiveId === selectedObjectiveId &&
              (p.status === "resolved" || p.status === "archived")
          )
        : [],
    [problems, selectedObjectiveId]
  );

  const currentWeeklyProblem = useMemo(() => {
    if (!selectedObjectiveId) return undefined;
    const weekIdentifier = getWeekIdentifier(new Date());
    return weeklyProblems.find(
      (wp) =>
        wp.objectiveId === selectedObjectiveId &&
        wp.weekIdentifier === weekIdentifier
    );
  }, [weeklyProblems, selectedObjectiveId]);

  const problemForWeekly = useMemo(() => {
    if (!currentWeeklyProblem) return undefined;
    return problems.find((p) => p.id === currentWeeklyProblem.problemId);
  }, [problems, currentWeeklyProblem]);

  // --- 핸들러 함수 (Handlers) ---
  const handleSelectObjective = (objectiveId: string) => {
    setSelectedObjectiveId(
      selectedObjectiveId === objectiveId ? null : objectiveId
    );
  };

  const handleLongPressObjective = (objectiveId: string) => {
    const objective = objectives.find((p) => p.id === objectiveId);
    if (!objective) return;
    Alert.alert(
      `"${objective.title}"`,
      "어떤 작업을 하시겠습니까?",
      [
        {
          text: "편집하기",
          onPress: () => router.push(`/objective/${objectiveId}`), // ✅ 경로 변경
        },
        {
          text: "삭제하기",
          onPress: () => showDeleteConfirmation(objectiveId, objective.title),
          style: "destructive",
        },
        { text: "취소", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const showDeleteConfirmation = (objectiveId: string, title: string) => {
    Alert.alert(
      `"${title}" 목표 삭제`, // ✅ 텍스트 변경
      "이 목표와 연결된 모든 데이터(문제, 스레드 등)가 함께 삭제됩니다. 정말 삭제하시겠습니까?", // ✅ 텍스트 변경
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          onPress: async () => {
            const success = await deleteObjective(objectiveId);
            if (success) {
              Alert.alert("성공", "목표가 삭제되었습니다.");
            } else {
              Alert.alert("오류", "목표 삭제에 실패했습니다.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };
  const handleNavigateToProblemDetail = (problemId: string) => {
    router.push(`/problem/${problemId}`);
  };
  const handleNavigateToCreateObjective = () => {
    router.push("/objective/create");
  };
  const handleCreateProblem = () => {
    if (selectedObjectiveId) {
      router.push({
        pathname: "/problem/create",
        params: { objectiveId: selectedObjectiveId },
      });
    } else {
      Alert.alert("알림", "문제를 생성할 목표를 먼저 선택해주세요.");
    }
  };
  const handleEditProblem = (problemId: string) => {
    router.push(`/problem/${problemId}/edit`);
  };

  const handleConfirmWeeklyProblem = (problemId: string) => {
    if (!selectedObjectiveId) return;
    const weekIdentifier = getWeekIdentifier(new Date());
    const existingWeeklyProblem = weeklyProblems.find(
      (wp) =>
        wp.objectiveId === selectedObjectiveId &&
        wp.weekIdentifier === weekIdentifier
    );
    if (existingWeeklyProblem) {
      deleteWeeklyProblem(existingWeeklyProblem.id);
    }
    addWeeklyProblem({
      objectiveId: selectedObjectiveId,
      problemId,
      weekIdentifier,
    });
  };

  const handleNavigateToSetWeeklyProblem = () => {
    setWeeklySelectModalVisible(true);
  };
  const handleCreateTodo = () => {
    setAddTodoModalVisible(true);
  };
  const handleSaveNewTodo = (content: string) => {
    addTodo({ content });
    setAddTodoModalVisible(false);
  };

  const SolvaView = () => (
    <ScrollView
      style={styles.sceneContainer}
      contentContainerStyle={{ paddingBottom: bottom }}
      showsVerticalScrollIndicator={false}
    >
      {selectedObjective ? (
        <>
          <SessionBox />
          <WeeklyProblemCard
            objective={selectedObjective} // ✅ persona -> objective
            weeklyProblem={currentWeeklyProblem}
            problem={problemForWeekly}
            onPress={handleNavigateToProblemDetail}
            onPressNew={handleNavigateToSetWeeklyProblem}
            onChangeWeeklyProblem={handleNavigateToSetWeeklyProblem}
          />
          <ProblemList
            objective={selectedObjective} // ✅ persona -> objective
            problems={activeProblems}
            onPressProblem={handleNavigateToProblemDetail}
            onLongPressProblem={handleEditProblem}
          />
          {resolvedProblems.length > 0 && (
            <ResolvedProblemList
              objective={selectedObjective} // ✅ persona -> objective
              problems={resolvedProblems}
              onPressProblem={handleNavigateToProblemDetail}
            />
          )}
        </>
      ) : (
        <View style={styles.placeholderContainer}>
          <Image
            source={require("@/assets/images/main_sample.png")}
            style={styles.placeholderImage}
          />
          <Text style={styles.placeholderText}>
            목표를 추가하거나 선택하여 작업을 시작해 보세요!
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderScene = SceneMap({
    solva: SolvaView,
    todo: TodoList,
  });

  const activeView = routes[index].key as "solva" | "todo";

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ [변경] ObjectiveList 컴포넌트와 관련 props로 모두 변경 */}
      <ObjectiveList
        selectedObjectiveId={selectedObjectiveId}
        onSelectObjective={handleSelectObjective}
        onLongPressObjective={handleLongPressObjective}
        onPressAddObjective={handleNavigateToCreateObjective}
      />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            style={styles.tabBar}
            indicatorStyle={styles.tabIndicator}
            activeColor="#212529"
            inactiveColor="#adb5bd"
          />
        )}
        commonOptions={{
          labelStyle: styles.tabLabel,
        }}
      />
      <View style={[styles.fabContainer, { bottom: tabBarHeight + 16 }]}>
        <FloatingActionButton
          mode={activeView}
          onPress={
            activeView === "solva" ? handleCreateProblem : handleCreateTodo
          }
        />
      </View>
      <SelectWeeklyProblemModal
        isVisible={isWeeklySelectModalVisible}
        onClose={() => setWeeklySelectModalVisible(false)}
        onConfirm={handleConfirmWeeklyProblem}
      />
      <AddTodoModal
        isVisible={isAddTodoModalVisible}
        onClose={() => setAddTodoModalVisible(false)}
        onSave={handleSaveNewTodo}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  sceneContainer: { flex: 1, backgroundColor: "#f8f9fa" },
  placeholderContainer: { flex: 1, paddingTop: 70, alignItems: "center" },
  placeholderText: { fontSize: 16, color: "#6c757d", textAlign: "center" },
  placeholderImage: { width: 180, height: 180, marginBottom: 24, opacity: 0.8 },
  tabBar: {
    backgroundColor: "#ffffff",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
  },
  tabIndicator: { backgroundColor: "#212529", height: 3 },
  tabLabel: { fontSize: 15, fontWeight: "bold", textTransform: "none" },
  listContentContainer: {},
  listCardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    overflow: "hidden",
  },
  listSectionHeader: {
    fontSize: 17,
    fontWeight: "600",
    color: "#212529",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#ffffff",
  },
  newProblemButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    margin: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  newProblemButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginLeft: 8,
  },
  fabContainer: { position: "absolute", right: 16 },
});
