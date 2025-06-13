// app/components/problem/WeeklyProblem.tsx

import { useAppStore } from "@/store/store";
import {
  ActionThreadItem, // ✅ 추가
  Persona,
  Problem,
  SessionThreadItem, // ✅ 추가
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

// WeeklyProblem 컴포넌트가 받을 Props 정의
interface WeeklyProblemProps {
  weeklyProblem: WeeklyProblem | null | undefined; // 이번 주 문제 기록
  problem: Problem | null | undefined; // 실제 문제 객체
  persona: Persona | null | undefined; // 현재 페르소나 객체
  onPress: (problemId: string) => void; // 카드 클릭 시 실행될 함수
  onPressNew: () => void; // 새 주간 문제 설정 시 실행될 함수
  onChangeWeeklyProblem: () => void;
}

export default function WeeklyProblemCard({
  weeklyProblem,
  problem,
  persona,
  onPress,
  onPressNew,
  onChangeWeeklyProblem,
}: WeeklyProblemProps) {
  // 전역 상태에서 모든 스레드 아이템을 가져옵니다.
  const threadItems = useAppStore((state) => state.threadItems);

  // D-Day 계산 로직 (useMemo로 최적화)
  const dDay = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간 정보를 제거하여 날짜만 비교

    const dayOfWeek = today.getDay(); // 0 (일요일) ~ 6 (토요일)
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

    if (daysUntilSunday === 0) return "D-Day";
    return `D-${daysUntilSunday}`;
  }, []);

  const stats = useMemo(() => {
    if (!problem) return null;
    // ✅ [수정] 문제에 속한 모든 스레드를 효율적으로 필터링
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
  }, [problem, threadItems]);

  // 주간 문제가 없는 경우, 대체 UI 렌더링
  if (!weeklyProblem || !problem || !persona) {
    return (
      <View style={styles.container}>
        <Text style={styles.componentTitle}>이번주에 해결할 문제:</Text>
        <TouchableOpacity style={styles.emptyCard} onPress={onPressNew}>
          <Feather name="plus-circle" size={24} color="#adb5bd" />
          <Text style={styles.emptyText}>
            이번 주에 해결할 문제를 설정해주세요.
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 주간 문제가 있는 경우, 카드 UI 렌더링
  return (
    <View style={styles.container}>
      <Text style={styles.componentTitle}>이번주에 집중할 문제:</Text>
      <View style={styles.cardWrapper}>
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => onPress(problem.id)}
      >
        {/* 카드 헤더: 페르소나 정보와 D-Day 칩 */}
        <View style={styles.cardHeader}>
          <Text style={styles.metaText}>persona/{persona.title}</Text>
          <View style={styles.dDayChip}>
            <Text style={styles.dDayText}>{dDay}</Text>
          </View>
        </View>

        {/* 카드 본문: 문제 제목과 설명 */}
        <View style={styles.cardBody}>
          <Text style={styles.problemTitle}>{problem.title}</Text>
          {problem.description && (
            <Text style={styles.problemDescription} numberOfLines={3}>
              {problem.description}
            </Text>
          )}
        </View>

        {/* 카드 푸터: 통계 정보 */}
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
      {/* ✅ [추가] '문제 바꾸기' 버튼. TouchableOpacity가 끝나는 지점 바로 아래에 추가 */}
      <TouchableOpacity
        style={styles.changeButton}
        onPress={onChangeWeeklyProblem}
      >
        <Feather name="refresh-cw" size={14} color="#495057" />
        <Text style={styles.changeButtonText}>주간 집중 문제 바꾸기</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  componentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  cardWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dee2e6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  // 카드 컨테이너 스타일
  cardContainer: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardHeader: {
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
  cardBody: {
    marginBottom: 16,
  },
  problemTitle: {
    fontSize: 20, // ProblemList 아이템보다 큰 폰트
    fontWeight: "bold",
    color: "#343a40",
    marginBottom: 8,
  },
  problemDescription: {
    fontSize: 15,
    color: "#495057",
    lineHeight: 22,
  },
  // 통계 정보 스타일 (ProblemList와 유사)
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
  // 주간 문제가 없을 때의 스타일
  emptyCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 120,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 15,
    color: "#868e96",
    fontWeight: "500",
  },
  // ✅ [수정] 변경 버튼 스타일
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12, // 패딩 조정
    backgroundColor: "#f8f9fa", // 배경색 변경
    borderTopWidth: 1, // 상단 구분선 추가
    borderColor: "#e9ecef",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  changeButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#495057",
    fontWeight: "500",
  },
});
