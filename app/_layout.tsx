// app/_layout.tsx
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler"; // 1. GestureHandlerRootView import
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { initDatabase } from "@/lib/db";

// SplashScreen 관련 코드는 사용자님이 제공한 버전에 없으므로 생략합니다.
// 필요시 이전 답변을 참고하여 추가할 수 있습니다.

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        await initDatabase();
        setDbInitialized(true);
        console.log("[RootLayout] Database initialized.");
      } catch (e) {
        console.warn("[RootLayout] Failed to initialize database:", e);
        setDbInitialized(true); // 임시: 오류 발생 시에도 UI는 계속 진행되도록 (개선 필요)
      }
    }

    prepareApp();
  }, []);

  if (!fontsLoaded || !dbInitialized) {
    return null; // 로딩 중에는 스플래시 화면이 보이거나 null을 반환
  }

  return (
    // 2. ThemeProvider를 GestureHandlerRootView로 감싸줍니다.
    // GestureHandlerRootView는 flex: 1 스타일을 가져야 전체 화면에서 제스처를 올바르게 처리할 수 있습니다.
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
