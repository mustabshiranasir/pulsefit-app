import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Animated, Modal, TouchableWithoutFeedback, Image, ScrollView, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");
const DRAWER_W = width >= 768 ? 320 : width * 0.8;

const DRAWER_TABS = [
  { id: "Home", label: "Home", icon: "home-outline" },
  { id: "Workout", label: "Workouts", icon: "barbell-outline" },
  { id: "Nutrition", label: "Nutrition", icon: "leaf-outline" },
  { id: "Progress", label: "Report", icon: "stats-chart-outline" },
  { id: "Coach", label: "Assistant", icon: "chatbubbles-outline" },
  { id: "Profile", label: "Profile", icon: "person-outline" },
];

export default function DrawerMenu({ visible, onClose, activeTab, onNavigate }) {
  const { user, signOut } = useAuth();
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -width, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.drawerBackdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.drawerPanel, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.drawerHero}>
          <Image
            source={{ uri: user?.avatar || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y" }}
            style={styles.drawerHeroImg}
            resizeMode="cover"
          />
          <View style={styles.drawerHeroOverlay} />
          <Pressable style={styles.drawerClose} onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>
          <View style={styles.drawerUserInfo}>
            <Text style={styles.drawerName}>{user ? user.name : "Guest"}</Text>
            <View style={styles.drawerBadge}>
              <Text style={styles.drawerBadgeTxt}>🔥 1-day streak</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.drawerNav} showsVerticalScrollIndicator={false}>
          {DRAWER_TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <Pressable
                key={tab.id}
                style={[styles.drawerItem, isActive && styles.drawerItemActive]}
                onPress={() => { onNavigate(tab.id); onClose(); }}
              >
                {isActive && <View style={styles.drawerActiveBar} />}
                <View style={[styles.drawerIconWrap, isActive && styles.drawerIconActive]}>
                  <Ionicons name={tab.icon} size={17} color={isActive ? C.primary : C.muted} />
                </View>
                <Text style={[styles.drawerItemTxt, isActive && styles.drawerItemTxtActive]}>
                  {tab.label}
                </Text>
                {isActive && <Ionicons name="chevron-forward" size={14} color={C.primary} style={{ marginLeft: "auto" }} />}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.drawerFooter}>
          <View style={styles.drawerDivider} />
          <Pressable style={styles.drawerLogout} onPress={() => { signOut(); onClose(); }}>
            <Ionicons name="log-out-outline" size={17} color={C.primary} />
            <Text style={styles.drawerLogoutTxt}>Log Out</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  drawerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.42)" },
  drawerPanel: { position: "absolute", left: 0, top: 0, bottom: 0, width: DRAWER_W, backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 6, height: 0 }, elevation: 12, overflow: "hidden" },
  drawerHero: { width: "100%", height: 200, position: "relative", overflow: "hidden" },
  drawerHeroImg: { width: "100%", height: 350 },
  drawerHeroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(236, 205, 210, 0.45)" },
  drawerClose: { position: "absolute", top: 44, right: 14, width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(0,0,0,0.28)", alignItems: "center", justifyContent: "center" },
  drawerUserInfo: { position: "absolute", bottom: 16, left: 16 },
  drawerName: { fontSize: 17, fontWeight: "900", color: "#fff", marginBottom: 5 },
  drawerBadge: { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" },
  drawerBadgeTxt: { fontSize: 11, color: "#fff", fontWeight: "700" },
  drawerNav: { flex: 1, paddingTop: 8, paddingHorizontal: 10 },
  drawerItem: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 10, borderRadius: 14, gap: 10, position: "relative", marginBottom: 2 },
  drawerItemActive: { backgroundColor: C.soft },
  drawerActiveBar: { position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, backgroundColor: C.primary },
  drawerIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F4F4" },
  drawerIconActive: { backgroundColor: C.primary + "18" },
  drawerItemTxt: { fontSize: 14, fontWeight: "600", color: C.muted },
  drawerItemTxtActive: { fontSize: 14, fontWeight: "800", color: C.text },
  drawerFooter: { paddingHorizontal: 10, paddingBottom: 28 },
  drawerDivider: { height: 1, backgroundColor: C.border, marginBottom: 10 },
  drawerLogout: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 10 },
  drawerLogoutTxt: { fontSize: 14, fontWeight: "700", color: C.primary },
});
