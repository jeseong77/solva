// components/problem/WeeklyProblemCard.tsx

import { useAppStore } from "@/store/store";
import {
  ActionThreadItem,
  Objective,
  Problem,
  SessionThreadItem,
  TaskThreadItem,
  WeeklyProblem,
} from "@/types";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * 초(seconds)를 HH:MM:SS 또는 MM:SS 형식으로 변환하는 헬퍼 함수
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

interface WeeklyProblemProps {
  weeklyProblem: WeeklyProblem | null | undefined;
  problem: Problem | null | undefined;
  objective: Objective | null | undefined;
  onPress: (problemId: string) => void;
  onPressNew: () => void;
  onChangeWeeklyProblem: () => void;
}

export default function WeeklyProblemCard({
  weeklyProblem,
  problem,
  objective,
  onPress,
  onPressNew,
  onChangeWeeklyProblem,
}: WeeklyProblemProps) {
  const threadItems = useAppStore((state) => state.threadItems);

  const dDay = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    if (daysUntilSunday === 0) return "D-Day";
    return `D-${daysUntilSunday}`;
  }, []);

  const stats = useMemo(() => {
    if (!problem) return null;
    const allThreadsInProblem = threadItems.filter(
      (item) => item.problemId === problem.id
    );
    const totalThreads = allThreadsInProblem.filter(
      (item) => item.type !== "Session"
    ).length;
    const taskItems = allThreadsInProblem.filter(
      (item): item is TaskThreadItem => item.type === "Task"
    );
    const completedTasks = taskItems.filter(
      (item) => !!item.isCompleted
    ).length;
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
      tasks: { completed: completedTasks, total: taskItems.length },
      actions: { completed: completedActions, total: actionItems.length },
      totalSessionTime,
    };
  }, [problem, threadItems]);

  if (
    !weeklyProblem ||
    !problem ||
    !objective ||
    problem.status === "resolved" ||
    problem.status === "archived"
  ) {
    return (
      <View style={styles.container}>
        <Text style={styles.componentTitle}>이번 주에 해결할 문제:</Text>
        <TouchableOpacity style={styles.emptyContainer} onPress={onPressNew}>
          {/* FIX: 아이콘을 'plus-circle'에서 'target'으로 변경 */}
          <Feather name="target" size={24} color="#adb5bd" />
          <Text style={styles.emptyText}>
            이번 주에 해결할 문제를 설정해주세요.
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.componentTitle}>이번 주에 집중할 문제</Text>
        <TouchableOpacity onPress={onChangeWeeklyProblem}>
          <Text style={styles.changeButtonText}>변경</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.contentContainer}
        onPress={() => onPress(problem.id)}
        activeOpacity={0.7}
      >
        <View style={styles.contentHeader}>
          <Text style={styles.metaText}>
            {objective.type}/{objective.title}
          </Text>
          <View style={styles.dDayChip}>
            <Text style={styles.dDayText}>{dDay}</Text>
          </View>
        </View>

        <View style={styles.contentBody}>
          <Text style={styles.problemTitle}>{problem.title}</Text>
          {problem.description && (
            <Text style={styles.problemDescription} numberOfLines={3}>
              {problem.description}
            </Text>
          )}
        </View>

        {stats && (
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
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  componentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
  },
  contentContainer: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  contentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  metaText: {
    fontSize: 13,
    color: "#868e96",
  },
  dDayChip: {
    backgroundColor: "#495057",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  dDayText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  contentBody: {
    marginBottom: 16,
  },
  problemTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#343a40",
    marginBottom: 8,
  },
  problemDescription: {
    fontSize: 15,
    color: "#495057",
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#f1f3f5",
  },
  statsText: {
    fontSize: 13,
    color: "#6c757d",
    marginLeft: 4,
  },
  separator: {
    color: "#ced4da",
    marginHorizontal: 8,
  },
  emptyContainer: {
    backgroundColor: "transparent",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 120,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#ced4da",
    borderStyle: "dashed",
    marginTop: 12,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 15,
    color: "#868e96",
    fontWeight: "500",
  },
  changeButtonText: {
    fontSize: 15,
    color: "#40c057",
    fontWeight: "600",
  },
});
