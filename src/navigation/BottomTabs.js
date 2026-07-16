import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import WorkoutsScreen from "../screens/WorkoutsScreen";
import ProgressScreen from "../screens/ProgressScreen";
import CoachScreen from "../screens/CoachScreen";
import ProfileScreen from "../screens/ProfileScreen";
import NutritionScreen from "../screens/NutritionScreen";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#E8607A",
        tabBarInactiveTintColor: "#8A8FA3",
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size, focused }) => {
          const iconSize = focused ? size + 1 : size;

          if (route.name === "Home")
            return <Ionicons name={focused ? "home" : "home-outline"} size={iconSize} color={color} />;

          if (route.name === "Progress")
            return <Feather name="trending-up" size={iconSize} color={color} />;

          if (route.name === "Workout")
            return <Ionicons name={focused ? "barbell" : "barbell-outline"} size={iconSize} color={color} />;

          if (route.name === "Coach")
            return <Ionicons name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} size={iconSize} color={color} />;

          if (route.name === "Nutrition")
            return <MaterialCommunityIcons name={focused ? "food-apple" : "food-apple-outline"} size={iconSize} color={color} />;

          return <Ionicons name={focused ? "person" : "person-outline"} size={iconSize} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Workout" component={WorkoutsScreen} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="Coach" component={CoachScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 68,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#EAECF0",
    backgroundColor: "#FFFFFF",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
});