// components/objective/ObjectiveList.tsx

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
import { Feather } from "@expo/vector-icons"; // ✅ Feather 아이콘으로 변경
import ObjectiveCard from "./ObjectiveCard"

// ✅ [변경] 컴포넌트에 전달될 Props 타입 정의 업데이트
interface ObjectiveListProps {
  selectedObjectiveId: string | null;
  onSelectObjective: (objectiveId: string) => void;
  onLongPressObjective: (objectiveId: string) => void;
  onPressAddObjective: () => void;
}

// ✅ [변경] PersonaList -> ObjectiveList
export default function ObjectiveList({
  selectedObjectiveId,
  onSelectObjective,
  onLongPressObjective,
  onPressAddObjective,
}: ObjectiveListProps) {
  // ✅ [변경] 스토어에서 objectives 관련 상태와 함수를 가져옴
  const { objectives, isLoadingObjectives, fetchObjectives } = useAppStore(
    useShallow((state) => ({
      objectives: state.objectives,
      isLoadingObjectives: state.isLoadingObjectives,
      fetchObjectives: state.fetchObjectives,
    }))
  );

  useEffect(() => {
    fetchObjectives();
  }, [fetchObjectives]);

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
            onPress={onPressAddObjective}
          >
            {/* ✅ [변경] Feather 아이콘으로 변경 */}
            <Feather name="plus" size={28} color="#343a40" />
          </TouchableOpacity>
          {/* ✅ [변경] 텍스트 변경 */}
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            목표 추가
          </Text>
        </View>

        {/* ✅ [변경] isLoadingPersonas -> isLoadingObjectives, personas -> objectives */}
        {isLoadingObjectives && objectives.length === 0 && (
          <ActivityIndicator size="small" style={styles.loadingIndicator} />
        )}

        {/* ✅ [변경] objectives 배열을 순회 */}
        {objectives.map((objective) => (
          // ✅ [변경] ObjectiveCard 컴포넌트 사용 및 props 이름 변경
          <ObjectiveCard
            key={objective.id}
            objectiveId={objective.id}
            isSelected={objective.id === selectedObjectiveId}
            onPress={onSelectObjective}
            onLongPress={onLongPressObjective}
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
    paddingHorizontal: 16,
  },
  loadingIndicator: {
    marginHorizontal: 10,
    alignSelf: "center",
    height: 80,
  },
  cardContainer: {
    alignItems: "center",
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
