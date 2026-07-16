/**
 * WorkoutsScreen.js – PulseFit Female Fitness
 *
 * Changes from v1:
 *  - Trending Choice cards rebuilt exactly like HomeScreen ChallengeCard
 *    (coloured bg + image top half + title/button bottom half)
 *  - Bottom navbar removed (handled by BottomTabs navigator)
 *  - "New" tab now shows ALL tab sections stacked vertically in one scroll:
 *    New Update banners → Body Focus → Trending Choices →
 *    Fast section → Yoga section → 7 Min section →
 *    Stretch section → For Summer section
 *  - Other tabs (Fast, Yoga, 7 min, Stretch, For summer) still render
 *    their own focused content when selected
 */

import { Ionicons } from "@expo/vector-icons";
import DrawerMenu from "../components/DrawerMenu";
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
  Alert,
} from "react-native";
import { ImageBackground } from "react-native";
import StickyNavbar from "../components/StickyNavbar";
import { addWorkoutStat } from "../storage/fitnessStorage";

const { width } = Dimensions.get("window");

// ─── Theme tokens — identical to HomeScreen ───────────────────────────────────
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

// ─── Layout constants ─────────────────────────────────────────────────────────
const DRAWER_W = width >= 768 ? 320 : width * 0.8;
// Challenge-card dimensions — same ratios as HomeScreen
const CHALLENGE_W = Math.min(width * 0.62, 260);
const CHALLENGE_H = Math.min(width * 0.68, 280);

// ─── Drawer nav items (same as HomeScreen) ────────────────────────────────────
const DRAWER_TABS = [
  { id: "home", label: "Home", icon: "home-outline" },
  { id: "workouts", label: "Workouts", icon: "barbell-outline" },
  { id: "nutrition", label: "Nutrition", icon: "nutrition-outline" },
  { id: "progress", label: "Progress", icon: "stats-chart-outline" },
  { id: "profile", label: "Profile", icon: "person-outline" },
  { id: "settings", label: "Settings", icon: "settings-outline" },
];

// ─── Category tab strip ────────────────────────────────────────────────────────
const WORKOUT_TABS = [
  { id: "new", label: "New", emoji: "🔥" },
  { id: "fast", label: "Fast", emoji: null },
  { id: "yoga", label: "Yoga", emoji: null },
  { id: "7min", label: "7 min", emoji: null },
  { id: "stretch", label: "Stretch", emoji: null },
  { id: "summer", label: "For summer", emoji: null },
];

// ─── Data ─────────────────────────────────────────────────────────────────────

// NEW UPDATE banners — same shape as HomeScreen CHALLENGES
const NEW_BANNERS = [
  {
    id: "n1", tag: "Collection",
    title: "Flexibility & Pain Relief",
    bg: "#C97B6A", accent: "#E8607A",
    image: "https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&w=600",
  },
  {
    id: "n2", tag: "Collection",
    title: "Late Night Workout",
    bg: "#4A6FA5", accent: "#9B72CF",
    image: "https://images.pexels.com/photos/4775193/pexels-photo-4775193.jpeg?auto=compress&w=600",
  },
  {
    id: "n3", tag: "Collection",
    title: "Morning Energy Boost",
    bg: "#2E9E85", accent: "#3BBFA0",
    image: "https://images.pexels.com/photos/3775590/pexels-photo-3775590.jpeg?auto=compress&w=600",
  },
];

// BODY FOCUS circles
const BODY_FOCUS = [
  { id: "belly", label: "Belly", count: 23, image: "https://images.pexels.com/photos/3757377/pexels-photo-3757377.jpeg?auto=compress&w=200" },
  { id: "butt", label: "Butt", count: 18, image: "https://images.pexels.com/photos/3931114/pexels-photo-3931114.jpeg?auto=compress&w=200" },
  { id: "thigh", label: "Thigh", count: 12, image: "https://images.pexels.com/photos/4775193/pexels-photo-4775193.jpeg?auto=compress&w=200" },
  { id: "arm", label: "Arm", count: 10, image: "https://images.pexels.com/photos/3757953/pexels-photo-3757953.jpeg?auto=compress&w=200" },
  { id: "full", label: "Full Body", count: 15, image: "https://images.pexels.com/photos/4775205/pexels-photo-4775205.jpeg?auto=compress&w=200" },
];

/**
 * TRENDING CHOICES — identical data shape to HomeScreen CHALLENGES
 * bg (card background) + accent (pill + button colour) + image
 * Rendered with the exact same ChallengeCard component
 */
