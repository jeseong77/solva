// @/components/ProblemList.tsx

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export interface ProblemListProps {
  personaId: string;
  onPress: (problemId: string) => void;
}

export default function ProblemList({
  personaId,
  onPress,
}: ProblemListProps) {
  
}