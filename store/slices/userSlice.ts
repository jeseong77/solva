// store/userSlice.ts

import { StateCreator } from "zustand";
import { User } from "@/types";
import type { AppState, UserSlice } from "@/types/storeTypes";
import { getDatabase } from "@/lib/db";
import "react-native-get-random-values";

// MVP 단계에서는 단일 사용자를 가정하므로, 고정된 ID를 사용합니다.
const LOCAL_USER_ID = "local-user";

// DB 데이터를 앱 상태 객체(User)로 변환하는 파서
const parseUserFromDB = (dbItem: any): User | null => {
  if (!dbItem) return null;
  return {
    id: dbItem.id,
    displayName: dbItem.displayName,
    username: dbItem.username === null ? undefined : dbItem.username,
    email: dbItem.email === null ? undefined : dbItem.email,
    bio: dbItem.bio === null ? undefined : dbItem.bio,
    introduction:
      dbItem.introduction === null ? undefined : dbItem.introduction,
    avatarImageUri:
      dbItem.avatarImageUri === null ? undefined : dbItem.avatarImageUri,
    coverImageUri:
      dbItem.coverImageUri === null ? undefined : dbItem.coverImageUri,
    location: dbItem.location === null ? undefined : dbItem.location,
    links: dbItem.links ? JSON.parse(dbItem.links) : [],
    createdAt: new Date(dbItem.createdAt),
    updatedAt: new Date(dbItem.updatedAt),
  };
};

export const createUserSlice: StateCreator<AppState, [], [], UserSlice> = (
  set,
  get
) => ({
  user: null,
  isLoadingUser: true,

  /**
   * 로컬 데이터베이스에서 사용자 정보를 불러옵니다.
   * 만약 사용자가 없으면, 기본값으로 새로운 사용자를 생성합니다.
   */
  fetchUser: async () => {
    set({ isLoadingUser: true });
    try {
      const db = await getDatabase();
      const result = await db.getFirstAsync<any>(
        "SELECT * FROM Users WHERE id = ?;",
        [LOCAL_USER_ID]
      );

      if (result) {
        // 사용자가 존재하면 상태에 설정
        const fetchedUser = parseUserFromDB(result);
        set({ user: fetchedUser, isLoadingUser: false });
        console.log("[UserSlice] User fetched:", fetchedUser?.displayName);
      } else {
        // 사용자가 없으면 (앱 최초 실행), 기본 사용자를 생성
        console.log("[UserSlice] No user found, creating a default user...");
        const newUser = await get().createUser({ displayName: "My Profile" });
        set({ user: newUser, isLoadingUser: false });
      }
    } catch (error) {
      console.error("[UserSlice] Error fetching user:", error);
      set({ isLoadingUser: false });
    }
  },

  /**
   * 새로운 사용자를 생성합니다. (주로 앱 최초 실행 시 fetchUser에 의해 호출됨)
   */
  createUser: async (userData) => {
    const now = new Date();
    const newUser: User = {
      id: LOCAL_USER_ID,
      displayName: userData.displayName,
      bio: userData.bio,
      introduction: userData.introduction,
      avatarImageUri: userData.avatarImageUri,
      coverImageUri: userData.coverImageUri,
      links: [],
      createdAt: now,
      updatedAt: now,
    };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO Users (id, displayName, bio, introduction, avatarImageUri, coverImageUri, links, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newUser.id,
          newUser.displayName,
          newUser.bio ?? null,
          newUser.introduction ?? null,
          newUser.avatarImageUri ?? null,
          newUser.coverImageUri ?? null,
          JSON.stringify(newUser.links),
          newUser.createdAt.toISOString(),
          newUser.updatedAt.toISOString(),
        ]
      );
      console.log("[UserSlice] Default user created successfully.");
      return newUser;
    } catch (error) {
      console.error("[UserSlice] Error creating user:", error);
      return null;
    }
  },

  /**
   * 기존 사용자 정보를 업데이트합니다.
   */
  updateUser: async (userToUpdate) => {
    const now = new Date();
    const updatedUser: User = { ...userToUpdate, updatedAt: now };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE Users SET displayName = ?, bio = ?, introduction = ?, avatarImageUri = ?, coverImageUri = ?, links = ?, updatedAt = ?
         WHERE id = ?;`,
        [
          updatedUser.displayName,
          updatedUser.bio ?? null,
          updatedUser.introduction ?? null,
          updatedUser.avatarImageUri ?? null,
          updatedUser.coverImageUri ?? null,
          JSON.stringify(updatedUser.links || []),
          updatedUser.updatedAt.toISOString(),
          updatedUser.id,
        ]
      );

      set({ user: updatedUser });
      console.log("[UserSlice] User updated:", updatedUser.displayName);
      return updatedUser;
    } catch (error) {
      console.error("[UserSlice] Error updating user:", error);
      return null;
    }
  },
});
