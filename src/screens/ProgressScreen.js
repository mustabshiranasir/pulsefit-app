import React, { useState, useCallback } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable, TextInput, Dimensions, Modal, KeyboardAvoidingView, Platform, StatusBar, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Line, Circle, Text as SvgText, Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import { C } from "../theme/colors";
import StickyNavbar from "../components/StickyNavbar";
import DrawerMenu from "../components/DrawerMenu";
import DraggableCoach from "../components/DraggableCoach";
import { getWorkoutStats, getWeightHistory, saveWeight, getProfile, saveProfile } from "../storage/fitnessStorage";

const { width, height: screenHeight } = Dimensions.get("window");

export default function ProgressScreen({ navigation }) {
  const [navScrolled, setNavScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState("Progress");
  const [stats, setStats] = useState({ workouts: 0, kcal: 0, minutes: 0 });
  const [weight, setWeight] = useState("55.0");
  const [goal, setGoal] = useState("50.0");
  const [height, setHeight] = useState("1.65");

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editType, setEditType] = useState(null); // "weight", "goal", "height"
  const [editValue, setEditValue] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const [s, p] = await Promise.all([
      getWorkoutStats(),
      getProfile()
    ]);
    setStats(s);
    setHeight(p.height || "1.65");
    setGoal(p.goal || "50");
    
    const history = await getWeightHistory();
    if (history && history.length > 0) {
      setWeight(history[history.length - 1].weight.toFixed(1));
    } else {
      setWeight(p.weight || "55.0");
    }
  };

  // Calculate BMI
  const parsedWeight = parseFloat(weight) || 55;
  const parsedHeight = parseFloat(height) || 1.65;
  const calculatedBmi = (parsedWeight / (parsedHeight * parsedHeight)).toFixed(1);
  const bmiVal = parseFloat(calculatedBmi);

  let bmiStatusText = "Normal";
  let bmiColor = "#10B981";
  if (bmiVal < 18.5) {
      bmiStatusText = "Underweight";
      bmiColor = "#3B82F6";
  } else if (bmiVal >= 25 && bmiVal < 30) {
      bmiStatusText = "Overweight";
      bmiColor = "#F59E0B";
  } else if (bmiVal >= 30) {
      bmiStatusText = "Obese";
      bmiColor = "#EF4444";
  }

  const bmiPercent = isNaN(bmiVal) || !isFinite(bmiVal) ? 0 : Math.max(0, Math.min(100, ((bmiVal - 15) / (40 - 15)) * 100));

  const openEditModal = (type, currentValue) => {
    setEditType(type);
    setEditValue(currentValue.toString());
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    const p = await getProfile();
    const numericVal = parseFloat(editValue);
    if (isNaN(numericVal) || numericVal <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid positive number.");
      return;
    }

    if (editType === "weight") {
      setWeight(numericVal.toFixed(1));
      await saveWeight(numericVal);
      await saveProfile({ ...p, weight: numericVal.toString() });
    } else if (editType === "goal") {
      setGoal(numericVal.toFixed(1));
      await saveProfile({ ...p, goal: numericVal.toString() });
    } else if (editType === "height") {
      setHeight(numericVal.toFixed(2));
      await saveProfile({ ...p, height: numericVal.toString() });
    }
    setEditModalVisible(false);
  };

  const handleScroll = (e) => {
    setNavScrolled(e.nativeEvent.contentOffset.y > 12);
  };

  const renderLineChart = () => {
    const chartHeight = 140;
    const containerInnerWidth = Math.min(width, 650) - 32; // Width inside responsiveContainer padding
    const chartWidth = containerInnerWidth - 40; // Space for labels
    const yLabels = ["60", "55", "50", "45", "40"];
    const stepY = chartHeight / 4;
    const stepX = chartWidth / 6;

    return (
      <View style={styles.chartContainer}>
        <Svg width={containerInnerWidth} height={chartHeight + 40}>
          {yLabels.map((lbl, idx) => (
            <React.Fragment key={idx}>
              <SvgText x="10" y={idx * stepY + 15} fontSize="10" fontFamily="Poppins_400Regular" fill={C.muted}>{lbl}</SvgText>
              <Line x1="40" y1={idx * stepY + 10} x2={chartWidth + 40} y2={idx * stepY + 10} stroke={C.border} strokeWidth="1" strokeDasharray="2,2" />
            </React.Fragment>
          ))}
          
          {/* Main Line */}
          <Circle cx={40 + stepX * 3} cy={chartHeight - 40} r="6" fill={C.primary} />
          <Rect x={40 + stepX * 3 - 25} y={chartHeight - 75} width="50" height="25" rx="8" fill={C.primary} />
          <SvgText x={40 + stepX * 3} y={chartHeight - 58} fontSize="12" fontFamily="Outfit_700Bold" fill="#fff" textAnchor="middle">{weight} kg</SvgText>

          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day, idx) => (
            <SvgText key={idx} x={40 + stepX * idx} y={chartHeight + 25} fontSize="10" fontFamily="Poppins_600SemiBold" fill={C.muted} textAnchor="middle">{day}</SvgText>
          ))}
        </Svg>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <StickyNavbar navScrolled={navScrolled} onMenuPress={() => setDrawerOpen(true)} title="REPORT" subtitle=" " />

      <DrawerMenu
        visible={drawerOpen} onClose={() => setDrawerOpen(false)}
        activeTab={activeDrawerTab}
        onNavigate={(tabId) => {
          setActiveDrawerTab(tabId);
          navigation.navigate(tabId);
        }}
      />

      <DraggableCoach onPress={() => navigation.navigate("Coach")} />

      <ScrollView 
        showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}
        onScroll={handleScroll} scrollEventThrottle={16}
      >
        <View style={styles.responsiveContainer}>
          {/* Top Summary Stats */}
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <View style={[styles.statIconBox, { backgroundColor: '#FFEDF1' }]}>
                 <Ionicons name="fitness" size={24} color={C.primary} />
              </View>
              <Text style={styles.statNum}>{stats.workouts}</Text>
              <Text style={styles.statLabel}>WORKOUTS</Text>
            </View>
            <View style={styles.statCol}>
              <View style={[styles.statIconBox, { backgroundColor: '#FFF4E5' }]}>
                 <Ionicons name="flame" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.statNum}>{stats.kcal}</Text>
              <Text style={styles.statLabel}>KCAL</Text>
            </View>
            <View style={styles.statCol}>
              <View style={[styles.statIconBox, { backgroundColor: '#E0F2FE' }]}>
                 <Ionicons name="time" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.statNum}>{stats.minutes}</Text>
              <Text style={styles.statLabel}>MINUTES</Text>
            </View>
          </View>

          {/* Weight Card */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>Weight <Text style={styles.cardUnit}>(kg)</Text></Text>
                <Pressable style={styles.editPill} onPress={() => openEditModal("weight", weight)}>
                    <Ionicons name="pencil" size={14} color={C.primary} />
                </Pressable>
            </View>

            <View style={styles.weightSummary}>
              <View style={styles.weightCol}>
                <Text style={styles.weightLabel}>Current</Text>
                <Text style={styles.weightNum}>{weight}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.weightCol}>
                <Text style={styles.weightLabel}>Goal</Text>
                <Text style={styles.weightNum}>{goal}</Text>
              </View>
            </View>

            {renderLineChart()}
          </View>

          {/* BMI Card */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>BMI <Text style={styles.cardUnit}>(kg/m²)</Text></Text>
              <Pressable style={styles.editPill} onPress={() => openEditModal("height", height)}>
                <Ionicons name="resize" size={14} color={C.primary} />
              </Pressable>
            </View>

            <View style={styles.bmiRow}>
              <Text style={styles.bmiNum}>{calculatedBmi}</Text>
              <View style={[styles.statusTag, { backgroundColor: bmiColor + '15' }]}>
                <Text style={[styles.bmiStatus, { color: bmiColor }]}>{bmiStatusText}</Text>
              </View>
            </View>

            <View style={styles.bmiBarContainer}>
              <View style={styles.bmiBar}>
                <Svg height="12" width="100%">
                  <Defs>
                    <SvgLinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                      <Stop offset="0" stopColor="#3B82F6" />
                      <Stop offset="0.25" stopColor="#10B981" />
                      <Stop offset="0.5" stopColor="#F59E0B" />
                      <Stop offset="0.75" stopColor="#F97316" />
                      <Stop offset="1" stopColor="#EF4444" />
                    </SvgLinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width="100%" height="12" rx="6" fill="url(#grad)" />
                </Svg>
              </View>
              <View style={[styles.bmiThumb, { left: `${bmiPercent}%`, backgroundColor: bmiColor }]} />
              <View style={styles.bmiLabels}>
                {["15", "18.5", "25", "30", "35", "40"].map((l, i) => (
                    <Text key={i} style={styles.bmiLabelTxt}>{l}</Text>
                ))}
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Update {editType === "weight" ? "Weight" : editType === "height" ? "Height" : "Goal"}</Text>
            <TextInput
              style={styles.modalInput} keyboardType="numeric"
              value={editValue} onChangeText={setEditValue} autoFocus
            />
            <View style={styles.modalBtns}>
              <Pressable style={styles.modalBtnCancel} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalBtnCancelTxt}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalBtnSave} onPress={saveEdit}>
                <Text style={styles.modalBtnSaveTxt}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAF9FA" },
  scroll: { paddingVertical: 10 },
  responsiveContainer: { width: '100%', maxWidth: 650, alignSelf: 'center', paddingHorizontal: 16 },

  statsCard: {
    backgroundColor: '#fff', borderRadius: 30, flexDirection: 'row',
    justifyContent: 'space-between', padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 4,
  },
  statCol: { alignItems: 'center', flex: 1 },
  statIconBox: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statNum: { fontSize: 22, fontFamily: 'Outfit_700Bold', color: C.text },
  statLabel: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: C.muted, letterSpacing: 0.5 },

  card: {
    backgroundColor: '#fff', borderRadius: 30, padding: 24, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
  },
  cardTitle: { fontSize: 20, fontFamily: 'Outfit_700Bold', color: C.text },
  cardUnit: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: C.muted },

  weightSummary: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20, backgroundColor: C.soft, borderRadius: 20, padding: 15 },
  weightCol: { alignItems: 'center' },
  weightLabel: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: C.muted, marginBottom: 4 },
  weightNum: { fontSize: 24, fontFamily: 'Outfit_700Bold', color: C.text },
  divider: { width: 1, height: '70%', backgroundColor: C.border, alignSelf: 'center' },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editPill: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },

  bmiRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 15 },
  bmiNum: { fontSize: 48, fontFamily: 'Outfit_700Bold', color: C.text },
  statusTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  bmiStatus: { fontSize: 14, fontFamily: 'Poppins_700Bold' },

  bmiBarContainer: { position: 'relative', marginTop: 10 },
  bmiBar: { height: 12, borderRadius: 6, overflow: 'hidden' },
  bmiThumb: { position: 'absolute', top: -4, width: 10, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  bmiLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  bmiLabelTxt: { fontSize: 10, fontFamily: 'Poppins_400Regular', color: C.muted },

  chartContainer: { marginTop: 10, overflow: 'hidden' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: width * 0.85, maxWidth: 340, backgroundColor: '#fff', borderRadius: 30, padding: 30, elevation: 10 },
  modalTitle: { fontSize: 20, fontFamily: 'Outfit_700Bold', color: C.text, marginBottom: 20, textAlign: 'center' },
  modalInput: { borderWidth: 2, borderColor: C.soft, borderRadius: 15, padding: 15, fontSize: 20, fontFamily: 'Outfit_700Bold', marginBottom: 25, textAlign: 'center', color: C.primary },
  modalBtns: { flexDirection: 'row', gap: 15 },
  modalBtnCancel: { flex: 1, paddingVertical: 15, borderRadius: 15, backgroundColor: C.soft, alignItems: 'center' },
  modalBtnCancelTxt: { fontFamily: 'Poppins_700Bold', color: C.muted },
  modalBtnSave: { flex: 1, paddingVertical: 15, borderRadius: 15, backgroundColor: C.primary, alignItems: 'center' },
  modalBtnSaveTxt: { fontFamily: 'Poppins_700Bold', color: '#fff' }
});