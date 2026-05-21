import { Image, View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import { Search, Plus, Home, User } from 'lucide-react-native';

import { FeedScreen } from '../screens/feed/FeedScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { NewListingScreen } from '../screens/listing/NewListingScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

function LogoHeader() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Image
        source={require('../assets/stadium.png')}
        style={{ width: 32, height: 32 }}
        resizeMode="contain"
      />
      <Image
        source={require('../assets/title.png')}
        style={{ width: 80, height: 29 }}
        resizeMode="contain"
      />
    </View>
  );
}

export function MainTabs() {
  return (
    <Tab.Navigator
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        tabBarActiveTintColor: colors.arenaDourado,
        tabBarInactiveTintColor: colors.ink3,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceBorder,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: colors.arenaVerde },
        headerTitleStyle: { color: colors.arenaDouradoClaro, fontWeight: '800', fontSize: 17 },
        headerTintColor: colors.arenaDouradoClaro,
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          headerShown: false,
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('../assets/stadium.png')}
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          headerShown: false,
          title: 'Buscar',
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="NewListing"
        component={NewListingScreen}
        options={{
          title: 'Anunciar',
          tabBarIcon: ({ color, size }) => <Plus color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <LogoHeader />,
          title: 'Minhas camisas',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