const TRENDING = [
  {
    id: "tr1", tag: "Popular",
    title: "For Beginners",
    bg: "#FADADD", accent: "#E8607A",
    image: "https://images.pexels.com/photos/7592293/pexels-photo-7592293.jpeg?auto=compress&w=400",
  },
  {
    id: "tr2", tag: "Hot 🔥",
    title: "Fat Burn",
    bg: "#E8E2FA", accent: "#9B72CF",
    image: "https://images.pexels.com/photos/17898140/pexels-photo-17898140.jpeg?auto=compress&w=400",
  },
  {
    id: "tr3", tag: "Top Pick",
    title: "Core & Abs",
    bg: "#DBFAEF", accent: "#3BBFA0",
    image: "https://images.pexels.com/photos/3764482/pexels-photo-3764482.jpeg?auto=compress&w=400",
  },
  {
    id: "tr4", tag: "Trending",
    title: "Yoga & Stretch",
    bg: "#FBEFE2", accent: "#F4A261",
    image: "https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&w=400",
  },
  {
    id: "tr5", tag: "New",
    title: "HIIT Cardio",
    bg: "#DDF0FC", accent: "#38BDF8",
    image: "https://images.pexels.com/photos/4775205/pexels-photo-4775205.jpeg?auto=compress&w=400",
  },
];

// FAST data
const FAST_HERO = {
  title: "FAT BURNING HIIT",
  mins: "2-7 min",
  bg: "#eabcd0",           // bright pink like screenshot
  image: "https://images.pexels.com/photos/17898140/pexels-photo-17898140.jpeg?auto=compress&w=800",
};

const FAST_RANDOM = [
  {
    id: "f1",
    title: "OFFICE WORKOUT",
    mins: "2-7 min",
    bg: "#B8F0E8",           // light teal/cyan
    image: "https://images.unsplash.com/photo-1685541087053-c9cab78e4a9e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fG9mZmljZSUyMHdvcmtvdXQlMjBnaXJsfGVufDB8fDB8fHww"
  },
  {
    id: "f2",
    title: "BED WORKOUT",
    mins: "2-7 min",
    bg: "#E0D4FF",           // soft purple
    image: "https://images.pexels.com/photos/7592293/pexels-photo-7592293.jpeg?auto=compress&w=600"
  },
];
const FAST_GOALS = [
  { id: "fg1", title: "Lose Weight", image: "https://images.pexels.com/photos/3775590/pexels-photo-3775590.jpeg?auto=compress&w=400" },
  { id: "fg2", title: "Build Muscle", image: "https://images.pexels.com/photos/3764482/pexels-photo-3764482.jpeg?auto=compress&w=400" },
  { id: "fg3", title: "Flat Belly", image: "https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&w=400" },
  { id: "fg4", title: "Toned Arms", image: "https://images.pexels.com/photos/3757953/pexels-photo-3757953.jpeg?auto=compress&w=400" },
  { id: "fg5", title: "Slim Legs", image: "https://images.pexels.com/photos/4775193/pexels-photo-4775193.jpeg?auto=compress&w=400" },
  { id: "fg6", title: "Core Strength", image: "https://images.pexels.com/photos/3776145/pexels-photo-3776145.jpeg?auto=compress&w=400" },
];

// YOGA data
const YOGA_GETTING_STARTED = [
  { id: "y1", title: "EASE YOGA FOR BEGINNERS", mins: "15 Mins", image: "https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&w=400" },
  { id: "y2", title: "SUN SALUTATION FLOW", mins: "12 Mins", image: "https://media.istockphoto.com/id/926101798/photo/opening-the-hips.webp?a=1&b=1&s=612x612&w=0&k=20&c=BO0mIFZ7Eybmcfi8GFcDYQiFS_t0de4RS1-0o0-acsQ=" },
];
const YOGA_STRESS = [
  { id: "ys1", title: "FLEXIBILITY MOVES", mins: "18 Mins", image: "https://images.pexels.com/photos/6160889/pexels-photo-6160889.jpeg?auto=compress&w=400" },
  { id: "ys2", title: "DEEP STRETCH FLOW", mins: "20 Mins", image: "https://images.pexels.com/photos/3776145/pexels-photo-3776145.jpeg?auto=compress&w=400" },
];

