import { DoItem, DontItem } from "@/types";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface RuleListProps {
    doItems: DoItem[];
    dontItems: DontItem[];
    onPressDoItem?: (doItemId: string) => void;
    onPressDontItem?: (dontItemId: string) => void;
    onPressAddRule: () => void;
}

export default function RuleList({
    doItems,
    dontItems,
    onPressDoItem,
    onPressDontItem,
    onPressAddRule,
}: RuleListProps) {
    return (
        <View>
            {/* Do Items Section */}
            <View>
                <Text>Do</Text>
                {doItems.length === 0 ? (
                    <Text>설정된 "Do" 규칙이 없습니다.</Text>
                ) : (
                    doItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => onPressDoItem?.(item.id)}
                            disabled={!onPressDoItem || item.isLocked}
                        >
                            <View>
                                <Text>{item.title}{item.isLocked ? " (잠김)" : ""}</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </View>

            <View style={{ marginTop: 15 }}>
                <Text>Don't</Text>
                {dontItems.length === 0 ? (
                    <Text>설정된 "Don't" 규칙이 없습니다.</Text>
                ) : (
                    dontItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => onPressDontItem?.(item.id)}
                            disabled={!onPressDontItem || item.isLocked}
                        >
                            <View>
                                <Text>{item.title}{item.isLocked ? " (잠김)" : ""}</Text>
                                {/* 필요시 여기에 item.observancePeriod, item.successCount 등 표시 */}
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </View>

            <TouchableOpacity
                onPress={onPressAddRule}
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 12,
                    backgroundColor: "#a8cbe8",
                    borderRadius: 8,
                    marginTop: 16,}}
            >
                <Ionicons name="add-circle-outline" size={20} />
                <Text>Add Rule</Text>
            </TouchableOpacity>
        </View>
    );
}

// StyleSheet.create 및 모든 스타일 정의 제거