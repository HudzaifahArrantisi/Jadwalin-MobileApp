import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet, Text, LayoutAnimation, UIManager } from 'react-native';
import { useAppTheme, Spacing, Radius, sw } from '@/constants/theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useMemo } from 'react';
import InteractivePressable from '@/components/InteractivePressable';

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
  const routeOrder = ['index', 'calendar', 'notes', 'leaderboard', 'settings'];

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
          else if (route.name === 'leaderboard') iconName = isFocused ? 'trophy' : 'trophy-outline';
          else if (route.name === 'settings') iconName = isFocused ? 'person' : 'person-outline';

          const label = route.name === 'index' 
            ? 'Home' 
            : route.name === 'calendar' 
            ? 'Jadwal' 
            : route.name === 'notes' 
            ? 'Catatan' 
            : route.name === 'leaderboard'
            ? 'Liga'
            : 'profile';

          return (
            <InteractivePressable
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
            >
              <Ionicons 
                name={iconName as any} 
                size={sw(20)} 
                color={isFocused ? Colors.brownDark : Colors.tabBarInactive} 
              />
              {isFocused && (
                <Text style={styles.tabLabelActive}>{label}</Text>
              )}
            </InteractivePressable>
          );
        })}
      </View>

      <InteractivePressable
        style={styles.addButton}
        onPress={() => {
          router.push('/(tabs)/calendar?add=true');
        }}
      >
        <Ionicons name="add" size={sw(26)} color={isDark ? Colors.black : Colors.white} />
      </InteractivePressable>
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
      <Tabs.Screen name="leaderboard" />
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
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.tabBarBg,
    borderRadius: Radius.full,
    flex: 1,
    marginRight: sw(12),
    paddingVertical: sw(6),
    paddingHorizontal: sw(6),
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sw(8),
    paddingHorizontal: sw(14),
    borderRadius: Radius.full,
  },
  tabItemActive: {
    backgroundColor: isDark ? Colors.beigeDark : Colors.white,
    paddingHorizontal: sw(16),
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
    backgroundColor: Colors.brownDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});
