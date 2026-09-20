import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ScrollView, ActivityIndicator, TextInput, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker'; 

export default function ReportDetailScreen({ navigation, route }) {
  const reportType = route.params?.reportType || 'borrow'; 
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState({ borrowReport: [], pendingReport: [], popularReport: [], fitnessReport: [] });
  const [searchText, setSearchText] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [eqCondition, setEqCondition] = useState('all'); 
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const API_URL = 'https://rmutk-sport.onrender.com'; 

  useEffect(() => { fetchDashboardReports(); }, []);

  const fetchDashboardReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/reports/dashboard`);
      const data = await res.json();
      if (res.ok) setReports(data);
    } catch (error) { console.error(error); }
    setIsLoading(false);
  };

  const handleNotifyUser = async (item) => {
    if (!item.email) return Alert.alert('ข้อผิดพลาด', `ไม่พบอีเมลของ ${item.member_name}`);
    try {
      const res = await fetch(`${API_URL}/api/notify-overdue`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: item.transaction_id, email: item.email, memberName: item.member_name, equipment: item.equipment })
      });
      if (res.ok) {
        Alert.alert('สำเร็จ', `ส่งอีเมลแจ้งเตือนไปที่ ${item.member_name} แล้ว`);
        const updatedPending = reports.pendingReport.map(r => r.transaction_id === item.transaction_id ? { ...r, last_notified_date: new Date().toISOString() } : r);
        setReports({ ...reports, pendingReport: updatedPending });
      } else Alert.alert('ข้อผิดพลาด', 'ไม่สามารถส่งแจ้งเตือนได้');
    } catch (error) { Alert.alert('ข้อผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'); }
  };

  const filteredData = useMemo(() => {
    let currentData = reportType === 'borrow' ? reports.borrowReport : reportType === 'pending' ? reports.pendingReport : reports.fitnessReport;
    
    return currentData.filter((item) => {
      const keyword = searchText.toLowerCase();
      const matchText = !searchText || (item.member_name && item.member_name.toLowerCase().includes(keyword)) || (item.equipment && item.equipment.toLowerCase().includes(keyword));
      let matchDate = true;
      const itemDateStr = item.borrow_date || item.check_in_time;
      if (itemDateStr) {
        const itemDate = new Date(itemDateStr); itemDate.setHours(0, 0, 0, 0);
        if (startDate && itemDate < startDate) matchDate = false;
        if (endDate && itemDate > endDate) matchDate = false;
      }
      return matchText && matchDate;
    });
  }, [reports, reportType, searchText, startDate, endDate]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${(d.getFullYear() + 543).toString().slice(-2)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{reportType === 'borrow' ? 'รายงานการยืม-คืน' : reportType === 'pending' ? 'รายงานคงค้าง' : 'รายงานฟิตเนส'}</Text>
      </View>

      <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}>
        <View style={styles.filterCard}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput placeholder="ค้นหาชื่อ, อุปกรณ์..." style={styles.searchInput} value={searchText} onChangeText={setSearchText} />
          </View>

          <View style={styles.datePickerGroup}>
            <TouchableOpacity style={styles.dateBox} onPress={() => setShowStartPicker(true)}>
              <Text style={styles.dateText}>{startDate ? formatDate(startDate) : 'วันเริ่มต้น'}</Text>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            </TouchableOpacity>
            <Text style={{marginHorizontal: 5, color: '#888'}}>-</Text>
            <TouchableOpacity style={styles.dateBox} onPress={() => setShowEndPicker(true)}>
              <Text style={styles.dateText}>{endDate ? formatDate(endDate) : 'วันสิ้นสุด'}</Text>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            </TouchableOpacity>
            {(startDate || endDate) && (
              <TouchableOpacity style={{marginLeft: 10}} onPress={() => { setStartDate(null); setEndDate(null); }}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {showStartPicker && Platform.OS !== 'web' && ( <DateTimePicker value={startDate || new Date()} mode="date" display="default" onChange={(e, d) => { setShowStartPicker(false); if(d) setStartDate(d); }} /> )}
        {showEndPicker && Platform.OS !== 'web' && ( <DateTimePicker value={endDate || new Date()} mode="date" display="default" onChange={(e, d) => { setShowEndPicker(false); if(d) setEndDate(d); }} /> )}

        {isLoading ? <ActivityIndicator size="large" color="#00A87E" style={{ marginTop: 50 }} /> : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tableContainer}>
              
              {/* ตารางยืม-คืน */}
              {reportType === 'borrow' && (
                <>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.headerCell, {width: 120}]}>สมาชิก</Text>
                    <Text style={[styles.headerCell, {width: 120}]}>อุปกรณ์</Text>
                    <Text style={[styles.headerCell, {width: 50}]}>จำนวน</Text>
                    <Text style={[styles.headerCell, {width: 80}]}>ยืมเมื่อ</Text>
                    <Text style={[styles.headerCell, {width: 80}]}>คืนเมื่อ</Text>
                  </View>
                  {filteredData.map((item, index) => (
                    <View key={index} style={styles.tableDataRow}>
                      <Text style={[styles.dataCell, {width: 120}]} numberOfLines={1}>{item.member_name}</Text>
                      <Text style={[styles.dataCell, {width: 120}]} numberOfLines={1}>{item.equipment}</Text>
                      <Text style={[styles.dataCell, {width: 50}]}>{item.amount}</Text>
                      <Text style={[styles.dataCell, {width: 80}]}>{formatDate(item.borrow_date)}</Text>
                      <Text style={[styles.dataCell, {width: 80}]}>{formatDate(item.return_date)}</Text>
                    </View>
                  ))}
                </>
              )}

              {/* ตารางคงค้าง */}
              {reportType === 'pending' && (
                <>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.headerCell, {width: 120}]}>สมาชิก</Text>
                    <Text style={[styles.headerCell, {width: 120}]}>อุปกรณ์</Text>
                    <Text style={[styles.headerCell, {width: 60}]}>ค้างส่ง</Text>
                    <Text style={[styles.headerCell, {width: 80}]}>ยืมเมื่อ</Text>
                    <Text style={[styles.headerCell, {width: 90}]}>จัดการ</Text>
                  </View>
                  {filteredData.map((item, index) => (
                    <View key={index} style={styles.tableDataRow}>
                      <Text style={[styles.dataCell, {width: 120}]} numberOfLines={1}>{item.member_name}</Text>
                      <Text style={[styles.dataCell, {width: 120}]} numberOfLines={1}>{item.equipment}</Text>
                      <Text style={[styles.dataCell, {width: 60, color: '#D93025', fontWeight: 'bold'}]}>{item.pending_amount || item.amount}</Text>
                      <Text style={[styles.dataCell, {width: 80}]}>{formatDate(item.borrow_date)}</Text>
                      <View style={[styles.dataCell, {width: 90, alignItems: 'center'}]}>
                        <TouchableOpacity style={styles.notifyBtn} onPress={() => handleNotifyUser(item)}>
                          <Text style={styles.notifyBtnText}>แจ้งเตือน</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {/* ตารางฟิตเนส */}
              {reportType === 'fitness' && (
                <>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.headerCell, {width: 120}]}>สมาชิก</Text>
                    <Text style={[styles.headerCell, {width: 90}]}>วันที่</Text>
                    <Text style={[styles.headerCell, {width: 80}]}>ค่าบริการ</Text>
                    <Text style={[styles.headerCell, {width: 80}]}>วิธีชำระ</Text>
                  </View>
                  {filteredData.map((item, index) => (
                    <View key={index} style={styles.tableDataRow}>
                      <Text style={[styles.dataCell, {width: 120}]} numberOfLines={1}>{item.member_name}</Text>
                      <Text style={[styles.dataCell, {width: 90}]}>{formatDate(item.check_in_time)}</Text>
                      <Text style={[styles.dataCell, {width: 80}]}>{item.service_fee} ฿</Text>
                      <Text style={[styles.dataCell, {width: 80}]}>{item.payment_type === 'cash' ? 'เงินสด' : 'สแกน'}</Text>
                    </View>
                  ))}
                </>
              )}

              {filteredData.length === 0 && <Text style={styles.emptyText}>ไม่พบข้อมูล</Text>}
            </View>
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  contentArea: { flex: 1, padding: 15 },
  filterCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 15 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 10, height: 40, marginBottom: 10 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, outlineStyle: 'none' },
  datePickerGroup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dateBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, paddingHorizontal: 10, height: 40, flex: 1, backgroundColor: '#FFF' },
  dateText: { fontSize: 12, color: '#6B7280' },
  tableContainer: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', minWidth: 450, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderColor: '#E5E7EB', paddingVertical: 12 },
  headerCell: { fontSize: 12, fontWeight: 'bold', color: '#374151', textAlign: 'center' },
  tableDataRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#F3F4F6', paddingVertical: 12, alignItems: 'center' },
  dataCell: { fontSize: 12, color: '#4B5563', textAlign: 'center' },
  emptyText: { textAlign: 'center', padding: 30, color: '#9CA3AF', fontSize: 13 },
  notifyBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 },
  notifyBtnText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' }
});
