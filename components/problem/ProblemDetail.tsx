// app/components/problem/ProblemDetail.tsx

import { useAppStore } from "@/store/store";
import { Feather } from "@expo/vector-icons";
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
  // ✅ [수정] 스토어에서 deleteThreadItem 함수 가져오기
  const {
    problem,
    persona,
    getThreadItemById,
    threadItems,
    startSession,
    stopSession,
    addThreadItem,
    deleteThreadItem, // 👈 추가
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
        deleteThreadItem: state.deleteThreadItem, // 👈 추가
      };
    })
  );

  const [isWriteModalVisible, setWriteModalVisible] = useState(false);
  const [replyParentId, setReplyParentId] = useState<string | null>(null);

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
    setReplyParentId(null);
    setWriteModalVisible(true);
  };
  const handleOpenReplyWriteModal = (parentId: string) => {
    setReplyParentId(parentId);
    setWriteModalVisible(true);
  };
  const handleStartSession = (threadId: string) => {
    startSession(threadId);
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
            saveSession("");
            Alert.alert("알림", "작업 내용 기록 기능은 준비 중입니다.");
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

  // ✅ [수정] '...' 아이콘 클릭 시 실행될 핸들러 함수 추가
  const handlePressThreadMenu = (threadId: string) => {
    // 여기에 나중에 '수정', '복사' 등 다양한 메뉴를 추가할 수 있습니다.
    const options = [
      {
        text: "삭제하기",
        onPress: () => {
          // 삭제 전 재확인
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
      // iOS에서는 '취소' 버튼이 보통 하단에 위치하므로 순서를 조정해줍니다.
      Platform.OS === "ios" ? options : options.reverse()
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
        onPressMenu={handlePressThreadMenu} // ✅ [수정] 핸들러 함수를 prop으로 전달
        level={item.level}
      />
    );
  };

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={26} color="#343a40" />
          </TouchableOpacity>
        </View>
        {problem && persona ? (
          <FlatList
            style={styles.contentScrollView}
            data={flattenedThreads}
            renderItem={renderThreadItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              <ProblemPost problem={problem} persona={persona} />
            }
            ListFooterComponent={
              flattenedThreads.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.noThreadsText}>
                    아직 추가된 스레드가 없습니다.
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
          style={styles.commentInputContainer}
          onPress={handleOpenRootWriteModal}
        >
          <Text style={styles.commentInputPlaceholder}>Add a thread...</Text>
        </TouchableOpacity>
      </SafeAreaView>
      {problem && (
        <ThreadWrite
          isVisible={isWriteModalVisible}
          onClose={() => setWriteModalVisible(false)}
          problemId={problem.id}
          parentThreadId={replyParentId}
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
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { paddingTop: 16 },
  noThreadsText: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    color: "#868e96",
    textAlign: "center",
  },
  commentInputContainer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#e9ecef",
  },
  commentInputPlaceholder: { color: "#adb5bd" },
});
