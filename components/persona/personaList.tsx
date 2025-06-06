import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useAppStore } from "@/store/store";
import { useShallow } from "zustand/react/shallow";
import { Ionicons } from "@expo/vector-icons";
import PersonaCard from "./personaCard";

// 컴포넌트에 전달될 Props 타입 정의
interface PersonaListProps {
  onPressPersona: (personaId: string) => void;
  onPressAddPersona: () => void;
}

export default function PersonaList({
  onPressPersona,
  onPressAddPersona,
}: PersonaListProps) {
  // 스토어에서 페르소나 목록, 로딩 상태, fetch 액션을 가져옵니다.
  const { personas, isLoadingPersonas, fetchPersonas } = useAppStore(
    useShallow((state) => ({
      personas: state.personas,
      isLoadingPersonas: state.isLoadingPersonas,
      fetchPersonas: state.fetchPersonas,
    }))
  );

  // 컴포넌트가 마운트될 때 페르소나 목록을 가져옵니다.
  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal={true} // 수평 스크롤 활성화
        showsHorizontalScrollIndicator={false} // 스크롤바 숨김
        contentContainerStyle={styles.scrollContainer}
      >
        {isLoadingPersonas && personas.length === 0 && (
          <ActivityIndicator size="small" style={styles.loadingIndicator} />
        )}

        {/* 스토어에서 가져온 personas 배열을 순회하며 PersonaCard 렌더링 */}
        {personas.map((persona) => (
          <TouchableOpacity
            key={persona.id}
            onPress={() => onPressPersona(persona.id)}
          >
            <PersonaCard personaId={persona.id} />
          </TouchableOpacity>
        ))}

        {/* 페르소나 추가 버튼 */}
        <TouchableOpacity
          style={styles.addButtonContainer}
          onPress={onPressAddPersona}
        >
          <View style={styles.addButton}>
            <Ionicons name="add" size={32} color="#007AFF" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // 이 컴포넌트가 배치될 곳의 스타일에 따라 높이 등이 결정됩니다.
    // 예: height: 100, paddingVertical: 10
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flexDirection: "row", // 항목들을 가로로 배열
    alignItems: "center", // 세로 중앙 정렬
    paddingHorizontal: 16, // 좌우 여백
  },
  loadingIndicator: {
    marginHorizontal: 10,
  },
  addButtonContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8, // 마지막 페르소나 카드와의 간격
    padding: 10, // 터치 영역 확보
  },
  addButton: {
    width: 48, // PersonaCard의 아바타와 유사한 크기
    height: 48,
    borderRadius: 24, // 원형
    backgroundColor: "#e9ecef", // 약간의 배경색
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderStyle: "dashed", // 점선 테두리
  },
});
