import React, { useState, useCallback, useRef } from "react";
import {
  SafeAreaView, ScrollView, View, Text, StyleSheet,
  Pressable, Image, Dimensions, Alert, Modal,
  KeyboardAvoidingView, Platform, Switch, TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { C } from "../theme/colors";
import DrawerMenu from "../components/DrawerMenu";
import StickyNavbar from "../components/StickyNavbar";
import {
  getWorkoutStats, getProfile, saveProfile,
  getSettings, saveSettings, resetAllData, saveWeight
} from "../storage/fitnessStorage";
import { useAuth } from "../context/AuthContext";
import * as ImagePicker from "expo-image-picker";

const { width } = Dimensions.get("window");
const ITEM_H = 44;

// ─── Drum column ──────────────────────────────────────────────────────────────
const DrumColumn = ({ data, selected, onSelect, label, colWidth = 100 }) => {
  const ref = useRef(null);
  return (
    <View style={{ alignItems: "center", width: colWidth }}>
      {label ? <Text style={drum.label}>{label}</Text> : null}
      <View style={drum.wrap}>
        <View style={drum.highlight} pointerEvents="none" />
        <ScrollView
          ref={ref}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
            onSelect(data[Math.max(0, Math.min(i, data.length - 1))]);
          }}
          onLayout={() => {
            const idx = data.indexOf(selected);
            if (idx >= 0) ref.current?.scrollTo({ y: idx * ITEM_H, animated: false });
          }}
        >
          {data.map((item) => (
            <Pressable
              key={item}
              style={drum.item}
              onPress={() => {
                onSelect(item);
                ref.current?.scrollTo({ y: data.indexOf(item) * ITEM_H, animated: true });
              }}
            >
              <Text style={[drum.txt, selected === item && drum.txtActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const drum = StyleSheet.create({
  label: { fontSize: 10, fontWeight: "600", color: "#9B8E93", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  wrap: { height: ITEM_H * 5, overflow: "hidden", position: "relative", width: "100%" },
  highlight: {
    position: "absolute", top: ITEM_H * 2, left: 0, right: 0,
    height: ITEM_H, borderRadius: 10,
    backgroundColor: "#E8607A08",
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#E8607A20",
    zIndex: 1,
  },
  item: { height: ITEM_H, alignItems: "center", justifyContent: "center" },
  txt: { fontSize: 16, fontWeight: "500", color: "#C0B0B8" },
  txtActive: { fontSize: 18, fontWeight: "700", color: "#E8607A" },
});

// ─── Stepper ──────────────────────────────────────────────────────────────────
const Stepper = ({ value, onChange, min = 0, max = 300, step = 5, unit = "s" }) => (
  <View style={step_.row}>
    <Pressable style={step_.btn} onPress={() => onChange(Math.max(min, value - step))}>
      <Ionicons name="remove" size={20} color="#E8607A" />
    </Pressable>
    <View style={step_.mid}>
      <Text style={step_.val}>{value}</Text>
      <Text style={step_.unit}>{unit}</Text>
    </View>
    <Pressable style={step_.btn} onPress={() => onChange(Math.min(max, value + step))}>
      <Ionicons name="add" size={20} color="#E8607A" />
    </Pressable>
  </View>
);

const step_ = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20 },
  btn: {
    width: 44, height: 44, borderRadius: 14, borderWidth: 1,
    borderColor: "#E8607A30", backgroundColor: "#FFF8F9",
    alignItems: "center", justifyContent: "center",
  },
  mid: { alignItems: "center", minWidth: 72 },
  val: { fontSize: 36, fontWeight: "700", color: "#2D1B20", lineHeight: 42 },
  unit: { fontSize: 12, fontWeight: "600", color: "#9B8E93", marginTop: -2 },
});

// ─── Segmented ────────────────────────────────────────────────────────────────
const Seg = ({ options, selected, onSelect }) => (
  <View style={seg.wrap}>
    {options.map((o) => (
      <Pressable key={o} style={[seg.opt, selected === o && seg.optActive]} onPress={() => onSelect(o)}>
        <Text style={[seg.txt, selected === o && seg.txtActive]}>{o}</Text>
      </Pressable>
    ))}
  </View>
);

const seg = StyleSheet.create({
  wrap: { flexDirection: "row", backgroundColor: "#F5F0F2", borderRadius: 12, padding: 3, marginBottom: 18 },
  opt: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  optActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  txt: { fontSize: 13, fontWeight: "600", color: "#9B8E93" },
  txtActive: { fontWeight: "700", color: "#E8607A" },
});

// ─── Sheet wrapper — compact, no emoji ───────────────────────────────────────
const Sheet = ({ visible, title, onClose, onConfirm, confirmLabel = "Save", children }) => (
  <Modal visible={visible} transparent animationType="slide">
    <Pressable style={sh.overlay} onPress={onClose}>
      <Pressable style={sh.card} onPress={(e) => e.stopPropagation()}>
        <View style={sh.handle} />
        <View style={sh.header}>
          <Text style={sh.title}>{title}</Text>
          <Pressable style={sh.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={18} color="#9B8E93" />
          </Pressable>
        </View>
        <View style={sh.body}>{children}</View>
        <View style={sh.footer}>
          <Pressable style={sh.cancelBtn} onPress={onClose}>
            <Text style={sh.cancelTxt}>Cancel</Text>
          </Pressable>
          <Pressable style={sh.confirmBtn} onPress={onConfirm}>
            <Text style={sh.confirmTxt}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

const sh = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "85%",
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#E5DDE0", alignSelf: "center", marginTop: 12, marginBottom: 4 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: "#F0E8EB" },
  title: { fontSize: 15, fontWeight: "700", color: "#2D1B20" },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F5F0F2", alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: 20, paddingVertical: 18 },
  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 10 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: "#F5F0F2", alignItems: "center" },
  cancelTxt: { fontSize: 14, fontWeight: "700", color: "#9B8E93" },
  confirmBtn: { flex: 1.6, paddingVertical: 13, borderRadius: 14, backgroundColor: "#E8607A", alignItems: "center" },
  confirmTxt: { fontSize: 14, fontWeight: "700", color: "#fff" },
});

// ─── Data ─────────────────────────────────────────────────────────────────────
const THEMES = [
  { name: "Rose Pink",    primary: "#E8607A" },
  { name: "Ocean Blue",   primary: "#4A90E2" },
  { name: "Forest Green", primary: "#3BBFA0" },
  { name: "Sunshine",     primary: "#F4A261" },
  { name: "Purple Night", primary: "#9B72CF" },
  { name: "Coral",        primary: "#FF6B6B" },
];
const GENDERS   = ["Female", "Male", "Non-binary", "Prefer not to say"];
const LANGUAGES = ["English", "Spanish", "French", "German", "Urdu", "Arabic"];
const UNITS_OPT = ["Metric (kg, m)", "Imperial (lb, ft)"];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { user, signOut, updateUser } = useAuth();
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState("Profile");
  const [navScrolled, setNavScrolled] = useState(false);
  const [stats, setStats]             = useState({ workouts: 0, kcal: 0, minutes: 0 });
  const [profile, setProfile]         = useState({
    name: "Your Name", email: "your@email.com", gender: "Female",
    birthYear: "2000", height: "5ft 2in", weight: "55 kg", goal: "50",
  });
  const [settings, setSettings] = useState({
    reminderTime: "20:00", restTime: "30", countdownTime: "10",
    soundEnabled: true, language: "English", units: "Metric (kg, m)", theme: "Rose Pink",
  });

  // Picker visibility
  const [showBirthYear,  setShowBirthYear]  = useState(false);
  const [showReminder,   setShowReminder]   = useState(false);
  const [showRest,       setShowRest]       = useState(false);
  const [showCountdown,  setShowCountdown]  = useState(false);
  const [showGender,     setShowGender]     = useState(false);
  const [showLanguage,   setShowLanguage]   = useState(false);
  const [showUnits,      setShowUnits]      = useState(false);
  const [showTheme,      setShowTheme]      = useState(false);
  const [showHeight,     setShowHeight]     = useState(false);
  const [showWeight,     setShowWeight]     = useState(false);
  const [showGoal,       setShowGoal]       = useState(false);
  const [showText,       setShowText]       = useState(false);
  const [textKey,        setTextKey]        = useState("");
  const [textLabel,      setTextLabel]      = useState("");
  const [textVal,        setTextVal]        = useState("");

  // Temp values
  const [tempYear,      setTempYear]      = useState("2000");
  const [tempHour,      setTempHour]      = useState("20");
  const [tempMin,       setTempMin]       = useState("00");
  const [tempRest,      setTempRest]      = useState(30);
  const [tempCountdown, setTempCountdown] = useState(10);
  const [heightUnit,    setHeightUnit]    = useState("ft");
  const [tempFt,        setTempFt]        = useState("5");
  const [tempIn,        setTempIn]        = useState("2");
  const [tempCm,        setTempCm]        = useState("160");
  const [weightUnit,    setWeightUnit]    = useState("kg");
  const [tempWeight,    setTempWeight]    = useState("55");
  const [tempGoal,      setTempGoal]      = useState(50);

  const years   = Array.from({ length: 80  }, (_, i) => (new Date().getFullYear() - 5 - i).toString());
  const hours   = Array.from({ length: 24  }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];
  const feetOpt = ["4", "5", "6", "7"];
  const inchOpt = Array.from({ length: 12 }, (_, i) => i.toString());
  const cmOpt   = Array.from({ length: 151 }, (_, i) => (100 + i).toString());
  const kgOpt   = Array.from({ length: 201 }, (_, i) => (20 + i).toString());
  const lbOpt   = Array.from({ length: 441 }, (_, i) => (44 + i).toString());

  useFocusEffect(useCallback(() => {
    (async () => {
      const [s, p, sett] = await Promise.all([getWorkoutStats(), getProfile(), getSettings()]);
      setStats(s); setProfile(p); setSettings(sett);
      if (p.birthYear) setTempYear(p.birthYear);
      if (sett.restTime) setTempRest(parseInt(sett.restTime) || 30);
      if (sett.countdownTime) setTempCountdown(parseInt(sett.countdownTime) || 10);
    })();
  }, []));

  const handleScroll = (e) => setNavScrolled(e.nativeEvent.contentOffset.y > 12);

  const saveP = async (key, value) => {
    const u = { ...profile, [key]: value };
    setProfile(u); await saveProfile(u); await updateUser({ [key]: value });
  };

  const saveS = async (key, value) => {
    const u = { ...settings, [key]: value };
    setSettings(u); await saveSettings(u);
  };

  const toggleSetting = async (key) => {
    const u = { ...settings, [key]: !settings[key] };
    setSettings(u); await saveSettings(u);
  };

  const openText = (src, key, label, val) => {
    setTextKey(`${src}::${key}`); setTextLabel(label); setTextVal(val); setShowText(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      await saveP("avatar", uri);
    }
  };

  const handleReset = () => Alert.alert("Reset Progress", "Permanently delete all data?", [
    { text: "Cancel", style: "cancel" },
    { text: "Reset", style: "destructive", onPress: async () => {
      await resetAllData();
      const [p, sett] = await Promise.all([getProfile(), getSettings()]);
      setStats({ workouts: 0, kcal: 0, minutes: 0 }); setProfile(p); setSettings(sett);
    }},
  ]);

  // BMI
  const parseH = (h) => {
    if (!h) return 0;
    const s = h.toLowerCase();
    if (s.includes("cm")) { const m = s.match(/(\d+)/); return m ? parseInt(m[1]) / 100 : 0; }
    const ft = s.match(/(\d+)\s*(ft|')/); const inch = s.match(/(\d+)\s*(in|")/);
    let meters = 0;
    if (ft) meters += parseInt(ft[1]) * 0.3048;
    if (inch) meters += parseInt(inch[1]) * 0.0254;
    if (meters === 0) { const n = parseFloat(h); if (!isNaN(n)) meters = n; }
    return meters;
  };
  const parseW = (w) => {
    if (!w) return 0;
    const n = parseFloat(w.match(/(\d+(\.\d+)?)/)?.[1] || "0");
    return w.toLowerCase().includes("lb") ? n * 0.453592 : n;
  };
  const bmiVal = (() => {
    const wKg = parseW(profile.weight); const hM = parseH(profile.height);
    if (!wKg || !hM) return "—";
    return (wKg / (hM * hM)).toFixed(1);
  })();
  const bmiLabel = (() => {
    const v = parseFloat(bmiVal);
    if (isNaN(v)) return "";
    if (v < 18.5) return "Underweight"; if (v < 25) return "Normal";
    if (v < 30) return "Overweight"; return "Obese";
  })();

  const Row = ({ icon, label, value, onPress, isLast = false, rightNode = null }) => (
    <Pressable onPress={onPress} style={[s.row, !isLast && s.rowBorder]}>
      <View style={s.rowLeft}>
        <View style={s.iconWrap}><Ionicons name={icon} size={16} color="#E8607A" /></View>
        <Text style={s.rowLabel}>{label}</Text>
      </View>
      <View style={s.rowRight}>
        {rightNode || (<>
          {value !== undefined && <Text style={s.rowVal}>{value}</Text>}
          {onPress && <Ionicons name="chevron-forward" size={14} color="#C5B8BC" />}
        </>)}
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StickyNavbar navScrolled={navScrolled} onMenuPress={() => setDrawerOpen(true)} title="PROFILE" subtitle=" " />
      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} activeTab={activeDrawerTab}
        onNavigate={(tabId) => { setActiveDrawerTab(tabId); navigation.navigate(tabId); }} />

      {/* Birth Year */}
      <Sheet visible={showBirthYear} title="Birth year" onClose={() => setShowBirthYear(false)}
        onConfirm={async () => { await saveP("birthYear", tempYear); setShowBirthYear(false); }}>
        <View style={{ alignItems: "center" }}>
          <DrumColumn data={years} selected={tempYear} onSelect={setTempYear} colWidth={200} />
        </View>
      </Sheet>

      {/* Reminder Time */}
      <Sheet visible={showReminder} title="Daily reminder" onClose={() => setShowReminder(false)}
        onConfirm={async () => { await saveS("reminderTime", `${tempHour}:${tempMin}`); setShowReminder(false); }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <DrumColumn data={hours}   selected={tempHour} onSelect={setTempHour} label="Hour" colWidth={100} />
          <Text style={{ fontSize: 26, fontWeight: "700", color: "#E8607A", marginTop: 18 }}>:</Text>
          <DrumColumn data={minutes} selected={tempMin}  onSelect={setTempMin}  label="Min"  colWidth={100} />
        </View>
      </Sheet>

      {/* Rest Time */}
      <Sheet visible={showRest} title="Rest between sets" onClose={() => setShowRest(false)}
        onConfirm={async () => { await saveS("restTime", tempRest.toString()); setShowRest(false); }}>
        <Stepper value={tempRest} onChange={setTempRest} min={5} max={300} step={5} unit="sec" />
        <View style={s.chips}>
          {[15, 30, 45, 60, 90, 120].map(v => (
            <Pressable key={v} style={[s.chip, tempRest === v && s.chipActive]} onPress={() => setTempRest(v)}>
              <Text style={[s.chipTxt, tempRest === v && s.chipTxtActive]}>{v}s</Text>
            </Pressable>
          ))}
        </View>
      </Sheet>

      {/* Countdown */}
      <Sheet visible={showCountdown} title="Countdown timer" onClose={() => setShowCountdown(false)}
        onConfirm={async () => { await saveS("countdownTime", tempCountdown.toString()); setShowCountdown(false); }}>
        <Stepper value={tempCountdown} onChange={setTempCountdown} min={3} max={60} step={1} unit="sec" />
        <View style={s.chips}>
          {[3, 5, 10, 15, 20].map(v => (
            <Pressable key={v} style={[s.chip, tempCountdown === v && s.chipActive]} onPress={() => setTempCountdown(v)}>
              <Text style={[s.chipTxt, tempCountdown === v && s.chipTxtActive]}>{v}s</Text>
            </Pressable>
          ))}
        </View>
      </Sheet>

      {/* Gender */}
      <Sheet visible={showGender} title="Gender" onClose={() => setShowGender(false)}
        onConfirm={() => setShowGender(false)} confirmLabel="Done">
        <View style={s.optList}>
          {GENDERS.map(g => (
            <Pressable key={g} style={[s.optRow, profile.gender === g && s.optRowActive]}
              onPress={() => saveP("gender", g)}>
              <Text style={[s.optTxt, profile.gender === g && s.optTxtActive]}>{g}</Text>
              {profile.gender === g && <Ionicons name="checkmark" size={16} color="#E8607A" />}
            </Pressable>
          ))}
        </View>
      </Sheet>

      {/* Language */}
      <Sheet visible={showLanguage} title="Language" onClose={() => setShowLanguage(false)}
        onConfirm={() => setShowLanguage(false)} confirmLabel="Done">
        <View style={s.optList}>
          {LANGUAGES.map(l => (
            <Pressable key={l} style={[s.optRow, settings.language === l && s.optRowActive]}
              onPress={() => saveS("language", l)}>
              <Text style={[s.optTxt, settings.language === l && s.optTxtActive]}>{l}</Text>
              {settings.language === l && <Ionicons name="checkmark" size={16} color="#E8607A" />}
            </Pressable>
          ))}
        </View>
      </Sheet>

      {/* Units */}
      <Sheet visible={showUnits} title="Measurement units" onClose={() => setShowUnits(false)}
        onConfirm={() => setShowUnits(false)} confirmLabel="Done">
        <View style={s.optList}>
          {UNITS_OPT.map(u => (
            <Pressable key={u} style={[s.optRow, settings.units === u && s.optRowActive]}
              onPress={() => saveS("units", u)}>
              <View>
                <Text style={[s.optTxt, settings.units === u && s.optTxtActive]}>{u}</Text>
                <Text style={s.optSub}>{u.includes("Imperial") ? "Weight: lb · Height: ft/in" : "Weight: kg · Height: cm"}</Text>
              </View>
              {settings.units === u && <Ionicons name="checkmark" size={16} color="#E8607A" />}
            </Pressable>
          ))}
        </View>
      </Sheet>

      {/* Theme */}
      <Sheet visible={showTheme} title="App theme" onClose={() => setShowTheme(false)}
        onConfirm={() => setShowTheme(false)} confirmLabel="Done">
        <View style={s.themeGrid}>
          {THEMES.map(t => (
            <Pressable key={t.name}
              style={[s.themeCell, { borderColor: settings.theme === t.name ? t.primary : "#EDE6E9" }]}
              onPress={() => saveS("theme", t.name)}>
              <View style={[s.themeDot, { backgroundColor: t.primary }]} />
              <Text style={[s.themeName, settings.theme === t.name && { color: t.primary, fontWeight: "700" }]}>
                {t.name}
              </Text>
              {settings.theme === t.name && (
                <View style={[s.themeCheck, { backgroundColor: t.primary }]}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </Sheet>

      {/* Height */}
      <Sheet visible={showHeight} title="Height" onClose={() => setShowHeight(false)}
        onConfirm={async () => {
          const val = heightUnit === "ft" ? `${tempFt}ft ${tempIn}in` : `${tempCm} cm`;
          await saveP("height", val); setShowHeight(false);
        }}>
        <Seg options={["ft / in", "cm"]} selected={heightUnit === "ft" ? "ft / in" : "cm"}
          onSelect={v => setHeightUnit(v === "ft / in" ? "ft" : "cm")} />
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
          {heightUnit === "ft" ? (<>
            <DrumColumn data={feetOpt} selected={tempFt} onSelect={setTempFt} label="Feet"   colWidth={110} />
            <DrumColumn data={inchOpt} selected={tempIn} onSelect={setTempIn} label="Inches"  colWidth={110} />
          </>) : (
            <DrumColumn data={cmOpt} selected={tempCm} onSelect={setTempCm} label="cm" colWidth={200} />
          )}
        </View>
      </Sheet>

      {/* Weight */}
      <Sheet visible={showWeight} title="Weight" onClose={() => setShowWeight(false)}
        onConfirm={async () => {
          const val = `${tempWeight} ${weightUnit}`;
          await saveP("weight", val); await saveWeight(parseFloat(tempWeight)); setShowWeight(false);
        }}>
        <Seg options={["kg", "lb"]} selected={weightUnit} onSelect={setWeightUnit} />
        <View style={{ alignItems: "center" }}>
          <DrumColumn data={weightUnit === "kg" ? kgOpt : lbOpt} selected={tempWeight}
            onSelect={setTempWeight} label={weightUnit === "kg" ? "kg" : "lb"} colWidth={200} />
        </View>
      </Sheet>

      {/* Goal Weight */}
      <Sheet visible={showGoal} title="Goal weight" onClose={() => setShowGoal(false)}
        onConfirm={async () => { await saveP("goal", tempGoal.toString()); setShowGoal(false); }}>
        <Stepper value={tempGoal} onChange={setTempGoal} min={30} max={200} step={1} unit="kg" />
      </Sheet>

      {/* Text edit */}
      <Modal visible={showText} transparent animationType="slide">
        <KeyboardAvoidingView style={sh.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable style={sh.overlay} onPress={() => setShowText(false)}>
            <Pressable style={sh.card} onPress={e => e.stopPropagation()}>
              <View style={sh.handle} />
              <View style={sh.header}>
                <Text style={sh.title}>{textLabel}</Text>
                <Pressable style={sh.closeBtn} onPress={() => setShowText(false)}>
                  <Ionicons name="close" size={18} color="#9B8E93" />
                </Pressable>
              </View>
              <View style={sh.body}>
                <TextInput
                  style={s.textInput} value={textVal} onChangeText={setTextVal}
                  autoFocus placeholder={`Enter ${textLabel.toLowerCase()}`} placeholderTextColor="#C5B8BC"
                />
              </View>
              <View style={sh.footer}>
                <Pressable style={sh.cancelBtn} onPress={() => setShowText(false)}>
                  <Text style={sh.cancelTxt}>Cancel</Text>
                </Pressable>
                <Pressable style={sh.confirmBtn} onPress={async () => {
                  const [src, key] = textKey.split("::");
                  if (src === "profile") await saveP(key, textVal);
                  else await saveS(key, textVal);
                  setShowText(false);
                }}>
                  <Text style={sh.confirmTxt}>Save</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
        onScroll={handleScroll} scrollEventThrottle={16}>
        <View style={s.container}>

          {/* Header */}
          <View style={s.profileHeader}>
            <Pressable style={s.avatarWrap} onPress={pickImage}>
              <Image source={{ uri: user?.avatar || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y" }} style={s.avatar} />
              <View style={s.cameraBadge}><Ionicons name="camera" size={11} color="#fff" /></View>
            </Pressable>
            <Pressable onPress={() => openText("profile", "name", "Name", profile.name)}>
              <Text style={s.profileName}>{profile.name}</Text>
            </Pressable>
            <Pressable onPress={() => openText("profile", "email", "Email", profile.email)}>
              <Text style={s.profileEmail}>{profile.email}</Text>
            </Pressable>
            <View style={s.bmiPill}>
              <Text style={s.bmiTxt}>BMI {bmiVal} · {bmiLabel}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={s.statsRow}>
            {[["⏱", stats.minutes, "min", "Time"], ["🔥", stats.kcal, "kcal", "Burned"], ["💪", stats.workouts, "", "Workouts"]].map(([ic, v, u, l]) => (
              <View key={l} style={s.statCard}>
                <Text style={s.statIcon}>{ic}</Text>
                <Text style={s.statVal}>{v}<Text style={s.statUnit}>{u ? ` ${u}` : ""}</Text></Text>
                <Text style={s.statLabel}>{l}</Text>
              </View>
            ))}
          </View>

          {/* Personal */}
          <Text style={s.section}>Personal</Text>
          <View style={s.card}>
            <Row icon="person-outline"   label="Name"        value={profile.name}              onPress={() => openText("profile", "name", "Name", profile.name)} />
            <Row icon="female-outline"   label="Gender"      value={profile.gender}             onPress={() => setShowGender(true)} />
            <Row icon="calendar-outline" label="Birth year"  value={profile.birthYear}          onPress={() => { setTempYear(profile.birthYear || "2000"); setShowBirthYear(true); }} />
            <Row icon="resize-outline"   label="Height"      value={profile.height}             onPress={() => setShowHeight(true)} />
            <Row icon="fitness-outline"  label="Weight"      value={profile.weight}             onPress={() => setShowWeight(true)} />
            <Row icon="flag-outline"     label="Goal weight" value={`${profile.goal || 50} kg`} onPress={() => { setTempGoal(parseInt(profile.goal) || 50); setShowGoal(true); }} isLast />
          </View>

          {/* Workout */}
          <Text style={s.section}>Workout</Text>
          <View style={s.card}>
            <Row icon="alarm-outline" label="Reminder"  value={settings.reminderTime}
              onPress={() => { const [h, m] = (settings.reminderTime || "20:00").split(":"); setTempHour(h); setTempMin(m || "00"); setShowReminder(true); }} />
            <Row icon="cafe-outline"  label="Rest time" value={`${settings.restTime}s`}
              onPress={() => { setTempRest(parseInt(settings.restTime) || 30); setShowRest(true); }} />
            <Row icon="timer-outline" label="Countdown" value={`${settings.countdownTime}s`}
              onPress={() => { setTempCountdown(parseInt(settings.countdownTime) || 10); setShowCountdown(true); }} />
            <Row icon="volume-medium-outline" label="Sound" isLast
              rightNode={<Switch value={!!settings.soundEnabled} onValueChange={() => toggleSetting("soundEnabled")}
                trackColor={{ false: "#E0D8DB", true: "#E8607A" }} thumbColor="#fff" />} />
          </View>

          {/* Preferences */}
          <Text style={s.section}>Preferences</Text>
          <View style={s.card}>
            <Row icon="language-outline"       label="Language"  value={settings.language}
              onPress={() => setShowLanguage(true)} />
            <Row icon="swap-horizontal-outline" label="Units"    value={settings.units?.includes("Imperial") ? "Imperial" : "Metric"}
              onPress={() => setShowUnits(true)} />
            <Row icon="color-palette-outline"  label="Theme"     value={settings.theme || "Rose Pink"}
              onPress={() => setShowTheme(true)} isLast />
          </View>

          {/* General */}
          <Text style={s.section}>General</Text>
          <View style={s.card}>
            <Row icon="star-outline"          label="Rate app"       onPress={() => Alert.alert("Rate app", "Opening store…")} />
            <Row icon="chatbubble-outline"    label="Feedback"       onPress={() => Alert.alert("Feedback", "feedback@pulsefit.app")} />
            <Row icon="document-text-outline" label="Privacy policy" isLast onPress={() => Alert.alert("Privacy", "pulsefit.app/privacy")} />
          </View>

          <Pressable style={s.resetBtn} onPress={handleReset}>
            <Ionicons name="trash-outline" size={16} color="#E8607A" style={{ marginRight: 8 }} />
            <Text style={s.resetTxt}>Reset all data</Text>
          </Pressable>
          <Pressable style={[s.resetBtn, { borderColor: "#C5B8BC" }]} onPress={signOut}>
            <Ionicons name="log-out-outline" size={16} color="#9B8E93" style={{ marginRight: 8 }} />
            <Text style={[s.resetTxt, { color: "#9B8E93" }]}>Log out</Text>
          </Pressable>
          <Text style={s.version}>Version 2.2.7E</Text>
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAF9FA" },
  scroll: { paddingVertical: 20 },
  container: { width: "100%", maxWidth: 650, alignSelf: "center", paddingHorizontal: 20 },

  profileHeader: { alignItems: "center", marginBottom: 24 },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 2.5, borderColor: "#E8607A30" },
  cameraBadge: { position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: "#E8607A", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FAF9FA" },
  profileName: { fontSize: 20, fontWeight: "800", color: "#2D1B20", marginBottom: 3, textAlign: "center" },
  profileEmail: { fontSize: 13, color: "#9B8E93", marginBottom: 12, textAlign: "center" },
  bmiPill: { backgroundColor: "#E8607A12", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  bmiTxt: { fontSize: 12, fontWeight: "700", color: "#E8607A" },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 16, paddingVertical: 14, alignItems: "center", borderWidth: 0.5, borderColor: "#F0E8EB" },
  statIcon: { fontSize: 18, marginBottom: 5 },
  statVal: { fontSize: 15, fontWeight: "800", color: "#2D1B20" },
  statUnit: { fontSize: 10, fontWeight: "500", color: "#9B8E93" },
  statLabel: { fontSize: 10, color: "#9B8E93", fontWeight: "600", marginTop: 2 },

  section: { fontSize: 11, fontWeight: "700", color: "#9B8E93", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 },
  card: { backgroundColor: "#fff", borderRadius: 18, paddingHorizontal: 16, marginBottom: 22, borderWidth: 0.5, borderColor: "#F0E8EB" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: "#F5EFF1" },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconWrap: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#E8607A10", alignItems: "center", justifyContent: "center", marginRight: 12 },
  rowLabel: { fontSize: 14, fontWeight: "600", color: "#2D1B20" },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowVal: { fontSize: 13, fontWeight: "600", color: "#9B8E93" },

  resetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E8607A30", borderRadius: 14, paddingVertical: 14, backgroundColor: "#fff", marginBottom: 12 },
  resetTxt: { fontSize: 14, fontWeight: "700", color: "#E8607A" },
  version: { textAlign: "center", fontSize: 11, color: "#C5B8BC", marginTop: 8, marginBottom: 4 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 18 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: "#F5F0F2", borderWidth: 1, borderColor: "#EDE6E9" },
  chipActive: { backgroundColor: "#E8607A", borderColor: "#E8607A" },
  chipTxt: { fontSize: 13, fontWeight: "600", color: "#9B8E93" },
  chipTxtActive: { color: "#fff" },

  optList: { gap: 8 },
  optRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: "#EDE6E9", backgroundColor: "#FDFBFC" },
  optRowActive: { borderColor: "#E8607A40", backgroundColor: "#FFF8F9" },
  optTxt: { fontSize: 14, fontWeight: "600", color: "#6B5A5F" },
  optTxtActive: { color: "#E8607A", fontWeight: "700" },
  optSub: { fontSize: 11, color: "#9B8E93", marginTop: 2 },

  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  themeCell: { width: "47%", flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1.5, backgroundColor: "#FDFBFC", position: "relative" },
  themeDot: { width: 28, height: 28, borderRadius: 14 },
  themeName: { fontSize: 13, fontWeight: "600", color: "#6B5A5F", flex: 1 },
  themeCheck: { position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },

  textInput: { borderWidth: 1, borderColor: "#EDE6E9", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: "600", color: "#2D1B20", backgroundColor: "#FDFBFC" },
});