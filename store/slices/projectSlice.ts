import { getDatabase } from "@/lib/db";
import { Project, ProjectStatus } from "@/types"; // Rule, Task 추가
import type {
  AppState,
  ProjectSlice as ProjectSliceInterface,
} from "@/types/storeTypes";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { StateCreator } from "zustand";

const parseProjectFromDB = (dbItem: any): Project => ({
  id: dbItem.id,
  objectiveId: dbItem.objectiveId,
  title: dbItem.title,
  completionCriteriaText:
    dbItem.completionCriteriaText === null
      ? undefined
      : dbItem.completionCriteriaText,
  numericalTarget:
    dbItem.numericalTarget === null ? undefined : dbItem.numericalTarget,
  currentNumericalProgress:
    dbItem.currentNumericalProgress === null
      ? 0
      : dbItem.currentNumericalProgress,
  performanceScore:
    dbItem.performanceScore === null ? 50 : dbItem.performanceScore,
  status: dbItem.status as ProjectStatus,
  isLocked: !!dbItem.isLocked,
  ruleIds: dbItem.ruleIds ? JSON.parse(dbItem.ruleIds) : [],
  taskIds: dbItem.taskIds ? JSON.parse(dbItem.taskIds) : [],
  timeSpent: dbItem.timeSpent || 0,
  createdAt: new Date(dbItem.createdAt),
  completedAt: dbItem.completedAt ? new Date(dbItem.completedAt) : undefined,
});

export const createProjectSlice: StateCreator<
  AppState,
  [],
  [],
  ProjectSliceInterface
