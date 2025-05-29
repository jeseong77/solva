import { getDatabase } from "@/lib/db";
import { Problem, Project, ProjectFocusStatus, ProjectStatus } from "@/types";
import type { AppState } from "@/types/storeTypes"; // 통합 AppState 타입
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

// Project 관련 파서 함수
const parseProjectFromDB = (dbItem: any): Project => ({
  id: dbItem.id,
  problemId: dbItem.problemId,
  title: dbItem.title,
  completionCriteriaText:
    dbItem.completionCriteriaText === null
      ? undefined
      : dbItem.completionCriteriaText,
  numericalTarget:
    dbItem.numericalTarget === null ? undefined : dbItem.numericalTarget,
  currentNumericalProgress:
    dbItem.currentNumericalProgress === null
      ? undefined
      : dbItem.currentNumericalProgress,
  performanceScore:
    dbItem.performanceScore === null ? undefined : dbItem.performanceScore,
  status: dbItem.status as ProjectStatus,
  isLocked: !!dbItem.isLocked,
  focused: dbItem.focused as ProjectFocusStatus,
  doItemIds: dbItem.doItemIds ? JSON.parse(dbItem.doItemIds) : [],
  dontItemIds: dbItem.dontItemIds ? JSON.parse(dbItem.dontItemIds) : [],
  taskIds: dbItem.taskIds ? JSON.parse(dbItem.taskIds) : [],
  createdAt: new Date(dbItem.createdAt),
  completedAt: dbItem.completedAt ? new Date(dbItem.completedAt) : undefined,
});

export interface ProjectSlice {
  projects: Project[];
  isLoadingProjects: boolean;
  fetchProjects: (problemId?: string) => Promise<void>;
  addProject: (
    projectData: Omit<
      Project,
      | "id"
      | "createdAt"
      | "doItemIds"
      | "dontItemIds"
      | "taskIds"
      | "currentNumericalProgress"
      | "performanceScore"
      | "status"
      | "focused"
      | "isLocked"
    > & {
      problemId: string;
      status?: ProjectStatus;
      focused?: ProjectFocusStatus;
      isLocked?: boolean;
    }
  ) => Promise<Project | null>;
  updateProject: (projectToUpdate: Project) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
  getProjectById: (id: string) => Project | undefined;
  setProjectFocus: (
    projectId: string,
    focusStatus: ProjectFocusStatus
  ) => Promise<void>;
}

export const createProjectSlice: StateCreator<
  AppState,
  [],
  [],
  ProjectSlice
