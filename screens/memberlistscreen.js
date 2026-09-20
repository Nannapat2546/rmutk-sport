import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ScrollView, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const facultyNameThai = {
  'arts': 'คณะศิลปศาสตร์', 'science': 'คณะวิทยาศาสตร์และเทคโนโลยี', 'industrial_education': 'คณะครุศาสตร์อุตสาหกรรม',
  'engineering': 'คณะวิศวกรรมศาสตร์', 'business': 'คณะบริหารธุรกิจ', 'home_economics': 'คณะเทคโนโลยีคหกรรมศาสตร์',
  'textile': 'คณะอุตสาหกรรมสิ่งทอ', 'international_college': 'วิทยาลัยนานาชาติ', 'isic': 'สถาบันวิทยาศาสตร์ นวัตกรรมและวัฒนธรรม',
};

const majorNameThai = {
  'english': 'ภาษาอังกฤษเพื่อการสื่อสารสากล', 'chinese': 'ภาษาจีนเพื่อการสื่อสาร', 'japanese': 'ภาษาญี่ปุ่น', 'tourism': 'การท่องเที่ยว', 'hotel': 'การโรงแรม',
  'cs': 'วิทยาการคอมพิวเตอร์', 'it': 'เทคโนโลยีสารสนเทศ', 'chemistry': 'เคมี', 'physics': 'ฟิสิกส์', 'math': 'คณิตศาสตร์', 'food_science': 'วิทยาศาสตร์และเทคโนโลยีการอาหาร',
  'te_me': 'ครุศาสตร์อุตสาหกรรม (เครื่องกล)', 'te_ie': 'ครุศาสตร์อุตสาหกรรม (อุตสาหการ)',
  'me': 'วิศวกรรมเครื่องกล', 'ee': 'วิศวกรรมไฟฟ้า', 'ce': 'วิศวกรรมคอมพิวเตอร์', 'civil': 'วิศวกรรมโยธา', 'ie': 'วิศวกรรมอุตสาหการ', 'che': 'วิศวกรรมเคมี', 'se': 'วิศวกรรมสำรวจ', 'electronic': 'วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม',
  'acc': 'การบัญชี', 'is': 'ระบบสารสนเทศ', 'marketing': 'การตลาด', 'management': 'การจัดการ', 'finance': 'การเงิน', 'international_business': 'ธุรกิจระหว่างประเทศ',
  'food_nutrition': 'อาหารและโภชนาการ', 'fashion': 'การออกแบบแฟชั่น', 'early_childhood': 'การศึกษาปฐมวัย',
  'textile_eng': 'วิศวกรรมสิ่งทอ', 'textile_design': 'การออกแบบสิ่งทอ', 'garment': 'เทคโนโลยีเสื้อผ้า',
  'ic_biz': 'บริหารธุรกิจ (นานาชาติ)', 'ic_tourism': 'การท่องเที่ยว (นานาชาติ)', 'innovation': 'นวัตกรรมและวัฒนธรรม',
};

