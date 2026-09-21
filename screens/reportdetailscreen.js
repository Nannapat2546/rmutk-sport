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
  const [reports, setReports] = useState({
    borrowReport: [], pendingReport: [], popularReport: [], fitnessReport: []
  });

  const [searchText, setSearchText] = useState('');
  
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [eqCondition, setEqCondition] = useState('all'); 
  const [statusFilter, setStatusFilter] = useState('all'); 

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [webStartDateText, setWebStartDateText] = useState('');
  const [webEndDateText, setWebEndDateText] = useState('');

  const API_URL = 'https://rmutk-sport.onrender.com'; 

  useEffect(() => {
    fetchDashboardReports();
  }, []);

  const fetchDashboardReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/reports/dashboard`);
      const data = await res.json();
      if (res.ok) setReports(data);
    } catch (error) {
      console.error("Fetch report error:", error);
    }
    setIsLoading(false);
  };

  const parseThaiDate = (text) => {
    if (!text || text.length !== 10) return null;
    const [day, month, yearStr] = text.split('/');
    if (!day || !month || !yearStr) return null;
    const year = parseInt(yearStr) - 543;
    return new Date(`${year}-${month}-${day}`);
  };

  const handleNotifyUser = async (item) => {
    if (!item.email) {
      if(Platform.OS === 'web') window.alert(`ไม่พบข้อมูลอีเมลของ ${item.member_name} ในระบบ`);
      else Alert.alert('ข้อผิดพลาด', `ไม่พบข้อมูลอีเมลของ ${item.member_name} ในระบบ`);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/notify-overdue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transaction_id: item.transaction_id,
          email: item.email,
          memberName: item.member_name,
          equipment: item.equipment
        })
      });

      if (res.ok) {
        if(Platform.OS === 'web') {
          window.alert(`ส่งอีเมลแจ้งเตือนไปยัง ${item.member_name} เรียบร้อยแล้ว`);
        } else {
          Alert.alert('สำเร็จ', `ส่งอีเมลแจ้งเตือนไปยัง ${item.member_name} เรียบร้อยแล้ว`);
        }

        const updatedPending = reports.pendingReport.map(r => {
          if (r.transaction_id === item.transaction_id) {
            return { ...r, last_notified_date: new Date().toISOString() };
          }
          return r;
        });
        
        setReports({ ...reports, pendingReport: updatedPending });

      } else {
        const errorData = await res.json();
        if(Platform.OS === 'web') window.alert(errorData.message || 'ไม่สามารถส่งแจ้งเตือนได้');
        else Alert.alert('ข้อผิดพลาด', errorData.message || 'ไม่สามารถส่งแจ้งเตือนได้');
      }
    } catch (error) {
      if(Platform.OS === 'web') window.alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      else Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  const filteredData = useMemo(() => {
    let currentData = [];
    
    if (reportType === 'borrow') {
      currentData = reports.borrowReport; 
    } else if (reportType === 'pending') {
      currentData = reports.pendingReport; 
    } else if (reportType === 'fitness') {
      currentData = reports.fitnessReport;
    }

    if (statusFilter !== 'all') {
      currentData = currentData.filter(item => {
        const targetDateStr = item.expected_return_date ? item.expected_return_date : item.borrow_date;
        const targetDate = new Date(targetDateStr);
        targetDate.setHours(0, 0, 0, 0); 
        
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        if (item.return_date) {
          const retDate = new Date(item.return_date);
          retDate.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((retDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
          if (statusFilter === 'returned') return diffDays <= 0; 
          if (statusFilter === 'late') return diffDays > 0; 
          return false;
        } else {
          const diffDays = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
          if (statusFilter === 'borrowing') return diffDays <= 0; 
          if (statusFilter === 'late') return diffDays > 0; 
          return false;
        }
      });
    }

    if (reportType === 'borrow' || reportType === 'pending') {
      currentData = currentData.filter(item => {
        // 🌟 เปลี่ยนเงื่อนไขตัวกรองให้ค้นหาทั้ง 'ใช้งาน' (ข้อมูลเดิม) และ 'ปกติ'
        if (eqCondition === 'normal') return item.equipment_status === 'ปกติ' || item.equipment_status === 'ใช้งาน';
        if (eqCondition === 'broken') return item.equipment_status === 'ชำรุด' || item.equipment_status === 'ส่งซ่อม';
        return true;
      });
    }

    return currentData.filter((item) => {
      const keyword = searchText.toLowerCase();
      const matchText = !searchText || 
        (item.member_name && item.member_name.toLowerCase().includes(keyword)) ||
        (item.equipment && item.equipment.toLowerCase().includes(keyword));

      let matchDate = true;
      const itemDateStr = item.borrow_date || item.check_in_time;
      
      if (itemDateStr) {
        const itemDate = new Date(itemDateStr);
        itemDate.setHours(0, 0, 0, 0);

        const filterStart = Platform.OS === 'web' && webStartDateText ? parseThaiDate(webStartDateText) : startDate;
        if (filterStart) {
          filterStart.setHours(0, 0, 0, 0);
          if (itemDate < filterStart) matchDate = false;
        }

        const filterEnd = Platform.OS === 'web' && webEndDateText ? parseThaiDate(webEndDateText) : endDate;
        if (filterEnd) {
          filterEnd.setHours(23, 59, 59, 999);
          if (itemDate > filterEnd) matchDate = false;
        }
      }

      return matchText && matchDate;
    });
  }, [reports, reportType, searchText, startDate, endDate, webStartDateText, webEndDateText, eqCondition, statusFilter]);

  const handleExportCSV = async () => {
    if (filteredData.length === 0) {
      if(Platform.OS === 'web') window.alert('ไม่มีข้อมูลสำหรับ Export CSV');
      else Alert.alert('แจ้งเตือน', 'ไม่มีข้อมูลสำหรับ Export CSV');
      return;
    }

    let csvContent = '\uFEFF'; 
    let headers = [];
    let rows = [];

    if (reportType === 'borrow') {
      headers = ['สมาชิก', 'อุปกรณ์', 'สภาพ', 'จำนวน', 'ยืมเมื่อ', 'นัดคืน', 'คืนเมื่อ', 'สถานะ'];
      rows = filteredData.map(item => {
        let statusText = '';
        const targetDateStr = item.expected_return_date ? item.expected_return_date : item.borrow_date;
        const targetDate = new Date(targetDateStr);
        targetDate.setHours(0, 0, 0, 0);

        if (item.return_date) {
          const retDate = new Date(item.return_date);
          retDate.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((retDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
          statusText = diffDays > 0 ? `คืนช้า ${diffDays} วัน` : 'คืนตรงเวลา';
        }

        return [
          `"${item.member_name || '-'}"`, `"${item.equipment || '-'}"`, `"${item.equipment_status === 'ใช้งาน' ? 'ปกติ' : (item.equipment_status || 'ปกติ')}"`, 
          item.amount, formatDate(item.borrow_date), formatDate(item.expected_return_date), formatDate(item.return_date), `"${statusText}"`
        ];
      });
    } else if (reportType === 'pending') {
      headers = ['สมาชิก', 'อุปกรณ์', 'สภาพ', 'ยืมไป (ชิ้น)', 'คืนแล้ว (ชิ้น)', 'ค้างส่ง (ชิ้น)', 'ยืมเมื่อ', 'นัดคืนล่าสุด', 'สถานะ'];
      rows = filteredData.map(item => {
        let statusText = '';
        const targetDateStr = item.expected_return_date ? item.expected_return_date : item.borrow_date;
        const targetDate = new Date(targetDateStr);
        targetDate.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
        statusText = diffDays > 0 ? `ล่าช้า ${diffDays} วัน` : 'กำลังยืม';

        const originalAmount = parseInt(item.amount) || 0;
        const pendingAmount = parseInt(item.pending_amount) || originalAmount;
        const returnedAmount = originalAmount > pendingAmount ? originalAmount - pendingAmount : 0;

        return [
          `"${item.member_name || '-'}"`, `"${item.equipment || '-'}"`, `"${item.equipment_status === 'ใช้งาน' ? 'ปกติ' : (item.equipment_status || 'ปกติ')}"`, 
          originalAmount, returnedAmount, pendingAmount, formatDate(item.borrow_date), formatDate(item.expected_return_date), `"${statusText}"`
        ];
      });
    } else if (reportType === 'fitness') {
      headers = ['สมาชิก', 'ประเภท', 'วันที่เข้าใช้', 'ค่าบริการ', 'วิธีชำระ'];
      rows = filteredData.map(item => [
        `"${item.member_name || '-'}"`, item.role === 'student' ? 'นักศึกษา' : 'บุคคลภายนอก',
        formatDate(item.check_in_time), item.service_fee, item.payment_type === 'cash' ? 'เงินสด' : 'สแกน'
      ]);
    }

    csvContent += headers.join(',') + '\n';
    rows.forEach(row => { csvContent += row.join(',') + '\n'; });

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report_${reportType}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert("สำเร็จ", "ฟังก์ชันดาวน์โหลดไฟล์บนมือถือต้องใช้แพ็กเกจเสริม");
    }
  };

  const getPageTitle = () => {
    switch(reportType) {
      case 'borrow': return 'รายงานการยืม-คืน';
      case 'pending': return 'รายงานคงค้าง';
      case 'fitness': return 'รายงานการเข้าใช้ฟิตเนส';
      default: return 'รายงาน';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = (d.getFullYear() + 543).toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  const formatDisplayDate = (date) => {
    if (!date) return 'วว/ดด/ปปปป';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  };

  const getStatusInfo = (item) => {
    const targetDateStr = item.expected_return_date ? item.expected_return_date : item.borrow_date;
    const targetDate = new Date(targetDateStr);
    targetDate.setHours(0, 0, 0, 0); 
    
    if (item.return_date) {
      const retDate = new Date(item.return_date);
      retDate.setHours(0, 0, 0, 0);
      const diffTime = retDate.getTime() - targetDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) return { isLate: true, days: diffDays, text: `คืนช้า ${diffDays} วัน`, type: 'returned_late' };
      return { isLate: false, text: 'คืนตรงเวลา', type: 'returned_ok' };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0); 
    const diffTime = now.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return { isLate: true, days: diffDays, text: `ล่าช้า ${diffDays} วัน`, type: 'pending_late', expectedDateStr: formatDate(targetDateStr) };
    return { isLate: false, text: 'กำลังยืม', type: 'pending_ok' };
  };

  const renderStatusBadge = (statusInfo) => {
    if (statusInfo.type === 'returned_late' || statusInfo.type === 'pending_late') {
      return (
        <View style={{ alignItems: 'center' }}>
          <View style={[styles.badge, {backgroundColor: '#FEE2E2', marginBottom: 4}]}>
            <Text style={[styles.badgeText, {color: '#EF4444'}]}>{statusInfo.text}</Text>
          </View>
          {statusInfo.type === 'pending_late' && (
            <Text style={{ fontSize: 10, color: '#EF4444' }}>(นัด: {statusInfo.expectedDateStr})</Text>
          )}
        </View>
      );
    }

    if (statusInfo.type === 'returned_ok') {
      return (
        <View style={[styles.badge, {backgroundColor: '#E6F5EF'}]}>
          <Text style={[styles.badgeText, {color: '#00A87E'}]}>{statusInfo.text}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.badge, {backgroundColor: '#EFF6FF'}]}>
        <Text style={[styles.badgeText, {color: '#3B82F6'}]}>{statusInfo.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getPageTitle()}</Text>
      </View>

      <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}>
        
        <View style={styles.filterCard}>
          <View style={styles.filterRow}>
            
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput 
                placeholder="ค้นหาชื่อ, อุปกรณ์..." 
                style={styles.searchInput} 
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}
            </View>

            {(reportType === 'borrow' || reportType === 'pending') && (
              <View style={{ position: 'relative', zIndex: 100 }}>
                <TouchableOpacity 
                  style={[styles.filterBtn, (eqCondition !== 'all' || statusFilter !== 'all') && styles.filterBtnActive]} 
                  onPress={() => setShowFilterMenu(!showFilterMenu)}
                >
                  <Ionicons name="filter" size={16} color={(eqCondition !== 'all' || statusFilter !== 'all') ? "#00A87E" : "#374151"} />
                  <Text style={[styles.filterBtnText, (eqCondition !== 'all' || statusFilter !== 'all') && {color: '#00A87E'}]}>
                    ตัวกรอง {(eqCondition !== 'all' || statusFilter !== 'all') ? '(เปิดทำงาน)' : ''}
                  </Text>
                </TouchableOpacity>

                {showFilterMenu && (
                  <View style={styles.inlineDropdown}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#1E293B' }}>ตัวกรองข้อมูล</Text>
                      <TouchableOpacity onPress={() => setShowFilterMenu(false)}>
                        <Ionicons name="close" size={22} color="#64748B" />
                      </TouchableOpacity>
                    </View>

                    {reportType === 'borrow' && (
                      <View style={{ marginBottom: 20 }}>
                        <Text style={styles.filterGroupTitle}>สถานะการยืม</Text>
                        <View style={styles.filterToggleGroup}>
                          <TouchableOpacity style={[styles.filterToggleBtn, statusFilter === 'all' && styles.filterToggleBtnActive]} onPress={() => setStatusFilter('all')}><Text style={[styles.filterToggleText, statusFilter === 'all' && styles.filterToggleTextActive]}>ทั้งหมด</Text></TouchableOpacity>
                          <TouchableOpacity style={[styles.filterToggleBtn, statusFilter === 'returned' && styles.filterToggleBtnActive]} onPress={() => setStatusFilter('returned')}><Text style={[styles.filterToggleText, statusFilter === 'returned' && styles.filterToggleTextActive]}>ตรงเวลา</Text></TouchableOpacity>
                          <TouchableOpacity style={[styles.filterToggleBtn, statusFilter === 'late' && styles.filterToggleBtnActive]} onPress={() => setStatusFilter('late')}><Text style={[styles.filterToggleText, statusFilter === 'late' && styles.filterToggleTextActive]}>คืนช้า</Text></TouchableOpacity>
                        </View>
                      </View>
                    )}
                    {reportType === 'pending' && (
                      <View style={{ marginBottom: 20 }}>
                        <Text style={styles.filterGroupTitle}>สถานะการยืม</Text>
                        <View style={styles.filterToggleGroup}>
                          <TouchableOpacity style={[styles.filterToggleBtn, statusFilter === 'all' && styles.filterToggleBtnActive]} onPress={() => setStatusFilter('all')}><Text style={[styles.filterToggleText, statusFilter === 'all' && styles.filterToggleTextActive]}>ทั้งหมด</Text></TouchableOpacity>
                          <TouchableOpacity style={[styles.filterToggleBtn, statusFilter === 'borrowing' && styles.filterToggleBtnActive]} onPress={() => setStatusFilter('borrowing')}><Text style={[styles.filterToggleText, statusFilter === 'borrowing' && styles.filterToggleTextActive]}>กำลังยืม</Text></TouchableOpacity>
                          <TouchableOpacity style={[styles.filterToggleBtn, statusFilter === 'late' && styles.filterToggleBtnActive]} onPress={() => setStatusFilter('late')}><Text style={[styles.filterToggleText, statusFilter === 'late' && styles.filterToggleTextActive]}>ล่าช้า</Text></TouchableOpacity>
                        </View>
                      </View>
                    )}

                    <View style={{ marginBottom: 10 }}>
                      <Text style={styles.filterGroupTitle}>สภาพอุปกรณ์</Text>
                      <View style={styles.filterToggleGroup}>
                        <TouchableOpacity style={[styles.filterToggleBtn, eqCondition === 'all' && styles.filterToggleBtnActive]} onPress={() => setEqCondition('all')}><Text style={[styles.filterToggleText, eqCondition === 'all' && styles.filterToggleTextActive]}>ทั้งหมด</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.filterToggleBtn, eqCondition === 'normal' && styles.filterToggleBtnActive]} onPress={() => setEqCondition('normal')}><Text style={[styles.filterToggleText, eqCondition === 'normal' && styles.filterToggleTextActive]}>ปกติ</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.filterToggleBtn, eqCondition === 'broken' && styles.filterToggleBtnActive]} onPress={() => setEqCondition('broken')}><Text style={[styles.filterToggleText, eqCondition === 'broken' && styles.filterToggleTextActive]}>ชำรุด</Text></TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity 
                       style={{ marginTop: 20, alignSelf: 'flex-end', backgroundColor: '#FEF2F2', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 }}
                       onPress={() => { setEqCondition('all'); setStatusFilter('all'); setShowFilterMenu(false); }}
                    >
                       <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: 'bold' }}>ล้างตัวกรอง</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            <View style={styles.datePickerGroup}>
              {Platform.OS === 'web' ? (
                <>
                  <TextInput 
                    style={[styles.dateBoxText, webStartDateText && {borderColor: '#00A87E'}]} 
                    placeholder="วว/ดด/ปปปป"
                    value={webStartDateText}
                    onChangeText={setWebStartDateText}
                    maxLength={10}
                  />
                  <Text style={{fontSize: 12, color: '#6B7280', marginHorizontal: 8}}>ถึง</Text>
                  <TextInput 
                    style={[styles.dateBoxText, webEndDateText && {borderColor: '#00A87E'}]} 
                    placeholder="วว/ดด/ปปปป"
                    value={webEndDateText}
                    onChangeText={setWebEndDateText}
                    maxLength={10}
                  />
                </>
              ) : (
                <>
                  <TouchableOpacity style={[styles.dateBox, startDate && {borderColor: '#00A87E'}]} onPress={() => setShowStartPicker(true)}>
                    <Text style={[styles.dateText, startDate && {color: '#00A87E'}]}>{formatDisplayDate(startDate)}</Text>
                    <Ionicons name="calendar-outline" size={14} color={startDate ? "#00A87E" : "#6B7280"} />
                  </TouchableOpacity>
                  
                  <Text style={{fontSize: 12, color: '#6B7280', marginHorizontal: 8}}>ถึง</Text>
                  
                  <TouchableOpacity style={[styles.dateBox, endDate && {borderColor: '#00A87E'}]} onPress={() => setShowEndPicker(true)}>
                    <Text style={[styles.dateText, endDate && {color: '#00A87E'}]}>{formatDisplayDate(endDate)}</Text>
                    <Ionicons name="calendar-outline" size={14} color={endDate ? "#00A87E" : "#6B7280"} />
                  </TouchableOpacity>
                </>
              )}

              {(startDate || endDate || webStartDateText !== '' || webEndDateText !== '') ? (
                <TouchableOpacity style={{marginLeft: 10}} onPress={() => { setStartDate(null); setEndDate(null); setWebStartDateText(''); setWebEndDateText(''); }}>
                  <Text style={{color: '#EF4444', fontSize: 12}}>ล้างค่า</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
              <Ionicons name="download-outline" size={16} color="#374151" />
              <Text style={styles.exportBtnText}>Export CSV</Text>
            </TouchableOpacity>

          </View>
        </View>

        {showStartPicker && Platform.OS !== 'web' ? (
          <DateTimePicker value={startDate || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, d) => { if(Platform.OS === 'android') setShowStartPicker(false); if(d) setStartDate(d); }} />
        ) : null}
        
        {showEndPicker && Platform.OS !== 'web' ? (
          <DateTimePicker value={endDate || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, d) => { if(Platform.OS === 'android') setShowEndPicker(false); if(d) setEndDate(d); }} />
        ) : null}
        
        {Platform.OS === 'ios' && (showStartPicker || showEndPicker) ? (
          <TouchableOpacity style={{ alignSelf: 'flex-end', marginRight: 20, marginBottom: 10 }} onPress={() => { setShowStartPicker(false); setShowEndPicker(false); }}>
            <Text style={{ color: '#1A73E8', fontWeight: 'bold' }}>เสร็จสิ้นการเลือกวันที่</Text>
          </TouchableOpacity>
        ) : null}

        {isLoading ? (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100}}>
            <ActivityIndicator size="large" color="#00A87E" />
            <Text style={{marginTop: 10, color: '#666'}}>กำลังดึงข้อมูล...</Text>
          </View>
        ) : (
          <View style={{ paddingBottom: 40 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tableContainer}>
                
                {/* ================= 1. ตารางประวัติ ยืม-คืน ================= */}
                {reportType === 'borrow' ? (
                  <>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.headerCell, {width: 140}]}>สมาชิก</Text>
                      <Text style={[styles.headerCell, {width: 140}]}>อุปกรณ์</Text>
                      <Text style={[styles.headerCell, {width: 80}]}>สภาพ</Text>
                      <Text style={[styles.headerCell, {width: 60}]}>จำนวน</Text>
                      <Text style={[styles.headerCell, {width: 90}]}>ยืมเมื่อ</Text>
                      <Text style={[styles.headerCell, {width: 90}]}>นัดคืน</Text>
                      <Text style={[styles.headerCell, {width: 90}]}>คืนเมื่อ</Text>
                      <Text style={[styles.headerCell, {width: 120}]}>สถานะ</Text>
                    </View>
                    {filteredData.map((item, index) => {
                      const statusInfo = getStatusInfo(item);
                      return (
                        <View key={index} style={styles.tableDataRow}>
                          <Text style={[styles.dataCell, {width: 140}]} numberOfLines={1}>{item.member_name}</Text>
                          <Text style={[styles.dataCell, {width: 140}]} numberOfLines={1}>{item.equipment}</Text>
                          
                          <View style={[styles.dataCell, {width: 80, alignItems: 'center'}]}>
                            {/* 🌟 เปลี่ยนคำว่า 'ใช้งาน' เป็น 'ปกติ' */}
                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: (item.equipment_status === 'ปกติ' || item.equipment_status === 'ใช้งาน') ? '#10B981' : '#EF4444' }}>
                              {item.equipment_status === 'ใช้งาน' ? 'ปกติ' : (item.equipment_status || 'ปกติ')}
                            </Text>
                          </View>

                          <Text style={[styles.dataCell, {width: 60}]}>{item.amount}</Text>
                          <Text style={[styles.dataCell, {width: 90}]}>{formatDate(item.borrow_date)}</Text>
                          <Text style={[styles.dataCell, {width: 90}]}>{formatDate(item.expected_return_date)}</Text>
                          <Text style={[styles.dataCell, {width: 90}]}>{formatDate(item.return_date)}</Text>
                          <View style={[styles.dataCell, {width: 120, alignItems: 'center', paddingVertical: 4}]}>
                            {renderStatusBadge(statusInfo)}
                          </View>
                        </View>
                      );
                    })}
                  </>
                ) : null}

                {/* ================= 2. ตารางคงค้าง ================= */}
                {reportType === 'pending' ? (
                  <>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.headerCell, {width: 130}]}>สมาชิก</Text>
                      <Text style={[styles.headerCell, {width: 130}]}>อุปกรณ์</Text>
                      <Text style={[styles.headerCell, {width: 70}]}>สภาพ</Text>
                      <Text style={[styles.headerCell, {width: 50}]}>ยืมไป</Text>
                      <Text style={[styles.headerCell, {width: 60}]}>คืนแล้ว</Text>
                      <Text style={[styles.headerCell, {width: 60}]}>ค้างส่ง</Text>
                      <Text style={[styles.headerCell, {width: 80}]}>ยืมเมื่อ</Text>
                      <Text style={[styles.headerCell, {width: 80}]}>นัดล่าสุด</Text>
                      <Text style={[styles.headerCell, {width: 100}]}>สถานะ</Text>
                      <Text style={[styles.headerCell, {width: 90}]}>จัดการ</Text>
                    </View>
                    {filteredData.map((item, index) => {
                      const statusInfo = getStatusInfo(item);
                      
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const lastNotified = item.last_notified_date ? new Date(item.last_notified_date) : null;
                      if (lastNotified) lastNotified.setHours(0, 0, 0, 0);
                      
                      const isNotifiedToday = lastNotified && lastNotified.getTime() === today.getTime();
                      const showNotifyButton = statusInfo.isLate && !isNotifiedToday;

                      const originalAmount = parseInt(item.amount) || 0;
                      const pendingAmount = parseInt(item.pending_amount) || originalAmount;
                      const returnedAmount = originalAmount > pendingAmount ? originalAmount - pendingAmount : 0;

                      return (
                        <View key={index} style={styles.tableDataRow}>
                          <Text style={[styles.dataCell, {width: 130}]} numberOfLines={1}>{item.member_name}</Text>
                          <Text style={[styles.dataCell, {width: 130}]} numberOfLines={1}>{item.equipment}</Text>
                          
                          <View style={[styles.dataCell, {width: 70, alignItems: 'center'}]}>
                            {/* 🌟 เปลี่ยนคำว่า 'ใช้งาน' เป็น 'ปกติ' */}
                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: (item.equipment_status === 'ปกติ' || item.equipment_status === 'ใช้งาน') ? '#10B981' : '#EF4444' }}>
                              {item.equipment_status === 'ใช้งาน' ? 'ปกติ' : (item.equipment_status || 'ปกติ')}
                            </Text>
                          </View>

                          <Text style={[styles.dataCell, {width: 50, fontWeight: 'bold', color: '#374151'}]}>
                            {originalAmount}
                          </Text>

                          <Text style={[styles.dataCell, {width: 60, fontWeight: 'bold', color: '#10B981'}]}>
                            {returnedAmount}
                          </Text>

                          <Text style={[styles.dataCell, {width: 60, fontWeight: 'bold', color: '#D93025'}]}>
                            {pendingAmount}
                          </Text>
                          
                          <Text style={[styles.dataCell, {width: 80}]}>{formatDate(item.borrow_date)}</Text>
                          <Text style={[styles.dataCell, {width: 80}]}>{formatDate(item.expected_return_date)}</Text>
                          
                          <View style={[styles.dataCell, {width: 100, alignItems: 'center', paddingVertical: 4}]}>
                            {renderStatusBadge(statusInfo)}
                          </View>

                          <View style={[styles.dataCell, {width: 90, alignItems: 'center'}]}>
                            {showNotifyButton ? (
                              <TouchableOpacity style={styles.notifyBtn} onPress={() => handleNotifyUser(item)}>
                                <Ionicons name="mail-outline" size={14} color="#FFF" style={{marginRight: 4}} />
                                <Text style={styles.notifyBtnText}>ส่งแจ้งเตือน</Text>
                              </TouchableOpacity>
                            ) : statusInfo.isLate && isNotifiedToday ? (
                              <Text style={{fontSize: 11, color: '#10B981', fontWeight: 'bold'}}>
                                <Ionicons name="checkmark-circle" size={12} color="#10B981"/> แจ้งเตือนแล้ว
                              </Text>
                            ) : (
                              <Text style={{fontSize: 11, color: '#9CA3AF'}}>-</Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </>
                ) : null}

                {/* ================= 3. ตารางรายงานฟิตเนส ================= */}
                {reportType === 'fitness' ? (
                  <>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.headerCell, {width: 150}]}>สมาชิก</Text>
                      <Text style={[styles.headerCell, {width: 120}]}>ประเภท</Text>
                      <Text style={[styles.headerCell, {width: 120}]}>วันที่เข้าใช้</Text>
                      <Text style={[styles.headerCell, {width: 100}]}>ค่าบริการ (฿)</Text>
                      <Text style={[styles.headerCell, {width: 100}]}>วิธีชำระ</Text>
                    </View>
                    {filteredData.map((item, index) => (
                      <View key={index} style={styles.tableDataRow}>
                        <Text style={[styles.dataCell, {width: 150}]} numberOfLines={1}>{item.member_name}</Text>
                        <View style={[styles.dataCell, {width: 120, alignItems: 'center'}]}>
                          <View style={[styles.roleTag, item.role === 'student' ? {backgroundColor: '#E6F5EF'} : {backgroundColor: '#FEE2E2'}]}>
                            <Text style={[styles.roleTagText, item.role === 'student' ? {color: '#00A87E'} : {color: '#EF4444'}]}>
                              {item.role === 'student' ? 'นักศึกษา' : 'บุคคลภายนอก'}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.dataCell, {width: 120}]}>{formatDate(item.check_in_time)}</Text>
                        <Text style={[styles.dataCell, {width: 100}]}>{item.service_fee}</Text>
                        <Text style={[styles.dataCell, {width: 100}]}>{item.payment_type === 'cash' ? 'เงินสด' : 'สแกน'}</Text>
                      </View>
                    ))}
                  </>
                ) : null}

                {filteredData.length === 0 ? (
                  <Text style={styles.emptyText}>ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</Text>
                ) : null}

              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', zIndex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', zIndex: 2 },
  backButton: { paddingRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  
  contentArea: { flex: 1, padding: 20, zIndex: 10 },
  filterCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20, zIndex: 50 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, zIndex: 50 },
  
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 10, height: 40, flex: 1, minWidth: 200 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: '#374151', outlineStyle: 'none' },
  
  filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, paddingHorizontal: 15, height: 40 },
  filterBtnActive: { borderColor: '#00A87E', backgroundColor: '#E6F5EF' },
  filterBtnText: { fontSize: 13, color: '#374151', marginLeft: 6, fontWeight: 'bold' },
  inlineDropdown: { position: 'absolute', top: 50, left: 0, width: 300, backgroundColor: '#FFF', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 10, borderWidth: 1, borderColor: '#E2E8F0', zIndex: 999 },
  filterGroupTitle: { fontSize: 13, fontWeight: 'bold', color: '#64748B', marginBottom: 8 },
  filterToggleGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterToggleBtn: { backgroundColor: '#F8FAFC', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  filterToggleBtnActive: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' },
  filterToggleText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  filterToggleTextActive: { color: '#FFF' },

  datePickerGroup: { flexDirection: 'row', alignItems: 'center' },
  dateBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, paddingHorizontal: 10, height: 40, width: 110, backgroundColor: '#FFF' },
  dateBoxText: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, paddingHorizontal: 10, height: 40, width: 110, backgroundColor: '#FFF', fontSize: 12, textAlign: 'center', outlineStyle: 'none' },
  dateText: { fontSize: 12, color: '#6B7280' },
  
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, height: 40, paddingHorizontal: 15, backgroundColor: '#FFF' },
  exportBtnText: { fontSize: 13, color: '#374151', marginLeft: 6, fontWeight: 'bold' },

  tableContainer: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', minWidth: '100%', zIndex: 1 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingVertical: 14 },
  headerCell: { fontSize: 13, fontWeight: 'bold', color: '#374151', textAlign: 'center' },
  tableDataRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingVertical: 14, alignItems: 'center' },
  dataCell: { fontSize: 13, color: '#4B5563', textAlign: 'center' },
  emptyText: { textAlign: 'center', padding: 30, color: '#9CA3AF', fontSize: 13 },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  roleTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  roleTagText: { fontSize: 11, fontWeight: 'bold' },

  notifyBtn: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
