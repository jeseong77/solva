import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useAppStore } from "@/store/store";
import { Ionicons } from "@expo/vector-icons";
import { Persona } from "@/types";

// 컴포넌트에 전달될 Props 타입 정의 업데이트
interface PersonaCardProps {
  personaId: string;
  isSelected: boolean; // 이 카드가 현재 선택되었는지 여부
  onPress: (personaId: string) => void; // 짧게 탭했을 때의 동작
  onLongPress: (personaId: string) => void; // 길게 눌렀을 때의 동작
}

export default function PersonaCard({
  personaId,
  isSelected,
  onPress,
  onLongPress,
}: PersonaCardProps) {
  const persona = useAppStore((state) =>
    state.personas.find((p) => p.id === personaId)
  );

  if (!persona) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.avatarContainer} />
      </View>
    );
  }

  // 선택되었을 때 적용될 동적 스타일
  const avatarContainerStyle = [
    styles.avatarContainer,
    isSelected && styles.selectedAvatarContainer, // isSelected가 true이면 녹색 띠 스타일 적용
  ];

  return (
    // TouchableOpacity가 탭과 길게 누르기 이벤트를 모두 처리
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => onPress(persona.id)}
      onLongPress={() => onLongPress(persona.id)}
      delayLongPress={200} // 길게 누르기 감지 시간 (ms)
    >
      <View style={avatarContainerStyle}>
        {persona.avatarImageUri ? (
          <Image
            source={{ uri: persona.avatarImageUri }}
            style={styles.avatarImage}
          />
        ) : persona.icon ? (
          <Ionicons name={persona.icon as any} size={28} color={"#ffffff"} />
        ) : (
          <View
            style={[
              styles.avatar,
              { backgroundColor: persona.color || "#cccccc" },
            ]}
          />
        )}
      </View>

      <Text
        style={[styles.title, isSelected && styles.selectedTitle]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {persona.title}
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
    borderWidth: 1.5, // 기본 테두리 두께
    borderColor: "transparent", // 기본 테두리는 투명하게
    overflow: "hidden",
    marginBottom: 6,
  },
  selectedAvatarContainer: {
    borderColor: "#2ecc71", // 녹색 띠
    borderWidth: 2, // 약간 더 두꺼운 테두리
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
  // 선택되었을 때 텍스트 스타일 추가
  selectedTitle: {
    color: "#2ecc71", // 녹색
    fontWeight: "bold",
  },
});
