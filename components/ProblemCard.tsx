import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Problem, ProblemStatus } from "@/types"; // ProblemStatus도 import합니다.

// 각 상태별 색상 정의 (가독성 및 유지보수성 향상)
type StatusStyle = {
  badgeBackgroundColor: string;
  badgeTextColor: string;
  borderColor?: string; // 상태에 따라 카드 테두리 색상도 변경 가능
};

const statusStyles: Record<ProblemStatus, StatusStyle> = {
  active: {
    badgeBackgroundColor: "#e0f7fa",
    badgeTextColor: "#00796b",
    borderColor: "#00796b",
  },
  evaluating: {
    badgeBackgroundColor: "#fff9c4",
    badgeTextColor: "#fbc02d",
    borderColor: "#fbc02d",
  },
  resolved: {
    badgeBackgroundColor: "#c8e6c9",
    badgeTextColor: "#388e3c",
    borderColor: "#388e3c",
  },
  archived: {
    badgeBackgroundColor: "#f5f5f5",
    badgeTextColor: "#757575",
    borderColor: "#bdbdbd",
  },
};

export interface ProblemCardProps {
  problem: Problem;
  level?: number; // 트리 리스트에서의 들여쓰기 레벨
  onPress?: (problem: Problem) => void; // 카드 전체 클릭 시 (예: 상세 보기)
  onEdit?: (problem: Problem) => void;
  onAddSubproblem?: (parentId: string) => void;
  onDefineTasks?: (problemId: string) => void; // '막다른 길의 문제'일 경우
  onMarkResolved?: (problemId: string) => void; // 해결됨으로 상태 변경
  onStartRetrospective?: (problemId: string) => void; // 회고 시작
}

export default function ProblemCard({
  problem,
  level = 0,
  onPress,
  onEdit,
  onAddSubproblem,
  onDefineTasks,
  onMarkResolved,
  onStartRetrospective,
}: ProblemCardProps) {
  const isDeadEnd =
    !problem.childProblemIds || problem.childProblemIds.length === 0;
  const currentStatusStyle =
    statusStyles[problem.status] || statusStyles.active; // 기본값은 active

  // 문제 상태에 따른 액션 버튼 렌더링 로직
  const renderActionButtons = () => {
    const canBeResolved =
      problem.status === "active" || problem.status === "evaluating";
    const canStartRetrospective = problem.status === "resolved";
    const canAddSubproblem =
      problem.status !== "resolved" && problem.status !== "archived"; // 해결/아카이브된 문제에는 하위 문제 추가 X

    return (
      <View style={styles.actionsContainer}>
        {onEdit && (
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => onEdit(problem)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
        {canAddSubproblem && onAddSubproblem && (
          <TouchableOpacity
            style={[styles.actionButton, styles.addSubproblemButton]}
            onPress={() => onAddSubproblem(problem.id)}
          >
            <Text style={styles.actionButtonText}>Add Sub-problem</Text>
          </TouchableOpacity>
        )}
        {isDeadEnd && canBeResolved && onDefineTasks && (
          <TouchableOpacity
            style={[styles.actionButton, styles.defineTasksButton]}
            onPress={() => onDefineTasks(problem.id)}
          >
            <Text style={styles.actionButtonText}>Define Tasks</Text>
          </TouchableOpacity>
        )}
        {canBeResolved && onMarkResolved && (
          <TouchableOpacity
            style={[styles.actionButton, styles.resolveButton]}
            onPress={() => onMarkResolved(problem.id)}
          >
            <Text style={styles.actionButtonText}>Mark Resolved</Text>
          </TouchableOpacity>
        )}
        {canStartRetrospective && onStartRetrospective && (
          <TouchableOpacity
            style={[styles.actionButton, styles.retrospectiveButton]}
            onPress={() => onStartRetrospective(problem.id)}
          >
            <Text style={styles.actionButtonText}>Start Retrospective</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPress={() => onPress?.(problem)}
      activeOpacity={onPress ? 0.7 : 1.0}
      style={styles.touchableWrapper}
    >
      <View
        style={[
          styles.card,
          {
            marginLeft: level * 15,
            borderColor: currentStatusStyle.borderColor,
            borderWidth: 1,
          }, // 들여쓰기 및 상태별 테두리 색상
          Platform.OS === "ios" ? styles.shadowIOS : styles.shadowAndroid,
        ]}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {problem.title}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: currentStatusStyle.badgeBackgroundColor },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: currentStatusStyle.badgeTextColor },
              ]}
            >
              {problem.status}
            </Text>
          </View>
        </View>

        {problem.description && (
          <Text
            style={styles.description}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {problem.description}
          </Text>
        )}

        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>
            Created: {problem.createdAt.toLocaleDateString()}
          </Text>
          {problem.childProblemIds && problem.childProblemIds.length > 0 && (
            <Text style={styles.metaText}>
              Sub-problems: {problem.childProblemIds.length}
            </Text>
          )}
          {isDeadEnd &&
            problem.associatedTaskIds &&
            problem.associatedTaskIds.length > 0 && (
              <Text style={styles.metaText}>
                Tasks: {problem.associatedTaskIds.length}
              </Text>
            )}
        </View>

        {renderActionButtons()}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchableWrapper: {
    marginVertical: 6,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    // marginVertical과 marginHorizontal은 TouchableWrapper로 이동
  },
  shadowIOS: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2.62,
  },
  shadowAndroid: {
    elevation: 3,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start", // 제목이 여러 줄일 경우를 대비
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50", // 좀 더 부드러운 검은색
    flex: 1, // 제목이 길어질 경우 공간 차지
    marginRight: 8, // 상태 배지와의 간격
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12, // 좀 더 둥근 배지
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase", // 대문자화
  },
  description: {
    fontSize: 14,
    color: "#34495e", // 내용 텍스트 색상
    lineHeight: 20, // 가독성 향상
    marginBottom: 10,
  },
  metaContainer: {
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1", // 구분선 색상
    paddingTop: 8,
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: "#7f8c8d", // 메타 정보 텍스트 색상
    marginBottom: 2,
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap", // 버튼이 많을 경우 다음 줄로
    justifyContent: "flex-start",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8, // 줄바꿈 시 아래 버튼과의 간격
  },
  actionButtonText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "500",
  },
  editButton: { backgroundColor: "#3498db" /* Peter River */ },
  addSubproblemButton: { backgroundColor: "#2ecc71" /* Emerald */ },
  defineTasksButton: { backgroundColor: "#1abc9c" /* Turquoise */ },
  resolveButton: { backgroundColor: "#f39c12" /* Orange */ },
  retrospectiveButton: { backgroundColor: "#9b59b6" /* Amethyst */ },
});
