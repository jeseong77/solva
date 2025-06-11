// src/types/storeTypes.ts

import {
  Persona,
  Problem,
  ProblemStatus,
  Priority,
  WeeklyProblem, // 새로 추가된 타입 임포트
  ThreadItem, // 누락된 타입 임포트
  BaseThreadItem,
  BottleneckThreadItem,
  TaskThreadItem,
  ActionThreadItem,
  SessionThreadItem,
  Result,
  StarReport,
  Tag,
  ThreadItemType,
  ActiveSession,
} from "@/types";

// --- 각 Slice 가 가질 상태와 액션들에 대한 인터페이스 정의 ---

export interface PersonaSlice {
  personas: Persona[];
  isLoadingPersonas: boolean;
  fetchPersonas: () => Promise<void>;
  addPersona: (
    personaData: Omit<Persona, "id" | "createdAt" | "problemIds" | "order"> & {
      order?: number;
    }
  ) => Promise<Persona | null>;
  updatePersona: (personaToUpdate: Persona) => Promise<Persona | null>;
  deletePersona: (personaId: string) => Promise<boolean>;
  getPersonaById: (id: string) => Persona | undefined;
}

export interface ProblemSlice {
  problems: Problem[];
  isLoadingProblems: boolean;
  fetchProblems: (personaId?: string) => Promise<void>;
  addProblem: (
    problemData: Omit<
      Problem,
      | "id"
      | "createdAt"
      | "childThreadIds"
      | "timeSpent"
      | "status"
      | "priority"
      | "starReportId"
      | "resolvedAt"
      | "archivedAt"
    > & {
      status?: ProblemStatus;
      priority?: Priority;
    }
  ) => Promise<Problem | null>;
  updateProblem: (problemToUpdate: Problem) => Promise<Problem | null>;
  deleteProblem: (problemId: string) => Promise<boolean>;
  getProblemById: (id: string) => Problem | undefined;
}

/**
 * @description 주간 문제(WeeklyProblem) 상태 관리를 위한 슬라이스
 */
export interface WeeklyProblemSlice {
  weeklyProblems: WeeklyProblem[];
  isLoadingWeeklyProblems: boolean;
  fetchWeeklyProblems: (options: {
    personaId?: string;
    weekIdentifier?: string;
  }) => Promise<void>;
  addWeeklyProblem: (
    weeklyProblemData: Omit<WeeklyProblem, "id" | "createdAt">
  ) => Promise<WeeklyProblem | null>;
  updateWeeklyProblem: (
    weeklyProblemToUpdate: WeeklyProblem
  ) => Promise<WeeklyProblem | null>;
  deleteWeeklyProblem: (weeklyProblemId: string) => Promise<boolean>;
  getWeeklyProblemById: (id: string) => WeeklyProblem | undefined;
}

export interface ThreadSlice {
  threadItems: ThreadItem[];
  isLoadingThreads: boolean;
  fetchThreads: (options: {
    problemId: string;
    parentId?: string | null;
  }) => Promise<void>;
  addThreadItem: (
    itemData: Omit<
      BaseThreadItem,
      "id" | "createdAt" | "childThreadIds" | "resultIds"
    > &
      // 각 하위 타입의 고유한 필드들을 옵셔널하게 추가
      Partial<Pick<BottleneckThreadItem, "isResolved">> &
      Partial<Pick<TaskThreadItem, "isCompleted">> &
      Partial<
        Pick<
          ActionThreadItem,
          "status" | "timeSpent" | "deadline" | "completedAt"
        >
      > &
      Partial<Pick<SessionThreadItem, "timeSpent" | "startTime">>
  ) => Promise<ThreadItem | null>;
  updateThreadItem: (itemToUpdate: ThreadItem) => Promise<ThreadItem | null>;
  deleteThreadItem: (itemId: string) => Promise<boolean>;
  getThreadItemById: (id: string) => ThreadItem | undefined;
  getThreadItemByType: <T extends ThreadItemType>(options: {
    problemId: string;
    type: T;
  }) => (ThreadItem & { type: T })[];
}

export interface ResultSlice {
  results: Result[];
  isLoadingResults: boolean;
  fetchResults: (parentThreadId: string) => Promise<void>;
  addResult: (
    resultData: Omit<Result, "id" | "createdAt">
  ) => Promise<Result | null>;
  updateResult: (resultToUpdate: Result) => Promise<Result | null>;
  deleteResult: (resultId: string) => Promise<boolean>;
  getResultById: (id: string) => Result | undefined;
}

export interface TagSlice {
  tags: Tag[];
  isLoadingTags: boolean;
  fetchTags: () => Promise<void>;
  addTag: (tagData: Omit<Tag, "id">) => Promise<Tag | null>;
  updateTag: (tagToUpdate: Tag) => Promise<Tag | null>;
  deleteTag: (tagId: string) => Promise<boolean>;
  getTagById: (id: string) => Tag | undefined;
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
  activeSession: ActiveSession | null;
  setSelectedPersonaId: (personaId: string | null) => void; // 선택된 페르소나 ID를 변경하는 액션
  setGlobalLoading: (isLoading: boolean) => void; // 로딩 상태 변경 액션
  startSession: (threadId: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => void;
}

// --- 모든 Slice 인터페이스를 통합하는 전체 AppState 정의 ---
export interface AppState
  extends PersonaSlice,
    ProblemSlice,
    WeeklyProblemSlice, // 새로 추가된 슬라이스
    ThreadSlice,
    ResultSlice,
    TagSlice,
    UIStateSlice,
    StarReportSlice {
  // UI 상태 등을 위한 별도의 Slice 추가 가능
  // extends UIStateSlice
}
