// src/types/storeTypes.ts

// @/types (즉, types/index.ts) 에서 모든 엔티티 및 상태 타입들을 가져옵니다.
import {
  Persona, // Persona 추가
  Problem, ProblemStatus, Priority,
  Objective, ObjectiveStatus,
  Rule,
  Tag,
  StarReport
  // Project, Task 등은 types/index.ts 최신 버전에서 제거됨
} from '@/types';

// --- 각 Slice 가 가질 상태와 액션들에 대한 인터페이스 정의 ---

export interface PersonaSlice {
  personas: Persona[];
  isLoadingPersonas: boolean;
  fetchPersonas: () => Promise<void>;
  addPersona: (
    personaData: Omit<Persona, "id" | "createdAt" | "problemIds" | "order"> & { order?: number }
  ) => Promise<Persona | null>;
  updatePersona: (personaToUpdate: Persona) => Promise<Persona | null>;
  deletePersona: (personaId: string) => Promise<boolean>;
  getPersonaById: (id: string) => Persona | undefined;
  // Persona에 Problem ID 연결/해제 액션 등
  // linkProblemToPersona: (personaId: string, problemId: string) => Promise<Persona | null>;
  // unlinkProblemFromPersona: (personaId: string, problemId: string) => Promise<Persona | null>;
}

export interface ProblemSlice {
  problems: Problem[];
  isLoadingProblems: boolean;
  fetchProblems: (personaId?: string) => Promise<void>; // 특정 Persona의 Problem 또는 전체 Problem
  addProblem: (
    // Omit: id, createdAt, objectiveIds, ruleIds, tagIds, timeSpent, currentNumericalProgress, resolvedAt, archivedAt, starReportId
    // 필수: personaId, title, status, priority
    // 옵션: description, resolutionCriteriaText, resolutionNumericalTarget
    problemData: Omit<Problem, "id" | "createdAt" | "objectiveIds" | "ruleIds" | "tagIds" | "timeSpent" | "currentNumericalProgress" | "resolvedAt" | "archivedAt" | "starReportId" | "status" | "priority"> &
    { personaId: string; title: string; status?: ProblemStatus; priority?: Priority; }
  ) => Promise<Problem | null>;
  updateProblem: (problemToUpdate: Problem) => Promise<Problem | null>;
  deleteProblem: (problemId: string) => Promise<boolean>;
  getProblemById: (id: string) => Problem | undefined;
  // Problem에 Objective ID 또는 Rule ID 연결/해제, Tag ID 연결/해제, 시간/진행도 업데이트 등의 액션은 updateProblem으로 처리
}

export interface ObjectiveSlice {
  objectives: Objective[];
  isLoadingObjectives: boolean;
  // Problem ID로 해당 Problem의 최상위 Objective 로드, 또는 parent Objective ID로 하위 Objective 로드
  fetchObjectives: (options: { problemId: string; parentObjectiveId?: string | null } | { parentObjectiveId: string; problemId?: string }) => Promise<void>;
  addObjective: (
    // Omit: id, createdAt, childObjectiveIds, blockingProblemIds, status, timeSpent, completedAt
    // 필수: problemId, title
    // 옵션: description, parentId, deadline, order, completionCriteriaText, numericalTarget, currentNumericalProgress, status
    objectiveData: Omit<Objective, "id" | "createdAt" | "childObjectiveIds" | "blockingProblemIds" | "status" | "timeSpent" | "completedAt"> &
    { problemId: string; title: string; parentId?: string | null; status?: ObjectiveStatus; }
  ) => Promise<Objective | null>;
  updateObjective: (objectiveToUpdate: Objective) => Promise<Objective | null>;
  deleteObjective: (objectiveId: string) => Promise<boolean>;
  getObjectiveById: (id: string) => Objective | undefined;
  // Objective에 blockingProblemId 추가/제거 등의 액션은 updateObjective로 처리
}

export interface RuleSlice {
  rules: Rule[];
  isLoadingRules: boolean;
  fetchRules: (problemId: string) => Promise<void>;
  addRule: (
    ruleData: Omit<Rule, "id" | "createdAt"> &
    { problemId: string; title: string; }
  ) => Promise<Rule | null>;
  updateRule: (ruleToUpdate: Rule) => Promise<Rule | null>;
  deleteRule: (ruleId: string) => Promise<boolean>;
  getRuleById: (id: string) => Rule | undefined;
}

export interface TagSlice {
  tags: Tag[];
  isLoadingTags: boolean;
  fetchTags: () => Promise<void>; // 모든 태그를 가져오거나, 사용자 ID 기반 필터링 가능
  addTag: (
    tagData: Omit<Tag, "id" | "createdAt"> // name, color?
  ) => Promise<Tag | null>;
  updateTag: (tagToUpdate: Tag) => Promise<Tag | null>;
  deleteTag: (tagId: string) => Promise<boolean>;
  getTagById: (id: string) => Tag | undefined;
  // Problem에 Tag 연결/해제는 ProblemSlice의 updateProblem을 통해 Problem.tagIds를 수정하여 처리
}

export interface StarReportSlice {
  starReports: StarReport[];
  isLoadingStarReports: boolean;
  fetchStarReports: (problemId?: string) => Promise<void>;
  addStarReport: (
    reportData: Omit<StarReport, "id" | "createdAt">
  ) => Promise<StarReport | null>;
  updateStarReport: (reportToUpdate: StarReport) => Promise<StarReport | null>;
  deleteStarReport: (reportId: string) => Promise<boolean>;
  getStarReportById: (id: string) => StarReport | undefined;
  getStarReportByProblemId: (problemId: string) => StarReport | undefined;
}

// --- 새로 추가될 UI 상태 Slice 인터페이스 정의 ---
export interface UIStateSlice {
  selectedPersonaId: string | null; // 현재 선택된 페르소나의 ID
  isLoading: boolean; // 앱의 전반적인 UI 로딩 상태 (선택적)
  setSelectedPersonaId: (personaId: string | null) => void; // 선택된 페르소나 ID를 변경하는 액션
  setGlobalLoading: (isLoading: boolean) => void; // 로딩 상태 변경 액션
}


// --- 모든 Slice 인터페이스를 통합하는 전체 AppState 정의 (수정) ---
export interface AppState
  extends PersonaSlice,
    ProblemSlice,
    ObjectiveSlice,
    RuleSlice,
    TagSlice,
    StarReportSlice,
    UIStateSlice { // 새로 추가
  // 전역 상태는 여기에 추가
}