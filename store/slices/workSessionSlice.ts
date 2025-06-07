import { StateCreator } from 'zustand';
import { WorkSession, Objective } from '@/types';
import type { AppState, WorkSessionSlice as WorkSessionSliceInterface } from '@/types/storeTypes';
import { getDatabase } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

// WorkSession 관련 파서 함수
const parseWorkSessionFromDB = (dbItem: any): WorkSession => ({
  id: dbItem.id,
  objectiveId: dbItem.objectiveId,
  startTime: new Date(dbItem.startTime),
  duration: dbItem.duration,
  notes: dbItem.notes === null ? undefined : dbItem.notes,
  isPomodoro: !!dbItem.isPomodoro,
  createdAt: new Date(dbItem.createdAt),
});

export const createWorkSessionSlice: StateCreator<AppState, [], [], WorkSessionSliceInterface> = (set, get) => ({
  workSessions: [],
  isLoadingWorkSessions: false,

  fetchWorkSessions: async (objectiveId: string) => {
    set({ isLoadingWorkSessions: true });
    try {
      const db = await getDatabase();
      const results = await db.getAllAsync<any>(
        "SELECT * FROM WorkSessions WHERE objectiveId = ? ORDER BY startTime DESC;",
        [objectiveId]
      );
      const fetchedSessions = results.map(parseWorkSessionFromDB);

      // 특정 objectiveId의 세션들만 교체
      set(state => ({
        workSessions: [
          ...state.workSessions.filter(ws => ws.objectiveId !== objectiveId),
          ...fetchedSessions
        ].sort((a,b) => b.startTime.getTime() - a.startTime.getTime()), // 시작 시간 최신순 정렬
        isLoadingWorkSessions: false
      }));
      console.log(`[WorkSessionSlice] Sessions fetched for objective ${objectiveId}:`, fetchedSessions.length);
    } catch (error) {
      console.error("[WorkSessionSlice] Error fetching work sessions:", error);
      set({ isLoadingWorkSessions: false });
    }
  },

  addWorkSession: async (sessionData) => {
    const newSession: WorkSession = {
      id: uuidv4(),
      objectiveId: sessionData.objectiveId,
      startTime: sessionData.startTime,
      duration: sessionData.duration,
      notes: sessionData.notes,
      isPomodoro: sessionData.isPomodoro,
      createdAt: new Date(),
    };

    const db = await getDatabase();
    try {
      await db.runAsync(
        `INSERT INTO WorkSessions (id, objectiveId, startTime, duration, notes, isPomodoro, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          newSession.id,
          newSession.objectiveId,
          newSession.startTime.toISOString(),
          newSession.duration,
          newSession.notes === undefined ? null : newSession.notes,
          newSession.isPomodoro ? 1 : 0,
          newSession.createdAt.toISOString(),
        ]
      );
      console.log("[WorkSessionSlice] New work session inserted into DB:", newSession.id);

      // 연결된 Objective의 workSessionIds와 timeSpent 업데이트
      const parentObjective = get().getObjectiveById(newSession.objectiveId);
      if (parentObjective) {
        const updatedParentObjective: Objective = {
          ...parentObjective,
          workSessionIds: [...parentObjective.workSessionIds, newSession.id],
          timeSpent: (parentObjective.timeSpent || 0) + newSession.duration,
        };
        await get().updateObjective(updatedParentObjective); // ObjectiveSlice의 액션 호출
        console.log(`[WorkSessionSlice] Parent objective ${parentObjective.id} updated with new session.`);
      } else {
        console.warn(`[WorkSessionSlice] Parent objective with ID ${newSession.objectiveId} not found for session linkage.`);
      }
      
      const currentSessions = get().workSessions;
      const newSessionList = [...currentSessions, newSession].sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
      set({ workSessions: newSessionList });
      console.log("[WorkSessionSlice] Work session added to store:", newSession.id);
      return newSession;
    } catch (error) {
      console.error("[WorkSessionSlice] Error adding work session:", error);
      return null;
    }
  },

  updateWorkSession: async (sessionToUpdate) => {
    const currentSessions = get().workSessions;
    const sessionIndex = currentSessions.findIndex(s => s.id === sessionToUpdate.id);
    if (sessionIndex === -1) {
      console.error("[WorkSessionSlice] Work session not found for update:", sessionToUpdate.id);
      return null;
    }
    const oldSession = currentSessions[sessionIndex];
    const finalSessionToUpdate = { ...oldSession, ...sessionToUpdate };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE WorkSessions SET startTime = ?, duration = ?, notes = ?, isPomodoro = ?
         WHERE id = ?;`, // objectiveId, createdAt 등은 보통 업데이트하지 않음
        [
          finalSessionToUpdate.startTime.toISOString(),
          finalSessionToUpdate.duration,
          finalSessionToUpdate.notes === undefined ? null : finalSessionToUpdate.notes,
          finalSessionToUpdate.isPomodoro ? 1 : 0,
          finalSessionToUpdate.id,
        ]
      );

      // timeSpent 롤업 로직: 기존 duration을 빼고 새 duration을 더함
      const parentObjective = get().getObjectiveById(finalSessionToUpdate.objectiveId);
      if (parentObjective) {
        const durationChange = finalSessionToUpdate.duration - oldSession.duration;
        const updatedParentObjective: Objective = {
          ...parentObjective,
          timeSpent: (parentObjective.timeSpent || 0) + durationChange,
        };
        await get().updateObjective(updatedParentObjective);
      }
      
      const updatedSessions = currentSessions.map(s => s.id === finalSessionToUpdate.id ? finalSessionToUpdate : s);
      updatedSessions.sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
      set({ workSessions: updatedSessions });
      console.log("[WorkSessionSlice] Work session updated:", finalSessionToUpdate.id);
      return finalSessionToUpdate;
    } catch (error) {
      console.error("[WorkSessionSlice] Error updating work session:", error);
      return null;
    }
  },

  deleteWorkSession: async (sessionId) => {
    const sessionToDelete = get().workSessions.find(s => s.id === sessionId);
    if (!sessionToDelete) return false;

    const db = await getDatabase();
    try {
      await db.runAsync(`DELETE FROM WorkSessions WHERE id = ?;`, [sessionId]);
      console.log("[WorkSessionSlice] Work session deleted from DB:", sessionId);

      // 연결된 Objective의 workSessionIds와 timeSpent 업데이트
      const parentObjective = get().getObjectiveById(sessionToDelete.objectiveId);
      if (parentObjective) {
        const updatedParentObjective: Objective = {
          ...parentObjective,
          workSessionIds: parentObjective.workSessionIds.filter(id => id !== sessionId),
          timeSpent: (parentObjective.timeSpent || 0) - sessionToDelete.duration,
        };
        await get().updateObjective(updatedParentObjective);
        console.log(`[WorkSessionSlice] Parent objective ${parentObjective.id} updated after session deletion.`);
      }
      
      set(state => ({
        workSessions: state.workSessions.filter(s => s.id !== sessionId)
            .sort((a,b) => b.startTime.getTime() - a.startTime.getTime())
      }));
      console.log("[WorkSessionSlice] Work session removed from store:", sessionId);
      return true;
    } catch (error) {
      console.error("[WorkSessionSlice] Error deleting work session:", error);
      return false;
    }
  },

  getWorkSessionById: (id: string) => {
    return get().workSessions.find(ws => ws.id === id);
  },
});