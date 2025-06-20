// components/problem/ProblemPost.tsx

// ... (keep all imports)
import {
  FlatList,
  Image,
  Modal,
  SafeAreaView as ModalSafeArea,
} from "react-native";
import React, { useMemo, useState } from "react";
import ImageView from "react-native-image-viewing";
import { useAppStore } from "@/store/store";
import {
  Objective,
  Priority,
  Problem,
  ProblemStatus,
  SessionThreadItem,
  TaskThreadItem,
  ActionThreadItem,
} from "@/types";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ... (keep all helper functions)
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

// FIX: Add the new onPressMenu prop
interface ProblemPostProps {
  problem: Problem;
  objective: Objective;
  onStatusBadgePress: () => void;
  onPressMenu: () => void; // <-- ADD THIS
}

export default function ProblemPost({
  problem,
  objective,
  onStatusBadgePress,
  onPressMenu, // <-- ADD THIS
}: ProblemPostProps) {
  // ... (keep all existing logic and state inside this component)
  const router = useRouter();
  const threadItems = useAppStore((state) => state.threadItems);
  const currentStatus = problem.status || "active";
  const currentStatusInfo = statusInfo[currentStatus];
  const [isImageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
  }, [problem.id, threadItems]);
  const indicatorColor =
    priorityColors[problem.priority] || priorityColors.none;
  const formattedDate = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(problem.createdAt as Date));
  const openImageViewer = (index: number) => {
    setCurrentImageIndex(index);
    setImageViewerVisible(true);
  };
  const closeImageViewer = () => {
    setImageViewerVisible(false);
  };
  const imagesForViewer = useMemo(() => {
    return (problem.imageUrls || []).map((url) => ({ uri: url }));
  }, [problem.imageUrls]);
  const handleNavigateToStarReport = () => {
    if (problem.starReportId) {
      router.push(`/report/${problem.starReportId}`);
    } else {
      console.warn("This resolved problem does not have a Star Report ID.");
      Alert.alert("오류", "연결된 리포트를 찾을 수 없습니다.");
    }
  };

  return (
    <>
      <View style={styles.postContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[styles.indicator, { backgroundColor: indicatorColor }]}
            />
            <View style={styles.metaContainer}>
              <Text style={styles.metaText}>
                {objective.type}/
                <Text style={styles.objectiveTitle}>{objective.title}</Text>
              </Text>
              <Text style={styles.metaText}>{formattedDate}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[
                styles.statusBadge,
                { backgroundColor: currentStatusInfo.backgroundColor },
              ]}
              onPress={onStatusBadgePress}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: currentStatusInfo.color },
                ]}
              >
                {currentStatusInfo.name}
              </Text>
              <Feather
                name="chevron-down"
                size={16}
                color={currentStatusInfo.color}
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton} onPress={onPressMenu}>
              <Feather name="more-vertical" size={22} color="#495057" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.problemTitle}>{problem.title}</Text>
          {problem.description && (
            <Text style={styles.problemDescription}>{problem.description}</Text>
          )}
          {problem.imageUrls && problem.imageUrls.length > 0 && (
            <FlatList
              horizontal
              data={problem.imageUrls}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              style={styles.imageList}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => openImageViewer(index)}
                  activeOpacity={0.8}
                >
                  
                  <Image
                    source={{ uri: item }}
                    style={styles.imageThumbnail}
                  />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
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
        {problem.status === "resolved" && problem.starReportId && (
          <TouchableOpacity
            style={styles.reportButtonContainer}
            onPress={handleNavigateToStarReport}
            activeOpacity={0.7}
          >
            <Feather name="star" size={16} color={"#ffffff"} />
            <Text style={styles.reportButtonText}>리포트 확인하기</Text>
            <Feather name="chevron-right" size={18} color={"#ffffff"} />
          </TouchableOpacity>
        )}
      </View>

      <ImageView
        images={imagesForViewer}
        imageIndex={currentImageIndex}
        visible={isImageViewerVisible}
        onRequestClose={closeImageViewer}
        HeaderComponent={({ imageIndex }) => (
          <ModalSafeArea style={styles.imageViewerHeader}>
            <TouchableOpacity onPress={closeImageViewer}>
              <Feather name="x" size={30} color="#ffffff" />
            </TouchableOpacity>
          </ModalSafeArea>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // ... (existing styles)
  postContainer: { padding: 16, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  indicator: { width: 16, height: 16, borderRadius: 16 },
  metaContainer: { marginLeft: 10 },
  metaText: { fontSize: 13, color: "#868e96" },
  objectiveTitle: { fontWeight: "bold" },
  body: { marginBottom: 20 },
  problemTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 12,
  },
  problemDescription: { fontSize: 16, lineHeight: 24, color: "#495057" },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#f1f3f5",
  },
  statsText: {
    fontSize: 14,
    color: "#6c757d",
    marginLeft: 4,
    fontVariant: ["tabular-nums"],
  },
  separator: { color: "#ced4da", marginHorizontal: 8 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusBadgeText: { fontSize: 13, fontWeight: "bold" },
  reportButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginHorizontal: -16,
    marginBottom: -16,
    backgroundColor: "#2b8a3e",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  reportButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  imageList: { marginTop: 8 },
  imageThumbnail: {
    width: 90,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "#f1f3f5",
  },
  imageViewerHeader: {
    width: "100%",
    position: "absolute",
    top: 0,
    right: 0,
    padding: 16,
    zIndex: 1,
    alignItems: "flex-end",
  },

  // ADD: New styles for the right side of the header
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuButton: {
    marginLeft: 8,
    padding: 4,
  },
});
