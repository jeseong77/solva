// src/components/DoItemList.tsx
import { DoItem } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import DoListItem from "./DoListItem";

interface DoItemListProps {
    doItems: DoItem[];
    projectId: string;
    isLoading: boolean;
    onPressDoItem: (doItemId: string) => void; // 각 DoItem 클릭 시
    onPressAddDoItem: (projectId: string) => void; // "Add Do Rule" 버튼 클릭 시
    onDeleteDoItem: (doItemId: string) => void;
}

export default function DoItemList({
    doItems,
    projectId,
    isLoading,
    onPressDoItem,
    onPressAddDoItem,
    onDeleteDoItem,
}: DoItemListProps) {
    if (isLoading && doItems.length === 0) {
        return (
            <View style={styles.messageContainer}>
                <ActivityIndicator size="large" />
                <Text style={styles.messageText}>Loading "Do" rules...</Text>
            </View>
        );
    }

    return (
        <View style={styles.listOuterContainer}>
            <Text style={styles.sectionHeader}>Do</Text>
            {doItems.length === 0 && !isLoading && (
                <View style={styles.messageContainerNoFlex}>
                    <Text style={styles.messageText}>
                        아직 설정된 "Do" 규칙이 없습니다.
                    </Text>
                </View>
            )}
            {doItems.map((item) => (
                <DoListItem
                    key={item.id}
                    doItem={item}
                    onPress={onPressDoItem}
                    onDelete={onDeleteDoItem}
                />
            ))}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => onPressAddDoItem(projectId)}
            >
                <Ionicons
                    name="add-circle-outline"
                    size={22}
                    color="#232f48"
                    style={styles.addButtonIcon}
                />
                <Text style={styles.addButtonText}>add do</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    listOuterContainer: {
        backgroundColor: "#ffffff",
        borderRadius: 8,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
    },
    messageContainer: {
        justifyContent: 'center', alignItems: 'center', paddingVertical: 30,
    },
    messageContainerNoFlex: {
        justifyContent: 'center', alignItems: 'center', paddingVertical: 30,
    },
    messageText: {
        fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8,
    },
    addButton: { // ProblemList.tsx의 addButton 스타일 참고하여 수정
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        backgroundColor: "#a8cbe8", // 파란색 계열 배경
        borderRadius: 8, // 둥근 모서리
        marginTop: 16,
    },
    addButtonIcon: {
        marginRight: 8,
        color: "#232f48", // 어두운 아이콘 색상
    },
    addButtonText: {
        color: "#232f48", // 어두운 텍스트 색상
        fontSize: 16,
        fontWeight: "500",
    },
});