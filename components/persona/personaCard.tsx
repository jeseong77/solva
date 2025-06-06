import React from "react";
import { StyleSheet, Text, View, Image } from "react-native"; // react-native에서 Image 컴포넌트 import
import { useAppStore } from "@/store/store";
import { Ionicons } from "@expo/vector-icons";
import { Persona } from "@/types";

interface PersonaCardProps {
  personaId: string;
}

export default function PersonaCard({ personaId }: PersonaCardProps) {
  const persona = useAppStore((state) =>
    state.personas.find((p) => p.id === personaId)
  );

  if (!persona) {
    // 데이터 로딩 중이거나 없을 때를 위한 플레이스홀더
    return (
      <View style={styles.cardContainer}>
        <View style={styles.avatarContainer} />
      </View>
    );
  }

  return (
    <View style={styles.cardContainer}>
      <View style={styles.avatarContainer}>
        {persona.avatarImageUri ? (
          // <Text>IMG</Text> 대신 실제 Image 컴포넌트 사용
          <Image
            source={{ uri: persona.avatarImageUri }}
            style={styles.avatarImage}
          />
        ) : persona.icon ? (
          <Ionicons name={persona.icon as any} size={28} color={"#ffffff"} />
        ) : (
          // 아이콘도 없을 경우 기본 배경색만 표시
          <View
            style={[
              styles.avatar,
              { backgroundColor: persona.color || "#cccccc" },
            ]}
          />
        )}
      </View>

      <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
        {persona.title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    alignItems: "center",
    marginRight: 0,
    width: 72,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f0f2f5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
    overflow: "hidden", // 이미지가 원 밖으로 나가지 않도록
    marginBottom: 6,
  },
  avatar: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  // Image 컴포넌트를 위한 스타일 추가
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 28, // 부모의 borderRadius와 일치시켜 원형 유지
  },
  title: {
    fontSize: 12,
    color: "#555555",
    textAlign: "center",
  },
});
