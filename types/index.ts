// types/index.ts

// --- 상태(Status) 타입 정의 ---
export type ObjectiveStatus =
  | "pending"
  | "active"
  | "blocked"
  | "onHold"
  | "completed"
  | "cancelled";

export type ProjectStatus = "active" | "onHold" | "completed";

export type TaskStatus = "todo" | "inProgress" | "completed"; // 프로젝트 내 Task용

// Problem 상태는 Objective 상태로 통합될 수 있으나, 구분을 위해 남겨둘 수 있음.
// 여기서는 ObjectiveStatus로 Problem의 상태도 관리한다고 가정하고 ProblemStatus 제거.
// export type ProblemStatus = "active" | "evaluating" | "resolved" | "archived";

// --- 주요 엔티티 타입 정의 ---

/**
 * Objective: 최상위 목표(Goal), 중간 요구사항(Requirement), 또는 병목(Problem)을 나타내는 통합 타입
 */
export interface Objective {
  id: string;
  title: string;
  description?: string;
  isBottleneck: boolean; // 이 Objective 자체가 병목으로 식별되었는지 여부 (기본값: false)
  bottleneckAnalysis?: {
    // isBottleneck이 true일 경우의 추가 분석 정보
    whyIsItAnIssue: string;
    derivedFromContext?: string;
    isSolvableByActor?: boolean;
  };
  parentId: string | null; // 부모 Objective의 ID (최상위 Objective는 null)
  childObjectiveIds: string[]; // 이 Objective를 구성하는 하위 Objective들의 ID 배열
  status: ObjectiveStatus;
  deadline?: Date;
  isFeatured?: boolean; // 중요 표시 (이 Objective에 연결된 Project가 superfocus 효과를 유발 가능)
  fulfillingProjectId?: string | null; // 이 Objective를 직접적으로 완수하는 Project의 ID
  timeSpent: number; // 이 Objective에 총 투여된 시간 (하위 Project/Task 시간 롤업) - 기본값 0
  createdAt: Date;
  completedAt?: Date;
  order?: number;
}

/**
 * Project: 특정 Objective를 달성하기 위한 구체적인 실행 계획 및 행동 단위
 */
export interface Project {
  id: string;
  objectiveId: string; // 이 프로젝트가 완수하려는 Objective의 ID
  title: string; // 프로젝트 제목
  completionCriteriaText?: string; // 사용자가 설정한 프로젝트 완성 기준 (텍스트)
  numericalTarget?: number; // 수치적 목표
  currentNumericalProgress?: number; // 현재까지 달성한 수치 (기본값 0)
  performanceScore?: number; // Rule 준수 기반 수행평가 점수 (기본값 50, 추후 로직 구체화)
  status: ProjectStatus;
  isLocked?: boolean; // 다른 Objective의 isFeatured로 인해 잠길 수 있음 (기본값 false)
  // focused 필드 제거됨 (Objective의 isFeatured로 관리)
  ruleIds: string[]; // 이 프로젝트에 속한 Rule들의 ID 배열
  taskIds: string[]; // 이 프로젝트에 속한 Task(일회성 과제)들의 ID 배열
  timeSpent: number; // 이 Project에 총 투여된 시간 (하위 Task/Rule 시간 롤업) - 기본값 0
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Rule: Project 내에서 사용자가 정의하는 지침 (기존 Do/Don't 통합)
 * 평가는 추후 숙고 예정이므로, 기본 정보만 포함
 */
export interface Rule {
  id: string;
  projectId: string;
  title: string; // 예: "매일 30분 운동하기", "야식 먹지 않기"
  // description?: string; // 필요시 추가
  // isAchievedToday?: boolean; // 일일 달성 여부 등 추적 메커니즘은 추후 구체화
  isLocked?: boolean; // Project 잠금 시 하위 아이템들도 잠김
  createdAt: Date;
  // lastUpdatedDate, successCount, failureCount 등은 일단 제거
}

/**
 * Task: Project 내의 구체적인 일회성/순차적 실행 과제
 */
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  isRepeatable: boolean; // 이 Task 자체를 완료하기 위해 여러 번 반복해야 하는 경우
  status: TaskStatus;
  isLocked?: boolean;
  timeSpent: number; // 이 Task에 투여된 시간 - 기본값 0
  createdAt: Date;
  completedAt?: Date;
}

/**
 * StarReport (기존 RetrospectiveReport): Objective 해결 후 작성하는 회고
 */
export interface StarReport {
  id: string;
  objectiveId: string; // 회고 대상 Objective의 ID
  situation: string;
  task: string; // 해결하려던 과업 (Objective의 맥락에서)
  action: string;
  result: string;
  learnings?: string;
  timeSpent?: number; // 회고 작성 또는 관련 성찰에 투여된 시간 (선택 사항)
  createdAt: Date;
}

// --- 제거된 타입 ---
// DoItem, DontItem, ProjectFocusStatus, ProblemStatus (ObjectiveStatus로 통합 가정)
