/**
 * HomeScreen.js – PulseFit Female Fitness
 *
 * Layout:
 *  - Sticky top bar (avatar, title, streak) — stays at top while scrolling
 *  - On scroll: bar background becomes solid card + light shadow (theme)
 *  - Main content scrolls underneath; top spacer avoids overlap
 *  - Drawer opens from avatar tap
 */

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import DrawerMenu from "../components/DrawerMenu";
import { addWorkoutStat } from "../storage/fitnessStorage";
import { useAuth } from "../context/AuthContext";

// Screen width for responsive card widths
const { width } = Dimensions.get("window");

// Theme tokens — used across styles
const C = {
  bg: "#FBF7F4",
  card: "#FFFFFF",
  primary: "#E8607A",
  accent: "#F4A261",
  purple: "#9B72CF",
  teal: "#3BBFA0",
  soft: "#FFF0F3",
  text: "#1C1C2E",
  muted: "#9499A8",
  border: "#F0EAE4",
};

import StickyNavbar from "../components/StickyNavbar";

// Layout constants
const CHALLENGE_W = Math.min(width * 0.78, 320);
const CHALLENGE_H = Math.min(width * 0.72, 290);
const DRAWER_W = width >= 768 ? 320 : width * 0.8;
const YML_W = Math.min(width * 0.78, 410);
const WORKOUT_CARD_W = Math.min(width * 0.98, 380);

// Drawer menu items (ids used with activeTab for highlight only)
const DRAWER_TABS = [
  { id: "Home", label: "Home", icon: "home-outline" },
  { id: "Workout", label: "Workouts", icon: "barbell-outline" },
  { id: "Nutrition", label: "Nutrition", icon: "nutrition-outline" },
  { id: "Progress", label: "Progress", icon: "stats-chart-outline" },
  { id: "Profile", label: "Profile", icon: "person-outline" },
  { id: "Settings", label: "Settings", icon: "settings-outline" },
];

const CHALLENGES = [
  {
    id: "c1", tag: "28-Day", title: "Full Body Workout",
    bg: "#FADADD", accent: "#E8607A",
    image: "https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg?q=80&w=400&auto=format&fit=crop&crop=top",
  },
  {
    id: "c2", tag: "28-Day", title: "Flat Stomach",
    bg: "#E8E2FA", accent: "#9B72CF",
    image: "https://images.unsplash.com/photo-1765045847158-11e23e972bb0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8ZXhlcmNpc2UlMjBnaXJsJTIwc2xpbXxlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    id: "c3", tag: "21-Day", title: "Round Booty",
    bg: "#DBFAEF", accent: "#3BBFA0",
    image: "https://images.pexels.com/photos/3775590/pexels-photo-3775590.jpeg?q=80&w=400&auto=format&fit=crop&crop=top",
  },
  {
    id: "c4", tag: "14-Day", title: "Toned Arms",
    bg: "#FBEFE2", accent: "#F4A261",
    image: "https://images.pexels.com/photos/7592375/pexels-photo-7592375.jpeg?q=80&w=400&auto=format&fit=crop&crop=top",
  },
  {
    id: "c5", tag: "30-Day", title: "Cardio Blast",
    bg: "#DDF0FC", accent: "#38BDF8",
    image: "https://images.pexels.com/photos/17898140/pexels-photo-17898140.jpeg?q=80&w=400&auto=format&fit=crop&crop=top",
  },
];

const PICKS_TODAY = {
  title: "Bed Workout Beginner",
  mins: "2 Mins",
  date: { month: "May", day: "8" },
  image: "https://images.pexels.com/photos/7592293/pexels-photo-7592293.jpeg?q=80&w=400&auto=format&fit=crop&crop=top",
};

const BODY_CATS = [
  { id: "abs", label: "Abs" },
  { id: "butt", label: "Butt" },
  { id: "thigh", label: "Thigh" },
  { id: "arm", label: "Arm" },
  { id: "split", label: "Split" },
  { id: "full", label: "Full Body" },
];

