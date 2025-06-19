// components/objective/ObjectiveEdit.tsx

import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Modal as RNModal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import GapItem from "./GapItem";
import { useObjectiveEdit } from "./ObjectiveEdit.module";
import styles from "./ObjectiveEdit.style";

export default function ObjectiveEdit() {
  const {
    isLoading,
    isSaving,
    isEditMode,
    title,
    description,
    type,
    coverImageUri,
    avatarImageUri,
    isCoverViewerVisible,
    localData,
    isGapModalVisible,
    editingGapId,
    gapTitle,
    idealState,
    currentState,
    isProblemModalVisible,
    problemTitle,
    problemDescription,
    setTitle,
    setDescription,
    setType,
    setCoverViewerVisible,
    setGapModalVisible,
    setGapTitle,
    setIdealState,
    setCurrentState,
    setProblemModalVisible,
    setProblemTitle,
    setProblemDescription,
    handleSave,
    handleCoverImageChange,
    handleAvatarPress,
    handleOpenAddGapModal,
    handleOpenEditGapModal,
    handleSaveGap,
    handleOpenProblemModal,
    handleSaveProblem,
    router,
  } = useObjectiveEdit();

  if (isLoading) {
    return (
      <View style={styles.centeredMessageContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={26} color="#343a40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? "목표 편집" : "새 목표"}
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.headerSaveButton}>
            {isSaving ? "저장중..." : "저장"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          {/* ✅ [수정] 불필요한 View 래퍼를 제거하여 원래 구조로 되돌립니다. */}
          <TouchableOpacity
            onPress={() => coverImageUri && setCoverViewerVisible(true)}
          >
            <ImageBackground
              source={coverImageUri ? { uri: coverImageUri } : undefined}
              style={styles.coverImage}
            >
              {!coverImageUri && (
                <Feather name="image" size={40} color="#ced4da" />
              )}
              <TouchableOpacity
                style={styles.editCoverButton}
                onPress={handleCoverImageChange}
              >
                <Feather name="camera" size={16} color="#495057" />
              </TouchableOpacity>
            </ImageBackground>
          </TouchableOpacity>

          <View style={styles.profileSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
            >
              {avatarImageUri ? (
                <Image
                  source={{ uri: avatarImageUri }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Feather name="user" size={40} color="#adb5bd" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.typeSelectorContainer}>
            {isEditMode ? (
              <View style={[styles.typeButton, styles.typeButtonSelected]}>
                <Text style={styles.typeButtonTextSelected}>
                  {type === "persona" ? "페르소나" : "프로덕트"}
                </Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === "persona" && styles.typeButtonSelected,
                  ]}
                  onPress={() => setType("persona")}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === "persona" && styles.typeButtonTextSelected,
                    ]}
                  >
                    페르소나
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === "product" && styles.typeButtonSelected,
                  ]}
                  onPress={() => setType("product")}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === "product" && styles.typeButtonTextSelected,
                    ]}
                  >
                    프로덕트
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          <View style={styles.formWrapper}>
            <View style={styles.formContainer}>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="이름"
                placeholderTextColor="#adb5bd"
              />
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="소개"
                placeholderTextColor="#adb5bd"
                multiline
              />
            </View>
          </View>

          <View style={styles.gapSection}>
            <Text style={styles.sectionDescription}>
              목표의 이상적인 상태와 현실을 정의하여 그 차이를 명확히 하세요. 이
              차이가 당신이 해결해야 할 '문제'가 됩니다.
            </Text>
            {localData.map((gap) => (
              <GapItem
                key={gap.tempId}
                gap={gap}
                onEditGap={handleOpenEditGapModal}
                onAddProblem={handleOpenProblemModal}
              />
            ))}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleOpenAddGapModal}
            >
              <Feather name="plus-circle" size={20} color="#2b8a3e" />
              <Text style={styles.addButtonText}>새로운 Gap 정의하기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <RNModal
        visible={isCoverViewerVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.viewerContainer}>
          <TouchableOpacity
            style={styles.viewerCloseButton}
            onPress={() => setCoverViewerVisible(false)}
          >
            <Feather name="x" size={32} color="white" />
          </TouchableOpacity>
          <Image
            source={{ uri: coverImageUri }}
            style={styles.viewerImage}
            resizeMode="contain"
          />
        </View>
      </RNModal>

      <Modal
        isVisible={isGapModalVisible}
        onBackdropPress={() => setGapModalVisible(false)}
        onBackButtonPress={() => setGapModalVisible(false)}
        avoidKeyboard
        style={styles.modal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingGapId ? "Gap 수정" : "새로운 Gap 정의"}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Gap 이름 (예: 영어 실력)"
              value={gapTitle}
              onChangeText={setGapTitle}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="이상적인 상태 (예: 원어민과 편하게 대화)"
              value={idealState}
              onChangeText={setIdealState}
              multiline
            />
            <TextInput
              style={styles.modalInput}
              placeholder="현재 상태 (예: 간단한 자기소개만 가능)"
              value={currentState}
              onChangeText={setCurrentState}
              multiline
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveGap}>
              <Text style={styles.saveButtonText}>
                {editingGapId ? "변경사항 저장" : "Gap 추가"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        isVisible={isProblemModalVisible}
        onBackdropPress={() => setProblemModalVisible(false)}
        onBackButtonPress={() => setProblemModalVisible(false)}
        avoidKeyboard
        style={styles.modal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>새로운 문제 정의</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="문제 제목 (예: 어휘력 부족)"
              value={problemTitle}
              onChangeText={setProblemTitle}
            />
            <TextInput
              style={[styles.modalInput, { height: 100 }]}
              placeholder="문제에 대한 간단한 설명 (선택 사항)"
              value={problemDescription}
              onChangeText={setProblemDescription}
              multiline
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProblem}
            >
              <Text style={styles.saveButtonText}>문제 추가</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
