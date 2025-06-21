// app/(tabs)/index.tsx

import ObjectiveList from "@/components/objective/ObjectiveList"; // ✅ [변경] PersonaList -> ObjectiveList
import ProblemList from "@/components/problem/ProblemList";
import ResolvedProblemList from "@/components/problem/ResolvedProblemList";
import SelectWeeklyProblemModal from "@/components/problem/SelectWeeklyProblemModal";
import WeeklyProblemCard from "@/components/problem/WeeklyProblem";
import SessionBox from "@/components/session/SessionBox";
import EditTodoModal from "@/components/todo/EditTodoModal";
import TodoList from "@/components/todo/TodoList";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { useBottomTabOverflow } from "@/components/ui/TabBarBackground";
import { useAppStore } from "@/store/store";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";
import Toast from "react-native-toast-message";
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

  // ADD: New state to manage the refreshing indicator
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      // ... (this state selection is unchanged)
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

  // --- Data Loading ---

  useFocusEffect(
    useCallback(() => {
      // 이 함수는 HomeScreen이 포커스될 때마다 실행됩니다.
      console.log("HomeScreen focused, fetching initial data...");
      fetchObjectives();
      fetchTodos();

      // cleanup 함수를 반환할 수도 있습니다.
      // 화면이 포커스를 잃을 때 실행할 작업이 있다면 여기에 작성합니다.
      // 예: return () => console.log("HomeScreen unfocused");
    }, [fetchObjectives, fetchTodos]) // fetch 함수들이 변경되지 않는 한, 콜백은 재생성되지 않습니다.
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

  // --- Data Processing (useMemo hooks are unchanged) ---
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

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    console.log("Refreshing data...");
    try {
      await Promise.all([fetchObjectives(), fetchTodos()]);
      // 선택된 목표가 있다면 관련 데이터도 새로고침
      if (selectedObjectiveId) {
        await fetchProblems(selectedObjectiveId);
        await fetchWeeklyProblems({ objectiveId: selectedObjectiveId });
        // 스레드까지 새로고침 할 필요가 있다면 추가
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
      Alert.alert("오류", "데이터를 새로고침하는 데 실패했습니다.");
    } finally {
      setIsRefreshing(false);
    }
  }, [
    selectedObjectiveId,
    fetchObjectives,
    fetchTodos,
    fetchProblems,
    fetchWeeklyProblems,
  ]);

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
              Toast.show({
                text1: "삭제 완료",
                text2: `"${title}" 목표가 삭제되었습니다.`,
                position: "top",
                visibilityTime: 2000,
              });
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

    // FIX: Add the required 'notes' property with a value of null.
    addWeeklyProblem({
      objectiveId: selectedObjectiveId,
      problemId,
      weekIdentifier,
      notes: null,
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
      // ADD: Add the RefreshControl component to the ScrollView
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* ... (The content inside the ScrollView is unchanged) ... */}
      {selectedObjective ? (
        <>
          <SessionBox />
          <WeeklyProblemCard
            objective={selectedObjective}
            weeklyProblem={currentWeeklyProblem}
            problem={problemForWeekly}
            onPress={handleNavigateToProblemDetail}
            onPressNew={handleNavigateToSetWeeklyProblem}
            onChangeWeeklyProblem={handleNavigateToSetWeeklyProblem}
          />
          <ProblemList
            objective={selectedObjective}
            problems={activeProblems}
            onPressProblem={handleNavigateToProblemDetail}
            onPressEdit={handleEditProblem}
            onPressEmpty={handleCreateProblem}
          />
          {resolvedProblems.length > 0 && (
            <ResolvedProblemList
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

  // ✅ [추가] TodoList를 ScrollView로 감싸는 새로운 뷰 컴포넌트
  const TodoView = () => (
    <ScrollView
      style={styles.sceneContainer}
      contentContainerStyle={{ paddingBottom: bottom }}
    >
      <TodoList />
    </ScrollView>
  );

  // ✅ [변경] SceneMap에서 TodoList를 새로 만든 TodoView로 교체
  const renderScene = SceneMap({
    solva: SolvaView,
    todo: TodoView, // TodoList -> TodoView
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
      <EditTodoModal
        isVisible={isAddTodoModalVisible}
        onClose={() => setAddTodoModalVisible(false)}
        onSave={handleSaveNewTodo}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  sceneContainer: { flex: 1, backgroundColor: "#F2F2F7" },
  placeholderContainer: { flex: 1, paddingTop: 120, alignItems: "center" },
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