> = (set, get) => ({
  projects: [],
  isLoadingProjects: false,

  fetchProjects: async (objectiveId?: string) => {
    set({ isLoadingProjects: true });
    try {
      const db = await getDatabase();
      let results;
      const params: string[] = [];
      let query = "SELECT * FROM Projects";

      if (objectiveId) {
        query += " WHERE objectiveId = ?";
        params.push(objectiveId);
      }
      query += " ORDER BY createdAt DESC;";
      results = await db.getAllAsync<any>(query, params);
      const fetchedProjects = results.map(parseProjectFromDB);

      if (objectiveId) {
        set((state) => ({
          projects: [
            ...state.projects.filter((p) => p.objectiveId !== objectiveId),
            ...fetchedProjects,
          ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
          isLoadingProjects: false,
        }));
      } else {
        set({ projects: fetchedProjects, isLoadingProjects: false });
      }
      // console.log(`[ProjectSlice] Projects fetched ${objectiveId ? `for objective ${objectiveId}` : '(all)'}:`, fetchedProjects.length);
    } catch (error) {
      console.error("[ProjectSlice] Error fetching projects:", error);
      set({ isLoadingProjects: false });
    }
  },

  addProject: async (projectData) => {
    // projectData 타입은 storeTypes.ts의 ProjectSlice.addProject 시그니처를 따름
    // Omit<Project, "id" | "createdAt" | "ruleIds" | "taskIds" | "currentNumericalProgress" | "performanceScore" | "status" | "isLocked" | "timeSpent" | "completedAt" | "focused">
    // & { objectiveId: string; status?: ProjectStatus; isLocked?: boolean; }
    // "focused"는 Project 타입에서 제거되었으므로 Omit에서도 제거됨.

    const newProject: Project = {
      id: uuidv4(),
      objectiveId: projectData.objectiveId,
      title: projectData.title,
      completionCriteriaText: projectData.completionCriteriaText,
      numericalTarget: projectData.numericalTarget,
      currentNumericalProgress: 0,
      performanceScore: 50,
      status: projectData.status || "active", // Omit되었지만 &{} 로 옵셔널하게 받음, 기본값 설정
      isLocked: projectData.isLocked || false, // Omit되었지만 &{} 로 옵셔널하게 받음, 기본값 설정
      ruleIds: [],
      taskIds: [],
      timeSpent: 0,
      createdAt: new Date(),
      completedAt: undefined,
    };
    const db = await getDatabase();
    try {
      // Projects 테이블 스키마: id, objectiveId, title, completionCriteriaText, numericalTarget, currentNumericalProgress, performanceScore, status, isLocked, ruleIds, taskIds, timeSpent, createdAt, completedAt
      // 총 14개 컬럼 (focused 제거됨)
      await db.runAsync(
        `INSERT INTO Projects (id, objectiveId, title, completionCriteriaText, numericalTarget, currentNumericalProgress, performanceScore, status, isLocked, ruleIds, taskIds, timeSpent, createdAt, completedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, // ? 14개
        [
          newProject.id, // 1. string
          newProject.objectiveId, // 2. string
          newProject.title, // 3. string
          newProject.completionCriteriaText === undefined
            ? null
            : newProject.completionCriteriaText, // 4. string | null
          newProject.numericalTarget === undefined
            ? null
            : newProject.numericalTarget, // 5. number | null
          newProject.currentNumericalProgress!, // 6. number (0)
          newProject.performanceScore!, // 7. number (50)
          newProject.status, // 8. string (ProjectStatus)
          newProject.isLocked ? 1 : 0, // 9. number (0 or 1)
          JSON.stringify(newProject.ruleIds), // 10. string ('[]')
          JSON.stringify(newProject.taskIds), // 11. string ('[]')
          newProject.timeSpent, // 12. number (0)
          newProject.createdAt.toISOString(), // 13. string
          newProject.completedAt ? newProject.completedAt.toISOString() : null, // 14. string | null
        ]
      );

      // 연결된 Objective의 fulfillingProjectId 필드 업데이트
      // ObjectiveSlice의 updateObjective를 사용하기 위해 AppState를 통해 접근
      const objectiveToLink = get().getObjectiveById(newProject.objectiveId);
      if (objectiveToLink) {
        await get().updateObjective({
          ...objectiveToLink,
          fulfillingProjectId: newProject.id,
        });
      } else {
        console.warn(
          `[ProjectSlice] Objective ${newProject.objectiveId} not found to link project ${newProject.id}`
        );
      }

      const currentProjects = get().projects;
      const newProjectList = [newProject, ...currentProjects].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      set({ projects: newProjectList });
      console.log(
        "[ProjectSlice] Project added and Objective updated:",
        newProject.title
      );
      return newProject;
    } catch (error) {
      console.error("[ProjectSlice] Error adding project:", error);
      return null;
    }
  },

  updateProject: async (projectToUpdate) => {
    // projectToUpdate는 Project 타입 전체 객체
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
    // 전달받은 projectToUpdate가 DB에 저장될 최종 모습이라고 가정
    try {
      const db = await getDatabase();
      await db.runAsync(
        // focused 컬럼 제거, createdAt은 업데이트하지 않음
        `UPDATE Projects SET objectiveId = ?, title = ?, completionCriteriaText = ?, numericalTarget = ?, 
        currentNumericalProgress = ?, performanceScore = ?, status = ?, isLocked = ?, 
        ruleIds = ?, taskIds = ?, timeSpent = ?, completedAt = ? 
        WHERE id = ?;`,
        [
          projectToUpdate.objectiveId,
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
          JSON.stringify(projectToUpdate.ruleIds || []),
          JSON.stringify(projectToUpdate.taskIds || []),
          projectToUpdate.timeSpent,
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

    try {
      const db = await getDatabase();
      // 연결된 Objective의 fulfillingProjectId를 null로 업데이트
      if (projectToDelete) {
        const objectiveToUnlink = get().getObjectiveById(
          projectToDelete.objectiveId
        );
        if (
          objectiveToUnlink &&
          objectiveToUnlink.fulfillingProjectId === projectId
        ) {
          await get().updateObjective({
            ...objectiveToUnlink,
            fulfillingProjectId: null,
          });
        }
      }
      await db.runAsync(`DELETE FROM Projects WHERE id = ?;`, [projectId]); // DB CASCADE로 Rule, Task 삭제

      set((state) => ({
        projects: state.projects
          .filter((p) => p.id !== projectId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        // Project 삭제 시 관련된 Rule과 Task도 로컬 상태에서 제거
        rules: state.rules.filter((r) => r.projectId !== projectId),
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
  // setProjectLockStatusByFeature, updateProjectTimeSpent 등 특수 목적 함수는 제거.
  // 이러한 변경은 updateProject를 통해 처리됩니다.
});
