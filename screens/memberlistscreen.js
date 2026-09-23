import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ScrollView, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MemberListScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const API_URL = 'https://envision-stumble-kept.ngrok-free.dev';

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      // 🌟 เพิ่ม Header ngrok เพื่อทะลุการบล็อก
      const res = await fetch(`${API_URL}/api/members`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) setMembers(data);
      else setMembers([]);
    } catch (error) { setMembers([]); }
    setIsLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    // แสดงผลแบบ วัน/เดือน/ปีพ.ศ.
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getFullYear() + 543}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>รายชื่อสมาชิกทั้งหมด</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{ width: '100%' }}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderText, { width: 140, paddingLeft: 10 }]}>ชื่อ-นามสกุล</Text>
              <Text style={[styles.tableHeaderText, { width: 90, textAlign: 'center' }]}>ประเภท</Text>
              <Text style={[styles.tableHeaderText, { width: 120, textAlign: 'center' }]}>รหัส/บัตร ปชช.</Text>
              <Text style={[styles.tableHeaderText, { width: 140, paddingLeft: 10 }]}>คณะ</Text>
              <Text style={[styles.tableHeaderText, { width: 140, paddingLeft: 10 }]}>สาขา</Text>
              <Text style={[styles.tableHeaderText, { width: 100, textAlign: 'center' }]}>เบอร์โทร</Text>
              {/* 🌟 เพิ่มหัวคอลัมน์ สมัครเมื่อ */}
              <Text style={[styles.tableHeaderText, { width: 100, textAlign: 'center' }]}>สมัครเมื่อ</Text>
              <Text style={[styles.tableHeaderText, { width: 200, paddingLeft: 10 }]}>อีเมล</Text>
            </View>

            {isLoading ? (
              <ActivityIndicator size="small" color="#00A87E" style={{ padding: 40 }} />
            ) : members.length === 0 ? (
              <Text style={{ textAlign: 'center', padding: 40, color: '#888' }}>ยังไม่มีข้อมูลสมาชิก</Text>
            ) : (
              members.map((item, index) => (
                <View key={item.id || index} style={[styles.tableDataRow, index === members.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={{ width: 140, paddingLeft: 10 }}>
                    <Text style={[styles.tableDataText, { fontWeight: 'bold' }]} numberOfLines={1}>{item.name || '-'}</Text>
                  </View>
                  <View style={{ width: 90, alignItems: 'center' }}>
                    <View style={[styles.roleBadge, item.role === 'นักศึกษา' ? { backgroundColor: '#E6F5EF' } : { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.roleBadgeText, item.role === 'นักศึกษา' ? { color: '#00A87E' } : { color: '#D97706' }]}>{item.role}</Text>
                    </View>
                  </View>
                  <View style={{ width: 120, alignItems: 'center' }}>
                    <Text style={styles.tableDataText}>{item.code || '-'}</Text>
                  </View>
                  <View style={{ width: 140, paddingLeft: 10 }}>
                    <Text style={styles.tableDataText} numberOfLines={1}>{item.faculty || '-'}</Text>
                  </View>
                  <View style={{ width: 140, paddingLeft: 10 }}>
                    <Text style={styles.tableDataText} numberOfLines={1}>{item.major || '-'}</Text>
                  </View>
                  <View style={{ width: 100, alignItems: 'center' }}>
                    <Text style={styles.tableDataText}>{item.phone || '-'}</Text>
                  </View>
                  {/* 🌟 แสดงข้อมูล วันที่สมัคร (ดึงจาก item.created_at) */}
                  <View style={{ width: 100, alignItems: 'center' }}>
                    <Text style={styles.tableDataText}>{formatDate(item.created_at)}</Text>
                  </View>
                  <View style={{ width: 200, paddingLeft: 10 }}>
                    <Text style={styles.tableDataText} numberOfLines={1}>{item.email || '-'}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
        <Text style={styles.noteText}>ปัดซ้าย-ขวาเพื่อดูข้อมูลเพิ่มเติม</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  content: { padding: 15 },
  // 🌟 ปรับ minWidth ให้กว้างขึ้นเพื่อรองรับคอลัมน์ใหม่
  tableContainer: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden', backgroundColor: '#FFF', minWidth: 1000 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 12 },
  tableHeaderText: { fontSize: 12, fontWeight: 'bold', color: '#1E293B' },
  tableDataRow: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 14, alignItems: 'center' },
  tableDataText: { fontSize: 12, color: '#334155' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  roleBadgeText: { fontSize: 11, fontWeight: 'bold' },
  noteText: { textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 10 }
});
