// components/problem/ProblemDetail.tsx

import { useAppStore } from "@/store/store";
import {
  ActionThreadItem,
  Problem,
  ProblemStatus,
  StarReport,
  TaskThreadItem,
} from "@/types";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
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

interface ProblemDetailProps {
  isVisible: boolean;
  onClose: () => void;
  problemId: string | null;
}

export default function ProblemDetail({
  isVisible,
  onClose,
  problemId,
}: ProblemDetailProps) {
  // ... (컴포넌트 상단 로직은 모두 동일합니다)
  const router = useRouter();
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
    useShallow((state) => {
      const problem = problemId
        ? state.problems.find((p) => p.id === problemId)
        : null;
      const persona = problem
        ? state.personas.find((p) => p.id === problem.personaId)
        : null;
      return {
        problem,
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

  const [isWriteModalVisible, setWriteModalVisible] = useState(false);
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [isLogSessionModalVisible, setLogSessionModalVisible] = useState(false);
  const [loggingThreadId, setLoggingThreadId] = useState<string | null>(null);
  const [isStarReportModalVisible, setStarReportModalVisible] = useState(false);
  const [reportingProblemId, setReportingProblemId] = useState<string | null>(
    null
  );

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

  const handleOpenReplyWriteModal = (parentId: string) => {
    setEditingThreadId(null); // [추가] 수정 모드 해제
    setReplyParentId(parentId);
    setWriteModalVisible(true);
  };

  const handleStartSession = (threadId: string) => {
    Alert.alert("세션 시작", "어떤 작업을 하시겠습니까?", [
      {
        text: "바로 시작하기",
        onPress: () => startSession(threadId), // 기존 로직
      },
      {
        text: "놓친 세션 기록하기",
        onPress: () => {
          setLoggingThreadId(threadId); // 어떤 스레드에 대한 기록인지 ID 저장
          setLogSessionModalVisible(true); // 후기록 모달 열기
        },
      },
      {
        text: "취소",
        style: "cancel",
      },
    ]);
  };

  // ✅ [추가] LogSessionModal에서 전달받은 데이터로 세션을 저장하는 핸들러
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

    setLogSessionModalVisible(false); // 모달 닫기
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
          if (Platform.OS === "ios") {
            Alert.prompt(
              "작업 내용 기록",
              "이번 세션에서 한 작업을 간단히 기록해주세요.",
              (text) => saveSession(text || "")
            );
          } else {
            // 안드로이드에서는 prompt가 기본 지원되지 않으므로, 별도 모달 구현 필요.
            // 여기서는 임시로 내용 없이 저장하도록 처리합니다.
            saveSession("");
            Alert.alert(
              "알림",
              "작업 내용 기록 기능은 준비 중입니다. 시간만 기록됩니다."
            );
          }
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

  // [추가] 수정 모달을 여는 핸들러
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
    Alert.alert(
      "스레드 옵션",
      "이 스레드에 대한 작업을 선택하세요.",
      Platform.OS === "ios" ? options : options.reverse()
    );
  };

  // ✅ [추가] 'Task' 또는 'Action'의 완료 상태를 토글하는 핸들러
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

  // ✅ [수정] 전체 로직이 통합된 최종 버전
  const handleStatusUpdate = async (newStatus: ProblemStatus) => {
    if (!problem) return;

    const isNewlyResolved =
      newStatus === "resolved" && problem.status !== "resolved";

    // 1. 문제 상태를 먼저 DB에 업데이트합니다.
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

    // 2. 문제가 '처음으로' 해결된 경우에만 STAR 리포트 관련 로직을 실행합니다.
    if (isNewlyResolved) {
      let report: StarReport | undefined | null = getStarReportByProblemId(
        problem.id
      );

      // 2-2. 없다면 빈 리포트를 생성합니다.
      if (!report) {
        report = await addStarReport({
          problemId: problem.id,
          situation: "",
          task: "",
          action: "",
          result: "",
        });
      }

      // 2-3. 리포트가 확실히 존재할 때, 작성 여부를 묻는 Alert를 띄웁니다.
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
                // 2-4. '예'를 선택하면, 상태를 변경하여 모달을 엽니다.
                setReportingProblemId(problem.id);
                setStarReportModalVisible(true);
              },
            },
          ]
        );
      }
    }
  };

  // ✅ [추가] 상태 배지를 눌렀을 때 선택 메뉴(Alert)를 띄우는 핸들러
  const handleChangeStatusPress = () => {
    if (!problem) return;

    // Alert에 표시될 버튼 목록
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

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === "ios" ? "formSheet" : undefined}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={26} color="#343a40" />
          </TouchableOpacity>
        </View>
        {problem && persona ? (
          <FlatList
            style={styles.contentScrollView}
            // ✅ 1. 리스트의 하단에 충분한 여백을 주어 플로팅 버튼에 가려지지 않도록 합니다.
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

        {/* ✅ 2. 기존의 하단 바를 제거하고, 새로운 플로팅 버튼을 추가합니다. */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleOpenRootWriteModal}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={20} color="#ffffff" />
          <Text style={styles.fabText}>New thread</Text>
        </TouchableOpacity>
      </SafeAreaView>
      {problem && (
        <ThreadWrite
          isVisible={isWriteModalVisible}
          onClose={() => {
            setWriteModalVisible(false);
            setEditingThreadId(null); // [추가] 모달 닫을 때 수정 ID 초기화
          }}
          problemId={problem.id}
          parentThreadId={replyParentId}
          threadToEditId={editingThreadId} // [추가] 수정할 스레드 ID 전달
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
          problemId={reportingProblemId} // ✅ problemId를 prop으로 전달
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: "#ffffff" },
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
    paddingBottom: 60, // 플로팅 버튼의 높이 + 추가 여백
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
    position: "absolute", // 화면 위에 떠 있도록 설정
    bottom: 30, // 하단에서의 위치 (SafeAreaView 안이므로 안전)
    alignSelf: "center", // 가로 중앙 정렬
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#212529", // 검은색 배경
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50, // 원형 모양
    // 그림자 효과 (선택 사항)
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
    color: "#ffffff", // 흰색 텍스트
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
