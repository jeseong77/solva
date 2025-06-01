// types/index.ts

export type ProblemStatus = "active" | "evaluating" | "resolved" | "archived";
export type TaskStatus = "todo" | "inProgress" | "completed";
export type ProjectStatus = "active" | "onHold" | "completed";
export type ProjectFocusStatus = "unfocused" | "focused" | "superfocused";
export type GoalStatus = "active" | "completed" | "onHold" | "archived";

/**
 * 사용자가 정의하는 Goal(단기 목표)에 대한 인터페이스
 */
export interface Goal {
  id: string;
  title: string;
  description?: string;
  isFeatured?: boolean; // 메인 화면 등에서 강조 표시 여부 (기본값: false)
  deadline?: Date;      // 목표 마감일 (선택 사항)
  status: GoalStatus;   // 목표 진행 상태
  todoIds: string[];    // 이 Goal에 속한 Todo 항목들의 ID 배열
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Goal 달성을 위한 개별 Todo 항목에 대한 인터페이스
 */
export interface Todo {
  id: string;
  goalId: string;      // 이 Todo가 속한 Goal의 ID
  title: string;
  isCompleted: boolean; // 완료 여부 (기본값: false)
  deadline?: Date;     // Todo 마감일 (선택 사항)
  notes?: string;      // 간단한 메모 (선택 사항)
  problemIds: string[]; // 이 Todo 수행 중 발견된 Problem(병목)들의 ID 배열
  order?: number;      // Goal 내 Todo 순서 정렬용 (선택 사항)
  createdAt: Date;
  completedAt?: Date;
}

export interface Problem {
  id: string;
  title: string;
  description?: string;
  parentId: string | null;
  childProblemIds: string[];
  status: ProblemStatus;
  path?: string;
  projectId?: string;
  retrospectiveReportId?: string;
  createdAt: Date;
  resolvedAt?: Date;
  archivedAt?: Date;
}

export interface Project {
  id: string;
  problemId: string;
  title: string;
  completionCriteriaText?: string;
  numericalTarget?: number;
  currentNumericalProgress?: number;
  performanceScore?: number;
  status: ProjectStatus;
  isLocked?: boolean;
  focused: ProjectFocusStatus;
  doItemIds: string[];
  dontItemIds: string[];
  taskIds: string[];
  createdAt: Date;
  completedAt?: Date;
}

export interface DoItem {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  recurrenceRule: string;
  lastUpdatedDate?: Date;
  successCount: number;
  failureCount: number;
  isLocked?: boolean;
  createdAt: Date;
}

export interface DontItem {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  observancePeriod: string;
  lastUpdatedDate?: Date;
  successCount: number;
  failureCount: number;
  isLocked?: boolean;
  createdAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  isRepeatable: boolean;
  status: TaskStatus;
  isLocked?: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface RetrospectiveReport {
  id: string;
  problemId: string;
  situation: string;
  task: string; // Renamed from starTask
  action: string;
  result: string;
  learnings?: string;
  createdAt: Date;
}
