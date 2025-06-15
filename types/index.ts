// types/index.ts

// --- 상태(Status) 및 우선순위(Priority) 타입 정의 ---

export type ProblemStatus = "active" | "onHold" | "resolved" | "archived";

export type Priority = "high" | "medium" | "low" | "none";

export type ThreadItemType =
  | "General"
  | "Bottleneck"
  | "Task"
  | "Action"
  | "Session";

export type ActionStatus = "todo" | "inProgress" | "completed" | "cancelled";

// --- 주요 엔티티 타입 정의 ---

/**
 * Persona: 사용자의 다양한 역할이나 삶의 영역을 나타내는 최상위 분류
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
 * WeeklyProblem: 특정 주에 집중하여 해결할 Problem을 지정하는 기록
 */
export interface WeeklyProblem {
  id: string; // 이 기록의 고유 ID
  personaId: string; // 어떤 페르소나에 대한 주간 문제인지
  problemId: string; // 주간 문제로 지정된 Problem의 ID
  weekIdentifier: string; // 해당 주를 식별하는 값 (예: "2025-W23")
  notes?: string; // 해당 주 목표에 대한 간단한 메모 (선택 사항)
  createdAt: Date; // 이 기록이 생성된 시간
}

/**
 * Problem: 사용자가 해결하고자 하는 구체적인 문제 또는 과제
 */
export interface Problem {
  id: string;
  personaId: string;
  title: string;
  description?: string;
  status: ProblemStatus;
  priority: Priority;
  urgency?: number;
  importance?: number;
  tags?: string[];
  childThreadIds: string[];
  timeSpent: number;
  createdAt: Date;
  resolvedAt?: Date;
  archivedAt?: Date;
  starReportId?: string | null;
}

/**
 * BaseThreadItem: 모든 스레드 아이템의 공통 속성을 정의하는 기본 타입
 */
export interface BaseThreadItem {
  id: string;
  problemId: string;
  parentId: string | null;
  childThreadIds: string[];
  type: ThreadItemType;
  content: string;
  isImportant?: boolean;
  resultIds: string[];
  createdAt: Date;
  authorId?: string;
}

// --- 5가지 구체적인 Thread Item 타입 정의 ---

export interface GeneralThreadItem extends BaseThreadItem {
  type: "General";
}

export interface BottleneckThreadItem extends BaseThreadItem {
  type: "Bottleneck";
  isResolved: boolean;
}

export interface TaskThreadItem extends BaseThreadItem {
  type: "Task";
  isCompleted: boolean;
}

export interface ActionThreadItem extends BaseThreadItem {
  type: "Action";
  status: ActionStatus;
  timeSpent: number;
  deadline?: Date;
  completedAt?: Date;
}

export interface SessionThreadItem extends BaseThreadItem {
  type: "Session";
  timeSpent: number;
  startTime: Date;
}

/**
 * 모든 ThreadItem 타입을 하나로 묶는 Discriminated Union
 */
export type ThreadItem =
  | GeneralThreadItem
  | BottleneckThreadItem
  | TaskThreadItem
  | ActionThreadItem
  | SessionThreadItem;

/**
 * Result: 각 ThreadItem에 주석처럼 달 수 있는 구체적인 성과 또는 결과물
 */
export interface Result {
  id: string;
  parentThreadId: string;
  content: string;
  occurredAt?: Date;
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
  createdAt: Date;
}

/**
 * Tag: Problem에 연결할 수 있는 태그
 */
export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface ActiveSession {
  threadId: string;
  startTime: number; // 세션 시작 또는 재시작 시의 타임스탬프 (Date.now())
  isPaused: boolean;
  pausedTime: number; // 일시정지 전까지 누적된 시간 (밀리초)
}

/**
 * @description 문제에 종속되지 않는 독립적인 할 일
 */
export interface Todo {
  id: string;
  content: string;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
}