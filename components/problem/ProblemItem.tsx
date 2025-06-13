import { useAppStore } from "@/store/store";
import {
  ActionThreadItem,
  Persona,
  Priority,
  Problem,
  ProblemStatus,
  SessionThreadItem,
  TaskThreadItem,
} from "@/types";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Priority에 따른 색상 맵
const priorityColors: { [key in Priority]: string } = {
  high: "#ffcdd2",
  medium: "#ffe0b2",
  low: "#c8e6c9",
  none: "#e9ecef",
};

/**
 * 초(seconds)를 HH:MM:SS 또는 MM:SS 형식의 문자열로 변환하는 헬퍼 함수
 */
const formatSeconds = (totalSeconds: number): string => {
  if (typeof totalSeconds !== "number" || isNaN(totalSeconds)) {
    return "00:00";
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const parts = [
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ];
  if (hours > 0) {
    parts.unshift(String(hours).padStart(2, "0"));
  }
  return parts.join(":");
};

// ✅ [추가] 상태별 이름 및 색상 정보
const statusInfo: {
  [key in ProblemStatus]: {
    name: string;
    color: string;
    backgroundColor: string;
  };
} = {
  active: { name: "Active", color: "#2b8a3e", backgroundColor: "#e6fcf5" },
  onHold: { name: "On Hold", color: "#868e96", backgroundColor: "#f1f3f5" },
  resolved: { name: "Resolved", color: "#1971c2", backgroundColor: "#e7f5ff" },
  archived: { name: "Archived", color: "#495057", backgroundColor: "#e9ecef" },
};

// 컴포넌트가 받을 Props 정의
interface ProblemItemProps {
  problem: Problem;
  persona: Persona;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
}

export default function ProblemItem({
  problem,
  persona,
  onPress,
  onLongPress,
}: ProblemItemProps) {
  const threadItems = useAppStore((state) => state.threadItems);

  // ✅ [수정] 문제에 속한 전체 스레드를 대상으로 통계 계산
  const stats = useMemo(() => {
    const allThreadsInProblem = threadItems.filter(
      (item) => item.problemId === problem.id
    );

    const totalThreads = allThreadsInProblem.filter(
      (item) => item.type !== "Session"
    ).length;

    const taskItems = allThreadsInProblem.filter(
      (item): item is TaskThreadItem => item.type === "Task"
    );
    const completedTasks = taskItems.filter((item) => item.isCompleted).length;

    const actionItems = allThreadsInProblem.filter(
      (item): item is ActionThreadItem => item.type === "Action"
    );
    const completedActions = actionItems.filter(
      (item) => item.status === "completed"
    ).length;

    const sessionItems = allThreadsInProblem.filter(
      (item): item is SessionThreadItem => item.type === "Session"
    );
    const totalSessionTime = sessionItems.reduce(
      (sum, item) => sum + (item.timeSpent || 0),
      0
    );

    return {
      totalThreads,
      tasks: {
        completed: completedTasks,
        total: taskItems.length,
      },
      actions: {
        completed: completedActions,
        total: actionItems.length,
      },
      totalSessionTime,
    };
  }, [problem.id, threadItems]);

  const indicatorColor =
    priorityColors[problem.priority] || priorityColors.none;

  const currentStatus = problem.status || "active";
  const currentStatusInfo = statusInfo[currentStatus];

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => onPress(problem.id)}
      onLongPress={() => onLongPress?.(problem.id)}
      delayLongPress={500}
    >
      <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />
      <View style={styles.contentContainer}>
        {/* ✅ [수정] 메타 정보 컨테이너에 상태 태그 추가 */}
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>persona/{persona.title}</Text>
          <View
            style={[
              styles.statusTag,
              { backgroundColor: currentStatusInfo.backgroundColor },
            ]}
          >
            <Text
              style={[styles.statusTagText, { color: currentStatusInfo.color }]}
            >
              {currentStatusInfo.name}
            </Text>
          </View>
        </View>
        <Text style={styles.itemTitle}>{problem.title}</Text>
        {/* ✅ [수정] 통계 표시 방식 변경 */}
        <View style={styles.statsContainer}>
          <Feather name="git-branch" size={14} color="#6c757d" />
          <Text style={styles.statsText}>{stats.totalThreads}</Text>
          <Text style={styles.separator}>·</Text>
          <Feather name="check-square" size={14} color="#6c757d" />
          <Text style={styles.statsText}>
            {stats.tasks.completed} / {stats.tasks.total}
          </Text>
          <Text style={styles.separator}>·</Text>
          <MaterialCommunityIcons name="run-fast" size={14} color="#6c757d" />
          <Text style={styles.statsText}>
            {stats.actions.completed} / {stats.actions.total}
          </Text>
          <Text style={styles.separator}>·</Text>
          <Feather name="clock" size={14} color="#6c757d" />
          <Text style={styles.statsText}>
            {formatSeconds(stats.totalSessionTime)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
  },
  indicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginTop: 4,
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#868e96",
  },
  statusTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 8,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsText: {
    fontSize: 13,
    color: "#6c757d",
    marginLeft: 4,
    fontVariant: ["tabular-nums"],
  },
  separator: {
    color: "#ced4da",
    marginHorizontal: 8,
    fontSize: 14,
  },
});