export default function MemberListScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  
  // 🌟 แก้ไข URL เรียบร้อย
  const API_URL = 'https://rmutk-sport.onrender.com';

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/members`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMembers(data);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error("Fetch members error:", error);
      setMembers([]);
    }
    setIsLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear() + 543; 
    return `${day}/${month}/${year}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>รายชื่อสมาชิก</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderText, { width: 160, paddingLeft: 15 }]}>ชื่อ-นามสกุล</Text>
              <View style={styles.tableDivider} />
              <Text style={[styles.tableHeaderText, { width: 110, textAlign: 'center' }]}>ประเภท</Text>
              <View style={styles.tableDivider} />
              <Text style={[styles.tableHeaderText, { width: 140, textAlign: 'center' }]}>รหัส</Text>
              <View style={styles.tableDivider} />
              <Text style={[styles.tableHeaderText, { width: 170, paddingLeft: 10 }]}>คณะ</Text>
              <View style={styles.tableDivider} />
              <Text style={[styles.tableHeaderText, { width: 180, paddingLeft: 10 }]}>สาขา</Text>
              <View style={styles.tableDivider} />
              <Text style={[styles.tableHeaderText, { width: 120, textAlign: 'center' }]}>เบอร์โทร</Text>
              <View style={styles.tableDivider} />
              <Text style={[styles.tableHeaderText, { width: 240, paddingLeft: 15 }]}>อีเมล</Text>
              <View style={styles.tableDivider} />
              <Text style={[styles.tableHeaderText, { width: 110, textAlign: 'center' }]}>สมัครเมื่อ</Text>
            </View>

            {isLoading ? (
              <ActivityIndicator size="small" color="#00A87E" style={{ padding: 40 }} />
            ) : members.length === 0 ? (
              <Text style={{ textAlign: 'center', padding: 40, color: '#888', width: '100%' }}>ยังไม่มีข้อมูลสมาชิกในระบบ</Text>
            ) : (
              members.map((item, index) => {
                const rawFaculty = item.faculty ? item.faculty.toLowerCase() : '';
                const rawMajor = item.major ? item.major.toLowerCase() : '';
                const displayFaculty = facultyNameThai[rawFaculty] || (item.faculty === '-' ? '-' : item.faculty);
                const displayMajor = majorNameThai[rawMajor] || (item.major === '-' ? '-' : item.major);

                return (
                  <View key={item.id || index} style={[styles.tableDataRow, index === members.length - 1 && { borderBottomWidth: 0 }]}>
                    
                    <View style={{ width: 160, justifyContent: 'center', paddingLeft: 15 }}>
                      <Text style={[styles.tableDataText, { fontWeight: 'bold' }]} numberOfLines={1}>{item.name || '-'}</Text>
                    </View>
                    <View style={styles.tableDivider} />

                    <View style={{ width: 110, alignItems: 'center', justifyContent: 'center' }}>
                      <View style={[styles.roleBadge, item.role === 'นักศึกษา' ? { backgroundColor: '#E6F5EF' } : { backgroundColor: '#FEF3C7' }]}>
                        <Text style={[styles.roleBadgeText, item.role === 'นักศึกษา' ? { color: '#00A87E' } : { color: '#D97706' }]}>
                          {item.role}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tableDivider} />

                    <View style={{ width: 140, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={styles.tableDataText}>{item.code || '-'}</Text>
                    </View>
                    <View style={styles.tableDivider} />

                    <View style={{ width: 170, justifyContent: 'center', paddingLeft: 10 }}>
                      <Text style={styles.tableDataText} numberOfLines={1}>{displayFaculty}</Text>
                    </View>
                    <View style={styles.tableDivider} />

                    <View style={{ width: 180, justifyContent: 'center', paddingLeft: 10 }}>
                      <Text style={styles.tableDataText} numberOfLines={1}>{displayMajor}</Text>
                    </View>
                    <View style={styles.tableDivider} />

                    <View style={{ width: 120, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={styles.tableDataText}>{item.phone || '-'}</Text>
                    </View>
                    <View style={styles.tableDivider} />

                    <View style={{ width: 240, justifyContent: 'center', paddingLeft: 15 }}>
                      <Text style={styles.tableDataText} numberOfLines={1}>{item.email || '-'}</Text>
                    </View>
                    <View style={styles.tableDivider} />

                    <View style={{ width: 110, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={styles.tableDataText}>{formatDate(item.created_at)}</Text>
                    </View>

                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  content: { padding: 20 },
  tableContainer: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden', backgroundColor: '#FFF' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 12 },
  tableHeaderText: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
  tableDataRow: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 14, alignItems: 'center' },
  tableDataText: { fontSize: 13, color: '#334155' },
  tableDivider: { width: 1, backgroundColor: '#E2E8F0', height: '100%' },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, alignSelf: 'center' },
  roleBadgeText: { fontSize: 13, fontWeight: 'bold' }
});