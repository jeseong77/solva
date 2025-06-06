// src/app/(tabs)/index.tsx
import PersonaList from "@/components/persona/personaList";
import { useAppStore } from "@/store/store";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  // HomeScreen은 앱의 메인 화면으로서, PersonaList가 표시할 데이터를
  // 미리 로드하는 책임을 가집니다.
  const fetchPersonas = useAppStore((state) => state.fetchPersonas);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  // PersonaList의 카드 클릭 시 호출될 핸들러
  const handleNavigateToPersonaDetail = (personaId: string) => {
    // 동적 라우트인 /persona/[personaId]로 이동합니다.
    router.push(`/persona/${personaId}`);
  };

  // PersonaList의 '+' 버튼 클릭 시 호출될 핸들러
  const handleNavigateToCreatePersona = () => {
    // 새 페르소나 생성을 위한 정적 라우트 /persona/create로 이동합니다.
    router.push("/persona/create");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 화면 상단에 페르소나 목록 표시 */}
      <PersonaList
        onPressPersona={handleNavigateToPersonaDetail}
        onPressAddPersona={handleNavigateToCreatePersona}
      />
      {/* ScrollView는 페르소나에 따라 선택된 ProblemList 등을 보여줄 메인 컨텐츠 영역 */}
      <ScrollView style={styles.mainContentContainer}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            Select a persona to see related problems.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa", // 전체 배경색
  },
  mainContentContainer: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    minHeight: 200, // 내용이 없을 때도 최소 높이 유지
  },
  placeholderText: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
  },
});
