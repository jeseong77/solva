import { User, UserLink } from "@/types";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ✅ [추가] 통계 데이터 타입을 명확하게 정의
interface ProfileStats {
  problemsSolved: number;
  totalHours: number;
  activePersonas: number;
  insightsGained: number;
}

// ✅ [수정] ProfileCard가 받을 Props 정의
interface ProfileCardProps {
  user: User | null; // 실제 User 객체를 받음
  stats: ProfileStats | null; // 실제 통계 객체를 받음
  onEditProfile?: () => void;
  onEditCover?: () => void;
  onEditAvatar?: () => void;
}

// --- Helper Components ---

const getIconForPlatform = (
  platform: UserLink["platform"]
): React.ComponentProps<typeof Feather>["name"] => {
  switch (platform) {
    case "github":
      return "github";
    case "linkedin":
      return "linkedin";
    case "website":
      return "globe";
    case "twitter":
      return "twitter";
    case "instagram":
      return "instagram";
    default:
      return "link";
  }
};

const StatRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string | number;
}) => (
  <View style={styles.statRow}>
    <View style={styles.statLabelContainer}>
      <Feather name={icon} size={20} color="#555" style={styles.statIcon} />
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const Divider = () => <View style={styles.divider} />;

// --- Main Component ---

export default function ProfileCard({
  user,
  stats,
  onEditProfile,
  onEditCover,
  onEditAvatar,
}: ProfileCardProps) {
  // ✅ 로딩 중이거나 user 데이터가 없을 경우 로딩 인디케이터 표시
  if (!user || !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}시간 ${m}분`;
  };

  return (
    <View style={styles.container}>
      {/* --- 커버 및 프로필 헤더 --- */}
      <View>
        <ImageBackground
          source={user.coverImageUri ? { uri: user.coverImageUri } : undefined}
          style={styles.coverImage}
        >
          <TouchableOpacity
            style={styles.editCoverButton}
            onPress={onEditCover}
          >
            <Feather name="camera" size={16} color="#343a40" />
          </TouchableOpacity>
        </ImageBackground>

        <View style={styles.profileHeader}>
          <TouchableOpacity activeOpacity={0.8} onPress={onEditAvatar}>
            <View style={styles.avatar}>
              {user.avatarImageUri ? (
                <Image
                  source={{ uri: user.avatarImageUri }}
                  style={styles.avatarImage}
                />
              ) : (
                <Feather name="user" size={40} color="#adb5bd" />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.nameContainer}>
            <Text style={styles.displayName}>{user.displayName}</Text>
            {user.username && (
              <Text style={styles.username}>@{user.username}</Text>
            )}
          </View>
        </View>
      </View>

      {/* --- 자기소개, 링크, 프로필 편집 버튼 --- */}
      <View style={styles.bioSection}>
        <Text style={styles.bioText}>
          {/* ✅ bio가 없으면 안내 텍스트 표시 */}
          {user.bio || (
            <Text style={styles.placeholderText}>
              한 줄 소개를 작성하여 자신을 표현해보세요.
            </Text>
          )}
        </Text>

        {/* ✅ location이 있을 때만 표시 */}
        {user.location && (
          <View style={styles.locationContainer}>
            <Feather name="map-pin" size={14} color="#868e96" />
            <Text style={styles.locationText}>{user.location}</Text>
          </View>
        )}

        {/* ✅ links 배열이 존재하고 비어있지 않을 때만 렌더링 */}
        {user.links && user.links.length > 0 && (
          <View style={styles.linksContainer}>
            {user.links.map((link) => (
              <TouchableOpacity
                key={link.id}
                style={styles.linkButton}
                onPress={() => Linking.openURL(link.url)}
              >
                <Feather
                  name={getIconForPlatform(link.platform)}
                  size={22}
                  color="#495057"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={onEditProfile}
        >
          <Text style={styles.editProfileButtonText}>프로필 편집</Text>
        </TouchableOpacity>
      </View>

      <Divider />

      {/* --- 상세 소개 --- */}
      <View style={styles.introductionSection}>
        <Text style={styles.sectionTitle}>자기소개</Text>
        <Text style={styles.introductionText}>
          {/* ✅ introduction이 없으면 안내 텍스트 표시 */}
          {user.introduction || (
            <Text style={styles.placeholderText}>
              프로필 편집에서 자기소개를 추가할 수 있습니다.
            </Text>
          )}
        </Text>
      </View>

      <Divider />

      {/* --- 통계 섹션 --- */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>활동 요약</Text>
        <StatRow
          icon="award"
          label="해결한 문제"
          value={`${stats.problemsSolved}개`}
        />
        <StatRow
          icon="clock"
          label="총 작업 시간"
          value={formatHours(stats.totalHours)}
        />
        <StatRow
          icon="users"
          label="활성 페르소나"
          value={`${stats.activePersonas}개`}
        />
        <StatRow
          icon="star"
          label="획득한 인사이트"
          value={`${stats.insightsGained}개`}
        />
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { width: "100%", backgroundColor: "#ffffff" },
  loadingContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  coverImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
  },
  editCoverButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  profileHeader: {
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginTop: -40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f1f3f5",
    borderWidth: 3,
    borderColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  nameContainer: { marginTop: 8 },
  displayName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
  },
  username: {
    fontSize: 16,
    color: "#868e96",
    marginTop: 2,
  },
  bioSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#495057",
  },
  placeholderText: {
    // ✅ 안내 텍스트를 위한 스타일
    fontStyle: "italic",
    color: "#adb5bd",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  locationText: {
    fontSize: 14,
    color: "#868e96",
    marginLeft: 6,
  },
  linksContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  linkButton: { marginRight: 20 },
  editProfileButton: {
    marginTop: 20,
    width: "100%",
    paddingVertical: 10,
    backgroundColor: "#e9ecef",
    borderRadius: 8,
    alignItems: "center",
  },
  editProfileButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#343a40",
  },
  introductionSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 8,
  },
  introductionText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#495057",
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  statLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    marginRight: 16,
    width: 22,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 16,
    color: "#343a40",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212529",
  },
  divider: {
    height: 8,
    backgroundColor: "#f8f9fa",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f1f3f5",
  },
});
