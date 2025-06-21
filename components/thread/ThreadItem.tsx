// components/thread/ThreadItem.tsx

import { useAppStore } from "@/store/store";
import {
  // REMOVED: ActionThreadItem is no longer needed here
  Objective,
  Problem,
  SessionThreadItem,
  TaskThreadItem,
  ThreadItem as ThreadItemData,
  ThreadItemType as ThreadTypeEnum,
} from "@/types";
import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useShallow } from "zustand/react/shallow";
import ActiveSessionTracker from "./ActiveSessionTracker";

// FIX: Removed 'Action' from the type definition and the style object
const typeStyles: {
  [key in Exclude<ThreadTypeEnum, "Session" | "Action">]: {
    color: string;
    backgroundColor: string;
    name: string;
  };
} = {
  General: { color: "#1c7ed6", backgroundColor: "#d0ebff", name: "일반" },
  Bottleneck: { color: "#f76707", backgroundColor: "#fff4e6", name: "병목" },
  Task: { color: "#2b8a3e", backgroundColor: "#e6fcf5", name: "할 일" },
  Insight: { color: "#845ef7", backgroundColor: "#f3f0ff", name: "인사이트" },
};

// ... (formatSeconds helper remains the same)
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
  objective: Objective;
  problem: Problem;
  onReply: (threadId: string) => void;
  onStartSession: (threadId: string) => void;
  onStopSession: (threadId: string, elapsedTime: number) => void;
  onPressMenu: (threadId: string) => void;
  onToggleCompletion: (threadId: string) => void;
  level: number;
}

export default function ThreadItem({
  thread,
  objective,
  problem,
  onReply,
  onStartSession,
  onStopSession,
  onPressMenu,
  onToggleCompletion,
  level,
}: ThreadItemProps) {
  const { activeSession, getThreadItemById } = useAppStore(
    useShallow((state) => ({
      activeSession: state.activeSession,
      getThreadItemById: state.getThreadItemById,
    }))
  );

  const [sessionsVisible, setSessionsVisible] = useState(false);

  // FIX: isCompletable is now only true for 'Task' type
  const isCompletable = thread.type === "Task";

  // FIX: isCompleted logic is simplified to only handle 'Task'
  let isCompleted = false;
  if (thread.type === "Task") {
    isCompleted = !!(thread as TaskThreadItem).isCompleted;
  }

  const sessionStats = useMemo(() => {
    // ... (sessionStats logic is unchanged)
    if (!thread.childThreadIds || thread.childThreadIds.length === 0) {
      return { sessions: [], totalTime: 0 };
    }
    const sessions = thread.childThreadIds
      .map((id) => getThreadItemById(id))
      .filter(
        (item): item is SessionThreadItem => !!item && item.type === "Session"
      );
    const totalTime = sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
    return { sessions, totalTime };
  }, [thread.childThreadIds, getThreadItemById]);

  const formattedDate = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
  }).format(new Date(thread.createdAt as Date));

  const tagStyle =
    thread.type !== "Session" && thread.type !== "Action" // Also exclude 'Action' here
      ? typeStyles[thread.type as Exclude<ThreadTypeEnum, "Session" | "Action">]
      : null;
  const isSessionActiveOnThisThread = activeSession?.threadId === thread.id;

  const indentLevel = level > 0 ? level : 0;
  const paddingLeft = 16 + indentLevel * 20;

  return (
    <View style={styles.contentContainer}>
      <View style={{ paddingLeft }}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
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
            <Text style={[styles.metaText, { marginLeft: tagStyle ? 8 : 0 }]}>
              {formattedDate}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => onPressMenu(thread.id)}>
              <Feather
                name="more-vertical"
                size={20}
                color="#868e96"
                style={styles.menuTrigger}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>
          <Text
            style={[styles.contentText, isCompleted && styles.completedText]}
          >
            {thread.content}
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onReply(thread.id)}
          >
            <Feather name="corner-down-right" size={18} color="#495057" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onStartSession(thread.id)}
            disabled={!!activeSession}
          >
            <Feather
              name="play-circle"
              size={18}
              color={activeSession ? "#ced4da" : "#495057"}
            />
          </TouchableOpacity>
          {isCompletable && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onToggleCompletion(thread.id)}
            >
              <Feather
                name={isCompleted ? "check-square" : "square"}
                size={18}
                color={isCompleted ? "#2b8a3e" : "#495057"}
              />
            </TouchableOpacity>
          )}
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
                완료된 세션: {sessionStats.sessions.length}개 · 총 시간:
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
                      {formatSeconds(session.timeSpent ?? 0)}
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

// ... (Styles are unchanged)
const styles = StyleSheet.create({
  contentContainer: {
    paddingVertical: 8,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderColor: "#f1f3f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  headerRight: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 13, color: "#868e96", flexShrink: 1 },
  menuTrigger: { padding: 4 },
  body: { marginBottom: 8 },
  typeTag: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginRight: 8,
  },
  typeTagText: { fontSize: 12, fontWeight: "bold" },
  contentText: { fontSize: 15, lineHeight: 22, color: "#343a40" },
  completedText: { textDecorationLine: "line-through", color: "#adb5bd" },
  footer: { flexDirection: "row", alignItems: "center" },
  actionButton: { padding: 6, marginRight: 12 },
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
