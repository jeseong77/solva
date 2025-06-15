// app/(tabs)/index.tsx

import PersonaList from "@/components/persona/personaList";
import ProblemList from "@/components/problem/ProblemList";
import ResolvedProblemList from "@/components/problem/ResolvedProblemList";
import SelectWeeklyProblemModal from "@/components/problem/SelectWeeklyProblemModal";
import WeeklyProblemCard from "@/components/problem/WeeklyProblem";
import SessionBox from "@/components/session/SessionBox";
import AddTodoModal from "@/components/todo/AddTodoModal";
import TodoList from "@/components/todo/TodoList";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
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

  // --- 상태 관리 (State) ---
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState<
    string | undefined
  >();
  const [isDetailModalVisible, setDetailModalVisible] = useState(false);
  const [viewingProblemId, setViewingProblemId] = useState<string | null>(null);
  const [isWeeklySelectModalVisible, setWeeklySelectModalVisible] =
    useState(false);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "solva", title: "Solva" },
    { key: "todo", title: "Todo" },
  ]);
  const [isAddTodoModalVisible, setAddTodoModalVisible] = useState(false);

  useEffect(() => {
    console.log(
      `[Debug] 탭 인덱스 변경: ${index} | 화면 높이: ${layout.height} | 탭바 높이: ${tabBarHeight}`
    );
  }, [index, layout.height, tabBarHeight]);
  // --- 스토어 데이터 및 액션 (Zustand) ---
  const {
    personas,
    fetchPersonas,
    selectedPersonaId,
    setSelectedPersonaId,
    deletePersona,
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
      personas: state.personas,
      fetchPersonas: state.fetchPersonas,
      selectedPersonaId: state.selectedPersonaId,
      setSelectedPersonaId: state.setSelectedPersonaId,
      deletePersona: state.deletePersona,
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
      fetchPersonas();
      fetchTodos(); // Todo 목록도 함께 불러옴
    }, [fetchPersonas, fetchTodos])
  );

  useEffect(() => {
    if (selectedPersonaId) {
      const loadDataForPersona = async () => {
        await Promise.all([
          fetchProblems(selectedPersonaId),
          fetchWeeklyProblems({ personaId: selectedPersonaId }),
        ]);
        const currentProblems = useAppStore
          .getState()
          .problems.filter((p) => p.personaId === selectedPersonaId);
        for (const problem of currentProblems) {
          await fetchThreads({ problemId: problem.id });
        }
      };
      loadDataForPersona();
    }
  }, [selectedPersonaId, fetchProblems, fetchWeeklyProblems, fetchThreads]);

  // --- 데이터 가공 (useMemo) ---
  const selectedPersona = useMemo(
    () => personas.find((p) => p.id === selectedPersonaId),
    [personas, selectedPersonaId]
  );

  const activeProblems = useMemo(
    () =>
      selectedPersonaId
        ? problems.filter(
            (p) =>
              p.personaId === selectedPersonaId &&
              (p.status === "active" || p.status === "onHold")
          )
        : [],
    [problems, selectedPersonaId]
  );

  const resolvedProblems = useMemo(
    () =>
      selectedPersonaId
        ? problems.filter(
            (p) =>
              p.personaId === selectedPersonaId &&
              (p.status === "resolved" || p.status === "archived")
          )
        : [],
    [problems, selectedPersonaId]
  );

  const currentWeeklyProblem = useMemo(() => {
    if (!selectedPersonaId) return undefined;
    const weekIdentifier = getWeekIdentifier(new Date());
    return weeklyProblems.find(
      (wp) =>
        wp.personaId === selectedPersonaId &&
        wp.weekIdentifier === weekIdentifier
    );
  }, [weeklyProblems, selectedPersonaId]);

  const problemForWeekly = useMemo(() => {
    if (!currentWeeklyProblem) return undefined;
    return problems.find((p) => p.id === currentWeeklyProblem.problemId);
  }, [problems, currentWeeklyProblem]);

  // --- 핸들러 함수 (Handlers) ---
  const handleSelectPersona = (personaId: string) => {
    setSelectedPersonaId(selectedPersonaId === personaId ? null : personaId);
  };

  const handleLongPressPersona = (personaId: string) => {
    const persona = personas.find((p) => p.id === personaId);
    if (!persona) return;
    Alert.alert(
      `"${persona.title}"`,
      "어떤 작업을 하시겠습니까?",
      [
        {
          text: "편집하기",
          onPress: () => router.push(`/persona/${personaId}`),
        },
        {
          text: "삭제하기",
          onPress: () => showDeleteConfirmation(personaId, persona.title),
          style: "destructive",
        },
        { text: "취소", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const showDeleteConfirmation = (personaId: string, title: string) => {
    Alert.alert(
      `"${title}" 페르소나 삭제`,
      "이 페르소나와 연결된 모든 데이터가 함께 삭제됩니다. 정말 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          onPress: async () => {
            const success = await deletePersona(personaId);
            if (success) {
              Alert.alert("성공", "페르소나가 삭제되었습니다.");
            } else {
              Alert.alert("오류", "페르소나 삭제에 실패했습니다.");
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
  const handleNavigateToCreatePersona = () => {
    router.push("/persona/create");
  };
  const handleCreateProblem = () => {
    // ✅ 생성 페이지로 이동하면서, 현재 선택된 persona의 ID를 파라미터로 전달합니다.
    if (selectedPersonaId) {
      router.push({
        pathname: "/problem/create",
        params: { personaId: selectedPersonaId },
      });
    } else {
      Alert.alert("알림", "문제를 생성할 페르소나를 먼저 선택해주세요.");
    }
  };
  const handleEditProblem = (problemId: string) => {
    // ✅ 수정 페이지로 이동합니다.
    router.push(`/problem/${problemId}/edit`);
  };
  const handleCloseEditModal = () => {
    setEditModalVisible(false);
  };

  const handleConfirmWeeklyProblem = (problemId: string) => {
    if (!selectedPersonaId) return;

    const weekIdentifier = getWeekIdentifier(new Date());

    // ✅ [추가] 기존 주간 문제가 있으면 ID를 찾아서 삭제 먼저 실행
    const existingWeeklyProblem = weeklyProblems.find(
      (wp) =>
        wp.personaId === selectedPersonaId &&
        wp.weekIdentifier === weekIdentifier
    );
    if (existingWeeklyProblem) {
      deleteWeeklyProblem(existingWeeklyProblem.id);
    }

    // 새로운 주간 문제 추가
    addWeeklyProblem({
      personaId: selectedPersonaId,
      problemId,
      weekIdentifier,
    });
  };

  // ✅ [수정] 기존 핸들러가 Alert 대신 모달을 열도록 변경
  const handleNavigateToSetWeeklyProblem = () => {
    setWeeklySelectModalVisible(true);
  };

  // ✅ [수정] FAB를 누르면 AddTodoModal을 열도록 변경
  const handleCreateTodo = () => {
    setAddTodoModalVisible(true);
  };

  // ✅ [추가] AddTodoModal에서 '저장'을 눌렀을 때 실행될 핸들러
  const handleSaveNewTodo = (content: string) => {
    addTodo({ content });
    setAddTodoModalVisible(false); // 저장 후 모달 닫기
  };

  const SolvaView = () => (
    // ✅ FlatList 대신 ScrollView를 사용하고, sceneContainer 스타일을 적용합니다.
    <ScrollView
      style={styles.sceneContainer}
      // ✅ 스크롤 콘텐츠 하단에 탭 바 높이만큼의 여백을 추가합니다.
      contentContainerStyle={{ paddingBottom: tabBarHeight }}
    >
      {selectedPersona ? (
        <>
          <SessionBox />
          <WeeklyProblemCard
            persona={selectedPersona}
            weeklyProblem={currentWeeklyProblem}
            problem={problemForWeekly}
            onPress={handleNavigateToProblemDetail}
            onPressNew={handleNavigateToSetWeeklyProblem}
            onChangeWeeklyProblem={handleNavigateToSetWeeklyProblem}
          />
          {/* ProblemList가 자체 카드 스타일을 가집니다. */}
          <ProblemList
            persona={selectedPersona}
            problems={activeProblems}
            onPressProblem={handleNavigateToProblemDetail}
            onLongPressProblem={handleEditProblem}
          />
          {/* ResolvedProblemList가 자체 카드 스타일을 가집니다. */}
          {resolvedProblems.length > 0 && (
            <ResolvedProblemList
              persona={selectedPersona}
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
            페르소나를 추가하거나 선택하여 작업을 시작해 보세요!
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
      <PersonaList
        selectedPersonaId={selectedPersonaId}
        onSelectPersona={handleSelectPersona}
        onLongPressPersona={handleLongPressPersona}
        onPressAddPersona={handleNavigateToCreatePersona}
      />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        // 1. TabBar의 컨테이너, 인디케이터, 색상 등을 설정합니다.
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

// ✅ 스타일 정의는 반드시 컴포넌트 선언 이후에 위치해야 합니다.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  sceneContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  placeholderContainer: {
    flex: 1,
    paddingTop: 70,
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
  },
  placeholderImage: {
    width: 180,
    height: 180,
    marginBottom: 24,
    opacity: 0.8,
  },
  tabBar: {
    backgroundColor: "#ffffff",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
  },
  tabIndicator: {
    backgroundColor: "#212529",
    height: 3,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: "bold",
    textTransform: "none",
  },
  listContentContainer: {},
  // ✅ [추가] FlatList 자체에 적용할 카드 스타일
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
    paddingHorizontal: 16, // 패딩 조정
    paddingTop: 16, // 패딩 조정
    paddingBottom: 8,
    backgroundColor: "#ffffff", // ✅ 배경색을 카드의 흰색으로 통일
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
  fabContainer: {
    position: "absolute",
    right: 16,
  },
});
