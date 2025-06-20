// store/slices/userSlice.ts

import { StateCreator } from "zustand";
import { User, UserLink } from "@/types"; // Make sure UserLink is imported if needed
import type { AppState, UserSlice } from "@/types/storeTypes";
import "react-native-get-random-values";
import { db } from "@/lib/db";
import { users, userLinks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const LOCAL_USER_ID = "local-user";


export const createUserSlice: StateCreator<AppState, [], [], UserSlice> = (
  set,
  get
) => ({
  user: null,
  isLoadingUser: true,

  fetchUser: async () => {
    set({ isLoadingUser: true });
    try {
      const result = await db.query.users.findFirst({
        where: eq(users.id, LOCAL_USER_ID),
        with: {
          links: true,
        },
      });

      if (result) {
        // The 'result' from the relational query now perfectly matches our app's 'User' type
        set({ user: result, isLoadingUser: false });
        console.log("[UserSlice] User fetched:", result.displayName);
      } else {
        console.log("[UserSlice] No user found, creating a default user...");
        const newUser = await get().createUser({ displayName: "My Profile" });
        set({ user: newUser, isLoadingUser: false });
      }
    } catch (error) {
      console.error("[UserSlice] Error fetching user:", error);
      set({ isLoadingUser: false });
    }
  },

  createUser: async (userData) => {
    const now = new Date();
    // The newUser object matches our application's User interface
    const newUser: User = {
      id: LOCAL_USER_ID,
      displayName: userData.displayName,
      bio: userData.bio ?? null,
      introduction: userData.introduction ?? null,
      avatarImageUri: userData.avatarImageUri ?? null,
      coverImageUri: userData.coverImageUri ?? null,
      username: null,
      email: null,
      location: null,
      links: [], // Includes the links array for app state consistency
      createdAt: now,
      updatedAt: now,
    };

    try {
      // FIX: Separate the database fields from the relational fields before inserting.
      const { links, ...dbUserData } = newUser;
      await db.insert(users).values(dbUserData);

      console.log("[UserSlice] Default user created successfully.");
      return newUser;
    } catch (error) {
      console.error("[UserSlice] Error creating user:", error);
      return null;
    }
  },

  updateUser: async (userToUpdate) => {
    const now = new Date();
    const updatedUser: User = { ...userToUpdate, updatedAt: now };

    try {
      await db.transaction(async (tx) => {
        // FIX: Separate the database fields from the relational 'links' field.
        const { links, ...dbUserData } = updatedUser;

        // 1. Update the user's main profile info in the `users` table
        await tx
          .update(users)
          .set(dbUserData)
          .where(eq(users.id, updatedUser.id));

        // 2. Delete all old links for this user
        await tx.delete(userLinks).where(eq(userLinks.userId, updatedUser.id));

        // 3. Insert the new, updated list of links (if any)
        if (links && links.length > 0) {
          // FIX: Add explicit type to 'link' parameter
          await tx.insert(userLinks).values(
            links.map((link: UserLink) => ({
              ...link,
              userId: updatedUser.id,
            }))
          );
        }
      });

      set({ user: updatedUser });
      console.log("[UserSlice] User updated:", updatedUser.displayName);
      return updatedUser;
    } catch (error) {
      console.error("[UserSlice] Error updating user:", error);
      return null;
    }
  },
});
