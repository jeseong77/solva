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
import { useRouter } from "expo-router"; // ✅ [추가] 페이지 이동을 위한 useRouter 임포트
import React, { useMemo } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Priority에 따른 색상 맵
const priorityColors: { [key in Priority]: string } = {
  high: "#e57373",
  medium: "#ffb74d",
  low: "#81c784",
  none: "#bdbdbd",
};

// 초(seconds)를 HH:MM:SS 또는 MM:SS 형식으로 변환하는 헬퍼 함수
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

// 상태별 이름 및 색상 정보
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
interface ProblemPostProps {
  problem: Problem;
  persona: Persona;
  onStatusBadgePress: () => void;
}

export default function ProblemPost({
  problem,
  persona,
  onStatusBadgePress,
}: ProblemPostProps) {
  const router = useRouter(); // ✅ [추가] 라우터 훅 초기화
  const threadItems = useAppStore((state) => state.threadItems);
  const currentStatus = problem.status || "active";
  const currentStatusInfo = statusInfo[currentStatus];

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
  }).format(new Date(problem.createdAt));

  // ✅ [추가] STAR 리포트 페이지로 이동하는 핸들러
  const handleNavigateToStarReport = () => {
    if (problem.starReportId) {
      router.push(`/report/${problem.starReportId}`);
    } else {
      // starReportId가 없는 경우에 대한 예외 처리 (예: 경고)
      console.warn("This resolved problem does not have a Star Report ID.");
      Alert.alert("오류", "연결된 리포트를 찾을 수 없습니다.");
    }
  };

  return (
    <View style={styles.postContainer}>
      {/* --- 헤더 --- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[styles.indicator, { backgroundColor: indicatorColor }]}
          />
          <View style={styles.metaContainer}>
            <Text style={styles.metaText}>
              persona/<Text style={styles.personaTitle}>{persona.title}</Text>
            </Text>
            <Text style={styles.metaText}>{formattedDate}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.statusBadge,
            { backgroundColor: currentStatusInfo.backgroundColor },
          ]}
          onPress={onStatusBadgePress}
        >
          <Text
            style={[styles.statusBadgeText, { color: currentStatusInfo.color }]}
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
      </View>

      {/* --- 본문 --- */}
      <View style={styles.body}>
        <Text style={styles.problemTitle}>{problem.title}</Text>
        {problem.description && (
          <Text style={styles.problemDescription}>{problem.description}</Text>
        )}
      </View>

      {/* --- 푸터 통계 --- */}
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

      {/* ✅ [추가] Resolved 상태일 때만 보이는 리포트 확인 버튼 */}
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
  );
}

const styles = StyleSheet.create({
  postContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
  },
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
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 16,
  },
  metaContainer: {
    marginLeft: 10,
  },
  metaText: {
    fontSize: 13,
    color: "#868e96",
  },
  personaTitle: {
    fontWeight: "bold",
  },
  body: {
    marginBottom: 20,
  },
  problemTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 12,
  },
  problemDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: "#495057",
  },
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
  separator: {
    color: "#ced4da",
    marginHorizontal: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  // ✅ [수정] 리포트 확인 버튼 관련 스타일
  reportButtonContainer: {
    // 레이아웃
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    // 좌우, 하단 여백을 음수 마진으로 처리해 부모의 padding을 무시하고 꽉 채움
    marginHorizontal: -16,
    marginBottom: -16,
    // 디자인
    backgroundColor: "#2b8a3e", // 요청하신 녹색 배경
    paddingVertical: 18,
    paddingHorizontal: 20,
    // borderTopWidth는 배경색으로 구분되므로 제거
  },
  reportButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16, // 가독성을 위해 폰트 크기 살짝 키움
    fontWeight: "bold", // 굵게 하여 강조
    color: "#ffffff", // ✅ 녹색 배경과 대비가 가장 선명한 흰색으로 변경
  },
});
