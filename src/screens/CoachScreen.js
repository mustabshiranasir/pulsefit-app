import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, View, Text, StyleSheet, TextInput, Pressable, ScrollView, Image, KeyboardAvoidingView, Platform, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../theme/colors";
import DrawerMenu from "../components/DrawerMenu";
import StickyNavbar from "../components/StickyNavbar";
import { getChatHistory, saveChatMessage, getNutritionData, getWeightHistory, getWorkoutStats, getProfile } from "../storage/fitnessStorage";
import { useAuth } from "../context/AuthContext";

const { height } = Dimensions.get('window');

const SUGGESTED_QUESTIONS = [
  "Why don't I feel my abs working during core exercises?",
  "Do tight thighs affect my workout performance?",
  "What to eat before and after a workout?"
];

const CHIPS = [
  { icon: "📅", label: "Workout Schedule" },
  { icon: "🔥", label: "Fat Loss & Toning" },
  { icon: "🧘‍♀️", label: "Stretching" }
];

export default function CoachScreen({ navigation }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState("Coach");
  const scrollViewRef = useRef();

  useEffect(() => {
    loadChat();
  }, []);

  const loadChat = async () => {
    const history = await getChatHistory();
    if (history.length === 0) {
      // Add initial greeting if history is empty
      const initialMsg = {
        id: Date.now().toString(),
        text: `Hi ${user ? user.name.split(' ')[0] : 'there'}! As your fitness pal, I'm here for all your questions. Ask me anything!`,
        isUser: false
      };
      await saveChatMessage(initialMsg);
      setMessages([initialMsg]);
    } else {
      setMessages(history);
    }
  };

  const handleSend = async (textOverride) => {
    const textToSend = textOverride || inputText;
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg = { id: Date.now().toString(), text: textToSend.trim(), isUser: true };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText("");
    await saveChatMessage(userMsg);

    // Simulated Bot Response Logic (Keyword Training + Real Data)
    setTimeout(async () => {
      const input = textToSend.toLowerCase();

      // Fetch latest data for "Smart" responses
      const nutrition = await getNutritionData();
      const weightHistory = await getWeightHistory();
      const workoutStats = await getWorkoutStats();
      const profile = await getProfile();

      const latestWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : profile.weight;
      const calorieProgress = nutrition.calories;
      const calorieGoal = nutrition.goal;
      const workoutCount = workoutStats.workouts;

      let response = "That's a great question! Based on your current progress, I'd recommend focusing on consistency and tracking your macros daily.";

      if (input.includes("my weight") || input.includes("current weight") || input.includes("how heavy")) {
        response = `Your last recorded weight is ${latestWeight}kg. ${latestWeight > profile.goal ? "You're working towards your goal of " + profile.goal + "kg—keep it up!" : "You've reached your goal weight! Amazing work."}`;
      } else if (input.includes("calories") || input.includes("how much did i eat") || input.includes("nutrition status")) {
        response = `Today you've consumed ${calorieProgress} kcal out of your ${calorieGoal} kcal goal. ${calorieProgress > calorieGoal ? "You've exceeded your goal slightly, try to balance it with an extra walk!" : "You're doing great with your intake!"}`;
      } else if (input.includes("how many workouts") || input.includes("my progress") || input.includes("total workouts")) {
        response = `You've completed a total of ${workoutCount} workouts so far. ${workoutCount > 0 ? "Each one brings you closer to your peak fitness!" : "Let's get started with your first workout today!"}`;
      } else if (input.includes("schedule") || input.includes("routine")) {
        response = "Your personalized workout schedule is designed to balance strength and recovery. Today, focus on your core and active recovery. You can see your full plan in the Workouts tab!";
      } else if (input.includes("fat loss") || input.includes("lose weight") || input.includes("burn")) {
        response = `For effective fat loss, aim for a sustainable caloric deficit. You're currently at ${calorieProgress} kcal today. Mixing cardio with weight training will help you reach your ${profile.goal}kg goal!`;
      } else if (input.includes("toning") || input.includes("tone") || input.includes("lean")) {
        response = "Toning comes from building muscle and reducing body fat simultaneously. Focus on high-repetition resistance training and ensure your protein intake is high enough for muscle repair.";
      } else if (input.includes("stretching") || input.includes("flexibility")) {
        response = "Stretching improves flexibility and prevents long-term injury. I recommend 10 minutes of dynamic stretching before your workouts and static stretching afterwards to cool down.";
      } else if (input.includes("abs") || input.includes("core")) {
        response = "Abs are revealed in the kitchen! While core exercises like planks and leg raises build the muscle, a clean diet is what makes them visible. Stay consistent!";
      } else if (input.includes("thighs") || input.includes("legs")) {
        response = "Tight thighs can often be relieved with consistent foam rolling and dynamic stretches. Ensure your form is correct during heavy leg days to avoid unnecessary strain.";
      } else if (input.includes("eat") || input.includes("food") || input.includes("protein") || input.includes("nutrition")) {
        response = `Proper fueling is essential. Today you've logged ${nutrition.meals.length} meals. Try to consume complex carbs 1-2 hours before training to support your ${workoutCount + 1}th workout session!`;
      } else if (input.includes("water") || input.includes("hydrate") || input.includes("hydration")) {
        response = "Hydration is crucial for peak performance! Aim for 2-3 liters of water a day. Water helps with muscle function, fat metabolism, and keeps your joints lubricated.";
      } else if (input.includes("rest") || input.includes("sleep") || input.includes("recovery")) {
        response = "Recovery is just as important as the workout itself. Aim for 7-9 hours of quality sleep to let your muscles repair and grow. Don't skip your rest days!";
      }

      const botMsg = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false
      };

      const updatedMessages = [...newMessages, botMsg];
      setMessages(updatedMessages);
      await saveChatMessage(botMsg);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <DrawerMenu
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          activeTab={activeDrawerTab}
          onNavigate={(tabId) => {
            setActiveDrawerTab(tabId);
            navigation.navigate(tabId);
          }}
        />

        <View style={styles.responsiveContainer}>
          {/* Header */}
          <StickyNavbar
            navScrolled={false}
            onMenuPress={() => setDrawerOpen(true)}
            subtitle={user ? `Chatting with ${user.name.split(' ')[0]}` : "AI Coach"}
          />

          {/* Chat ScrollView */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatArea}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <View key={msg.id} style={[styles.messageBubble, msg.isUser ? styles.messageUser : styles.messageBot]}>
                <Text style={msg.isUser ? styles.messageTextUser : styles.messageTextBot}>{msg.text}</Text>
              </View>
            ))}

            {/* Suggested Questions Box */}
            <View style={styles.suggestedBox}>
              <View style={styles.suggestedHeader}>
                <Text style={styles.suggestedTitle}>You may want to know...</Text>
                <Ionicons name="refresh" size={18} color={C.muted} />
              </View>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <Pressable key={idx} style={styles.suggestedItem} onPress={() => handleSend(q)}>
                  <Text style={styles.bulbIcon}>💡</Text>
                  <Text style={styles.suggestedText}>{q}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Bottom Area */}
          <View style={styles.bottomArea}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {CHIPS.map((chip, idx) => (
                <Pressable key={idx} style={styles.chip} onPress={() => handleSend(chip.label)}>
                  <Text style={styles.chipText}>{chip.icon} {chip.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your question"
                placeholderTextColor={C.muted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSend()}
              />
              <Pressable style={styles.sendBtn} onPress={() => handleSend()}>
                <Ionicons name="paper-plane" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF9FA' },
  container: { flex: 1 },
  responsiveContainer: { flex: 1, width: '100%', maxWidth: 768, alignSelf: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  iconBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: C.text },

  chatArea: { flex: 1 },
  chatContent: { paddingHorizontal: 20, paddingVertical: 10, paddingBottom: 20 },

  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
  },
  messageBot: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1
  },
  messageUser: {
    backgroundColor: C.primary,
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
  },
  messageTextBot: { fontSize: 16, color: C.text, lineHeight: 22 },
  messageTextUser: { fontSize: 16, color: '#fff', lineHeight: 22 },

  suggestedBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginTop: 10,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1
  },
  suggestedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  suggestedTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  suggestedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F6F8',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  bulbIcon: { fontSize: 16, marginRight: 10 },
  suggestedText: { flex: 1, fontSize: 14, color: C.text, lineHeight: 20 },

  bottomArea: {
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#FAF9FA',
  },
  chipScroll: { paddingHorizontal: 20, gap: 10, marginBottom: 15 },
  chip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1
  },
  chipText: { fontSize: 14, fontWeight: '600', color: C.text },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  input: { flex: 1, fontSize: 15, color: C.text, paddingVertical: 5 },
  sendBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: '#CFD0D4', // Gray when inactive, could be C.primary if has text
    alignItems: 'center', justifyContent: 'center'
  }
});
