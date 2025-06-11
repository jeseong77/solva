import { useAppStore } from "@/store/store";
import { ThreadItemType as ThreadTypeEnum } from "@/types";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useShallow } from "zustand/react/shallow";

// 타입별 태그의 스타일(색상, 이름)을 정의하는 객체
const typeStyles: {
  [key in Exclude<ThreadTypeEnum, "Session">]: {
    color: string;
    backgroundColor: string;
    name: string;
  };
} = {
  General: { color: "#1c7ed6", backgroundColor: "#d0ebff", name: "일반" },
  Bottleneck: { color: "#f76707", backgroundColor: "#fff4e6", name: "병목" },
  Task: { color: "#2b8a3e", backgroundColor: "#e6fcf5", name: "할 일" },
  Action: { color: "#d9480f", backgroundColor: "#fff0f6", name: "액션" },
};

// 컴포넌트가 받을 Props 정의
interface ThreadItemProps {
  threadId: string;
  level: number; // 트리 구조의 깊이 (들여쓰기용)
  onReply: (threadId: string) => void;
  onStartSession: (threadId: string) => void;
}

export default function ThreadItem({
  threadId,
  level,
  onReply,
  onStartSession,
}: ThreadItemProps) {
  // 스토어에서 필요한 함수와 데이터를 가져옵니다.
  const { thread, problem, persona } = useAppStore(
    useShallow((state) => {
      const thread = state.getThreadItemById(threadId);
      const problem = thread
        ? state.getProblemById(thread.problemId)
        : undefined;
      const persona = problem
        ? state.getPersonaById(problem.personaId)
        : undefined;
      return { thread, problem, persona };
    })
  );

  // 데이터가 없으면 아무것도 렌더링하지 않음 (안전 장치)
  if (!thread || !problem || !persona) {
    return null;
  }

  // 날짜 포맷팅
  const formattedDate = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(thread.createdAt);

  const tagStyle =
    typeStyles[thread.type as Exclude<ThreadTypeEnum, "Session">];

  return (
    <View style={[styles.wrapper, { paddingLeft: level * 16 }]}>
      {/* 왼쪽: 트리 구조를 보여주는 세로선 */}
      <View style={styles.gutter}>
        {level > 0 && <View style={styles.threadLine} />}
      </View>

      {/* 오른쪽: 실제 콘텐츠 영역 */}
      <View style={styles.contentContainer}>
        {/* 헤더: 작성자 정보 및 날짜 */}
        <View style={styles.header}>
          <Text style={styles.metaText}>
            {persona.title}/{problem.title}
          </Text>
          <Text style={[styles.metaText, { marginLeft: 8 }]}>
            · {formattedDate}
          </Text>
        </View>

        {/* 타입 태그 및 본문 */}
        <View style={styles.body}>
          {tagStyle && (
            <View
              style={[
                styles.typeTag,
                { backgroundColor: tagStyle.backgroundColor },
              ]}
            >
              <Text style={[styles.typeTagText, { color: tagStyle.color }]}>
                {tagStyle.name}
              </Text>
            </View>
          )}
          <Text style={styles.contentText}>{thread.content}</Text>
        </View>

        {/* 푸터: 액션 버튼 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onReply(thread.id)}
          >
            <Feather name="message-square" size={16} color="#495057" />
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onStartSession(thread.id)}
          >
            <Feather name="play-circle" size={16} color="#495057" />
            <Text style={styles.actionText}>Start Session</Text>
          </TouchableOpacity>
        </View>

        {/* 자식 스레드가 렌더링될 영역 (Step 2에서 채워짐) */}
        <View style={styles.childContainer}>
          {/* <ThreadList threadIds={thread.childThreadIds} level={level + 1} ... /> */}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
  },
  gutter: {
    width: 16,
    alignItems: "center",
  },
  threadLine: {
    width: 2,
    height: "100%",
    backgroundColor: "#e9ecef",
  },
  contentContainer: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#868e96",
  },
  body: {
    marginBottom: 8,
  },
  typeTag: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  typeTagText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#343a40",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    marginRight: 16,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#495057",
    fontWeight: "500",
  },
  childContainer: {
    // 자식 ThreadList가 위치할 곳
  },
});
