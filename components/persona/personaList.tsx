// src/components/PersonaList.tsx
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

interface PersonaListProps {
  onPressPersona: (personaId: string) => void;
  onPressAddPersona: () => void;
}

export default function PersonaList({
  onPressPersona,
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
        <View style={styles.addCardContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={onPressAddPersona}
          >
            <Ionicons name="add" size={28} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.addTitle} numberOfLines={1} ellipsizeMode="tail">
            페르소나 추가
          </Text>
        </View>

        {isLoadingPersonas && personas.length === 0 && (
          <ActivityIndicator size="small" style={styles.loadingIndicator} />
        )}

        {personas.map((persona) => (
          <TouchableOpacity
            key={persona.id}
            onPress={() => onPressPersona(persona.id)}
          >
            <PersonaCard personaId={persona.id} />
          </TouchableOpacity>
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
    backgroundColor: "#ffffff",
  },
  scrollContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 8,
  },
  loadingIndicator: {
    marginHorizontal: 10,
  },
  addCardContainer: {
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
    marginBottom: 6, // 제목과의 간격을 여기로 이동
  },
  addTitle: {
    fontSize: 12,
    color: "#555555",
    textAlign: "center",
  },
});
