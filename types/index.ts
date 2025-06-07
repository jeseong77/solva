// types/index.ts

// --- 상태(Status) 및 우선순위(Priority) 타입 정의 ---
export type ProblemStatus = "active" | "onHold" | "resolved" | "archived";

export type ObjectiveStatus =
  | "todo"
  | "inProgress"
  | "completed"
  | "blocked"
  | "onHold"
  | "cancelled";

export type Priority = "high" | "medium" | "low" | "none";

// --- 새로운 엔티티 타입: WorkSession ---
/**
 * Objective에 대한 작업 시간 기록 (뽀모도로 또는 수동 입력)
 */
export interface WorkSession {
  id: string;
  objectiveId: string; // 이 작업 세션이 속한 Objective의 ID
  startTime: Date; // 작업 시작 시간
  duration: number; // 작업 시간 (분 또는 초 단위)
  notes?: string; // 해당 작업 세션에 대한 간단한 메모 (선택 사항)
  isPomodoro: boolean; // 뽀모도로 타이머를 사용했는지 여부
  createdAt: Date; // 이 레코드 생성 시간
}

// --- 주요 엔티티 타입 정의 ---

/**
 * 특정 주에 집중하여 해결할 Problem을 지정하는 기록
 */
export interface WeeklyProblem {
  id: string;
  personaId: string;
  problemId: string;
  weekIdentifier: string; // 예: "2025-W23"
  notes?: string;
  createdAt: Date;
}

/**
 * Persona: 사용자의 다양한 역할이나 삶의 영역을 나타내는 최상위 분류.
 */
export interface Persona {
  id: string;
  title: string;
  description?: string;
  personaGoals?: string;
  avatarImageUri?: string;
  icon?: string;
  color?: string;
  problemIds: string[];
  createdAt: Date;
  order?: number;
}

/**
 * Problem: 사용자가 해결하고자 하는 구체적인 문제 또는 달성하고자 하는 주요 과제.
 */
export interface Problem {
  id: string;
  personaId: string;
  originatingObjectiveId?: string;
  title: string;
  description?: string;
  status: ProblemStatus;
  priority: Priority;
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
 * Objective: Problem 해결을 위한 구체적인 목표, 과업, 또는 하위 목표.
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
  workSessionIds: string[]; // 이 Objective에 대한 작업 세션(WorkSession) ID 목록 추가
  completionCriteriaText?: string;
  numericalTarget?: number;
  currentNumericalProgress?: number;
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
 * Tag: 사용자가 생성하고 Problem에 연결할 수 있는 태그
 */
export interface Tag {
  id: string;
  name: string;
  color?: string;
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