// 7 MIN data
const SEVEN_MIN = [
  { id: "7a", title: "7 MIN CLASSIC", mins: "7 Mins", image: "https://images.pexels.com/photos/3757377/pexels-photo-3757377.jpeg?auto=compress&w=300" },
  { id: "7b", title: "7 MIN ABS WORKOUT", mins: "7 Mins", image: "https://images.pexels.com/photos/3764482/pexels-photo-3764482.jpeg?auto=compress&w=300" },
  { id: "7c", title: "7 MIN BUTT WORKOUT", mins: "7 Mins", image: "https://images.pexels.com/photos/3931114/pexels-photo-3931114.jpeg?auto=compress&w=300" },
  { id: "7d", title: "7 MIN THIGH TONER", mins: "7 Mins", image: "https://images.pexels.com/photos/4775193/pexels-photo-4775193.jpeg?auto=compress&w=300" },
  { id: "7e", title: "7 MIN ARM SHAPER", mins: "7 Mins", image: "https://images.pexels.com/photos/3757953/pexels-photo-3757953.jpeg?auto=compress&w=300" },
];

// STRETCH data
const STRETCH_ROUTINES = [
  { id: "sr1", title: "MORNING WARMUP", mins: "4 Mins", bg: "#FEFDD8", image: "https://media.istockphoto.com/id/964053234/photo/sporty-female-doing-gym-exercise.webp?a=1&b=1&s=612x612&w=0&k=20&c=xdZmgM8UNrX7N1nDerT6TjOnSnV7jrV53Lwn3QAAe8Y=" },
  { id: "sr2", title: "SLEEPY TIME STRETCH", mins: "6 Mins", bg: "#EEE6FA", image: "https://images.pexels.com/photos/6603662/pexels-photo-6603662.jpeg?auto=compress&w=300" },
  { id: "sr3", title: "PRE-WORKOUT WARMUP", mins: "3 Mins", bg: "#DDF6F0", image: "https://images.pexels.com/photos/3776145/pexels-photo-3776145.jpeg?auto=compress&w=300" },
];

