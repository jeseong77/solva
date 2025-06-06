// types/index.ts

// --- 상태(Status) 및 우선순위(Priority) 타입 정의 ---
export type ProblemStatus = "active" | "onHold" | "resolved" | "archived";

export type ObjectiveStatus =
  | "todo"
  | "inProgress"
  | "completed"
  | "blocked" // 하위 Objective 또는 blockingProblem으로 인해 지연
  | "onHold"
  | "cancelled";

export type Priority = "high" | "medium" | "low" | "none";

// --- 주요 엔티티 타입 정의 ---

/**
 * Persona: 사용자의 다양한 역할이나 삶의 영역을 나타내는 최상위 분류.
 * 각 Persona는 여러 Problem을 가질 수 있음.
 */
export interface Persona {
  id: string;
  title: string;                       // 예: "개인 성장", "대학생", "Solva 앱 개발자"
  description?: string;                 // 이 페르소나에 대한 설명
  personaGoals?: string;                // 이 페르소나로서 달성하고자 하는 전반적인 목표 (텍스트)
  avatarImageUri?: string;              // 대표 이미지 URI (선택 사항)
  icon?: string;                        // 아이콘 이름 (선택 사항)
  color?: string;                       // 대표 색상 (선택 사항)
  problemIds: string[];                // 이 페르소나에 속한 Problem들의 ID 배열
  createdAt: Date;
  order?: number;                       // 페르소나 목록에서의 순서
}

/**
 * Problem: 사용자가 해결하고자 하는 구체적인 문제 또는 달성하고자 하는 주요 과제.
 * Persona에 속하며, Objective와 Rule을 통해 해결 계획을 가짐.
 */
export interface Problem {
  id: string;
  personaId: string;      // 이 Problem이 속한 Persona의 ID
  title: string;
  description?: string;
  status: ProblemStatus;
  priority: Priority;     // 이 Problem의 중요도 (isFeatured 대체)

  // Problem 자체의 해결 기준은 Objective들의 완료로 판단, 정량/정성 목표는 Objective로 이동
  // resolutionCriteriaText?: string; // Objective로 이동
  // resolutionNumericalTarget?: number; // Objective로 이동
  // currentNumericalProgress?: number;  // Objective로 이동

  objectiveIds: string[]; // 이 Problem을 해결하기 위한 최상위 Objective들의 ID 목록
  ruleIds: string[];      // 이 Problem 해결 과정에 적용될 Rule들의 ID 목록
  tagIds?: string[];       // 이 Problem에 연결된 Tag들의 ID 배열

  timeSpent: number;      // 이 Problem 해결에 투여된 총 시간 (Objective들로부터 롤업), 기본값 0
  createdAt: Date;
  resolvedAt?: Date;
  archivedAt?: Date;
  starReportId?: string | null;
}

/**
 * Objective: Problem 해결을 위한 구체적인 목표, 과업, 또는 하위 목표.
 * 재귀적으로 분해 가능하며, 가장 작은 단위가 실제 실행 Task 역할을 함.
 */
export interface Objective {
  id: string;
  problemId: string;        // 이 Objective가 속한 Problem의 ID
  title: string;
  description?: string;
  parentId: string | null;  // 상위 Objective ID (해당 Problem 내 최상위 Objective는 null)
  childObjectiveIds: string[]; // 이 Objective를 구성하는 하위 Objective들

  // 이 Objective 수행 중 발견되어, 이 Objective의 진행을 막는 새로운 Problem(병목)들의 ID 목록
  blockingProblemIds: string[];

  status: ObjectiveStatus;
  deadline?: Date;
  timeSpent: number;        // 이 Objective(과업)에 직접 투여된 시간, 기본값 0

  // Objective 해결을 위한 구체적인 조건 (Problem에서 이전됨)
  completionCriteriaText?: string;    // 완료 기준 (정성적)
  numericalTarget?: number; // 목표치 (정량적)
  currentNumericalProgress?: number;  // 현재 달성도 (정량적)

  createdAt: Date;
  completedAt?: Date;
  order?: number;           // 형제 Objective 간 순서
}

/**
 * Rule: Problem 해결 과정에서 사용자가 정의하는 지침
 */
export interface Rule {
  id: string;
  problemId: string; // 이 Rule이 속한 Problem의 ID
  title: string;     // 예: "매일 1시간 X", "Y 하지 않기"
  createdAt: Date;
  // isLocked 필드 제거됨
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
  problemId: string;      // 회고 대상 Problem의 ID
  situation: string;
  task: string;           // STAR 방법론의 T (해결하려던 과업/Problem 제목 등)
  action: string;
  result: string;
  learnings?: string;
  timeSpent?: number;      // 회고 작성 시간 (선택 사항)
  createdAt: Date;
}