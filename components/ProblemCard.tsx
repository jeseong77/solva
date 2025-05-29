import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Problem, ProblemStatus, Project } from "@/types"; // Project 타입 import 추가

// 각 상태별 색상 정의 (이전과 동일)
type StatusStyle = {
  badgeBackgroundColor: string;
  badgeTextColor: string;
  borderColor?: string;
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
  allProjects: Project[]; // Problem에 연결된 Project를 찾기 위해 추가
  level?: number;
  onPress?: (problem: Problem) => void;
  onEdit?: (problem: Problem) => void;
  onAddSubproblem?: (parentId: string) => void;
  onDefineTasks?: (problemId: string, projectId?: string) => void; // projectId도 전달하도록 변경
  onMarkResolved?: (problemId: string) => void;
  onStartRetrospective?: (problemId: string) => void;
}

export default function ProblemCard({
  problem,
  allProjects, // props로 받기
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
    statusStyles[problem.status] || statusStyles.active;

  // 현재 Problem에 연결된 Project 찾기
  const associatedProject = problem.projectId
    ? allProjects.find((p) => p.id === problem.projectId)
    : null;

  // 연결된 Project의 Task 개수
  const projectTaskCount = associatedProject
    ? associatedProject.taskIds.length
    : 0;

  const renderActionButtons = () => {
    const canBeResolved =
      problem.status === "active" || problem.status === "evaluating";
    const canStartRetrospective = problem.status === "resolved";
    const canAddSubproblem =
      problem.status !== "resolved" && problem.status !== "archived";

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
        {/* 'Define Tasks' 버튼은 이제 Project 관리/생성으로 이어질 수 있음 */}
        {isDeadEnd && canBeResolved && onDefineTasks && (
          <TouchableOpacity
            style={[styles.actionButton, styles.defineTasksButton]}
            // onDefineTasks 호출 시 problem.id와 함께 problem.projectId도 전달
            onPress={() => onDefineTasks(problem.id, problem.projectId)}
          >
            <Text style={styles.actionButtonText}>
              {problem.projectId ? "Manage Project" : "Start Project"}
            </Text>
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
          },
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
          {/* 종점 문제(isDeadEnd)일 경우 Project 및 Task 정보 표시 */}
          {isDeadEnd && problem.projectId && associatedProject && (
            <Text style={styles.metaText}>
              Project Tasks: {projectTaskCount}
            </Text>
          )}
          {isDeadEnd && !problem.projectId && (
            <Text style={styles.metaText}>
              (Project to solve this not yet started)
            </Text>
          )}
        </View>

        {renderActionButtons()}
      </View>
    </TouchableOpacity>
  );
}

// 스타일 정의는 이전과 동일
const styles = StyleSheet.create({
  touchableWrapper: {
    marginVertical: 6,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
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
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  description: {
    fontSize: 14,
    color: "#34495e",
    lineHeight: 20,
    marginBottom: 10,
  },
  metaContainer: {
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
    paddingTop: 8,
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 2,
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
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
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "500",
  },
  editButton: { backgroundColor: "#3498db" },
  addSubproblemButton: { backgroundColor: "#2ecc71" },
  defineTasksButton: { backgroundColor: "#1abc9c" }, // 이제 "Manage/Start Project" 버튼
  resolveButton: { backgroundColor: "#f39c12" },
  retrospectiveButton: { backgroundColor: "#9b59b6" },
});