const CLASSIC_WORKOUTS = {
  abs: [
    { id: "a1", title: "Abs Beginner", mins: "10 Mins", calories: "180 cal", level: "Beginner", image: "https://images.pexels.com/photos/3757377/pexels-photo-3757377.jpeg" },
    { id: "a2", title: "Abs Intermediate", mins: "15 Mins", calories: "250 cal", level: "Intermediate", image: "https://images.pexels.com/photos/3764482/pexels-photo-3764482.jpeg" },
    { id: "a3", title: "Abs Advanced", mins: "20 Mins", calories: "320 cal", level: "Advanced", image: "https://media.istockphoto.com/id/693304104/photo/cropped-view-of-perfect-woman-in-white-underwear-isolated-on-white.webp?a=1&b=1&s=612x612&w=0&k=20&c=ufRWP5QhGNYDFVf64icIuE3u0TRFqviIZBbBjSdk6Tk=" },
  ],
  butt: [
    { id: "b1", title: "Glute Beginner", mins: "12 Mins", calories: "200 cal", level: "Beginner", image: "https://images.pexels.com/photos/3931114/pexels-photo-3931114.jpeg" },
    { id: "b2", title: "Booty Builder", mins: "18 Mins", calories: "290 cal", level: "Intermediate", image: "https://images.pexels.com/photos/20263479/pexels-photo-20263479.jpeg" },
    { id: "b3", title: "Hip Lifts", mins: "14 Mins", calories: "240 cal", level: "Intermediate", image: "https://plus.unsplash.com/premium_photo-1669795610273-93f15d1533ff?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDR8fHxlbnwwfHx8fHw%3D" },
  ],
  thigh: [
    { id: "t1", title: "Thigh Beginner", mins: "11 Mins", calories: "190 cal", level: "Beginner", image: "https://images.pexels.com/photos/12645032/pexels-photo-12645032.jpeg" },
    { id: "t2", title: "Thigh Intermediate", mins: "16 Mins", calories: "270 cal", level: "Intermediate", image: "https://images.pexels.com/photos/4775193/pexels-photo-4775193.jpeg" },
    { id: "t3", title: "Thigh Advanced", mins: "21 Mins", calories: "340 cal", level: "Advanced", image: "https://images.pexels.com/photos/7319689/pexels-photo-7319689.jpeg" },
  ],
  arm: [
    { id: "ar1", title: "Arm Beginner", mins: "10 Mins", calories: "170 cal", level: "Beginner", image: "https://images.pexels.com/photos/3757953/pexels-photo-3757953.jpeg" },
    { id: "ar2", title: "Bicep Burn", mins: "15 Mins", calories: "260 cal", level: "Intermediate", image: "https://images.pexels.com/photos/6443525/pexels-photo-6443525.jpeg" },
    { id: "ar3", title: "Tricep Dips", mins: "12 Mins", calories: "210 cal", level: "Intermediate", image: "https://images.pexels.com/photos/5000219/pexels-photo-5000219.jpeg" },
  ],
  split: [
    { id: "sp1", title: "Split Basics", mins: "20 Mins", calories: "280 cal", level: "Intermediate", image: "https://plus.unsplash.com/premium_photo-1661353239433-71b91d5c754c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fHNwbGl0JTIwd29ya291dCUyMGdpcmx8ZW58MHx8MHx8fDA%3D" },
    { id: "sp2", title: "Split Flow", mins: "25 Mins", calories: "350 cal", level: "Advanced", image: "https://plus.unsplash.com/premium_photo-1661604440767-cfc4cdd63d18?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fHNwbGl0JTIwd29ya291dCUyMGdpcmx8ZW58MHx8MHx8fDA%3D" },
  ],
  full: [
    { id: "f1", title: "Full Body Burn", mins: "35 Mins", calories: "420 cal", level: "Advanced", image: "https://media.istockphoto.com/id/1207920802/photo/beautiful-fitness-woman.webp?a=1&b=1&s=612x612&w=0&k=20&c=rDKgPUtdAKu9ZQ4eL_5eHIIi4kY-o8l4Zv48oBZZs_M=" },
    { id: "f2", title: "Total Tone", mins: "40 Mins", calories: "480 cal", level: "Advanced", image: "https://images.pexels.com/photos/28968254/pexels-photo-28968254.jpeg" },
    { id: "f3", title: "HIIT Cardio", mins: "30 Mins", calories: "400 cal", level: "Advanced", image: "https://images.pexels.com/photos/4775205/pexels-photo-4775205.jpeg" },
  ],
};