// FOR SUMMER data
const SUMMER_LIST = [
  { id: "su1", title: "SUMMER ABS BLAST", mins: "14 Mins", image: "https://images.unsplash.com/photo-1759476598772-fda6a2abc803?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  { id: "su2", title: "SUMMER THIGH SLIMMER", mins: "8 Mins", image: "https://media.istockphoto.com/id/2206223281/photo/stay-fit-stay-healthy.webp?a=1&b=1&s=612x612&w=0&k=20&c=tQMPjwfUmvvSwP5W6sEGIhM8ra7SKLnkTXz_pw4SbdI=" },
  { id: "su3", title: "BIKINI WORKOUT", mins: "7 Mins", image: "https://images.unsplash.com/photo-1648139206922-8285007b7959?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjd8fGJpa2luaSUyMHdvcmtvdXQlMjBnaXJsfGVufDB8fDB8fHww" },
  { id: "su4", title: "BEACH CARDIO BLAST", mins: "10 Mins", image: "https://plus.unsplash.com/premium_photo-1770372176068-0a683bc16bbd?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
];

// DrawerMenu moved to src/components/DrawerMenu.js

// ─── ChallengeCard — exact copy from HomeScreen ───────────────────────────────
// Used for BOTH New Update banners AND Trending Choices so layout is 100% identical
function ChallengeCard({ item, navigation }) {
  return (
    <Pressable style={[styles.challengeCard, { backgroundColor: item.bg }]} onPress={() => navigation.navigate("WorkoutDetail", { workout: item })}>
      {/* Coloured tag pill — top-left */}
      <View style={[styles.challengeTagPill, { backgroundColor: item.accent + "22" }]}>
        <Text style={[styles.challengeTagTxt, { color: item.accent }]}>{item.tag}</Text>
      </View>
      {/* Image fills top 62% of card */}
      <Image source={{ uri: item.image }} style={styles.challengeImg} resizeMode="cover" />
      {/* Bottom Content */}
      <View style={styles.challengeContent}>
        <Text style={styles.challengeTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Pressable
          style={[
            styles.startBtn,
            { backgroundColor: item.accent },
          ]}
          onPress={() => navigation.navigate("WorkoutDetail", { workout: item })}
        >
          <Text style={styles.startBtnTxt}>Start</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

// ─── Body-focus circle ────────────────────────────────────────────────────────
function BodyFocusCircle({ item, onPress }) {
  return (
    <Pressable style={styles.bodyFocusItem} onPress={onPress}>
      <View style={styles.bodyFocusCircle}>
        <Image source={{ uri: item.image }} style={styles.bodyFocusImg} />
      </View>
      <Text style={styles.bodyFocusLabel}>{item.label}</Text>
      <Text style={styles.bodyFocusCount}>{item.count} Workouts</Text>
    </Pressable>
  );
}

// ─── List row — image left, title + duration right ────────────────────────────
function WorkoutListRow({ item, navigation }) {
  return (
    <Pressable style={styles.listRow} onPress={() => navigation.navigate("WorkoutDetail", { workout: item })}>
      <Image source={{ uri: item.image }} style={styles.listRowImg} />
      <View style={styles.listRowInfo}>
        <Text style={styles.listRowTitle}>{item.title}</Text>
        <Text style={styles.listRowMins}>{item.mins}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={C.muted} />
    </Pressable>
  );
}

// ─── Full-image 2-col card (yoga, fast random) ────────────────────────────────
function TwoColCard({ item, navigation }) {
  return (
    <Pressable style={styles.twoColCard} onPress={() => navigation.navigate("WorkoutDetail", { workout: item })}>
      <Image source={{ uri: item.image }} style={styles.twoColImg} />
      <View style={styles.twoColOverlay} />
      <View style={styles.twoColInfo}>
        <Text style={styles.twoColTitle}>{item.title}</Text>
        {item.mins ? <Text style={styles.twoColMins}>{item.mins}</Text> : null}
      </View>
    </Pressable>
  );
}

// ─── Coloured stretch routine card ────────────────────────────────────────────
function StretchCard({ item, navigation }) {
  return (
    <Pressable style={[styles.stretchCard, { backgroundColor: item.bg }]} onPress={() => navigation.navigate("WorkoutDetail", { workout: item })}>
      <Text style={styles.stretchCardTitle}>{item.title}</Text>
      <Text style={styles.stretchCardMins}>{item.mins}</Text>
      <Image source={{ uri: item.image }} style={styles.stretchCardImg} />
    </Pressable>
  );
}

// ─── Labelled divider between sections in the "New" all-in-one view ──────────
function SectionDivider({ label }) {
  return (
    <View style={styles.sectionDividerWrap}>
      <View style={styles.sectionDividerLine} />
      <Text style={styles.sectionDividerTxt}>{label}</Text>
      <View style={styles.sectionDividerLine} />
    </View>
  );
}

// ─── Shared section header ────────────────────────────────────────────────────
function SectionHeader({ title, onViewAll }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onViewAll && (
        <Pressable onPress={onViewAll}>
          <Text style={styles.viewAll}>View all</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION BLOCKS — each exported so "New" can embed all of them
// ─────────────────────────────────────────────────────────────────────────────

function NewSection({ navigation }) {
  return (
    <>
      {/* Horizontal ChallengeCards */}
      <SectionHeader title="NEW UPDATE" onViewAll={() => { }} />
      <FlatList
        data={NEW_BANNERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ gap: 14, paddingBottom: 4 }}
        style={{ marginBottom: 26 }}
        renderItem={({ item }) => <ChallengeCard item={item} navigation={navigation} />}
      />

      {/* Body Focus circles */}
      <SectionHeader title="BODY FOCUS" />
      <FlatList
        data={BODY_FOCUS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ gap: 18, paddingBottom: 4 }}
        style={{ marginBottom: 26 }}
        renderItem={({ item }) => <BodyFocusCircle item={item} navigation={navigation} />}
      />

      {/* Trending Choices — same ChallengeCard component */}
      <SectionHeader title="TRENDING CHOICES" onViewAll={() => { }} />
      <FlatList
        data={TRENDING}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ gap: 14, paddingBottom: 4 }}
        style={{ marginBottom: 10 }}
        renderItem={({ item }) => <ChallengeCard item={item} navigation={navigation} />}
      />
    </>
  );
}

function FastSection({ navigation }) {
  return (
    <>
      <Text style={styles.tabSubtitle}>Not enough time?</Text>
      <Text style={[styles.tabSubSubtitle, { marginBottom: 18 }]}>
        2–7 min workout. Do it anytime, anywhere.
      </Text>

      {/* HERO - FAT BURNING HIIT (matches screenshot) */}
      <Pressable 
        style={[styles.fastHeroNew, { backgroundColor: FAST_HERO.bg }]}
        onPress={() => navigation.navigate("WorkoutDetail", { workout: FAST_HERO })}
      >
        <View style={styles.fastHeroTextWrapNew}>
          <Text style={styles.fastHeroTitleNew}>{FAST_HERO.title}</Text>
          <Text style={styles.fastHeroMinsNew}>{FAST_HERO.mins}</Text>
        </View>
        <Image
          source={{ uri: FAST_HERO.image }}
          style={styles.fastHeroImgNew}
          resizeMode="cover"
        />
      </Pressable>

      {/* RANDOM WORKOUT */}
      <SectionHeader title="RANDOM WORKOUT" />

      <View style={styles.twoColRow}>
        {FAST_RANDOM.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.fastRandomCardNew, { backgroundColor: item.bg }]}
            onPress={() => navigation.navigate("WorkoutDetail", { workout: item })}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.fastRandomImgNew}
              resizeMode="cover"
            />
            <View style={styles.fastRandomTextWrapNew}>
              <Text style={styles.fastRandomTitleNew}>{item.title}</Text>
              <Text style={styles.fastRandomMinsNew}>{item.mins}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* TRAINING GOALS - keep as is or adjust if needed */}
      <SectionHeader title="TRAINING GOAL" />

      <FlatList
        data={FAST_GOALS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ gap: 15, }}
        renderItem={({ item }) => (
          <Pressable 
            style={styles.fastGoalCard}
            onPress={() => navigation.navigate("WorkoutDetail", { workout: item })}
          >
            <Image source={{ uri: item.image }} style={styles.fastGoalImg} />
            <View style={styles.fastGoalOverlay} />
            <Text style={styles.fastGoalTitle}>{item.title}</Text>
          </Pressable>
        )}
      />
    </>
  );
}

