// components/problem/ProblemPost.tsx

// ... (imports remain mostly the same, but ActionThreadItem can be removed)
import { useAppStore } from "@/store/store";
import {
  InsightThreadItem,
  Objective,
  Priority,
  Problem,
  ProblemStatus,
  SessionThreadItem,
  TaskThreadItem,
} from "@/types";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView as ModalSafeArea,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ImageView from "react-native-image-viewing";

// ... (helper functions remain the same)
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

interface ProblemPostProps {
  problem: Problem;
  objective: Objective;
  onStatusBadgePress: () => void;
  onPressMenu: () => void;
}

export default function ProblemPost({
  problem,
  objective,
  onStatusBadgePress,
  onPressMenu,
}: ProblemPostProps) {
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

    // REMOVED: All logic related to 'Action' items
    // const actionItems = ...
    // const completedActions = ...

    // ADD: New logic to count 'Insight' items
    const insightItems = allThreadsInProblem.filter(
      (item): item is InsightThreadItem => item.type === "Insight"
    );

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
      insights: insightItems.length, // <-- New insight count
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
        {/* ... (Header remains the same) ... */}
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

        {/* ... (Body remains the same) ... */}
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
                  <Image source={{ uri: item }} style={styles.imageThumbnail} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* --- Footer Stats --- */}
        <View style={styles.statsContainer}>
          <Feather name="git-branch" size={14} color="#6c757d" />
          <Text style={styles.statsText}>{stats.totalThreads}</Text>
          <Text style={styles.separator}>·</Text>
          <Feather name="check-square" size={14} color="#6c757d" />
          <Text style={styles.statsText}>
            {stats.tasks.completed} / {stats.tasks.total}
          </Text>
          <Text style={styles.separator}>·</Text>

          {/* FIX: Replaced 'Action' stats with 'Insight' stats */}
          <Feather name="eye" size={14} color="#6c757d" />
          <Text style={styles.statsText}>{stats.insights}</Text>

          <Text style={styles.separator}>·</Text>
          <Feather name="clock" size={14} color="#6c757d" />
          <Text style={styles.statsText}>
            {formatSeconds(stats.totalSessionTime)}
          </Text>
        </View>

        {/* ... (Report button remains the same) ... */}
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
    width: 180,
    height: 240,
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
  headerRight: { flexDirection: "row", alignItems: "center" },
  menuButton: { marginLeft: 8, padding: 4 },
});