const YOU_MAY_LIKE = [
  {
    id: "yl1", title: "Stretch & Relax",
    plans: [
      { id: "s1", title: "Full Body Stretching", mins: "5 Mins", image: "https://images.pexels.com/photos/6160889/pexels-photo-6160889.jpeg" },
      { id: "s2", title: "Sleepy Time Stretch", mins: "6 Mins", image: "https://images.pexels.com/photos/6603662/pexels-photo-6603662.jpeg" },
      { id: "s3", title: "Post-run Cool Down", mins: "5 Mins", image: "https://images.pexels.com/photos/3776145/pexels-photo-3776145.jpeg" },
    ],
  },
  {
    id: "yl2", title: "Sweat & Burn",
    plans: [
      { id: "ca1", title: "HIIT Blast", mins: "25 Mins", image: "https://images.unsplash.com/photo-1593164842264-854604db2260?q=80&w=200&auto=format&fit=crop" },
      { id: "ca2", title: "Jump & Burn", mins: "20 Mins", image: "https://media.istockphoto.com/id/493912830/photo/jump.jpg?b=1&s=612x612&w=0&k=20&c=KxqLrdmOmCm_ESeL3RwmpXp0zGmrQaGB56JLWdpQYzk=" },
      { id: "ca3", title: "Dance Cardio", mins: "30 Mins", image: "https://images.pexels.com/photos/3776152/pexels-photo-3776152.jpeg" },
    ],
  },
  {
    id: "yl3", title: "Strength & Tone",
    plans: [
      { id: "st1", title: "Dumbbell Flow", mins: "35 Mins", image: "https://images.pexels.com/photos/29825226/pexels-photo-29825226.jpeg" },
      { id: "st2", title: "Body Sculpt", mins: "28 Mins", image: "https://images.pexels.com/photos/918576/pexels-photo-918576.jpeg" },
      { id: "st3", title: "Resistance", mins: "22 Mins", image: "https://images.pexels.com/photos/8436146/pexels-photo-8436146.jpeg" },
    ],
  },
  {
    id: "yl4", title: "Mindful Mobility",
    plans: [
      { id: "mob1", title: "Hip Opener Flow", mins: "12 Mins", image: "https://images.pexels.com/photos/6454021/pexels-photo-6454021.jpeg" },
      { id: "mob2", title: "Spine & Posture", mins: "15 Mins", image: "https://images.pexels.com/photos/4534578/pexels-photo-4534578.jpeg" },
      { id: "mob3", title: "Morning Mobility", mins: "10 Mins", image: "https://images.pexels.com/photos/4775187/pexels-photo-4775187.jpeg" },
    ],
  },
];

// DrawerMenu component moved to src/components/DrawerMenu.js

