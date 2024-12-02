import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import { UserExperienceProvider } from './src/contexts/UserExperienceContext';
import ErrorBoundary from './src/components/ErrorBoundary';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import VerificationScreen from './src/screens/VerificationScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import PaymentScreen from './src/screens/PaymentScreen';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList, RootTabParamList {}
  }
}

type VerificationType = 'phone' | 'email';

export type RootStackParamList = {
  Login: undefined;
  Verification: {
    type: VerificationType;
    value: string;
    onVerificationComplete: () => void;
  };
  ForgotPassword: undefined;
  Payment: {
    amount: number;
    email: string;
  };
};

export type RootTabParamList = {
  Home: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
      />
      <Stack.Screen
        name="Verification"
        component={VerificationScreen}
        initialParams={{
          type: 'email',
          value: '',
          onVerificationComplete: () => {},
        }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{
          headerShown: true,
          title: 'Payment'
        }}
      />
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2D9CDB',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const Navigation = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SubscriptionProvider>
          <UserExperienceProvider>
            <Navigation />
          </UserExperienceProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}