function YogaSection({ navigation }) {
  return (
    <>
      <View style={styles.accentBar} />
      <Text style={[styles.tabSubtitle, { marginBottom: 22 }]}>
        Activate your body with basic yoga asanas. Improve your flexibility and reduce chronic pain and stress.
      </Text>

      <SectionHeader title="GETTING STARTED" />
      <View style={[styles.twoColRow, { marginBottom: 20 }]}>
        {YOGA_GETTING_STARTED.map((item) => <TwoColCard key={item.id} item={item} navigation={navigation} />)}
      </View>

      <SectionHeader title="STRESS RELIEF AND RELAX" />
      <View style={[styles.twoColRow, { marginBottom: 10 }]}>
        {YOGA_STRESS.map((item) => <TwoColCard key={item.id} item={item} navigation={navigation} />)}
      </View>
    </>
  );
}

function SevenMinSection({ navigation }) {
  return (
    <>
      <View style={styles.accentBar} />
      <Text style={[styles.tabSubtitle, { marginBottom: 22 }]}>
        In just 7 min a day, simple, fast, and efficient workouts help improve your fitness and health.
      </Text>
      {SEVEN_MIN.map((item) => <WorkoutListRow key={item.id} item={item} navigation={navigation} />)}
      <View style={{ height: 10 }} />
    </>
  );
}

function StretchSection({ navigation }) {
  return (
    <>
      <View style={styles.accentBar} />
      <Text style={[styles.tabSubtitle, { marginBottom: 22 }]}>
        Stretch your arm, shoulder, chest and back. Loosen muscles and improve flexibility.
      </Text>

      <SectionHeader title="ROUTINES" />

      <FlatList
        data={STRETCH_ROUTINES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ gap: 14, paddingBottom: 10 }}
        style={{ marginBottom: 20 }}
        renderItem={({ item }) => <StretchCardNew item={item} navigation={navigation} />}
      />
    </>
  );
}
// ─── New Stretch Card: Full Width Image at Top + Text at Bottom ─────────────
function StretchCardNew({ item, navigation }) {
  return (
    <Pressable 
      style={[styles.stretchCardNew, { backgroundColor: item.bg }]}
      onPress={() => navigation.navigate("WorkoutDetail", { workout: item })}
    >
      {/* Full width image at top */}
      <Image
        source={{ uri: item.image }}
        style={styles.stretchCardNewImg}
        resizeMode="cover"
      />

      {/* Bottom content area */}
      <View style={styles.stretchCardNewBottom}>
        <Text style={styles.stretchCardNewTitle}>{item.title}</Text>
        <Text style={styles.stretchCardNewMins}>{item.mins}</Text>
      </View>
    </Pressable>
  );
}