// ── Challenge carousel card
function ChallengeCard({ item, navigation }) {
  return (
    <Pressable style={[styles.challengeCard, { backgroundColor: item.bg }]} onPress={() => navigation.navigate("WorkoutDetail", { workout: item })}>
      <View style={[styles.challengeTagPill, { backgroundColor: item.accent + "22" }]}>
        <Text style={[styles.challengeTagTxt, { color: item.accent }]}>{item.tag}</Text>
      </View>
      <Image source={{ uri: item.image }} style={styles.challengeImg} resizeMode="cover" />
      <View style={styles.challengeBottom}>
        <Text style={styles.challengeTitle} numberOfLines={2}>{item.title}</Text>
        <Pressable style={[styles.startBtn, { backgroundColor: item.accent }]} onPress={() => navigation.navigate("WorkoutDetail", { workout: item })}>
          <Text style={styles.startBtnTxt}>Start</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

// ── Classic workout horizontal card with caption (Time + Cal + Level)
function ClassicWorkoutCard({ item, navigation }) {
  const levelColor =
    item.level === "Advanced" ? "#9B72CF" :
      item.level === "Intermediate" ? "#F4A261" : "#3BBFA0";

  return (
    <Pressable style={styles.classicWorkoutCard} onPress={() => navigation.navigate("WorkoutDetail", { workout: item })}>
      <Image source={{ uri: item.image }} style={styles.classicWorkoutImg} />

      <View style={styles.classicWorkoutInfo}>
        <View style={styles.classicWorkoutBottomRow}>
          <View style={styles.classicWorkoutTextWrap}>
            <Text style={styles.classicWorkoutTitle} numberOfLines={2}>{item.title}</Text>

            {/* New Caption Row */}
            <View style={styles.captionRow}>
              <View style={styles.captionItem}>
                <Ionicons name="time-outline" size={13} color={C.muted} />
                <Text style={styles.captionText}>{item.mins}</Text>
              </View>
              <View style={styles.captionItem}>
                <Ionicons name="flame-outline" size={13} color={C.muted} />
                <Text style={styles.captionText}>{item.calories}</Text>
              </View>
              <View style={[styles.levelPill, { backgroundColor: levelColor + "22" }]}>
                <Text style={[styles.levelText, { color: levelColor }]}>{item.level}</Text>
              </View>
            </View>
          </View>

          <Pressable style={[styles.startBtn, styles.classicStartBtn]} onPress={() => navigation.navigate("WorkoutDetail", { workout: item })}>
            <Text style={styles.startBtnTxt}>Start</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function YouMayLikeCard({ item, navigation }) {
  return (
    <View style={styles.ymlCard}>
      <Text style={styles.ymlCardTitle}>{item.title}</Text>
      {item.plans.map((plan, idx) => (
        <Pressable key={plan.id} style={[styles.ymlRow, idx === 0 && { borderTopWidth: 0 }]} onPress={() => navigation.navigate("WorkoutDetail", { workout: plan })}>
          <Image source={{ uri: plan.image }} style={styles.ymlRowImg} />
          <View style={styles.ymlRowInfo}>
            <Text style={styles.ymlRowTitle}>{plan.title}</Text>
            <Text style={styles.ymlRowMins}>{plan.mins}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [activeCat, setActiveCat] = useState("thigh");
  const [workoutSearch, setWorkoutSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  // Sticky navbar: toggles style after small scroll
  const [navScrolled, setNavScrolled] = useState(false);

  const workouts = CLASSIC_WORKOUTS[activeCat] ?? [];
  const filteredWorkouts = workouts.filter((item) =>
    item.title.toLowerCase().includes(workoutSearch.trim().toLowerCase())
  );
  const handleNavigate = useCallback((tabId) => {
    setActiveTab(tabId);
    navigation.navigate(tabId);
  }, [navigation]);

  const handleScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    if (!navScrolled && y > 12) setNavScrolled(true);
    if (navScrolled && y <= 12) setNavScrolled(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Sticky Top Navbar */}
      <StickyNavbar 
        navScrolled={navScrolled} 
        onMenuPress={() => setDrawerOpen(true)} 
        subtitle={user ? `Hi, ${user.name.split(' ')[0]}!` : "Female Fitness"}
      />

      <DrawerMenu
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeTab={activeTab}
        onNavigate={handleNavigate}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        nestedScrollEnabled
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.responsiveContainer}>
        {/* Challenge */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Challenge</Text>
          <Pressable onPress={() => navigation.navigate("Workout")}><Text style={styles.viewAll}>View all</Text></Pressable>
        </View>
        <FlatList
          data={CHALLENGES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
          style={{ marginBottom: 20 }}
          renderItem={({ item }) => <ChallengeCard item={item} navigation={navigation} />}
        />

        {/* Progress CTA */}
        <Pressable style={styles.progressBanner} onPress={() => handleNavigate("Progress")}>
          <View style={styles.progressLeft}>
            <View style={styles.progressIconWrap}>
              <Ionicons name="stats-chart" size={20} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.progressTitle}>Track Your Progress</Text>
              <Text style={styles.progressSub}>Streaks, weight & workout history</Text>
            </View>
          </View>
          <View style={styles.progressArrow}>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </View>
        </Pressable>

        {/* Picks for today */}
        <View style={[styles.sectionRow, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Picks For Today</Text>
        </View>
        <View style={styles.pickCard}>
          <Image source={{ uri: PICKS_TODAY.image }} style={styles.pickImg} />
          <View style={styles.pickOverlay} />
          <View style={styles.pickDate}>
            <Text style={styles.pickDateWeekday}>TODAY</Text>
            <Text style={styles.pickDateDay}>{PICKS_TODAY.date.day}</Text>
            <Text style={styles.pickDateMonth}>{PICKS_TODAY.date.month}</Text>
          </View>
          <View style={styles.pickInfo}>
            <Text style={styles.pickTitle}>{PICKS_TODAY.title}</Text>
            <Text style={styles.pickMins}>{PICKS_TODAY.mins}</Text>
          </View>
          <Pressable style={styles.pickPlay} onPress={() => navigation.navigate("WorkoutDetail", { workout: PICKS_TODAY })}>
            <Ionicons name="play" size={18} color={C.text} />
          </Pressable>
        </View>

        {/* Classic workouts: search → chips → horizontal cards */}
        <View style={[styles.sectionRow, { marginTop: 26 }]}>
          <Text style={styles.sectionTitle}>Classic workouts</Text>
        </View>
        <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocused]}>
          <Ionicons name="search-outline" size={16} color={C.muted} style={{ marginRight: 8 }} />
          <TextInput
            value={workoutSearch}
            onChangeText={setWorkoutSearch}
            placeholder={`Search ${activeCat} workouts`}
            placeholderTextColor={C.muted}
            style={styles.searchInput}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            underlineColorAndroid="transparent"
          />
          <Pressable style={styles.searchBtn}>
            <Text style={styles.searchBtnTxt}>Search</Text>
          </Pressable>
        </View>

        <FlatList
          data={BODY_CATS}
          horizontal
          showsHorizontalScrollIndicator={true}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ gap: 8, paddingBottom: 14, paddingHorizontal: 2 }}
          style={styles.chipScroll}
          renderItem={({ item }) => {
            const isActive = item.id === activeCat;
            return (
              <Pressable
                onPress={() => setActiveCat(item.id)}
                style={[styles.chip, isActive && styles.chipActive]}
              >
                <Text style={[styles.chipTxt, isActive && styles.chipTxtActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />

        <FlatList
          data={filteredWorkouts}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 15, paddingBottom: 6, alignItems: "center" }}
          style={{ marginBottom: 10 }}
          renderItem={({ item }) => <ClassicWorkoutCard item={item} navigation={navigation} />}
          ListFooterComponent={
            <View style={styles.viewAllInlineWrap}>
              <Pressable style={styles.viewAllInlineBtn} onPress={() => navigation.navigate("Workout")}>
                <Text style={styles.viewAll}>View all</Text>
              </Pressable>
            </View>
          }
        />

        {/* You may like */}
        <View style={[styles.sectionRow, { marginTop: 26 }]}>
          <View>
            <Text style={styles.sectionTitle}>You May Like</Text>
            <Text style={styles.sectionSub}>Selected By Popular Demand</Text>
          </View>
        </View>
        <FlatList
          data={YOU_MAY_LIKE}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ gap: 15, paddingBottom: 6 }}
          style={{ marginBottom: 22 }}
          renderItem={({ item }) => <YouMayLikeCard item={item} navigation={navigation} />}
        />

        <Pressable style={styles.moreBtn} onPress={() => navigation.navigate("Workout")}>
          <MaterialCommunityIcons name="compass-outline" size={18} color={C.primary} />
          <Text style={styles.moreBtnTxt}>More workouts</Text>
        </Pressable>

        <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingVertical: 10 },
  responsiveContainer: { width: '100%', maxWidth: 768, alignSelf: 'center',paddingHorizontal: 12 },
  
  /* ==================== NAVBAR ==================== */
  // Moved to StickyNavbar.js

  /* ==================== COMMON SECTION STYLES ==================== */
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  sectionTitle: { fontSize: 19, fontWeight: "800", color: C.text },
  sectionSub: { fontSize: 12, color: C.muted, fontWeight: "500", marginTop: 3 },
  viewAll: { fontSize: 13, fontWeight: "700", color: C.primary, marginTop: 6 },

  /* ==================== CHALLENGE CARDS ==================== */
  challengeCard: {
    width: CHALLENGE_W,
    height: CHALLENGE_H,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 6,
  },
  challengeTagPill: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 2,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  challengeTagTxt: { fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },
  challengeImg: { width: "100%", height: CHALLENGE_H * 0.62 },
  challengeBottom: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, justifyContent: "space-between" },
  challengeTitle: { fontSize: 14, fontWeight: "800", color: C.text, lineHeight: 19, marginBottom: 6 },

  /* ==================== CLASSIC WORKOUT CARD CAPTION ==================== */
  captionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    flexWrap: "wrap",
  },
  captionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 10,
  },
  captionText: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "600",
  },
  levelPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginLeft: "auto",
  },
  levelText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  /* ==================== START BUTTON ==================== */
  startBtn: { borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  startBtnTxt: { fontSize: 13, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },

  /* ==================== PROGRESS BANNER ==================== */
  progressBanner: { flexDirection: "row", alignItems: "center", backgroundColor: C.soft, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: C.primary + "22", justifyContent: "space-between" },
  progressLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  progressIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.primary + "16", alignItems: "center", justifyContent: "center" },
  progressTitle: { fontSize: 14, fontWeight: "800", color: C.text, marginBottom: 3 },
  progressSub: { fontSize: 11, color: C.muted, fontWeight: "500" },
  progressArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },

  /* ==================== PICKS FOR TODAY ==================== */
  pickCard: {
    width: width * 0.89,
    maxWidth: 430,
    height: 230,
    alignSelf: "center",
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#d7ccf4",
    position: "relative",
    marginHorizontal: 0,
  },
  pickImg: { ...StyleSheet.absoluteFillObject, resizeMode: "cover", opacity: 0.95 },
  pickOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(191, 180, 226, 0.28)" },
  pickDate: {
    position: "absolute",
    height: 50,
    top: 10,
    right: 10,
    backgroundColor: C.primary + "cc",
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignItems: "center",
  },
  pickDateWeekday: {
    fontSize: 7,
    color: "#0f0e0e",
    backgroundColor: C.card,
    borderRadius: 4,
    fontWeight: "800",
    letterSpacing: 0.8,
    opacity: 0.9,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginBottom: 2,
  },
  pickDateMonth: { fontSize: 9, color: "#fff", fontWeight: "600", opacity: 0.8 },
  pickDateDay: { fontSize: 16, color: "#fff", fontWeight: "900" },
  pickInfo: { position: "absolute", bottom: 16, left: 16 },
  pickTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  pickMins: { fontSize: 13, color: "#fff", opacity: 0.85, fontWeight: "500", marginTop: 2 },
  pickPlay: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  /* ==================== CHIPS & SEARCH ==================== */
  chipScroll: { marginBottom: 10, paddingHorizontal: 2 },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 24, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
  chipActive: { borderColor: C.primary },
  chipTxt: { fontSize: 13, fontWeight: "600", color: C.muted },
  chipTxtActive: { color: C.primary, fontWeight: "800" },

  searchWrap: {
    width: "100%",
    height: 44,
    borderRadius: 14,
    borderWidth: 0,
    borderColor: C.border,
    backgroundColor: C.card,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    marginBottom: 14,
  },
  searchWrapFocused: { borderColor: C.primary, borderWidth: 1.5 },
  searchInput: { flex: 1, fontSize: 13, color: C.text, paddingVertical: 0, borderWidth: 0, outlineStyle: "none" },
  searchBtn: { width: 94, height: 44, borderRadius: 14, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  searchBtnTxt: { color: "#fff", fontSize: 12, fontWeight: "800" },

  /* ==================== CLASSIC WORKOUT CARDS ==================== */
  classicWorkoutBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10,  },
  classicWorkoutTextWrap: { flex: 1, paddingRight: 17 },
  classicStartBtn: { backgroundColor: C.primary, minWidth: 72, paddingHorizontal: 12, paddingVertical: 6, marginTop: 0},
  classicWorkoutCard: {
    width: WORKOUT_CARD_W,
    maxWidth: 420,
    height: 280,
    gap: 5,
    margin: 6,
    backgroundColor: C.card,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  classicWorkoutImg: { width: "100%", height: 200, resizeMode: "cover" },
  classicWorkoutInfo: { padding: 13, },
  classicWorkoutTitle: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 6, lineHeight: 20 },

  /* ==================== VIEW ALL & YOU MAY LIKE ==================== */
  viewAllInlineBtn: {
    backgroundColor: C.soft,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.primary,
    marginLeft: 10,
    marginRight: 6,
    height: 42,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllInlineWrap: { height: 260, justifyContent: "center", alignItems: "center" },

  ymlCard: { width: YML_W, backgroundColor: "#fff", borderRadius: 22, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  ymlCardTitle: { fontSize: 17, fontWeight: "700", color: C.text, marginBottom: 10 },
  ymlRow: { flexDirection: "row", alignItems: "center", paddingVertical: 9, gap: 12, borderTopWidth: 1, borderTopColor: C.border },
  ymlRowImg: { width: 62, height: 62, borderRadius: 13, backgroundColor: "#eee" },
  ymlRowInfo: { flex: 1 },
  ymlRowTitle: { fontSize: 13, fontWeight: "700", color: C.text, marginBottom: 3 },
  ymlRowMins: { fontSize: 11, color: C.muted, fontWeight: "500" },

  moreBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.soft, borderRadius: 18, paddingVertical: 15, borderWidth: 1.5, borderColor: C.primary + "30", width: width * 0.95, maxWidth: 220, alignSelf: "center" },
  moreBtnTxt: { fontSize: 15, fontWeight: "800", color: C.primary },

  // Drawer styles moved to components/DrawerMenu.js
});