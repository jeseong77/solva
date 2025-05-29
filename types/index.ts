// types/index.ts

export type ProblemStatus = "active" | "evaluating" | "resolved" | "archived";
export type TaskStatus = "todo" | "inProgress" | "completed";
export type ProjectStatus = "active" | "onHold" | "completed";

/**
 * 프로젝트의 집중도 상태를 나타내는 타입
 * - unfocused: 일반 상태 (기본값)
 * - focused: 중요 표시, 목록 상단에 오거나 강조 표시
 * - superfocused: 이 프로젝트 외 다른 모든 프로젝트를 잠금 상태로 변경
 */
export type ProjectFocusStatus = "unfocused" | "focused" | "superfocused";

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
