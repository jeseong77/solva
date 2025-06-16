// src/types/storeTypes.ts

import {
  ActionThreadItem,
  ActiveSession,
  BaseThreadItem,
  BottleneckThreadItem,
  Persona,
  Priority,
  Problem,
  ProblemStatus,
  Result,
  SessionThreadItem,
  StarReport,
  Tag,
  TaskThreadItem,
  ThreadItem,
  ThreadItemType,
  Todo,
  User,
  WeeklyProblem,
} from "@/types";

// --- 각 Slice 가 가질 상태와 액션들에 대한 인터페이스 정의 ---

/**
 * ✅ [추가] 사용자 프로필 상태 관리를 위한 슬라이스
 */
export interface UserSlice {
  user: User | null;
  isLoadingUser: boolean;
  fetchUser: () => Promise<void>;
  // createUser의 인자 타입을 명시적으로 정의
  createUser: (userData: {
    displayName: string;
    bio?: string;
    introduction?: string;
    avatarImageUri?: string;
    coverImageUri?: string;
  }) => Promise<User | null>;
  updateUser: (userToUpdate: User) => Promise<User | null>;
}

export interface PersonaSlice {
  personas: Persona[];
  isLoadingPersonas: boolean;
  fetchPersonas: () => Promise<void>;
  addPersona: (
    // ✅ Omit에 userId 추가
    personaData: Omit<
      Persona,
      "id" | "userId" | "createdAt" | "problemIds" | "order"
    > & {
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
/**
 * ✅ [추가] 가장 최근 세션 정보를 담는 객체 타입
 */
export interface RecentSessionInfo {
  session: SessionThreadItem;
  parentThread: ThreadItem | undefined;
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
  /**
   * ✅ [추가] 가장 최근에 완료된 세션과 그 부모 스레드 정보를 가져옵니다.
   */
  getMostRecentSession: () => RecentSessionInfo | null;
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

export interface TodoSlice {
  todos: Todo[];
  isLoadingTodos: boolean;
  fetchTodos: () => Promise<void>;
  addTodo: (todoData: { content: string }) => Promise<Todo | null>;
  updateTodo: (todoToUpdate: Todo) => Promise<Todo | null>;
  deleteTodo: (todoId: string) => Promise<boolean>;
  getTodoById: (id: string) => Todo | undefined;
}

// --- 모든 Slice 인터페이스를 통합하는 전체 AppState 정의 ---
export interface AppState
  extends UserSlice, // ✅ UserSlice 추가
    PersonaSlice,
    ProblemSlice,
    WeeklyProblemSlice,
    ThreadSlice,
    ResultSlice,
    TodoSlice,
    TagSlice,
    UIStateSlice,
    StarReportSlice {
  // ...
}
