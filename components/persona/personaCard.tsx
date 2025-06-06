import { useAppStore } from "@/store/store";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PersonaCardProps {
  personaId: string;
}

export default function PersonaCard({ personaId }: PersonaCardProps) {
  const persona = useAppStore((state) =>
    state.personas.find((p) => p.id === personaId)
  );

  if (!persona) {
    return null;
  }

  return (
    <TouchableOpacity>
      <View>
        {persona.avatarImageUri ? (
          // <Image source={{ uri: persona.avatarImageUri }} style={styles.avatar} />
          <Text>이미지</Text> // 실제 Image 컴포넌트로 대체
        ) : persona.icon ? (
          <Ionicons
            name={persona.icon as any}
            size={24}
            color={persona.color || "#fff"}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              { backgroundColor: persona.color || "#ccc" },
            ]}
          />
        )}
      </View>

      <Text style={styles.title}>{persona.title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 48,
    height: 48,
  },
  title: {
    fontSize: 18,
  },
});
