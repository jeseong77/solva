// types/index.ts

// --- 상태(Status) 및 우선순위(Priority) 타입 정의 ---

export type ProblemStatus = "active" | "onHold" | "resolved" | "archived";
export type Priority = "high" | "medium" | "low" | "none";

export type ThreadItemType =
  | "General"
  | "Insight"
  | "Bottleneck"
  | "Task"
  | "Action"
  | "Session";

export type ActionStatus = "todo" | "inProgress" | "completed" | "cancelled";

// ✅ [추가] Objective의 타입을 정의합니다.
export type ObjectiveType = "persona" | "product";

// --- 주요 엔티티 타입 정의 ---

export interface UserLink {
  id: string;
  platform:
    | "website"
    | "github"
    | "linkedin"
    | "twitter"
    | "instagram"
    | "other";
  url: string;
  title?: string;
}

export interface User {
  id: string;
  displayName: string;
  username?: string;
  email?: string;
  bio?: string;
  introduction?: string;
  avatarImageUri?: string;
  coverImageUri?: string;
  location?: string;
  links?: UserLink[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ✅ [변경] Persona -> Objective
 * 사용자의 역할(페르소나) 뿐만 아니라, 달성하고자 하는 모든 대상(프로덕트 등)을 포함합니다.
 */
export interface Objective {
  id: string;
  userId: string;
  type: ObjectiveType; // ✅ 'persona' 또는 'product'
  title: string;
  description?: string;
  objectiveGoals?: string; // personaGoals -> objectiveGoals
  coverImageUri?: string;
  avatarImageUri?: string;
  icon?: string;
  color?: string;
  problemIds: string[];
  createdAt: Date;
  order?: number;
}

/**
 * ✅ [추가] Gap
 * Objective의 '이상'과 '현실' 사이의 격차를 정의합니다.
 * 예: (목표) SAT 점수, (이상) 1550, (현실) 1300
 */
export interface Gap {
  id: string;
  objectiveId: string; // 어떤 Objective에 속한 Gap인지
  title: string; // 이 Gap의 이름 (예: SAT 점수, 월간 활성 사용자 수)
  idealState: string; // 이상적인 상태/수치
  currentState: string; // 현재 상태/수치
  problemIds: string[]; // 이 Gap을 해결하기 위해 생성된 문제들
  createdAt: Date;
}

/**
 * ✅ [변경] WeeklyProblem
 * personaId -> objectiveId
 */
export interface WeeklyProblem {
  id: string;
  objectiveId: string; // 👩‍💻
  problemId: string;
  weekIdentifier: string;
  notes?: string;
  createdAt: Date;
}

/**
 * ✅ [변경] Problem
 * personaId -> objectiveId
 */
export interface Problem {
  id: string;
  objectiveId: string; // 👩‍💻
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

// --- 구체적인 Thread Item 타입 정의 ---

export interface GeneralThreadItem extends BaseThreadItem {
  type: "General";
}

// ✅ InsightThreadItem 인터페이스 추가
export interface InsightThreadItem extends BaseThreadItem {
  type: "Insight";
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
  | InsightThreadItem
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
  startTime: number;
  isPaused: boolean;
  pausedTime: number;
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
