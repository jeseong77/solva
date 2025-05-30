import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Task } from "@/types";
// import { Ionicons } from "@expo/vector-icons"; // 아이콘은 일단 제외

interface TaskListProps {
    tasks: Task[]; // 현재 프로젝트에 속한 Task 객체 배열
    onPressTaskItem?: (taskId: string) => void; // 목록의 Task 항목 클릭 시 (선택 사항)
    onPressAddTask: () => void; // "Add Task" 버튼 클릭 시
    // isProjectLocked?: boolean; // 프로젝트 잠금 상태에 따른 버튼 비활성화는 일단 제외
}

export default function TaskList({
    tasks,
    onPressTaskItem,
    onPressAddTask,
}: TaskListProps) {
    return (
        <View>
            {/* Tasks Section */}
            <View style={{ marginBottom: 10 }}> {/* 최소한의 섹션 구분을 위한 margin */}
                <Text style={{ fontSize: 17, fontWeight: 'bold', marginBottom: 5 }}>Tasks (해야 할 일들)</Text>
                {tasks.length === 0 ? (
                    <Text style={{ fontStyle: 'italic', color: 'gray' }}>설정된 Task가 없습니다.</Text>
                ) : (
                    tasks.map((task) => (
                        <TouchableOpacity
                            key={task.id}
                            onPress={() => onPressTaskItem?.(task.id)}
                            disabled={!onPressTaskItem || task.isLocked}
                            style={{ paddingVertical: 4 }} // 항목 간 최소 간격
                        >
                            <View>
                                <Text style={task.isLocked ? { textDecorationLine: 'line-through', color: '#b0b0b0' } : {}}>
                                    {task.title}
                                    <Text style={{ fontSize: 12, color: '#777' }}> (상태: {task.status})</Text>
                                    {task.isLocked ? " (잠김)" : ""}
                                </Text>
                                {/* {task.description && <Text style={{ fontSize: 12, color: 'gray' }}> - {task.description}</Text>} */}
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </View>

            {/* Add Task Button */}
            <TouchableOpacity
                onPress={onPressAddTask}
                style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderColor: '#e0e0e0' }} // 버튼과 목록 구분선 및 간격
            >
                {/* <Ionicons name="add-circle-outline" size={20} /> */}
                <Text style={{ color: '#007AFF', fontSize: 16 }}>Add Task</Text>
            </TouchableOpacity>
        </View>
    );
}

// StyleSheet.create({}); // 스타일을 완전히 제거하거나, 위와 같이 최소한의 인라인 스타일 사용