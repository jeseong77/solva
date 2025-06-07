import PersonaList from "@/components/persona/personaList";
import { useAppStore } from "@/store/store";
import { useRouter } from "expo-router";
import React, { useEffect, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { useShallow } from "zustand/react/shallow";
import { useFocusEffect } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  const {
    personas,
    fetchPersonas,
    selectedPersonaId,
    setSelectedPersonaId,
    deletePersona,
  } = useAppStore(
    useShallow((state) => ({
      personas: state.personas, // 길게 눌렀을 때 메뉴에 페르소나 이름을 표시하기 위해 필요
      fetchPersonas: state.fetchPersonas,
      selectedPersonaId: state.selectedPersonaId, // 현재 선택된 페르소나 ID
      setSelectedPersonaId: state.setSelectedPersonaId, // 페르소나를 선택하는 액션
      deletePersona: state.deletePersona, // 페르소나 삭제 액션
    }))
  );

  // 화면이 포커스될 때마다 페르소나 목록을 다시 가져와
  // 다른 화면에서 추가/삭제/수정된 내용이 즉시 반영되도록 합니다.
  useFocusEffect(
    useCallback(() => {
      fetchPersonas();
    }, [fetchPersonas])
  );

  // 짧게 탭했을 때: 선택된 페르소나 ID를 스토어에 저장하는 핸들러
  const handleSelectPersona = (personaId: string) => {
    // 이미 선택된 페르소나를 다시 탭하면 선택 해제 (선택적 기능)
    const newSelectedId = selectedPersonaId === personaId ? null : personaId;
    setSelectedPersonaId(newSelectedId);
    console.log("Selected Persona ID:", newSelectedId);
  };

  // 길게 눌렀을 때: 컨텍스트 메뉴(Alert)를 표시하는 핸들러
  const handleLongPressPersona = (personaId: string) => {
    const persona = personas.find((p) => p.id === personaId);
    if (!persona) return;

    Alert.alert(
      `"${persona.title}"`, // 메뉴 제목
      "어떤 작업을 하시겠습니까?", // 메뉴 설명
      [
        {
          text: "편집하기",
          onPress: () => router.push(`/persona/${personaId}`),
        },
        {
          text: "삭제하기",
          onPress: () => showDeleteConfirmation(personaId, persona.title),
          style: "destructive", // iOS에서 빨간색으로 표시
        },
        {
          text: "취소",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  // 삭제 최종 확인 Alert
  const showDeleteConfirmation = (personaId: string, title: string) => {
    Alert.alert(
      `"${title}" 페르소나 삭제`,
      "이 페르소나와 연결된 모든 문제(Problem)들이 함께 삭제됩니다. 정말 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          onPress: async () => {
            const success = await deletePersona(personaId);
            if (success) {
              Alert.alert("성공", "페르소나가 삭제되었습니다.");
            } else {
              Alert.alert("오류", "페르소나 삭제에 실패했습니다.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // '+' 버튼 클릭 시 호출될 핸들러
  const handleNavigateToCreatePersona = () => {
    router.push("/persona/create");
  };

  return (
    <SafeAreaView style={styles.container}>
      <PersonaList
        selectedPersonaId={selectedPersonaId}
        onSelectPersona={handleSelectPersona}
        onLongPressPersona={handleLongPressPersona}
        onPressAddPersona={handleNavigateToCreatePersona}
      />
      <ScrollView style={styles.mainContentContainer}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            {selectedPersonaId
              ? "선택된 페르소나의 문제 목록이 여기에 표시됩니다."
              : "페르소나를 선택하여 관련 문제들을 확인하세요."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  mainContentContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  placeholderContainer: {
    padding: 20,
    marginTop: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
  },
});
