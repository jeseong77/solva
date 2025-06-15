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

// Priority에 따른 색상 맵 (기존과 동일)
const priorityColors: { [key in Priority]: string } = {
  high: "#e57373", // 연한 빨강 -> 진한 빨강 계열
  medium: "#ffb74d", // 연한 주황 -> 진한 주황 계열
  low: "#81c784", // 연한 녹색 -> 진한 녹색 계열
  none: "#bdbdbd", // 연한 회색 -> 진한 회색 계열
};

/**
 * 초(seconds)를 HH:MM:SS 또는 MM:SS 형식의 문자열로 변환하는 헬퍼 함수
 * ThreadItem.tsx 에서 가져와 재사용합니다.
 */
const formatSeconds = (totalSeconds: number): string => {
  if (typeof totalSeconds !== "number" || isNaN(totalSeconds)) {
    return "00:00";
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60); // Math.floor 추가하여 정수로 처리
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
  // 전역 상태에서 스레드 아이템을 가져와 통계 계산
  const threadItems = useAppStore((state) => state.threadItems);
  const currentStatus = problem.status || "active";
  const currentStatusInfo = statusInfo[currentStatus];

  // ✅ [수정] 통계 계산 로직 전체 변경
  const stats = useMemo(() => {
    // 1. 이 문제에 속한 모든 스레드를 필터링합니다.
    const allThreadsInProblem = threadItems.filter(
      (item) => item.problemId === problem.id
    );

    // 2. '총 스레드 수'는 'Session' 타입을 제외하고 계산합니다.
    const totalThreads = allThreadsInProblem.filter(
      (item) => item.type !== "Session"
    ).length;

    // 3. '할 일' 통계를 계산합니다.
    const taskItems = allThreadsInProblem.filter(
      (item): item is TaskThreadItem => item.type === "Task"
    );
    const completedTasks = taskItems.filter((item) => item.isCompleted).length;

    // 4. '액션' 통계를 계산합니다.
    const actionItems = allThreadsInProblem.filter(
      (item): item is ActionThreadItem => item.type === "Action"
    );
    const completedActions = actionItems.filter(
      (item) => item.status === "completed"
    ).length;

    // 5. '총 세션 시간'을 계산합니다.
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
      totalSessionTime, // 총 시간을 초 단위 숫자로 저장
    };
  }, [problem.id, threadItems]);

  const indicatorColor =
    priorityColors[problem.priority] || priorityColors.none;

  const formattedDate = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(problem.createdAt));

  return (
    <View style={styles.postContainer}>
      {/* 헤더 (기존과 동일) */}
      <View style={styles.header}>
        {/* 헤더 왼쪽 컨텐츠 */}
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

        {/* 헤더 오른쪽: 상태 배지 */}
        <TouchableOpacity
          style={[
            styles.statusBadge,
            { backgroundColor: currentStatusInfo.backgroundColor },
          ]}
          onPress={onStatusBadgePress} // ✅ 이벤트 핸들러 연결
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

      {/* 본문 (기존과 동일) */}
      <View style={styles.body}>
        <Text style={styles.problemTitle}>{problem.title}</Text>
        {problem.description && (
          <Text style={styles.problemDescription}>{problem.description}</Text>
        )}
      </View>

      {/* ✅ [수정] 푸터 통계 표시 방식 변경 */}
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
  );
}

// styles는 기존과 동일
const styles = StyleSheet.create({
  postContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
  },
  // [수정] header 스타일
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // 양쪽 정렬
    marginBottom: 8,
  },
  // [추가] headerLeft 스타일
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // 왼쪽 영역이 남는 공간을 차지하도록
    marginRight: 8, // 오른쪽과의 간격
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
    fontVariant: ["tabular-nums"], // 숫자가 고정폭으로 보이도록 설정
  },
  separator: {
    color: "#ced4da",
    marginHorizontal: 8,
  },
  // [추가] statusBadge 관련 스타일
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
});
