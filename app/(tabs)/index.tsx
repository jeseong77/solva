import ProblemList from "@/components/ProblemList";
import PersonaList from "@/components/persona/personaList";
import React, { useEffect } from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAppStore } from "@/store/store";
import { useShallow } from "zustand/react/shallow";

export default function HomeScreen() {
  const router = useRouter();

  // PersonaList를 위해 필요한 상태와 액션만 가져옵니다.
  const { fetchPersonas } = useAppStore(
    useShallow((state) => ({
      fetchPersonas: state.fetchPersonas,
    }))
  );

  // 화면이 로드될 때 페르소나 데이터를 가져옵니다.
  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  // PersonaCard 클릭 시 호출될 핸들러
  const handleNavigateToPersonaDetail = (personaId: string) => {
    console.log("Navigating to persona:", personaId);
    // 동적 라우트 경로로 personaId를 전달하여 이동합니다.
    router.push(`/persona/${personaId}`);
  };

  // 페르소나 추가(+) 버튼 클릭 시 호출될 핸들러
  const handleNavigateToCreatePersona = () => {
    console.log("Navigating to create new persona screen...");
    // 새 페르소나 생성을 위한 별도의 라우트로 이동합니다.
    // 이 라우트를 위해 `app/persona/create.tsx` 파일 생성이 필요할 수 있습니다.
    router.push("/persona/create");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* PersonaList에 핸들러 함수들을 props로 전달합니다. */}
        <PersonaList
          onPressPersona={handleNavigateToPersonaDetail}
          onPressAddPersona={handleNavigateToCreatePersona}
        />
        {/* ProblemList는 요청하신 대로 props 없이 그대로 둡니다. */}
        <ProblemList />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
});
