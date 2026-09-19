import React from 'react';
import { View, Platform } from 'react-native'; 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SelectType from './screens/SelectType'; 
import Login from './screens/login'; 
import LoginStaff from './screens/loginstaff'; 
import StaffDashboard from './screens/staffhome';
import LoginAdminScreen from './screens/loginadmin';
import AdminDashboard from './screens/adminhome'; 
import Dashboard from './screens/home'; 
import RegisterStudent from './screens/register-student'; 
import RegisterOutsider from './screens/register-external'; 
import BorrowScreen from './screens/borrowscreen'; 
import ReturnScreen from './screens/returnscreen'; 
import FitnessScreen from './screens/fitnessscreen';
import EquipmentScreen from './screens/equipment';
import MemberListScreen from './screens/memberlistscreen'; 
import ReportScreen from './screens/reportscreen';         
import ReportDetailScreen from './screens/reportdetailscreen';
import HistoryScreen from './screens/historyscreen'; 

// 🌟 จุดที่ 1: ตรวจสอบชื่อไฟล์ตรงนี้ให้ตรงกับในโฟลเดอร์ของคุณ!
// ถ้าชื่อไฟล์ของคุณเป็นตัวเล็กหมด ให้ใช้บรรทัดนี้:
import FitnessScannerScreen from './screens/fitnessscannerscreen';
// (ถ้าไฟล์คุณชื่อ fitnessscannerscreen.js ให้แก้ด้านบนเป็น './screens/fitnessscannerscreen')

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <View style={{ flex: 1, width: '100%', height: Platform.OS === 'web' ? '100vh' : '100%' }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="SelectType" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SelectType" component={SelectType} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="LoginStaff" component={LoginStaff} />
            <Stack.Screen name="LoginAdmin" component={LoginAdminScreen} />
            <Stack.Screen name="StaffDashboard" component={StaffDashboard} />
            <Stack.Screen name="AdminHome" component={AdminDashboard} options={{ headerShown: false }} />
            <Stack.Screen name="home" component={Dashboard} /> 
            <Stack.Screen name="Borrow" component={BorrowScreen} />
            <Stack.Screen name="Return" component={ReturnScreen} />
            <Stack.Screen name="Fitness" component={FitnessScreen} />
            
            {/* 🌟 จุดที่ 2: เพิ่มหน้า FitnessScanner เข้ามาในระบบนำทางตรงนี้ */}
            <Stack.Screen name="FitnessScanner" component={FitnessScannerScreen} />
            
            <Stack.Screen name="Equipment" component={EquipmentScreen} />
            <Stack.Screen name="MemberList" component={MemberListScreen} /> 
            <Stack.Screen name="Report" component={ReportScreen} />         
            <Stack.Screen name="RegisterStudent" component={RegisterStudent} />
            <Stack.Screen name="RegisterOutsider" component={RegisterOutsider} /> 
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </View>
  );
}