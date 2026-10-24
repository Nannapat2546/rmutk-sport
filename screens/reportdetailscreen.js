import React, { useState, useEffect, useMemo, useRef } from 'react';
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

  // Ref สำหรับเรียกปฏิทินเบราว์เซอร์บน Web
  const webStartInputRef = useRef(null);
  const webEndInputRef = useRef(null);

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

  const formatDateForInput = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const parseItemDate = (dateVal) => {
    if (!dateVal) return null;
    if (dateVal instanceof Date) {
      return new Date(dateVal.getFullYear(), dateVal.getMonth(), dateVal.getDate(), 0, 0, 0, 0);
    }
    const str = String(dateVal).trim();
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10) - 1;
        let year = parseInt(parts[2], 10);
        if (year > 2500) year -= 543;
        else if (year < 100) year += 2000;
        return new Date(year, month, day, 0, 0, 0, 0);
      }
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    }
    return null;
  };

  const handleNotifyUser = async (item, diffDays) => {
    if (!item.email) {
      if(Platform.OS === 'web') window.alert(`ไม่พบข้อมูลอีเมลของ ${item.member_name} ในระบบ`);
      else Alert.alert('ข้อผิดพลาด', `ไม่พบข้อมูลอีเมลของ ${item.member_name} ในระบบ`);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/notify-overdue`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          transaction_id: item.transaction_id,
          email: item.email,
          memberName: item.member_name,
          equipment: item.equipment,
          lateDays: diffDays 
        })
      });

      if (res.ok) {
        if(Platform.OS === 'web') {
          window.alert(`ส่งอีเมลแจ้งเตือนไปยัง ${item.member_name} (${item.email}) เรียบร้อยแล้ว`);
        } else {
          Alert.alert('สำเร็จ', `ส่งอีเมลแจ้งเตือนไปยัง ${item.member_name} (${item.email}) เรียบร้อยแล้ว`);
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

  const getStatusInfo = (item, type = reportType) => {
    const originalAmount = parseInt(item.amount) || 0;
    const pendingAmount = parseInt(item.pending_amount) || originalAmount;
    const returnedAmount = originalAmount > pendingAmount ? originalAmount - pendingAmount : 0;
    
    const isPartialReturn = returnedAmount > 0 && pendingAmount > 0;
    const displayExpectedDate = (isPartialReturn && item.expected_return_date) 
      ? formatDate(item.expected_return_date) 
      : '-';

    const targetDateStr = (isPartialReturn && item.expected_return_date) 
      ? item.expected_return_date 
      : item.borrow_date; 

    if (!targetDateStr) {
      return { isLate: false, days: 0, text: 'กำลังยืม', type: 'pending_ok', displayExpectedDate };
    }

    const targetDate = new Date(targetDateStr);
    targetDate.setHours(0, 0, 0, 0); 

    if (item.return_date && type !== 'pending') {
      const retDate = new Date(item.return_date);
      retDate.setHours(0, 0, 0, 0);
      const diffTime = retDate.getTime() - targetDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) return { isLate: true, days: diffDays, text: `คืนช้า ${diffDays} วัน`, type: 'returned_late', displayExpectedDate };
      return { isLate: false, days: 0, text: 'คืนตรงเวลา', type: 'returned_ok', displayExpectedDate };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0); 
    const diffTime = now.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return { 
        isLate: true, 
        days: diffDays, 
        text: `ล่าช้า ${diffDays} วัน`, 
        type: 'pending_late', 
        expectedDateStr: displayExpectedDate, 
        displayExpectedDate 
      };
    }
    return { isLate: false, days: 0, text: 'กำลังยืม', type: 'pending_ok', displayExpectedDate };
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
        const status = getStatusInfo(item, reportType);
        if (item.return_date && reportType !== 'pending') {
          if (statusFilter === 'returned') return !status.isLate; 
          if (statusFilter === 'late') return status.isLate; 
          return false;
        } else {
          if (statusFilter === 'borrowing') return !status.isLate; 
          if (statusFilter === 'late') return status.isLate; 
          return false;
        }
      });
    }

    if (reportType === 'borrow' || reportType === 'pending') {
      currentData = currentData.filter(item => {
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
      const rawDateStr = item.borrow_date || item.check_in_time;
      const itemDate = parseItemDate(rawDateStr);
      
      if (itemDate) {
        if (startDate) {
          const fStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0);
          if (itemDate.getTime() < fStart.getTime()) matchDate = false;
        }

        if (endDate) {
          const fEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
          if (itemDate.getTime() > fEnd.getTime()) matchDate = false;
        }
      }

      return matchText && matchDate;
    });
  }, [reports, reportType, searchText, startDate, endDate, eqCondition, statusFilter]);

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
        const statusInfo = getStatusInfo(item, 'borrow');
        return [
          `"${item.member_name || '-'}"`, `"${item.equipment || '-'}"`, `"${item.equipment_status === 'ใช้งาน' ? 'ปกติ' : (item.equipment_status || 'ปกติ')}"`, 
          item.amount, formatDate(item.borrow_date), statusInfo.displayExpectedDate, formatDate(item.return_date), `"${statusInfo.text}"`
        ];
      });
    } else if (reportType === 'pending') {
      headers = ['สมาชิก', 'อุปกรณ์', 'สภาพ', 'ยืมไป (ชิ้น)', 'คืนแล้ว (ชิ้น)', 'ค้างส่ง (ชิ้น)', 'ยืมเมื่อ', 'นัดล่าสุด', 'คืนเมื่อ', 'สถานะ'];
      rows = filteredData.map(item => {
        const statusInfo = getStatusInfo(item, 'pending');
        const originalAmount = parseInt(item.amount) || 0;
        const pendingAmount = parseInt(item.pending_amount) || originalAmount;
        const returnedAmount = originalAmount > pendingAmount ? originalAmount - pendingAmount : 0;

        return [
          `"${item.member_name || '-'}"`, `"${item.equipment || '-'}"`, `"${item.equipment_status === 'ใช้งาน' ? 'ปกติ' : (item.equipment_status || 'ปกติ')}"`, 
          originalAmount, returnedAmount, pendingAmount, formatDate(item.borrow_date), statusInfo.displayExpectedDate, formatDate(item.return_date), `"${statusInfo.text}"`
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

  const renderStatusBadge = (statusInfo) => {
    if (statusInfo.type === 'returned_late' || statusInfo.type === 'pending_late') {
      return (
        <View style={{ alignItems: 'center' }}>
          <View style={[styles.badge, {backgroundColor: '#FEE2E2', borderColor: '#FECACA', borderWidth: 1}]}>
            <Text style={[styles.badgeText, {color: '#EF4444'}]}>{statusInfo.text}</Text>
          </View>
          {statusInfo.type === 'pending_late' && statusInfo.expectedDateStr && statusInfo.expectedDateStr !== '-' && (
            <Text style={{ fontSize: 10, color: '#EF4444', marginTop: 2 }}>(นัด: {statusInfo.expectedDateStr})</Text>
          )}
        </View>
      );
    }

    if (statusInfo.type === 'returned_ok') {
      return (
        <View style={[styles.badge, {backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1}]}>
          <Text style={[styles.badgeText, {color: '#059669'}]}>{statusInfo.text}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.badge, {backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1}]}>
        <Text style={[styles.badgeText, {color: '#2563EB'}]}>{statusInfo.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getPageTitle()}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentArea} showsVerticalScrollIndicator={false}>
        
        {/* ================= ส่วนตัวกรอง ================= */}
        <View style={styles.filterCard}>
          <View style={styles.filterRow}>
            
            {/* ช่องค้นหา */}
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput 
                placeholder="ค้นหาชื่อ, อุปกรณ์..." 
                style={styles.searchInput} 
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* กลุ่มปุ่มตัวกรอง วันที่ และ Export */}
            <View style={styles.actionsGroup}>
              {/* ปุ่มเมนูตัวกรอง */}
              {(reportType === 'borrow' || reportType === 'pending') && (
                <View style={{ position: 'relative', zIndex: 100 }}>
                  <TouchableOpacity 
                    style={[styles.filterBtn, (eqCondition !== 'all' || statusFilter !== 'all') && styles.filterBtnActive]} 
                    onPress={() => setShowFilterMenu(!showFilterMenu)}
                  >
                    <Ionicons name="filter" size={16} color={(eqCondition !== 'all' || statusFilter !== 'all') ? "#00A87E" : "#475569"} />
                    <Text style={[styles.filterBtnText, (eqCondition !== 'all' || statusFilter !== 'all') && {color: '#00A87E'}]}>
                      ตัวกรอง {(eqCondition !== 'all' || statusFilter !== 'all') ? '(เปิดทำงาน)' : ''}
                    </Text>
                  </TouchableOpacity>

                  {showFilterMenu && (
                    <View style={styles.inlineDropdown}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#1E293B' }}>ตัวกรองข้อมูล</Text>
                        <TouchableOpacity onPress={() => setShowFilterMenu(false)}>
                          <Ionicons name="close" size={20} color="#64748B" />
                        </TouchableOpacity>
                      </View>

                      {reportType === 'borrow' && (
                        <View style={{ marginBottom: 16 }}>
                          <Text style={styles.filterGroupTitle}>สถานะการยืม</Text>
                          <View style={styles.filterToggleGroup}>
                            <TouchableOpacity style={[styles.filterToggleBtn, statusFilter === 'all' && styles.filterToggleBtnActive]} onPress={() => setStatusFilter('all')}><Text style={[styles.filterToggleText, statusFilter === 'all' && styles.filterToggleTextActive]}>ทั้งหมด</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.filterToggleBtn, statusFilter === 'returned' && styles.filterToggleBtnActive]} onPress={() => setStatusFilter('returned')}><Text style={[styles.filterToggleText, statusFilter === 'returned' && styles.filterToggleTextActive]}>ตรงเวลา</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.filterToggleBtn, statusFilter === 'late' && styles.filterToggleBtnActive]} onPress={() => setStatusFilter('late')}><Text style={[styles.filterToggleText, statusFilter === 'late' && styles.filterToggleTextActive]}>คืนช้า</Text></TouchableOpacity>
                          </View>
                        </View>
                      )}
                      {reportType === 'pending' && (
                        <View style={{ marginBottom: 16 }}>
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
                        style={{ marginTop: 15, alignSelf: 'flex-end', backgroundColor: '#FEF2F2', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 }}
                        onPress={() => { setEqCondition('all'); setStatusFilter('all'); setShowFilterMenu(false); }}
                      >
                        <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: 'bold' }}>ล้างตัวกรอง</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* ปฏิทินเลือกช่วงวันที่ */}
              <View style={styles.datePickerGroup}>
                {Platform.OS === 'web' ? (
                  <View style={styles.webDatePickerRow}>
                    {/* กล่องวันที่เริ่มต้น */}
                    <View style={{ position: 'relative' }}>
                      <TouchableOpacity 
                        style={[styles.dateBox, startDate && {borderColor: '#00A87E', backgroundColor: '#F0FDF4'}]} 
                        activeOpacity={0.7}
                        onPress={() => {
                          if (webStartInputRef.current) {
                            if ('showPicker' in HTMLInputElement.prototype) {
                              try { webStartInputRef.current.showPicker(); } catch (e) {}
                            } else {
                              webStartInputRef.current.click();
                            }
                          }
                        }}
                      >
                        <Text style={[styles.dateText, startDate && {color: '#00A87E', fontWeight: 'bold'}]}>
                          {formatDisplayDate(startDate)}
                        </Text>
                        <Ionicons name="calendar-outline" size={15} color={startDate ? "#00A87E" : "#64748B"} />
                      </TouchableOpacity>
                      <input
                        ref={webStartInputRef}
                        type="date"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                          zIndex: 10
                        }}
                        value={formatDateForInput(startDate)}
                        onClick={(e) => {
                          if ('showPicker' in e.target) {
                            try { e.target.showPicker(); } catch (err) {}
                          }
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const [y, m, d] = val.split('-');
                            setStartDate(new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)));
                          } else {
                            setStartDate(null);
                          }
                        }}
                      />
                    </View>

                    <Text style={{ fontSize: 13, color: '#64748B', marginHorizontal: 4 }}>ถึง</Text>

                    {/* กล่องวันที่สิ้นสุด */}
                    <View style={{ position: 'relative' }}>
                      <TouchableOpacity 
                        style={[styles.dateBox, endDate && {borderColor: '#00A87E', backgroundColor: '#F0FDF4'}]} 
                        activeOpacity={0.7}
                        onPress={() => {
                          if (webEndInputRef.current) {
                            if ('showPicker' in HTMLInputElement.prototype) {
                              try { webEndInputRef.current.showPicker(); } catch (e) {}
                            } else {
                              webEndInputRef.current.click();
                            }
                          }
                        }}
                      >
                        <Text style={[styles.dateText, endDate && {color: '#00A87E', fontWeight: 'bold'}]}>
                          {formatDisplayDate(endDate)}
                        </Text>
                        <Ionicons name="calendar-outline" size={15} color={endDate ? "#00A87E" : "#64748B"} />
                      </TouchableOpacity>
                      <input
                        ref={webEndInputRef}
                        type="date"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                          zIndex: 10
                        }}
                        value={formatDateForInput(endDate)}
                        onClick={(e) => {
                          if ('showPicker' in e.target) {
                            try { e.target.showPicker(); } catch (err) {}
                          }
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const [y, m, d] = val.split('-');
                            setEndDate(new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)));
                          } else {
                            setEndDate(null);
                          }
                        }}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.mobileDateRow}>
                    <TouchableOpacity style={[styles.dateBox, startDate && {borderColor: '#00A87E'}]} onPress={() => setShowStartPicker(true)}>
                      <Text style={[styles.dateText, startDate && {color: '#00A87E', fontWeight: 'bold'}]}>{formatDisplayDate(startDate)}</Text>
                      <Ionicons name="calendar-outline" size={15} color={startDate ? "#00A87E" : "#64748B"} />
                    </TouchableOpacity>
                    
                    <Text style={{fontSize: 13, color: '#64748B', marginHorizontal: 4}}>ถึง</Text>
                    
                    <TouchableOpacity style={[styles.dateBox, endDate && {borderColor: '#00A87E'}]} onPress={() => setShowEndPicker(true)}>
                      <Text style={[styles.dateText, endDate && {color: '#00A87E', fontWeight: 'bold'}]}>{formatDisplayDate(endDate)}</Text>
                      <Ionicons name="calendar-outline" size={15} color={endDate ? "#00A87E" : "#64748B"} />
                    </TouchableOpacity>
                  </View>
                )}

                {(startDate || endDate) ? (
                  <TouchableOpacity style={styles.clearDateBtn} onPress={() => { setStartDate(null); setEndDate(null); }}>
                    <Text style={{color: '#EF4444', fontSize: 12, fontWeight: 'bold'}}>ล้างค่า</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* ปุ่ม Export CSV */}
              <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
                <Ionicons name="download-outline" size={16} color="#334155" />
                <Text style={styles.exportBtnText}>Export CSV</Text>
              </TouchableOpacity>
            </View>

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

        {/* ================= ส่วนตารางแสดงผล ================= */}
        {isLoading ? (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100}}>
            <ActivityIndicator size="large" color="#00A87E" />
            <Text style={{marginTop: 10, color: '#64748B', fontSize: 14}}>กำลังดึงข้อมูล...</Text>
          </View>
        ) : (
          <View style={{ paddingBottom: 40 }}>
            <View style={styles.tableCard}>
              {/* 🌟 ปรับปรุง ScrollView และ tableContainer ให้ตารางขยายเต็มการ์ดเสมอ */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={true} 
                contentContainerStyle={{ flexGrow: 1, minWidth: '100%' }}
              >
                <View style={styles.tableContainer}>
                  
                  {/* ================= 1. ตารางประวัติ ยืม-คืน ================= */}
                  {reportType === 'borrow' ? (
                    <>
                      <View style={styles.tableHeaderRow}>
                        <Text style={[styles.headerCell, {flex: 1.5, minWidth: 140}]}>สมาชิก</Text>
                        <Text style={[styles.headerCell, {flex: 1.5, minWidth: 140}]}>อุปกรณ์</Text>
                        <Text style={[styles.headerCell, {flex: 1, minWidth: 90}]}>สภาพ</Text>
                        <Text style={[styles.headerCell, {flex: 0.8, minWidth: 70}]}>จำนวน</Text>
                        <Text style={[styles.headerCell, {flex: 1.2, minWidth: 100}]}>ยืมเมื่อ</Text>
                        <Text style={[styles.headerCell, {flex: 1.2, minWidth: 100}]}>นัดคืน</Text>
                        <Text style={[styles.headerCell, {flex: 1.2, minWidth: 100}]}>คืนเมื่อ</Text>
                        <Text style={[styles.headerCell, {flex: 1.5, minWidth: 130}]}>สถานะ</Text>
                      </View>
                      {filteredData.map((item, index) => {
                        const statusInfo = getStatusInfo(item, 'borrow');
                        return (
                          <View key={index} style={[styles.tableDataRow, index % 2 === 1 && styles.tableDataRowAlt]}>
                            <Text style={[styles.dataCell, {flex: 1.5, minWidth: 140, fontWeight: '500', color: '#1E293B'}]} numberOfLines={1}>{item.member_name}</Text>
                            <Text style={[styles.dataCell, {flex: 1.5, minWidth: 140}]} numberOfLines={1}>{item.equipment}</Text>
                            
                            <View style={[styles.dataCell, {flex: 1, minWidth: 90, alignItems: 'center'}]}>
                              <Text style={{ fontSize: 13, fontWeight: 'bold', color: (item.equipment_status === 'ปกติ' || item.equipment_status === 'ใช้งาน') ? '#10B981' : '#EF4444' }}>
                                {item.equipment_status === 'ใช้งาน' ? 'ปกติ' : (item.equipment_status || 'ปกติ')}
                              </Text>
                            </View>

                            <Text style={[styles.dataCell, {flex: 0.8, minWidth: 70, fontWeight: '600'}]}>{item.amount}</Text>
                            <Text style={[styles.dataCell, {flex: 1.2, minWidth: 100}]}>{formatDate(item.borrow_date)}</Text>
                            <Text style={[styles.dataCell, {flex: 1.2, minWidth: 100}]}>{statusInfo.displayExpectedDate}</Text>
                            <Text style={[styles.dataCell, {flex: 1.2, minWidth: 100}]}>{formatDate(item.return_date)}</Text>
                            <View style={[styles.dataCell, {flex: 1.5, minWidth: 130, alignItems: 'center', paddingVertical: 4}]}>
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
                        <Text style={[styles.headerCell, {flex: 1.4, minWidth: 140}]}>สมาชิก</Text>
                        <Text style={[styles.headerCell, {flex: 1.4, minWidth: 140}]}>อุปกรณ์</Text>
                        <Text style={[styles.headerCell, {flex: 0.9, minWidth: 80}]}>สภาพ</Text>
                        <Text style={[styles.headerCell, {flex: 1, minWidth: 100}]}>ยืมไป (ชิ้น)</Text>
                        <Text style={[styles.headerCell, {flex: 0.8, minWidth: 80}]}>คืนแล้ว</Text>
                        <Text style={[styles.headerCell, {flex: 0.8, minWidth: 80}]}>ค้างส่ง</Text>
                        <Text style={[styles.headerCell, {flex: 1.1, minWidth: 95}]}>ยืมเมื่อ</Text>
                        <Text style={[styles.headerCell, {flex: 1.1, minWidth: 95}]}>นัดล่าสุด</Text>
                        <Text style={[styles.headerCell, {flex: 1.1, minWidth: 95}]}>คืนเมื่อ</Text>
                        <Text style={[styles.headerCell, {flex: 1.2, minWidth: 110}]}>สถานะ</Text>
                        <Text style={[styles.headerCell, {flex: 1.2, minWidth: 120}]}>จัดการ</Text>
                      </View>
                      {filteredData.map((item, index) => {
                        const statusInfo = getStatusInfo(item, 'pending');
                        
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
                          <View key={index} style={[styles.tableDataRow, index % 2 === 1 && styles.tableDataRowAlt]}>
                            <Text style={[styles.dataCell, {flex: 1.4, minWidth: 140, fontWeight: '500', color: '#1E293B'}]} numberOfLines={1}>{item.member_name}</Text>
                            <Text style={[styles.dataCell, {flex: 1.4, minWidth: 140}]} numberOfLines={1}>{item.equipment}</Text>
                            
                            <View style={[styles.dataCell, {flex: 0.9, minWidth: 80, alignItems: 'center'}]}>
                              <Text style={{ fontSize: 13, fontWeight: 'bold', color: (item.equipment_status === 'ปกติ' || item.equipment_status === 'ใช้งาน') ? '#10B981' : '#EF4444' }}>
                                {item.equipment_status === 'ใช้งาน' ? 'ปกติ' : (item.equipment_status || 'ปกติ')}
                              </Text>
                            </View>

                            <Text style={[styles.dataCell, {flex: 1, minWidth: 100, fontWeight: 'bold', color: '#334155'}]}>
                              {originalAmount}
                            </Text>

                            <Text style={[styles.dataCell, {flex: 0.8, minWidth: 80, fontWeight: 'bold', color: '#10B981'}]}>
                              {returnedAmount}
                            </Text>

                            <Text style={[styles.dataCell, {flex: 0.8, minWidth: 80, fontWeight: 'bold', color: '#D93025'}]}>
                              {pendingAmount}
                            </Text>
                            
                            <Text style={[styles.dataCell, {flex: 1.1, minWidth: 95}]}>{formatDate(item.borrow_date)}</Text>
                            <Text style={[styles.dataCell, {flex: 1.1, minWidth: 95}]}>{statusInfo.displayExpectedDate}</Text>
                            <Text style={[styles.dataCell, {flex: 1.1, minWidth: 95}]}>{formatDate(item.return_date)}</Text>
                            
                            <View style={[styles.dataCell, {flex: 1.2, minWidth: 110, alignItems: 'center', paddingVertical: 4}]}>
                              {renderStatusBadge(statusInfo)}
                            </View>

                            <View style={[styles.dataCell, {flex: 1.2, minWidth: 120, alignItems: 'center'}]}>
                              {showNotifyButton ? (
                                <TouchableOpacity style={styles.notifyBtn} onPress={() => handleNotifyUser(item, statusInfo.days)}>
                                  <Ionicons name="mail-outline" size={13} color="#FFF" style={{marginRight: 4}} />
                                  <Text style={styles.notifyBtnText}>แจ้งเตือน</Text>
                                </TouchableOpacity>
                              ) : statusInfo.isLate && isNotifiedToday ? (
                                <Text style={{fontSize: 11, color: '#10B981', fontWeight: 'bold'}}>
                                  <Ionicons name="checkmark-circle" size={12} color="#10B981"/> แจ้งเตือนแล้ว
                                </Text>
                              ) : (
                                <Text style={{fontSize: 11, color: '#94A3B8'}}>-</Text>
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
                        <Text style={[styles.headerCell, {flex: 2, minWidth: 180}]}>สมาชิก</Text>
                        <Text style={[styles.headerCell, {flex: 1.5, minWidth: 140}]}>ประเภท</Text>
                        <Text style={[styles.headerCell, {flex: 1.5, minWidth: 140}]}>วันที่เข้าใช้</Text>
                        <Text style={[styles.headerCell, {flex: 1.2, minWidth: 120}]}>ค่าบริการ (฿)</Text>
                        <Text style={[styles.headerCell, {flex: 1.2, minWidth: 120}]}>วิธีชำระ</Text>
                      </View>
                      {filteredData.map((item, index) => (
                        <View key={index} style={[styles.tableDataRow, index % 2 === 1 && styles.tableDataRowAlt]}>
                          <Text style={[styles.dataCell, {flex: 2, minWidth: 180, fontWeight: '500', color: '#1E293B'}]} numberOfLines={1}>{item.member_name}</Text>
                          <View style={[styles.dataCell, {flex: 1.5, minWidth: 140, alignItems: 'center'}]}>
                            <View style={[styles.roleTag, item.role === 'student' ? {backgroundColor: '#E6F5EF'} : {backgroundColor: '#FEE2E2'}]}>
                              <Text style={[styles.roleTagText, item.role === 'student' ? {color: '#00A87E'} : {color: '#EF4444'}]}>
                                {item.role === 'student' ? 'นักศึกษา' : 'บุคคลภายนอก'}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.dataCell, {flex: 1.5, minWidth: 140}]}>{formatDate(item.check_in_time)}</Text>
                          <Text style={[styles.dataCell, {flex: 1.2, minWidth: 120, fontWeight: '600'}]}>{item.service_fee}</Text>
                          <Text style={[styles.dataCell, {flex: 1.2, minWidth: 120}]}>{item.payment_type === 'cash' ? 'เงินสด' : 'สแกน'}</Text>
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
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  header: { 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0', 
    zIndex: 2 
  },
  headerInner: {
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 16,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center'
  },
  backButton: { paddingRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  
  scrollView: { flex: 1 },
  contentArea: { 
    paddingHorizontal: 24, 
    paddingTop: 20,
    maxWidth: 1280, 
    width: '100%', 
    alignSelf: 'center',
    zIndex: 10 
  },
  
  filterCard: { 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginBottom: 20, 
    zIndex: 50, 
    shadowColor: '#0F172A', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.04, 
    shadowRadius: 6, 
    elevation: 2 
  },
  filterRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    alignItems: 'center', 
    justify: 'space-between', 
    gap: 12, 
    zIndex: 50 
  },
  
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    height: 40, 
    flex: 1, 
    minWidth: 260 
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 8, 
    fontSize: 13, 
    color: '#334155', 
    outlineStyle: 'none' 
  },

  actionsGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10
  },
  
  filterBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderWidth: 1, 
    borderColor: '#CBD5E1', 
    borderRadius: 8, 
    paddingHorizontal: 14, 
    height: 40 
  },
  filterBtnActive: { borderColor: '#00A87E', backgroundColor: '#E6F5EF' },
  filterBtnText: { fontSize: 13, color: '#334155', marginLeft: 6, fontWeight: '600' },
  inlineDropdown: { 
    position: 'absolute', 
    top: 48, 
    left: 0, 
    width: 290, 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    padding: 18, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.12, 
    shadowRadius: 10, 
    elevation: 8, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    zIndex: 999 
  },
  filterGroupTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 8 },
  filterToggleGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterToggleBtn: { backgroundColor: '#F8FAFC', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  filterToggleBtnActive: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' },
  filterToggleText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  filterToggleTextActive: { color: '#FFF' },

  datePickerGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  webDatePickerRow: { flexDirection: 'row', alignItems: 'center' },
  mobileDateRow: { flexDirection: 'row', alignItems: 'center' },
  dateBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justify: 'space-between', 
    borderWidth: 1, 
    borderColor: '#CBD5E1', 
    borderRadius: 8, 
    paddingHorizontal: 10, 
    height: 40, 
    width: 135, 
    backgroundColor: '#FFF' 
  },
  dateText: { fontSize: 12, color: '#475569' },
  clearDateBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  
  exportBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justify: 'center', 
    borderWidth: 1, 
    borderColor: '#CBD5E1', 
    borderRadius: 8, 
    height: 40, 
    paddingHorizontal: 14, 
    backgroundColor: '#FFF' 
  },
  exportBtnText: { fontSize: 13, color: '#334155', marginLeft: 6, fontWeight: '600' },

  tableCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    overflow: 'hidden', 
    shadowColor: '#0F172A', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.04, 
    shadowRadius: 8, 
    elevation: 2 
  },
  tableContainer: { 
    width: '100%', 
    minWidth: 1000, 
    flex: 1, 
    zIndex: 1 
  },
  tableHeaderRow: { 
    flexDirection: 'row', 
    backgroundColor: '#F8FAFC', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0', 
    paddingVertical: 14, 
    paddingHorizontal: 12 
  },
  headerCell: { fontSize: 13, fontWeight: '700', color: '#475569', textAlign: 'center' },
  tableDataRow: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9', 
    paddingVertical: 14, 
    paddingHorizontal: 12, 
    alignItems: 'center', 
    backgroundColor: '#FFF' 
  },
  tableDataRowAlt: { backgroundColor: '#FAFAFE' },
  dataCell: { fontSize: 13, color: '#334155', textAlign: 'center' },
  emptyText: { textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 14 },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  roleTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  roleTagText: { fontSize: 11, fontWeight: 'bold' },

  notifyBtn: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justify: 'center',
  },
  notifyBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  }
});
