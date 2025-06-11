// app/components/thread/ThreadItem.tsx

import { useAppStore } from "@/store/store";
import {
  Persona,
  Problem,
  SessionThreadItem,
  ThreadItem as ThreadItemData,
  ThreadItemType as ThreadTypeEnum,
} from "@/types";
import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  LayoutChangeEvent,
  ViewStyle,
} from "react-native";
import { useShallow } from "zustand/react/shallow";
import ActiveSessionTracker from "./ActiveSessionTracker";

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

// ✅ [오류 수정] formatSeconds 함수의 전체 구현을 포함합니다.
const formatSeconds = (totalSeconds: number): string => {
  if (typeof totalSeconds !== "number" || isNaN(totalSeconds)) {
    return "00:00";
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ];
  if (hours > 0) {
    parts.unshift(String(hours).padStart(2, "0"));
  }
  return parts.join(":");
};

interface ThreadItemProps {
  thread: ThreadItemData;
  persona: Persona;
  problem: Problem;
  onReply: (threadId: string) => void;
  onStartSession: (threadId: string) => void;
  onStopSession: (threadId: string, elapsedTime: number) => void;
  level: number;
}

export default function ThreadItem({
  thread,
  persona,
  problem,
  onReply,
  onStartSession,
  onStopSession,
  level,
}: ThreadItemProps) {
  const { activeSession, getThreadItemById } = useAppStore(
    useShallow((state) => ({
      activeSession: state.activeSession,
      getThreadItemById: state.getThreadItemById,
    }))
  );

  const [sessionsVisible, setSessionsVisible] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setContentHeight(event.nativeEvent.layout.height);
  }, []);

  // ✅ [오류 수정] useMemo 함수의 전체 구현을 포함합니다.
  const sessionStats = useMemo(() => {
    if (!thread.childThreadIds || thread.childThreadIds.length === 0) {
      return { sessions: [], totalTime: 0 };
    }
    const sessions = thread.childThreadIds
      .map((id) => getThreadItemById(id))
      .filter((item): item is SessionThreadItem => item?.type === "Session");
    const totalTime = sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
    return { sessions, totalTime };
  }, [thread.childThreadIds, getThreadItemById]);

  const formattedDate = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(thread.createdAt));

  const tagStyle =
    thread.type !== "Session"
      ? typeStyles[thread.type as Exclude<ThreadTypeEnum, "Session">]
      : null;
  const isSessionActiveOnThisThread = activeSession?.threadId === thread.id;

  const indentLevel = level > 0 ? level : 0;
  const paddingLeft = 16 + indentLevel * 20;

  // ✅ [오류 수정] position 속성의 타입을 명확히 합니다.
  const lineStyle: ViewStyle = {
    position: "absolute",
    top: 0,
    height: contentHeight, // onLayout으로 측정한 높이 사용
    left: paddingLeft / 2 - 8,
    width: 2,
    backgroundColor: "#e9ecef",
  };

  return (
    <View style={styles.contentContainer} onLayout={onLayout}>
      {level > 0 && <View style={lineStyle} />}
      <View style={{ paddingLeft }}>
        <View style={styles.header}>
          <Text style={styles.metaText} numberOfLines={1}>
            {persona.title}/{problem.title}
          </Text>
          <Text style={[styles.metaText, { marginLeft: 8 }]}>
            · {formattedDate}
          </Text>
        </View>

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
            disabled={!!activeSession}
          >
            <Feather
              name="play-circle"
              size={16}
              color={activeSession ? "#ced4da" : "#495057"}
            />
            <Text
              style={[styles.actionText, activeSession && { color: "#ced4da" }]}
            >
              Start Session
            </Text>
          </TouchableOpacity>
        </View>

        {isSessionActiveOnThisThread && (
          <ActiveSessionTracker
            onStop={(elapsedTime) => onStopSession(thread.id, elapsedTime)}
          />
        )}

        {sessionStats.sessions.length > 0 && (
          <View style={styles.completedSessionSection}>
            <TouchableOpacity
              style={styles.summaryContainer}
              onPress={() => setSessionsVisible(!sessionsVisible)}
            >
              <Text style={styles.summaryText}>
                완료된 세션: {sessionStats.sessions.length}개 · 총 시간:{" "}
                {formatSeconds(sessionStats.totalTime)}
              </Text>
              <Feather
                name={sessionsVisible ? "chevron-up" : "chevron-down"}
                size={18}
                color="#868e96"
              />
            </TouchableOpacity>
            {sessionsVisible && (
              <View style={styles.sessionList}>
                {sessionStats.sessions.map((session) => (
                  <View key={session.id} style={styles.sessionItem}>
                    <Text style={styles.sessionContent}>
                      {session.content || "기록 없음"}
                    </Text>
                    <Text style={styles.sessionTime}>
                      {formatSeconds(session.timeSpent)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderColor: "#f1f3f5",
    position: "relative",
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  metaText: { fontSize: 13, color: "#868e96", flexShrink: 1 },
  body: { marginBottom: 8 },
  typeTag: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  typeTagText: { fontSize: 12, fontWeight: "bold" },
  contentText: { fontSize: 15, lineHeight: 22, color: "#343a40" },
  footer: { flexDirection: "row", alignItems: "center" },
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
  completedSessionSection: {
    marginTop: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  summaryText: { fontSize: 13, fontWeight: "500", color: "#495057" },
  sessionList: { borderTopWidth: 1, borderColor: "#e9ecef", padding: 12 },
  sessionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  sessionContent: { fontSize: 14, color: "#495057", flex: 1 },
  sessionTime: {
    fontSize: 14,
    color: "#868e96",
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
});
