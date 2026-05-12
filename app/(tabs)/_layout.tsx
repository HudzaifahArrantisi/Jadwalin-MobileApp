import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, sw } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.white,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarStyle: {
          backgroundColor: Colors.brown,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? sw(88) : sw(65),
          paddingBottom: Platform.OS === 'ios' ? sw(28) : sw(8),
          paddingTop: sw(8),
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: sw(10),
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={sw(22)}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Note',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'document-text' : 'document-text-outline'}
              size={sw(22)}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Kalender',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={sw(22)}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.profileTab}>
              <Ionicons
                name={focused ? 'person-circle' : 'person-circle-outline'}
                size={sw(28)}
                color={color}
              />
            </View>
          ),
        }}
      />
      {/* Hide add-task from tabs */}
      <Tabs.Screen
        name="add-task"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  profileTab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
