import { useAppStore } from "@/store/store";
import {
  ActionThreadItem,
  Problem,
  ProblemStatus,
  StarReport,
  TaskThreadItem,
} from "@/types";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router"; // ✅ useLocalSearchParams 추가
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView, // ✅ Modal, Platform 제거, SafeAreaView 유지
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";
import StarReportWrite from "../report/StarReportWrite";
import LogSessionModal from "../session/LogSessionModal";
import ThreadItem from "../thread/ThreadItem";
import ThreadWrite from "../thread/ThreadWrite";
import ProblemPost from "./ProblemPost";

interface FlatThreadItem {
  id: string;
  level: number;
}

// ❌ 더 이상 Props를 받지 않으므로 interface를 제거합니다.
// interface ProblemDetailProps { ... }

export default function ProblemDetail() {
  const router = useRouter();
  // ✅ URL 경로에서 파라미터를 가져옵니다. e.g., /problem/123 -> { problemId: '123' }
  const params = useLocalSearchParams();
  const problemId = Array.isArray(params.problemId)
    ? params.problemId[0]
    : params.problemId;

  const {
    problem,
    persona,
    getThreadItemById,
    threadItems,
    startSession,
    stopSession,
    addThreadItem,
    deleteThreadItem,
    updateThreadItem,
    updateProblem,
    getStarReportByProblemId,
    addStarReport,
  } = useAppStore(
    // ✅ Zustand 스토어에서도 props 대신 hook으로 가져온 problemId를 사용합니다.
    useShallow((state) => {
      const p = problemId
        ? state.problems.find((p) => p.id === problemId)
        : null;
      const persona = p
        ? state.personas.find((p) => p.id === p.id)
        : null;
      return {
        problem: p,
        persona,
        getThreadItemById: state.getThreadItemById,
        threadItems: state.threadItems,
        startSession: state.startSession,
        stopSession: state.stopSession,
        addThreadItem: state.addThreadItem,
        deleteThreadItem: state.deleteThreadItem,
        updateThreadItem: state.updateThreadItem,
        updateProblem: state.updateProblem,
        getStarReportByProblemId: state.getStarReportByProblemId,
        addStarReport: state.addStarReport,
      };
    })
  );

  // ... 내부 상태(useState)와 핸들러 함수들은 대부분 그대로 유지됩니다 ...
  const [isWriteModalVisible, setWriteModalVisible] = useState(false);
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [isLogSessionModalVisible, setLogSessionModalVisible] = useState(false);
  const [loggingThreadId, setLoggingThreadId] = useState<string | null>(null);
  const [isStarReportModalVisible, setStarReportModalVisible] = useState(false);
  const [reportingProblemId, setReportingProblemId] = useState<string | null>(
    null
  );

  // ... (flattenedThreads 및 나머지 핸들러 함수들 모두 동일)
  const flattenedThreads = ((): FlatThreadItem[] => {
    if (!problem) return [];
    const allThreadsById = new Map(threadItems.map((item) => [item.id, item]));
    const flatten = (ids: string[], level: number): FlatThreadItem[] => {
      let result: FlatThreadItem[] = [];
      for (const id of ids) {
        const item = allThreadsById.get(id);
        if (item && item.type !== "Session") {
          result.push({ id, level });
          if (item.childThreadIds && item.childThreadIds.length > 0) {
            const childItems = flatten(item.childThreadIds, level + 1);
            result = result.concat(childItems);
          }
        }
      }
      return result;
    };
    return flatten(problem.childThreadIds, 0);
  })();
  const handleOpenRootWriteModal = () => {
    setEditingThreadId(null);
    setReplyParentId(null);
    setWriteModalVisible(true);
  };
  // ... (다른 모든 핸들러 함수들은 변경 없이 그대로 여기에 위치합니다)
  const handleOpenReplyWriteModal = (parentId: string) => {
    setEditingThreadId(null);
    setReplyParentId(parentId);
    setWriteModalVisible(true);
  };

  const handleStartSession = (threadId: string) => {
    Alert.alert("세션 시작", "어떤 작업을 하시겠습니까?", [
      {
        text: "바로 시작하기",
        onPress: () => startSession(threadId),
      },
      {
        text: "놓친 세션 기록하기",
        onPress: () => {
          setLoggingThreadId(threadId);
          setLogSessionModalVisible(true);
        },
      },
      {
        text: "취소",
        style: "cancel",
      },
    ]);
  };

  const handleSaveLoggedSession = (
    durationInSeconds: number,
    description: string
  ) => {
    if (!loggingThreadId || !problem) return;

    addThreadItem({
      problemId: problem.id,
      parentId: loggingThreadId,
      type: "Session",
      content: description || "기록된 세션",
      timeSpent: durationInSeconds,
      startTime: new Date(Date.now() - durationInSeconds * 1000),
    });

    setLogSessionModalVisible(false);
  };

  const handleStopSession = (threadId: string, elapsedTime: number) => {
    Alert.alert("세션 종료", "이번 세션에서 한 작업을 기록하시겠습니까?", [
      {
        text: "아니요 (시간만 기록)",
        onPress: () => saveSession(""),
        style: "cancel",
      },
      {
        text: "예 (내용 기록)",
        onPress: () => {
          Alert.prompt(
            "작업 내용 기록",
            "이번 세션에서 한 작업을 간단히 기록해주세요.",
            (text) => saveSession(text || "")
          );
        },
      },
    ]);
    const saveSession = async (content: string) => {
      if (!problem) return;
      await addThreadItem({
        problemId: problem.id,
        parentId: threadId,
        type: "Session",
        content: content || "작업 세션 기록",
        timeSpent: Math.round(elapsedTime / 1000),
        startTime: new Date(Date.now() - elapsedTime),
      });
      stopSession();
    };
  };

  const handleOpenEditModal = (threadId: string) => {
    setEditingThreadId(threadId);
    setReplyParentId(null);
    setWriteModalVisible(true);
  };

  const handlePressThreadMenu = (threadId: string) => {
    const options = [
      {
        text: "수정하기",
        onPress: () => handleOpenEditModal(threadId),
      },
      {
        text: "삭제하기",
        onPress: () => {
          Alert.alert(
            "스레드 삭제",
            "이 스레드와 모든 하위 스레드들이 영구적으로 삭제됩니다. 계속하시겠습니까?",
            [
              { text: "취소", style: "cancel" as const },
              {
                text: "삭제",
                onPress: () => deleteThreadItem(threadId),
                style: "destructive" as const,
              },
            ]
          );
        },
        style: "destructive" as const,
      },
      { text: "취소", style: "cancel" as const },
    ];
    Alert.alert("스레드 옵션", "이 스레드에 대한 작업을 선택하세요.", options);
  };
  const handleToggleCompletion = (threadId: string) => {
    const thread = getThreadItemById(threadId);
    if (!thread) return;

    if (thread.type === "Task") {
      const updatedTask: TaskThreadItem = {
        ...thread,
        isCompleted: !thread.isCompleted,
      };
      updateThreadItem(updatedTask);
    } else if (thread.type === "Action") {
      const newStatus = thread.status === "completed" ? "todo" : "completed";
      const updatedAction: ActionThreadItem = {
        ...thread,
        status: newStatus,
        completedAt: newStatus === "completed" ? new Date() : undefined,
      };
      updateThreadItem(updatedAction);
    }
  };
  const handleStatusUpdate = async (newStatus: ProblemStatus) => {
    if (!problem) return;

    const isNewlyResolved =
      newStatus === "resolved" && problem.status !== "resolved";

    const updatedProblemData: Problem = {
      ...problem,
      status: newStatus,
      resolvedAt: newStatus === "resolved" ? new Date() : problem.resolvedAt,
      archivedAt: newStatus === "archived" ? new Date() : problem.archivedAt,
    };
    if (problem.status === "resolved" && newStatus !== "resolved") {
      updatedProblemData.resolvedAt = undefined;
    }
    if (problem.status === "archived" && newStatus !== "archived") {
      updatedProblemData.archivedAt = undefined;
    }
    await updateProblem(updatedProblemData);

    if (isNewlyResolved) {
      let report: StarReport | undefined | null = getStarReportByProblemId(
        problem.id
      );

      if (!report) {
        report = await addStarReport({
          problemId: problem.id,
          situation: "",
          task: "",
          action: "",
          result: "",
        });
      }

      if (report) {
        Alert.alert(
          "문제 해결 완료!",
          "문제 해결 경험을 STAR 리포트로 기록하여 자산으로 남겨보시겠어요?",
          [
            {
              text: "나중에 하기",
              style: "cancel",
            },
            {
              text: "지금 작성하기",
              onPress: () => {
                setReportingProblemId(problem.id);
                setStarReportModalVisible(true);
              },
            },
          ]
        );
      }
    }
  };
  const handleChangeStatusPress = () => {
    if (!problem) return;
    const options = [
      { text: "Active", onPress: () => handleStatusUpdate("active") },
      { text: "On Hold", onPress: () => handleStatusUpdate("onHold") },
      { text: "Resolved", onPress: () => handleStatusUpdate("resolved") },
      { text: "Archived", onPress: () => handleStatusUpdate("archived") },
      { text: "취소", style: "cancel" as const },
    ];
    Alert.alert(
      "문제 상태 변경",
      `'${problem.title}' 문제의 상태를 선택하세요.`,
      options
    );
  };
  const renderThreadItem = ({ item }: { item: FlatThreadItem }) => {
    const thread = getThreadItemById(item.id);
    if (!thread || !problem || !persona) return null;

    return (
      <ThreadItem
        thread={thread}
        persona={persona}
        problem={problem}
        onReply={handleOpenReplyWriteModal}
        onStartSession={handleStartSession}
        onStopSession={handleStopSession}
        onPressMenu={handlePressThreadMenu}
        onToggleCompletion={handleToggleCompletion}
        level={item.level}
      />
    );
  };

  // ✅ <Modal>을 <SafeAreaView>로 교체하고, props를 제거합니다.
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* ✅ onClose 대신 router.back()을 호출하여 뒤로가기 기능을 수행합니다. */}
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={26} color="#343a40" />
        </TouchableOpacity>
      </View>
      {problem && persona ? (
        <FlatList
          style={styles.contentScrollView}
          contentContainerStyle={styles.listContentContainer}
          data={flattenedThreads}
          renderItem={renderThreadItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <ProblemPost
              problem={problem}
              persona={persona}
              onStatusBadgePress={handleChangeStatusPress}
            />
          }
          ListFooterComponent={
            flattenedThreads.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.noThreadsText}>
                  아직 추가된 스레드가 없습니다. {"\n"}이 문제를 해결하기 위해
                  필요한 것들을 나열해보세요.
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.loadingContainer}>
          <Text>문제 정보를 불러오는 중...</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenRootWriteModal}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={20} color="#ffffff" />
        <Text style={styles.fabText}>New thread</Text>
      </TouchableOpacity>

      {/* ✅ 이 화면 내에서 사용되는 다른 모달들은 그대로 유지합니다. */}
      {problem && (
        <ThreadWrite
          isVisible={isWriteModalVisible}
          onClose={() => {
            setWriteModalVisible(false);
            setEditingThreadId(null);
          }}
          problemId={problem.id}
          parentThreadId={replyParentId}
          threadToEditId={editingThreadId}
        />
      )}
      {problem && (
        <LogSessionModal
          isVisible={isLogSessionModalVisible}
          onClose={() => setLogSessionModalVisible(false)}
          onSave={handleSaveLoggedSession}
        />
      )}
      {reportingProblemId && (
        <StarReportWrite
          isVisible={isStarReportModalVisible}
          onClose={() => setStarReportModalVisible(false)}
          problemId={reportingProblemId}
        />
      )}
    </SafeAreaView>
  );
}

// ✅ 스타일 이름의 명확성을 위해 modalContainer를 container로 변경합니다.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
  },
  contentScrollView: { flex: 1, backgroundColor: "#ffffff" },
  listContentContainer: {
    paddingBottom: 80, // ✅ fab 높이 + 추가 여백 확보
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: { paddingTop: 16 },
  noThreadsText: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    color: "#868e96",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#212529",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
