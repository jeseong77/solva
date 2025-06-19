// src/types/storeTypes.ts

import {
  ActionThreadItem,
  ActiveSession,
  BaseThreadItem,
  BottleneckThreadItem,
  Objective, // ✅ Persona -> Objective
  ObjectiveType, // ✅ ObjectiveType 추가
  Gap, // ✅ Gap 추가
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

export interface UserSlice {
  user: User | null;
  isLoadingUser: boolean;
  fetchUser: () => Promise<void>;
  createUser: (userData: {
    displayName: string;
    bio?: string;
    introduction?: string;
    avatarImageUri?: string;
    coverImageUri?: string;
  }) => Promise<User | null>;
  updateUser: (userToUpdate: User) => Promise<User | null>;
}

// ✅ [변경] PersonaSlice -> ObjectiveSlice
export interface ObjectiveSlice {
  objectives: Objective[];
  isLoadingObjectives: boolean;
  fetchObjectives: () => Promise<void>;
  addObjective: (
    objectiveData: Omit<Objective, "id" | "userId" | "createdAt" | "problemIds">
  ) => Promise<Objective | null>;
  updateObjective: (objectiveToUpdate: Objective) => Promise<Objective | null>;
  deleteObjective: (objectiveId: string) => Promise<boolean>;
  getObjectiveById: (id: string) => Objective | undefined;
}

// ✅ [추가] GapSlice
export interface GapSlice {
  gaps: Gap[];
  isLoadingGaps: boolean;
  fetchGaps: (objectiveId: string) => Promise<void>;
  addGap: (
    gapData: Omit<Gap, "id" | "createdAt" | "problemIds">
  ) => Promise<Gap | null>;
  updateGap: (gapToUpdate: Gap) => Promise<Gap | null>;
  deleteGap: (gapId: string) => Promise<boolean>;
  getGapById: (id: string) => Gap | undefined;
}

export interface ProblemSlice {
  problems: Problem[];
  isLoadingProblems: boolean;
  // ✅ [변경] personaId -> objectiveId
  fetchProblems: (objectiveId?: string) => Promise<void>;
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

export interface WeeklyProblemSlice {
  weeklyProblems: WeeklyProblem[];
  isLoadingWeeklyProblems: boolean;
  fetchWeeklyProblems: (options: {
    // ✅ [변경] personaId -> objectiveId
    objectiveId?: string;
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

export interface UIStateSlice {
  // ✅ [변경] personaId -> objectiveId
  selectedObjectiveId: string | null;
  isLoading: boolean;
  activeSession: ActiveSession | null;
  // ✅ [변경] personaId -> objectiveId
  setSelectedObjectiveId: (objectiveId: string | null) => void;
  setGlobalLoading: (isLoading: boolean) => void;
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
  extends UserSlice,
    ObjectiveSlice, // ✅ PersonaSlice -> ObjectiveSlice
    GapSlice, // ✅ GapSlice 추가
    ProblemSlice,
    WeeklyProblemSlice,
    ThreadSlice,
    ResultSlice,
    TodoSlice,
    TagSlice,
    UIStateSlice,
    StarReportSlice {}
