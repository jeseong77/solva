// types/index.ts

/**
 * 문제의 현재 상태를 나타내는 타입
 * - active: 현재 분석 중이거나 해결 중인 문제
 * - evaluating: 하위 문제가 해결되어 현재 재평가 중인 문제
 * - resolved: 사용자가 해결되었다고 판단한 문제 (회고 작성 전 단계일 수 있음)
 * - archived: 회고까지 완료되어 보관(아카이브)된 문제
 */
export type ProblemStatus = "active" | "evaluating" | "resolved" | "archived";

/**
 * 과제의 진행 상태를 나타내는 타입
 */
export type TaskStatus = "todo" | "inProgress" | "completed";

/**
 * 사용자가 정의하는 문제(Problem)에 대한 인터페이스
 */
export interface Problem {
  id: string; // 고유 식별자 (예: UUID)
  title: string; // 문제의 제목
  description?: string; // 문제에 대한 상세 설명 (선택 사항)
  parentId: string | null; // 상위 문제의 ID (최상위 문제의 경우 null)
  childProblemIds: string[]; // 이 문제의 하위 문제들 ID 배열
  status: ProblemStatus; // 문제의 현재 상태
  path?: string; // 문제의 경로 또는 카테고리 (예: "학습/수학/미적분") (선택 사항)
  associatedTaskIds: string[]; // 이 문제가 '막다른 길의 문제'일 경우, 직접 연결된 Task들의 ID 배열
  retrospectiveReportId?: string; // 이 문제와 연결된 회고 리포트의 ID (선택 사항)
  createdAt: Date; // 문제 생성 일시
  resolvedAt?: Date; // 문제 해결 완료 일시 (선택 사항)
  archivedAt?: Date; // 문제 보관(아카이브) 일시 (선택 사항)
}

/**
 * '막다른 길의 문제'를 해결하기 위한 구체적인 실행 과제(Task)에 대한 인터페이스
 */
export interface Task {
  id: string; // 과제의 고유 식별자
  problemId: string; // 이 과제가 연결된 '막다른 길의 문제'의 ID
  title: string; // 과제의 내용
  isRepeatable: boolean; // 반복 수행이 필요한 과제인지 여부
  status: TaskStatus; // 과제의 진행 상태
  createdAt: Date; // 과제 생성 일시
  completedAt?: Date; // 과제 완료 일시 (선택 사항)
}

/**
 * 문제 해결 후 작성하는 회고 리포트(Retrospective Report)에 대한 인터페이스
 * STAR (Situation, Task, Action, Result) 방법론을 활용합니다.
 */
export interface RetrospectiveReport {
  id: string; // 회고 리포트의 고유 식별자
  problemId: string; // 이 회고 리포트가 연결된 Problem의 ID
  situation: string; // 당시 상황 (STAR의 S)
  starTask: string; // 맡았던 과제 또는 목표 (STAR의 T - 시스템의 Task 타입과 구분)
  action: string; // 취했던 행동 (STAR의 A)
  result: string; // 행동의 결과 (STAR의 R)
  learnings?: string; // 추가적인 배운 점이나 교훈 (선택 사항)
  createdAt: Date; // 리포트 작성 일시
}

// 추후 필요에 따라 사용자(User) 타입 등을 추가할 수 있습니다.
