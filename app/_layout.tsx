// app/_layout.tsx
import { useColorScheme } from "@/hooks/useColorScheme";
import { initDatabase } from "@/lib/db";
import { useAppStore } from "@/store/store";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    // ✅ [변경] 초기 Objective를 설정하는 함수
    async function setupInitialObjective() {
      const { getState, setState } = useAppStore;

      // 1. DB에서 모든 Objective 데이터를 먼저 불러옵니다.
      await getState().fetchObjectives();

      // ✅ [변경] personas -> objectives, selectedPersonaId -> selectedObjectiveId
      const { selectedObjectiveId, objectives } = getState();

      // 2. 디바이스에 저장되어 있던 ID가 현재 DB에도 유효한지 확인합니다.
      const lastSelectedIsValid = objectives.some(
        (o) => o.id === selectedObjectiveId
      );

      if (lastSelectedIsValid) {
        // 1순위: 유효하면 아무것도 하지 않고 기존 선택을 유지합니다.
        return;
      } else if (objectives.length > 0) {
        // 2순위: 유효하지 않지만 다른 Objective가 있다면, 목록의 첫 번째를 선택합니다.
        setState({ selectedObjectiveId: objectives[0].id });
      } else {
        // 3순위: Objective가 아예 없다면, null 상태를 유지합니다.
        setState({ selectedObjectiveId: null });
      }
    }

    async function prepareApp() {
      try {
        await initDatabase();
        setDbInitialized(true);
        console.log("[RootLayout] Database initialized.");
        await useAppStore.getState().fetchUser();
        // ✅ [변경] setupInitialPersona -> setupInitialObjective
        await setupInitialObjective();
      } catch (e) {
        console.warn("[RootLayout] Failed to initialize database:", e);
        setDbInitialized(true);
      }
    }

    prepareApp();
  }, []);

  if (!fontsLoaded || !dbInitialized) {
    return null; // 로딩 중에는 스플래시 화면이 보이거나 null을 반환
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