function SummerSection({ navigation }) {
  return (
    <>
      <View style={styles.accentBar} />
      <Text style={[styles.tabSubtitle, { marginBottom: 22 }]}>
        Flatten your belly, lift your booty, slim your legs, get you bikini ready before summer starts!
      </Text>
      {SUMMER_LIST.map((item) => <WorkoutListRow key={item.id} item={item} navigation={navigation} />)}
      <View style={{ height: 10 }} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB CONTENT ROUTER
// "new" → all sections stacked in one vertical scroll
// other tabs → only their own section
// ─────────────────────────────────────────────────────────────────────────────
function TabContent({ tabId, navigation }) {
  if (tabId === "new") {
    return (
      <>
        <NewSection navigation={navigation} />
        <SectionDivider label="FAST WORKOUTS" />
        <FastSection navigation={navigation} />
        <SectionDivider label="YOGA" />
        <YogaSection navigation={navigation} />
        <SectionDivider label="7 MIN WORKOUTS" />
        <SevenMinSection navigation={navigation} />
        <SectionDivider label="STRETCH" />
        <StretchSection navigation={navigation} />
        <SectionDivider label="FOR SUMMER" />
        <SummerSection navigation={navigation} />
      </>
    );
  }
  if (tabId === "fast") return <FastSection navigation={navigation} />;
  if (tabId === "yoga") return <YogaSection navigation={navigation} />;
  if (tabId === "7min") return <SevenMinSection navigation={navigation} />;
  if (tabId === "stretch") return <StretchSection navigation={navigation} />;
  if (tabId === "summer") return <SummerSection navigation={navigation} />;
  return null;
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function WorkoutsScreen({ navigation }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState("workouts");
  const [activeWorkoutTab, setActiveWorkoutTab] = useState("new");
  const [searchText, setSearchText] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  const handleDrawerNavigate = useCallback((tabId) => {
    setActiveDrawerTab(tabId);
    navigation.navigate(tabId);
  }, [navigation]);

  const handleScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    setNavScrolled(y > 12);
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Navbar ── */}
      <StickyNavbar
        navScrolled={navScrolled}
        onMenuPress={() => setDrawerOpen(true)}
        title="WORKOUTS"
      />

      {/* ── Drawer ── */}
      <DrawerMenu
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeTab={activeDrawerTab}
        onNavigate={handleDrawerNavigate}
      />

      {/* ── Main scroll ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        nestedScrollEnabled
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.responsiveContainer}>
          {/* Search bar */}
          <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocused]}>
            <Ionicons name="search-outline" size={16} color={C.muted} style={{ marginRight: 8 }} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="SEARCH WORKOUTS"
              placeholderTextColor={C.muted}
              style={styles.searchInput}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              underlineColorAndroid="transparent"
            />
            <Pressable style={styles.searchIconBtn}>
              <Ionicons name="options-outline" size={18} color={C.primary} />
            </Pressable>
          </View>

          {/* Category tab strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catTabStrip}
            style={{ marginBottom: 20 }}
          >
            {WORKOUT_TABS.map((tab) => {
              const isActive = tab.id === activeWorkoutTab;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveWorkoutTab(tab.id)}
                  style={styles.catTabItem}
                >
                  <Text style={[styles.catTabTxt, isActive && styles.catTabTxtActive]}>
                    {tab.emoji ? `${tab.emoji} ` : ""}{tab.label}
                  </Text>
                  {isActive && <View style={styles.catTabUnderline} />}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Render the active tab content */}
          <TabContent tabId={activeWorkoutTab} navigation={navigation} />

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingVertical: 10 },
  responsiveContainer: { width: '100%', maxWidth: 768, alignSelf: 'center', paddingHorizontal: 15 },

  // ── Sticky navbar (identical to HomeScreen) ──
  // Moved to StickyNavbar.js

  // ── Search ──
  searchWrap: {
    width: "100%", height: 46, borderRadius: 14,
    backgroundColor: C.card, flexDirection: "row", alignItems: "center",
    paddingLeft: 12, marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.04,
    shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  searchWrapFocused: { borderWidth: 1.5, borderColor: C.primary },
  searchInput: { flex: 1, fontSize: 12, fontWeight: "700", letterSpacing: 0.8, color: C.muted },
  searchIconBtn: {
    width: 44, height: 46, alignItems: "center", justifyContent: "center",
    borderLeftWidth: 1, borderLeftColor: C.border,
  },

  // ── Category tab strip ──
  catTabStrip: { gap: 4, paddingHorizontal: 2 },
  catTabItem: { alignItems: "center", paddingHorizontal: 8, paddingBottom: 6 },
  catTabTxt: { fontSize: 15, fontWeight: "600", color: C.muted },
  catTabTxtActive: { fontSize: 16, fontWeight: "900", color: C.text },
  catTabUnderline: {
    height: 3, width: "100%", borderRadius: 2,
    backgroundColor: C.primary, marginTop: 4,
  },

  // ── Common section header ──
  sectionRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: C.text, letterSpacing: 0.5 },
  viewAll: { fontSize: 13, fontWeight: "700", color: C.primary, marginTop: 2 },

  // ── Section divider (between blocks in New tab) ──
  sectionDividerWrap: {
    flexDirection: "row", alignItems: "center",
    gap: 10, marginTop: 28, marginBottom: 24,
  },
  sectionDividerLine: { flex: 1, height: 1.5, backgroundColor: C.primary + "33", borderRadius: 1 },
  sectionDividerTxt: { fontSize: 12, fontWeight: "900", color: C.primary, letterSpacing: 1.2 },

  // ── Accent bar (pink line above description text) ──
  accentBar: { width: 70, height: 3, borderRadius: 2, backgroundColor: C.primary, marginBottom: 14, letterSpacing: 0.5, },

  // ── Tab description text ──
  tabSubtitle: { fontSize: 16, color: C.text, lineHeight: 22, fontWeight: "200", marginBottom: 12 },
  tabSubSubtitle: { fontSize: 13, color: C.muted, fontWeight: "500", lineHeight: 12, marginBottom: 20 },
  // ────────────────────────────────────────────────────────────────────────────
  // ChallengeCard — EXACT copy of HomeScreen
  // Image fills top 62%, title + button in remaining 38%
  // ────────────────────────────────────────────────────────────────────────────
  challengeCard: {
    width: CHALLENGE_W,
    height: CHALLENGE_H,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  challengeTagPill: {
    position: "absolute", top: 10, left: 10, zIndex: 2,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  challengeTagTxt: { fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },
  challengeImg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  }, challengeBottom: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 10,
    justifyContent: "space-between",
  },
  challengeTitle: { fontSize: 14, fontWeight: "800", color: C.text, lineHeight: 19, marginBottom: 6 },
  startBtn: { borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  startBtnTxt: { fontSize: 13, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  challengeContent: {
    position: "absolute",
    bottom: 16,
    left: 14,
    right: 14,
  },

  challengeTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 18,
    marginBottom: 14,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  // ── Body focus circles ──
  bodyFocusItem: { alignItems: "center", width: 80 },
  bodyFocusCircle: { width: 72, height: 72, borderRadius: 36, overflow: "hidden", marginBottom: 6 },
  bodyFocusImg: { width: "100%", height: "100%", resizeMode: "cover" },
  bodyFocusLabel: { fontSize: 13, fontWeight: "800", color: C.text },
  bodyFocusCount: { fontSize: 10, color: C.muted, fontWeight: "500", marginTop: 1 },

  // ── Generic 2-col row wrapper ──
  twoColRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
    justifyContent: "center",     // Centers the cards
    alignItems: "center",
    flexWrap: "wrap",             // Good fallback for small screens
    paddingHorizontal: 8,
  },
  // ── Full-image 2-col card ──
  twoColCard: {
    width: 192,                    // Fixed width = consistent centering
    height: 199,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  twoColImg: { ...StyleSheet.absoluteFillObject, resizeMode: "cover" },
  twoColOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  twoColInfo: { position: "absolute", bottom: 12, left: 12 },
  twoColTitle: { fontSize: 13, fontWeight: "900", color: "#fff", lineHeight: 18 },
  twoColMins: { fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: "500", marginTop: 3 },

  // ── NEW HERO (Clean pink card like screenshot) ──
  fastHeroNew: {
    width: "100%", maxWidth: 500,
    height: 200,
    borderRadius: 22,
    overflow: "hidden",
    flexDirection: "row",
    marginBottom: 26,
    position: "relative", alignItems: "center",
    //adding the grey overlay 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  fastHeroTextWrapNew: {
    position: "absolute", bottom: 1, left: 20, right: 20,
    zIndex: 2, paddingBottom: 10,
  },
  fastHeroTitleNew: {
    fontSize: 21,
    fontWeight: "900",
    color: "#f8f8fb",
    lineHeight: 24,
    marginBottom: 6,
    textShadowColor: "rgba(0,0,0,0.45)",
  },
  fastHeroMinsNew: {
    fontSize: 14,
    color: "#b0afaf",
    fontWeight: "700",
  },
  fastHeroImgNew: {
    position: "absolute",
    right: -20,
    bottom: -10,
    width: "110%",
    height: "110%",
    resizeMode: "cover",
  },

  // ── NEW RANDOM CARDS (light bg + clean image) ──
  fastRandomCardNew: {
    flex: 1,
    height: 168,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    margin: 15,
  },
  fastRandomImgNew: {
    width: "100%", position: "absolute",
    height: "100%", style: "cover",
  },
  fastRandomTextWrapNew: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 2,
  },
  fastRandomTitleNew: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1C1C2E",
    lineHeight: 18,
  },
  fastRandomMinsNew: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginTop: 4,
  },
  // ── Fast goal 2-col cards ──
  fastGoalCard: {
    marginBottom: 20, marginTop: 20,

    width: 140,
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 12,
  },

  fastGoalImg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  fastGoalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  fastGoalTitle: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    color: "#fff",
    fontWeight: "900",
    fontSize: 13,
  },
  // ── Workout list rows (7 min / summer) ──
  listRow: {
    flexDirection: "row", alignItems: "center",
    gap: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  listRowImg: { width: 90, height: 66, borderRadius: 12, resizeMode: "cover" },
  listRowInfo: { flex: 1 },
  listRowTitle: { fontSize: 15, fontWeight: "900", color: C.text, lineHeight: 20 },
  listRowMins: { fontSize: 12, color: C.muted, fontWeight: "500", marginTop: 4 },


  // ── New Stretch Card: Image Top + Text Bottom ──
  stretchCardNew: {
    width: 178 * 1.1,
    height: 205,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  stretchCardNewImg: {
    width: "100%",
    height: "68%",           // Image takes top ~68%
    resizeMode: "cover",
  },
  stretchCardNewBottom: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: "center",
  },
  stretchCardNewTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: C.text,
    lineHeight: 19,
    marginBottom: 4,
  },
  stretchCardNewMins: {
    fontSize: 13,
    color: C.muted,
    fontWeight: "600",
  },

  // ── Drawer (identical to HomeScreen) ──
  drawerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.42)" },
  drawerPanel: {
    position: "absolute", left: 0, top: 0, bottom: 0, width: DRAWER_W,
    backgroundColor: "#fff",
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 20,
    shadowOffset: { width: 6, height: 0 }, elevation: 12, overflow: "hidden",
  },
  drawerHero: { width: "100%", height: 200, position: "relative", overflow: "hidden" },
  drawerHeroImg: { width: "100%", height: 350 },
  drawerHeroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(236,205,210,0.45)" },
  drawerClose: {
    position: "absolute", top: 44, right: 14,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center", justifyContent: "center",
  },
  drawerUserInfo: { position: "absolute", bottom: 16, left: 16 },
  drawerName: { fontSize: 17, fontWeight: "900", color: "#fff", marginBottom: 5 },
  drawerBadge: {
    backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start",
  },
  drawerBadgeTxt: { fontSize: 11, color: "#fff", fontWeight: "700" },
  drawerNav: { flex: 1, paddingTop: 8, paddingHorizontal: 10 },
  drawerItem: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 13, paddingHorizontal: 10,
    borderRadius: 14, gap: 10, position: "relative", marginBottom: 2,
  },
  drawerItemActive: { backgroundColor: C.soft },
  drawerActiveBar: {
    position: "absolute", left: 0, top: 8, bottom: 8,
    width: 3, borderRadius: 2, backgroundColor: C.primary,
  },
  drawerIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center", backgroundColor: "#F4F4F4",
  },
  drawerIconActive: { backgroundColor: C.primary + "18" },
  drawerItemTxt: { fontSize: 14, fontWeight: "600", color: C.muted },
  drawerItemTxtActive: { fontSize: 14, fontWeight: "800", color: C.text },
  drawerFooter: { paddingHorizontal: 10, paddingBottom: 28 },
  drawerDivider: { height: 1, backgroundColor: C.border, marginBottom: 10 },
  drawerLogout: {
    flexDirection: "row", alignItems: "center",
    gap: 10, paddingVertical: 12, paddingHorizontal: 10,
  },
  drawerLogoutTxt: { fontSize: 14, fontWeight: "700", color: C.primary },
});