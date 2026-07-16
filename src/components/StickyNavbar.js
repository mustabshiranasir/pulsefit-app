import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { C } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

export default function StickyNavbar({ navScrolled, onMenuPress, title, subtitle }) {
  const { user } = useAuth();

  return (
    <View style={[styles.navbar, navScrolled && styles.navbarScrolled]}>
      <Pressable onPress={onMenuPress} hitSlop={8}>
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: user?.avatar || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y" }}
            style={styles.avatar}
          />
          <View style={styles.avatarOnline} />
        </View>
      </Pressable>

      <View style={styles.headerCenter}>
        <Text style={[styles.brandName, navScrolled && styles.brandNameScrolled]}>
          {title || "PulseFit"}
        </Text>
        {(!title || subtitle) && (
          <Text style={[styles.brandSub, navScrolled ? styles.brandSubScrolled : { color: C.muted }]}>
            {subtitle || "Female Fitness"}
          </Text>
        )}
      </View>

      <View style={styles.streakBadge}>
        <Text style={styles.streakFire}>🔥</Text>
        <Text style={styles.streakTxt}>1</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 12,
    backgroundColor: C.bg,
    borderBottomWidth: 1.5,
    borderBottomColor: C.primary + "22",
    zIndex: 100,
  },
  navbarScrolled: {
    backgroundColor: C.primary,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  avatarWrap: { position: "relative" },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: C.primary },
  avatarOnline: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  brandName: { fontSize: 22, fontWeight: "900", color: C.text, letterSpacing: -0.4 },
  brandNameScrolled: { color: C.card },
  brandSub: { fontSize: 11, color: C.text, fontWeight: "600", marginTop: 1 },
  brandSubScrolled: { color: "rgba(255,255,255,0.8)" },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3CD",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
    gap: 4,
  },
  streakFire: { fontSize: 14 },
  streakTxt: { fontSize: 14, fontWeight: "800", color: "#E65100" },
});
