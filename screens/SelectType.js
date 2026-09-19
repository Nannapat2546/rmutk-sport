import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform,
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SelectType({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* ส่วนหัวข้อ */}
        <View style={styles.header}>
          <Text style={styles.title}>
            ระบบยืม-คืน <Text style={styles.titleHighlight}>อุปกรณ์</Text>
          </Text>
          <Text style={styles.subtitle}>
            ยินดีต้อนรับสู่ระบบยืมคืนอุปกรณ์ กรุณาเลือกประเภท{'\n'}
            การใช้งานของคุณ เพื่อเข้าสู่ระบบ
          </Text>
        </View>

        {/* ปุ่มเลือก นักศึกษา */}
        <TouchableOpacity 
          style={[styles.card, styles.cardStudent]} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('RegisterStudent')} 
        >
          <View style={styles.circleDecorationStudent} />
          <View style={styles.iconContainerStudent}>
            <Ionicons name="id-card-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.cardTitle}>นักศึกษา</Text>
          <Text style={styles.cardDesc}>
            สำหรับนักศึกษาที่มีรหัสนักศึกษาและ Email มหาวิทยาลัย
          </Text>
        </TouchableOpacity>

        {/* ปุ่มเลือก บุคคลภายนอก */}
        <TouchableOpacity 
          style={[styles.card, styles.cardOutsider]} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('RegisterOutsider')}  
        >
          <View style={styles.circleDecorationOutsider} />
          <View style={styles.iconContainerOutsider}>
            <Ionicons name="person-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.cardTitle}>บุคคลภายนอก</Text>
          <Text style={styles.cardDesc}>
            สำหรับบุคลากร อาจารย์ หรือบุคคลทั่วไปที่ไม่ใช่นักศึกษา
          </Text>
        </TouchableOpacity>

        {/* ปุ่มเลือก เจ้าหน้าที่ */}
        <TouchableOpacity 
          style={[styles.card, styles.cardStaff]} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('LoginStaff')}  
        >
          <View style={styles.circleDecorationStaff} />
          <View style={styles.iconContainerStaff}>
            <Ionicons name="briefcase-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.cardTitle}>เจ้าหน้าที่</Text>
          <Text style={styles.cardDesc}>
            สำหรับเจ้าหน้าที่ผู้ดูแลระบบและจัดการการยืม-คืนอุปกรณ์
          </Text>
        </TouchableOpacity>

        {/* 🌟 ปุ่มเลือก ผู้ดูแลระบบ (Admin) เพิ่มใหม่ตรงนี้ครับ 🌟 */}
        <TouchableOpacity 
          style={[styles.card, styles.cardAdmin]} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('LoginAdmin')}  
        >
          <View style={styles.circleDecorationAdmin} />
          <View style={styles.iconContainerAdmin}>
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.cardTitle}>ผู้ดูแลระบบ (Admin)</Text>
          <Text style={styles.cardDesc}>
            สำหรับผู้ดูแลระบบ จัดการข้อมูลเจ้าหน้าที่และตั้งค่าระบบ
          </Text>
        </TouchableOpacity>

        {/* ส่วนเข้าสู่ระบบ (ทั่วไป) */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>มีบัญชีผู้ใช้งานอยู่แล้ว? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>เข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 60 : 40,
    alignItems: 'center',
    paddingBottom: 40,
    flexGrow: 1,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    textAlign: 'center',
  },
  titleHighlight: {
    color: '#00A87E',
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  cardStudent: {
    borderColor: '#E0F0E9',
  },
  cardOutsider: {
    borderColor: '#FFF4E0',
  },
  cardStaff: {
    borderColor: '#DBEAFE',
  },
  // 🌟 เพิ่มสไตล์ขอบการ์ดแอดมิน
  cardAdmin: {
    borderColor: '#EDE9FE',
  },
  iconContainerStudent: {
    width: 48,
    height: 48,
    backgroundColor: '#00A87E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconContainerOutsider: {
    width: 48,
    height: 48,
    backgroundColor: '#FFA500',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconContainerStaff: {
    width: 48,
    height: 48,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  // 🌟 เพิ่มสไตล์กล่องไอคอนแอดมิน
  iconContainerAdmin: {
    width: 48,
    height: 48,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: '#888888',
    lineHeight: 20,
  },
  circleDecorationStudent: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E6F5EF',
  },
  circleDecorationOutsider: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF8EA',
  },
  circleDecorationStaff: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EFF6FF',
  },
  // 🌟 เพิ่มสไตล์วงกลมตกแต่งแอดมิน
  circleDecorationAdmin: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F3FF',
  },
  loginContainer: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 15,
    color: '#888888',
  },
  loginLink: {
    fontSize: 15,
    color: '#00A87E',
    fontWeight: 'bold',
  }
});