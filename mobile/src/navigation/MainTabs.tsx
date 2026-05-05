import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';

import { FeedScreen } from '../screens/feed/FeedScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { NewListingScreen } from '../screens/listing/NewListingScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { TabExploreIcon, TabHomeIcon, TabPlusIcon, TabProfileIcon } from '../components/BrandIcons';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.arenaDourado,
        tabBarInactiveTintColor: colors.ink3,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceBorder,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        headerStyle: { backgroundColor: colors.arenaVerde },
        headerTitleStyle: { color: colors.arenaDouradoClaro, fontWeight: '800', fontSize: 17 },
        headerTintColor: colors.arenaDouradoClaro,
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color, size }) => <TabExploreIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="NewListing"
        component={NewListingScreen}
        options={{
          title: 'Anunciar',
          tabBarIcon: ({ color, size }) => <TabPlusIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Minhas camisas',
          tabBarIcon: ({ color, size }) => <TabHomeIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <TabProfileIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
