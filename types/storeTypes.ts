// src/types/storeTypes.ts

import {
  ActionStatus,
  ActionThreadItem,
  ActiveSession,
  BaseThreadItem,
  BottleneckThreadItem,
  Gap,
  Objective,
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

export interface ObjectiveSlice {
  objectives: Objective[];
  isLoadingObjectives: boolean;
  fetchObjectives: () => Promise<void>;
  addObjective: (
    objectiveData: Omit<Objective, "id" | "userId" | "createdAt">
  ) => Promise<Objective | null>;
  updateObjective: (objectiveToUpdate: Objective) => Promise<Objective | null>;
  deleteObjective: (objectiveId: string) => Promise<boolean>;
  getObjectiveById: (id: string) => Objective | undefined;
}

export interface GapSlice {
  gaps: Gap[];
  isLoadingGaps: boolean;
  fetchGaps: (objectiveId: string) => Promise<void>;
  addGap: (gapData: Omit<Gap, "id" | "createdAt">) => Promise<Gap | null>;
  updateGap: (gapToUpdate: Gap) => Promise<Gap | null>;
  deleteGap: (gapId: string) => Promise<boolean>;
  getGapById: (id: string) => Gap | undefined;
}

// This type is correct and already includes the optional imageUrls property. No changes needed here.
type AddProblemData = Pick<Problem, "title" | "objectiveId"> & {
  gapId?: string | null;
  description?: string;
  status?: ProblemStatus;
  priority?: Priority;
  urgency?: number;
  importance?: number;
  tags?: string[];
  imageUrls?: string[] | null;
};

export interface ProblemSlice {
  problems: Problem[];
  isLoadingProblems: boolean;
  fetchProblems: (objectiveId?: string) => Promise<void>;
  addProblem: (problemData: AddProblemData) => Promise<Problem | null>;
  updateProblem: (problemToUpdate: Problem) => Promise<Problem | null>;
  deleteProblem: (problemId: string) => Promise<boolean>;
  getProblemById: (id: string) => Problem | undefined;
}

export interface WeeklyProblemSlice {
  weeklyProblems: WeeklyProblem[];
  isLoadingWeeklyProblems: boolean;
  fetchWeeklyProblems: (options: {
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
// FIX: Add all possible optional fields for different thread types.
type AddThreadItemData = {
  problemId: string;
  parentId: string | null;
  type: ThreadItemType;
  content: string;
  isImportant?: boolean;
  authorId?: string | null;
  imageUrls?: string[] | null;
  timeSpent?: number | null;
  startTime?: Date | null;
  deadline?: Date | null;
  status?: ActionStatus | null;
  isCompleted?: boolean | null;
  isResolved?: boolean | null;
  completedAt?: Date | null;
};

export interface ThreadSlice {
  threadItems: ThreadItem[];
  isLoadingThreads: boolean;
  fetchThreads: (options: {
    problemId: string;
    parentId?: string | null;
  }) => Promise<void>;
  // FIX: Use the new, cleaner AddThreadItemData type for the function signature.
  addThreadItem: (itemData: AddThreadItemData) => Promise<ThreadItem | null>;
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
  selectedObjectiveId: string | null;
  isLoading: boolean;
  activeSession: ActiveSession | null;
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

export interface AppState
  extends UserSlice,
    ObjectiveSlice,
    GapSlice,
    ProblemSlice,
    WeeklyProblemSlice,
    ThreadSlice,
    ResultSlice,
    TodoSlice,
    TagSlice,
    UIStateSlice,
    StarReportSlice {}