> = (set, get) => ({
  projects: [],
  isLoadingProjects: false,

  fetchProjects: async (problemId?: string) => {
    set({ isLoadingProjects: true });
    try {
      const db = await getDatabase();
      let results;
      if (problemId) {
        results = await db.getAllAsync<any>(
          "SELECT * FROM Projects WHERE problemId = ? ORDER BY createdAt DESC;",
          [problemId]
        );
      } else {
        results = await db.getAllAsync<any>(
          "SELECT * FROM Projects ORDER BY createdAt DESC;"
        );
      }
      const fetchedProjects = results.map(parseProjectFromDB);
      // 기존 로직을 유지하되, problemId로 필터링된 fetch시에는 해당 problemId의 project들만 교체
      if (problemId) {
        set((state) => ({
          projects: [
            ...state.projects.filter((p) => p.problemId !== problemId),
            ...fetchedProjects,
          ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), // 최신순 정렬
          isLoadingProjects: false,
        }));
      } else {
        set({ projects: fetchedProjects, isLoadingProjects: false });
      }
      console.log(
        `[ProjectSlice] Projects fetched ${
          problemId ? `for problem ${problemId}` : "(all)"
        }:`,
        fetchedProjects.length
      );
    } catch (error) {
      console.error("[ProjectSlice] Error fetching projects:", error);
      set({ isLoadingProjects: false });
    }
  },

  addProject: async (projectData) => {
    const newProject: Project = {
      id: uuidv4(),
      problemId: projectData.problemId,
      title: projectData.title,
      completionCriteriaText: projectData.completionCriteriaText,
      numericalTarget: projectData.numericalTarget,
      currentNumericalProgress: 0,
      performanceScore: 50,
      status: projectData.status || "active",
      isLocked: projectData.isLocked || false,
      focused: projectData.focused || "unfocused",
      doItemIds: [],
      dontItemIds: [],
      taskIds: [],
      createdAt: new Date(),
      completedAt: projectData.completedAt,
    };
    const db = await getDatabase();
    try {
      await db.runAsync(
        `INSERT INTO Projects (id, problemId, title, completionCriteriaText, numericalTarget, currentNumericalProgress, performanceScore, status, isLocked, focused, doItemIds, dontItemIds, taskIds, createdAt, completedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newProject.id,
          newProject.problemId,
          newProject.title,
          newProject.completionCriteriaText === undefined
            ? null
            : newProject.completionCriteriaText,
          newProject.numericalTarget === undefined
            ? null
            : newProject.numericalTarget,
          newProject.currentNumericalProgress === undefined
            ? null
            : newProject.currentNumericalProgress,
          newProject.performanceScore === undefined
            ? null
            : newProject.performanceScore,
          newProject.status,
          newProject.isLocked ? 1 : 0,
          newProject.focused,
          JSON.stringify(newProject.doItemIds),
          JSON.stringify(newProject.dontItemIds),
          JSON.stringify(newProject.taskIds),
          newProject.createdAt ? newProject.createdAt.toISOString() : null,
          newProject.completedAt ? newProject.completedAt.toISOString() : null,
        ]
      );
      // 연결된 Problem의 projectId 필드 업데이트
      const problemToUpdate = get().problems.find(
        (p) => p.id === newProject.problemId
      );
      if (problemToUpdate) {
        const updatedProblemData: Problem = {
          ...problemToUpdate,
          projectId: newProject.id,
        };
        // ProblemSlice의 updateProblem 액션을 직접 호출 (의존성 주의)
        // 또는 Problem 업데이트 로직을 별도 유틸/서비스로 분리하거나, 여기서 직접 DB 업데이트
        await get().updateProblem(updatedProblemData); // AppState를 통해 다른 slice의 액션 접근
      }

      const currentProjects = get().projects;
      const newProjectList = [newProject, ...currentProjects].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      set({ projects: newProjectList });
      console.log(
        "[ProjectSlice] Project added and Problem updated:",
        newProject.title
      );
      return newProject;
    } catch (error) {
      console.error("[ProjectSlice] Error adding project:", error);
      return null;
    }
  },

  updateProject: async (projectToUpdate) => {
    const currentProjects = get().projects;
    const projectIndex = currentProjects.findIndex(
      (p) => p.id === projectToUpdate.id
    );
    if (projectIndex === -1) {
      console.error(
        "[ProjectSlice] Project not found for update:",
        projectToUpdate.id
      );
      return null;
    }
    // DB에 저장하기 전, 타입에 맞게 값 변환 (isLocked, Date, JSON 배열 등)
    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE Projects SET problemId = ?, title = ?, completionCriteriaText = ?, numericalTarget = ?, 
        currentNumericalProgress = ?, performanceScore = ?, status = ?, isLocked = ?, focused = ?, 
        doItemIds = ?, dontItemIds = ?, taskIds = ?, completedAt = ? 
        WHERE id = ?;`, // createdAt은 업데이트에서 제외
        [
          projectToUpdate.problemId,
          projectToUpdate.title,
          projectToUpdate.completionCriteriaText === undefined
            ? null
            : projectToUpdate.completionCriteriaText,
          projectToUpdate.numericalTarget === undefined
            ? null
            : projectToUpdate.numericalTarget,
          projectToUpdate.currentNumericalProgress === undefined
            ? null
            : projectToUpdate.currentNumericalProgress,
          projectToUpdate.performanceScore === undefined
            ? null
            : projectToUpdate.performanceScore,
          projectToUpdate.status,
          projectToUpdate.isLocked ? 1 : 0,
          projectToUpdate.focused,
          JSON.stringify(projectToUpdate.doItemIds || []),
          JSON.stringify(projectToUpdate.dontItemIds || []),
          JSON.stringify(projectToUpdate.taskIds || []),
          projectToUpdate.completedAt
            ? projectToUpdate.completedAt.toISOString()
            : null,
          projectToUpdate.id,
        ]
      );
      const updatedProjects = currentProjects.map((p) =>
        p.id === projectToUpdate.id ? projectToUpdate : p
      );
      updatedProjects.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      set({ projects: updatedProjects });
      console.log("[ProjectSlice] Project updated:", projectToUpdate.title);
      return projectToUpdate;
    } catch (error) {
      console.error("[ProjectSlice] Error updating project:", error);
      return null;
    }
  },

  deleteProject: async (projectId) => {
    const projectToDelete = get().projects.find((p) => p.id === projectId);
    if (!projectToDelete) {
      console.warn(
        "[ProjectSlice] Project to delete not found in state:",
        projectId
      );
      // DB에서 직접 삭제 시도 가능
    }

    try {
      const db = await getDatabase();
      // 연결된 Problem의 projectId를 null로 업데이트
      if (projectToDelete) {
        const problemToUpdate = get().problems.find(
          (p) => p.id === projectToDelete.problemId
        );
        if (problemToUpdate && problemToUpdate.projectId === projectId) {
          const clearedProblemData: Problem = {
            ...problemToUpdate,
            projectId: undefined,
          };
          await get().updateProblem(clearedProblemData); // ProblemSlice의 액션 호출
        }
      }
      await db.runAsync(`DELETE FROM Projects WHERE id = ?;`, [projectId]); // DB CASCADE로 Do/Dont/Tasks 삭제

      set((state) => ({
        projects: state.projects
          .filter((p) => p.id !== projectId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        // CASCADE로 DB에서 삭제되므로, 로컬 상태에서도 관련 항목들 제거
        doItems: state.doItems.filter((d) => d.projectId !== projectId),
        dontItems: state.dontItems.filter((d) => d.projectId !== projectId),
        tasks: state.tasks.filter((t) => t.projectId !== projectId),
      }));
      console.log(
        "[ProjectSlice] Project and related items deleted/cleaned:",
        projectId
      );
      return true;
    } catch (error) {
      console.error("[ProjectSlice] Error deleting project:", error);
      return false;
    }
  },

  getProjectById: (id: string) => {
    return get().projects.find((p) => p.id === id);
  },

  setProjectFocus: async (
    projectIdToFocus: string,
    newFocusStatus: ProjectFocusStatus
  ) => {
    const allCurrentProjects = get().projects;
    const allCurrentProblems = get().problems; // Problem 정보도 필요
    const targetProject = allCurrentProjects.find(
      (p) => p.id === projectIdToFocus
    );

    if (!targetProject) {
      console.error(
        "[ProjectSlice] Project to focus not found:",
        projectIdToFocus
      );
      return;
    }

    const projectsToUpdateInDB: Project[] = [];

    // 1. 새로운 superfocused 프로젝트 설정 또는 기존 superfocused 해제
    if (newFocusStatus === "superfocused") {
      // 기존 superfocused 프로젝트가 있다면 focused로 변경
      const currentSuperfocused = allCurrentProjects.find(
        (p) => p.focused === "superfocused" && p.id !== projectIdToFocus
      );
      if (currentSuperfocused) {
        projectsToUpdateInDB.push({
          ...currentSuperfocused,
          focused: "focused",
          isLocked: false,
        }); // superfocus 해제 시 isLocked도 해제 시도 (구조적 잠금은 유지될 것)
      }
      // 대상 프로젝트를 superfocused로 설정
      projectsToUpdateInDB.push({
        ...targetProject,
        focused: newFocusStatus,
        isLocked: false,
      }); // superfocused 프로젝트는 잠기지 않음
    } else {
      // 대상 프로젝트의 포커스 상태만 변경 (superfocused에서 내려오는 경우 포함)
      projectsToUpdateInDB.push({ ...targetProject, focused: newFocusStatus });
    }

    // 2. 다른 프로젝트들의 잠금 상태 조정
    const isLiftingSuperfocus =
      targetProject.focused === "superfocused" &&
      newFocusStatus !== "superfocused";

    allCurrentProjects.forEach((p) => {
      if (p.id === projectIdToFocus) return; // 대상 프로젝트는 이미 처리

      let shouldBeLocked = p.isLocked; // 현재 잠금 상태 유지 시도
      const problemOfThisProject = allCurrentProblems.find(
        (prob) => prob.id === p.problemId
      );
      const isProblemTerminal = problemOfThisProject
        ? !problemOfThisProject.childProblemIds ||
          problemOfThisProject.childProblemIds.length === 0
        : false;

      if (newFocusStatus === "superfocused") {
        // 새 superfocus 설정 시
        // 다른 모든 프로젝트는 잠금 (단, isLocked 데이터 필드를 직접 변경)
        if (!p.isLocked) {
          // 이미 다른 이유로 잠겨있지 않은 경우에만
          shouldBeLocked = true;
        }
      } else if (isLiftingSuperfocus) {
        // 기존 superfocus 해제 시
        // 종점 문제의 프로젝트이고, (구조적으로 잠겨있지 않다면) 잠금 해제
        if (isProblemTerminal) {
          shouldBeLocked = false;
        }
        // 구조적으로 잠겨야 하는 프로젝트는 isProblemTerminal이 false이므로, shouldBeLocked가 p.isLocked로 유지됨
      }

      if (shouldBeLocked !== p.isLocked) {
        // 상태 변경이 필요한 경우에만 추가
        // projectsToUpdateInDB에 이미 있는지 확인하고 추가/병합
        const existingUpdate = projectsToUpdateInDB.find(
          (upd) => upd.id === p.id
        );
        if (existingUpdate) {
          existingUpdate.isLocked = shouldBeLocked;
        } else {
          projectsToUpdateInDB.push({ ...p, isLocked: shouldBeLocked });
        }
      }
    });

    // DB 업데이트 및 상태 반영
    try {
      set({ isLoadingProjects: true });
      const db = await getDatabase();
      // SQLite는 batch update를 직접 지원하지 않으므로, 개별적으로 업데이트
      for (const projectToSave of projectsToUpdateInDB) {
        await db.runAsync(
          `UPDATE Projects SET focused = ?, isLocked = ? WHERE id = ?;`,
          [
            projectToSave.focused,
            projectToSave.isLocked ? 1 : 0,
            projectToSave.id,
          ]
        );
      }

      // 로컬 상태 일괄 업데이트
      let finalProjects = [...allCurrentProjects];
      projectsToUpdateInDB.forEach((updatedData) => {
        finalProjects = finalProjects.map((p) =>
          p.id === updatedData.id ? { ...p, ...updatedData } : p
        );
      });
      finalProjects.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      set({ projects: finalProjects, isLoadingProjects: false });

      console.log(
        `[ProjectSlice] Focus status set for ${projectIdToFocus} to ${newFocusStatus}. Other projects adjusted.`
      );
    } catch (error) {
      console.error("[ProjectSlice] Error setting project focus:", error);
      set({ isLoadingProjects: false });
    }
  },
});
