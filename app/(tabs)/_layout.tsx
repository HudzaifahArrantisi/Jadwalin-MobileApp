import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Colors, Spacing, sw, SCREEN_WIDTH } from '@/constants/theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  // We only want to show the first 4 tabs (index, notes, calendar, settings)
  // `settings` is the profile button

  
  const mainTabs = state.routes.filter((r) => ['index', 'notes', 'calendar'].includes(r.name));
  const profileTab = state.routes.find((r) => r.name === 'settings');

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.pillContainer}>
        {mainTabs.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === state.routes.findIndex(r => r.key === route.key);

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
          else if (route.name === 'notes') iconName = isFocused ? 'document-text' : 'document-text-outline';
          else if (route.name === 'calendar') iconName = isFocused ? 'calendar' : 'calendar-outline';

          const label = route.name === 'index' ? 'Inbox' : route.name === 'notes' ? 'Note' : 'Kalender';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={(options as any).tabBarTestID}
              onPress={onPress}
              style={styles.tabItem}
            >
              <Ionicons name={iconName as any} size={sw(24)} color={Colors.black} />
              <Text style={styles.tabLabel}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {profileTab && (
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => {
            const isFocused = state.index === state.routes.findIndex(r => r.key === profileTab.key);
            const event = navigation.emit({
              type: 'tabPress',
              target: profileTab.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(profileTab.name);
            }
          }}
        >
          <Ionicons name="person-circle-outline" size={sw(36)} color={Colors.black} />
        </TouchableOpacity>
      )}
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
      <Tabs.Screen name="notes" />
      <Tabs.Screen name="calendar" />
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

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? sw(30) : sw(20),
    left: sw(20),
    right: sw(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.beigeDark, 
    borderRadius: 999,
    flex: 1,
    marginRight: sw(10),
    paddingVertical: sw(8),
    paddingHorizontal: sw(12),
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: Colors.brownDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: sw(10),
    fontWeight: '600',
    color: Colors.brownDark,
    marginTop: sw(2),
  },
  profileButton: {
    width: sw(56),
    height: sw(56),
    borderRadius: sw(28),
    backgroundColor: Colors.brownDark, 
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});
