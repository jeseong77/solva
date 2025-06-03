// types/index.ts

// --- 상태(Status) 타입 정의 ---
export type ProblemStatus = "active" | "onHold" | "resolved" | "archived";

export type ObjectiveStatus =
  | "todo"
  | "inProgress"
  | "completed"
  | "blocked"
  | "onHold"
  | "cancelled";

export type Priority = "high" | "medium" | "low";

// --- 새로운 엔티티 타입: Tag ---
/**
 * 사용자가 생성하고 Problem에 연결할 수 있는 태그
 */
export interface Tag {
  id: string; // 고유 식별자
  name: string; // 태그 이름 (예: "업무", "공부", "개인 프로젝트")
  color?: string; // 태그 색상 (선택 사항)
  createdAt: Date; // 생성일
}

// --- 주요 엔티티 타입 정의 (Problem에 tagsIds 추가) ---

/**
 * Problem: 사용자가 해결하고자 하는 최상위 문제점 또는 과제.
 */
export interface Problem {
  id: string;
  title: string;
  description?: string;
  status: ProblemStatus;
  priority: Priority;
  resolutionCriteriaText?: string;
  resolutionNumericalTarget?: number;
  currentNumericalProgress?: number;
  objectiveIds: string[];
  ruleIds: string[];
  tagIds?: string[];
  timeSpent: number;
  createdAt: Date;
  resolvedAt?: Date;
  archivedAt?: Date;
  starReportId?: string | null;
}

/**
 * Objective: Problem 해결을 위한 구체적인 목표, 과업, 또는 하위 목표. Task의 역할을 겸하며 재귀적으로 분해 가능.
 */
export interface Objective {
  id: string;
  problemId: string;
  title: string;
  description?: string;
  parentId: string | null;
  childObjectiveIds: string[];
  blockingProblemIds: string[];
  status: ObjectiveStatus;
  deadline?: Date;
  timeSpent: number;
  createdAt: Date;
  completedAt?: Date;
  order?: number;
}

/**
 * Rule: Problem 해결 과정에서 사용자가 정의하는 지침
 */
export interface Rule {
  id: string;
  problemId: string;
  title: string;
  createdAt: Date;
}

/**
 * StarReport: Problem 해결 후 작성하는 회고
 */
export interface StarReport {
  id: string;
  problemId: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  learnings?: string;
  timeSpent?: number;
  createdAt: Date;
}