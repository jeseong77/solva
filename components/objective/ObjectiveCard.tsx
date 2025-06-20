// components/objective/ObjectiveCard.tsx

import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useAppStore } from "@/store/store";
import { Feather } from "@expo/vector-icons"; // ✅ Ionicons -> Feather
import { Objective } from "@/types"; // ✅ Persona -> Objective

// ✅ [변경] 컴포넌트에 전달될 Props 타입 정의 업데이트
interface ObjectiveCardProps {
  objectiveId: string;
  isSelected: boolean;
  onPress: (objectiveId: string) => void;
  onLongPress: (objectiveId: string) => void;
}

// ✅ [변경] PersonaCard -> ObjectiveCard
export default function ObjectiveCard({
  objectiveId,
  isSelected,
  onPress,
  onLongPress,
}: ObjectiveCardProps) {
  // ✅ [변경] state.objectives 배열에서 해당 objective를 찾습니다.
  const objective = useAppStore((state) =>
    state.objectives.find((o) => o.id === objectiveId)
  );

  // 데이터가 로드되기 전이나, ID에 해당하는 objective가 없을 경우
  if (!objective) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.avatarContainer} />
      </View>
    );
  }

  // 선택되었을 때 적용될 동적 스타일
  const avatarContainerStyle = [
    styles.avatarContainer,
    isSelected && styles.selectedAvatarContainer,
  ];

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => onPress(objective.id)}
      onLongPress={() => onLongPress(objective.id)}
      delayLongPress={200}
    >
      <View style={avatarContainerStyle}>
        {/* ✅ [변경] persona -> objective */}
        {objective.avatarImageUri ? (
          <Image
            source={{ uri: objective.avatarImageUri }}
            style={styles.avatarImage}
          />
        ) : objective.icon ? (
          // ✅ [변경] Ionicons -> Feather
          <Feather name={objective.icon as any} size={28} color={"#495057"} />
        ) : (
          <View
            style={[
              styles.avatar,
              { backgroundColor: objective.color || "#cccccc" },
            ]}
          />
        )}
      </View>

      <Text
        style={[styles.title, isSelected && styles.selectedTitle]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {objective.title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    alignItems: "center",
    width: 72,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f0f2f5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2, // 기본 테두리 두께 통일
    borderColor: "transparent",
    overflow: "hidden",
    marginBottom: 6,
  },
  selectedAvatarContainer: {
    borderColor: "#40c057", // ✅ 녹색 계열로 변경
  },
  avatar: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
  },
  title: {
    fontSize: 12,
    color: "#555555",
    textAlign: "center",
  },
  selectedTitle: {
    color: "#40c057", // ✅ 녹색 계열로 변경
    fontWeight: "bold",
  },
});
