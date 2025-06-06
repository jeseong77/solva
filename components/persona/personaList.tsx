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

// 컴포넌트에 전달될 Props 타입 정의 업데이트
interface PersonaListProps {
  selectedPersonaId: string | null; // 현재 선택된 페르소나의 ID
  onSelectPersona: (personaId: string) => void; // 짧게 탭하여 선택하는 액션
  onLongPressPersona: (personaId: string) => void; // 길게 눌러 메뉴를 여는 액션
  onPressAddPersona: () => void;
}

export default function PersonaList({
  selectedPersonaId,
  onSelectPersona,
  onLongPressPersona,
  onPressAddPersona,
}: PersonaListProps) {
  const { personas, isLoadingPersonas, fetchPersonas } = useAppStore(
    useShallow((state) => ({
      personas: state.personas,
      isLoadingPersonas: state.isLoadingPersonas,
      fetchPersonas: state.fetchPersonas,
    }))
  );

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={onPressAddPersona}
          >
            <Ionicons name="add" size={28} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            페르소나 추가
          </Text>
        </View>

        {isLoadingPersonas && personas.length === 0 && (
          <ActivityIndicator size="small" style={styles.loadingIndicator} />
        )}

        {personas.map((persona) => (
          <PersonaCard
            key={persona.id}
            personaId={persona.id}
            isSelected={persona.id === selectedPersonaId} // 선택 여부 전달
            onPress={onSelectPersona} // 탭 핸들러 연결
            onLongPress={onLongPressPersona} // 길게 누르기 핸들러 연결
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eef0f2",
    backgroundColor: "transparent",
  },
  scrollContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16, // 전체 스크롤 뷰의 좌우 패딩
  },
  loadingIndicator: {
    marginHorizontal: 10,
    alignSelf: "center",
    height: 80, // 다른 카드들과 높이를 맞추기 위함
  },
  // '페르소나 추가' 버튼을 PersonaCard와 동일한 스타일 구조로 맞춤
  cardContainer: {
    alignItems: "center",
    marginRight: 4,
    width: 72,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f0f2f5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    color: "#555555",
    textAlign: "center",
  },
});
