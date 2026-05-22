import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet, TouchableOpacity, Text, LayoutAnimation, UIManager } from 'react-native';
import { useAppTheme, Spacing, sw } from '@/constants/theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useMemo } from 'react';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { Colors, isDark } = useAppTheme();
  const styles = useMemo(() => getStyles(Colors, isDark), [Colors, isDark]);

  // Animate tab switches
  React.useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [state.index]);

  // Define tab bar routes in order
  const routeOrder = ['index', 'calendar', 'notes', 'settings'];

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.pillContainer}>
        {routeOrder.map((routeName) => {
          const route = state.routes.find((r) => r.name === routeName);
          if (!route) return null;

          const { options } = descriptors[route.key];
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName = 'home-outline';
          if (route.name === 'index') iconName = isFocused ? 'home' : 'home-outline';
          else if (route.name === 'calendar') iconName = isFocused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'notes') iconName = isFocused ? 'document-text' : 'document-text-outline';
          else if (route.name === 'settings') iconName = isFocused ? 'person' : 'person-outline';

          const label = route.name === 'index' 
            ? 'Home' 
            : route.name === 'calendar' 
            ? 'Jadwal' 
            : route.name === 'notes' 
            ? 'Catatan' 
            : 'profile';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={(options as any).tabBarTestID}
              onPress={onPress}
              style={[
                styles.tabItem,
                isFocused && styles.tabItemActive
              ]}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={iconName as any} 
                size={sw(20)} 
                color={isFocused ? Colors.brownDark : Colors.tabBarInactive} 
              />
              {isFocused && (
                <Text style={styles.tabLabelActive}>{label}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.addButton}
        activeOpacity={0.85}
        onPress={() => {
          router.push('/(tabs)/calendar?add=true');
        }}
      >
        <Ionicons name="add" size={sw(28)} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="notes" />
      <Tabs.Screen name="settings" />
      <Tabs.Screen
        name="add-task"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const getStyles = (Colors: any, isDark: boolean) => StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? sw(30) : sw(20),
    left: sw(20),
    right: sw(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: isDark ? '#1C1C1E' : '#E5E7EB', 
    borderRadius: 999,
    flex: 1,
    marginRight: sw(12),
    paddingVertical: sw(6),
    paddingHorizontal: sw(6),
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sw(8),
    paddingHorizontal: sw(14),
    borderRadius: 999,
  },
  tabItemActive: {
    backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
    paddingHorizontal: sw(16),
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  tabLabelActive: {
    fontSize: sw(12),
    fontWeight: '600',
    color: Colors.brownDark,
    marginLeft: sw(6),
  },
  addButton: {
    width: sw(48),
    height: sw(48),
    borderRadius: sw(24),
    backgroundColor: '#FF5A5F', // Premium vibrant coral red
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#FF5A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
