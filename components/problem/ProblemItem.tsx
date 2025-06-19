import { useAppStore } from "@/store/store";
import {
  ActionThreadItem,
  Objective,
  Priority,
  Problem,
  ProblemStatus,
  SessionThreadItem,
  TaskThreadItem,
} from "@/types";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const priorityColors: { [key in Priority]: string } = {
  high: "#e57373",
  medium: "#ffb74d",
  low: "#81c784",
  none: "#bdbdbd",
};

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

interface ProblemItemProps {
  problem: Problem;
  objective: Objective;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
  isLast?: boolean;
}

export default function ProblemItem({
  problem,
  objective,
  onPress,
  onLongPress,
  isLast,
}: ProblemItemProps) {
  const threadItems = useAppStore((state) => state.threadItems);

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
      style={[styles.itemContainer, isLast && styles.lastItemContainer]}
      onPress={() => onPress(problem.id)}
      onLongPress={() => onLongPress?.(problem.id)}
      delayLongPress={500}
    >
      <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />
      <View style={styles.contentContainer}>
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>
            {objective.type}/{objective.title}
          </Text>
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
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: "#e9ecef",
  },
  lastItemContainer: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderTopWidth: 1,
    borderBottomWidth: 0,
  },
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
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
