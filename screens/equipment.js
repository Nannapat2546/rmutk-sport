import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, TextInput, Alert, ActivityIndicator, Image, Modal, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const CustomDropdown = ({ label, options, selectedValue, onSelect, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={[styles.inputGroup, { zIndex: isOpen ? 1000 : 1, elevation: isOpen ? 10 : 1 }]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={{ position: 'relative', zIndex: isOpen ? 100 : 1 }}>
        <TouchableOpacity style={styles.dropdownBox} onPress={() => setIsOpen(!isOpen)} activeOpacity={0.8}>
          <Text style={[styles.inputText, !selectedValue && { color: '#A0A0A0' }]}>
            {selectedValue ? (selectedValue.name || selectedValue) : placeholder}
          </Text>
          <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#888" />
        </TouchableOpacity>
        
        {isOpen && (
          <View style={styles.dropdownList}>
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {options.length > 0 ? options.map((item, index) => (
                <TouchableOpacity
                  key={item.id || index}
                  style={styles.dropdownItem}
                  onPress={() => { onSelect(item); setIsOpen(false); }}
                >
                  <Text style={styles.dropdownItemText}>{item.name || item}</Text>
                </TouchableOpacity>
              )) : (
                <Text style={{ padding: 12, color: '#999', textAlign: 'center' }}>ไม่มีข้อมูลหมวดหมู่</Text>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

export default function EquipmentScreen({ navigation }) {
  const [currentView, setCurrentView] = useState('main'); 
  const [isLoading, setIsLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [equipList, setEquipList] = useState([]);
  const [equipCode, setEquipCode] = useState('');
  const [equipCategory, setEquipCategory] = useState(null); 
  const [equipName, setEquipName] = useState('');
  const [equipQty, setEquipQty] = useState('');
  const [equipStatus, setEquipStatus] = useState('เปิดใช้งาน');
  const [equipImage, setEquipImage] = useState(null);
  
  const [editingId, setEditingId] = useState(null);
  const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);

  // 🌟 แก้ไข URL ให้ชี้ไปที่ Backend ที่ถูกต้อง และเอา http://https:// ออก
  const API_URL = 'https://rmutk-sport.onrender.com'; 

  useEffect(() => {
    if (currentView === 'main') fetchEquipment();
    if (currentView === 'category' || currentView === 'equipment') fetchCategories();
  }, [currentView]);

  const fetchEquipment = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/inventory/manage`);
      const data = await res.json();
      if (data && Array.isArray(data)) {
        setEquipList(data);
      } else {
        setEquipList([]);
      }
    } catch (error) {
      setEquipList([]);
    }
    setIsLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`);
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
      else setCategories([]);
    } catch (error) {
      setCategories([]);
    }
  };

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName) return showAlert('แจ้งเตือน', 'กรุณากรอกชื่อประเภท');
    try {
      const res = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });
      if (res.ok) {
        showAlert('สำเร็จ', 'บันทึกประเภทอุปกรณ์เรียบร้อย');
        setNewCategoryName('');
        fetchCategories(); 
      } else {
        showAlert('ข้อผิดพลาด', 'ชื่อประเภทนี้อาจมีอยู่แล้ว');
      }
    } catch (error) {
      showAlert('ข้อผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCategories();
      else showAlert('ลบไม่สำเร็จ', 'อาจมีอุปกรณ์ที่ใช้งานหมวดหมู่นี้อยู่');
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteEquipment = (id) => {
    const executeDelete = async () => {
      try {
        const res = await fetch(`${API_URL}/api/inventory/${id}`, { method: 'DELETE' });
        if (res.ok) fetchEquipment();
        else showAlert('ข้อผิดพลาด', 'ไม่สามารถลบอุปกรณ์ได้');
      } catch (error) {
        showAlert('ข้อผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
      }
    };

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm('คุณต้องการลบอุปกรณ์นี้ออกจากระบบใช่หรือไม่?');
      if (confirmDelete) executeDelete();
    } else {
      Alert.alert('ยืนยันการลบ', 'คุณต้องการลบอุปกรณ์นี้ออกจากระบบใช่หรือไม่?', [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ลบ', style: 'destructive', onPress: executeDelete }
      ]);
    }
  };

  const handleAddNewClick = () => {
    setEditingId(null);
    setEquipCode('');
    setEquipName('');
    setEquipQty('');
    setEquipImage(null);
    setEquipCategory(null);
    setEquipStatus('เปิดใช้งาน');
    setCurrentView('equipment');
  };

  const handleEditClick = (item) => {
    setEditingId(item.id); 
    setEquipCode(item.equipment_code);
    setEquipName(item.item_name);
    setEquipStatus(item.status || 'เปิดใช้งาน');
    setEquipImage(item.image_url || null);
    
    const cat = categories.find(c => c.name === item.category_name);
    setEquipCategory(cat || null);

    const totalStock = parseInt(item.stock) || 0;
    setEquipQty(totalStock.toString());

    setCurrentView('equipment');
  };

  const handleRepairEquipment = (id) => {
    const executeRepair = async () => {
      try {
        const res = await fetch(`${API_URL}/api/inventory/${id}/repair`, { method: 'POST' });
        if (res.ok) {
          showAlert('สำเร็จ', 'นำอุปกรณ์ที่ซ่อมแซมกลับเข้า "สต็อกว่าง" เรียบร้อยแล้ว!');
          fetchEquipment();
          setCurrentView('main');
        } else {
          showAlert('ข้อผิดพลาด', 'ไม่สามารถทำรายการได้');
        }
      } catch (error) {
        showAlert('ข้อผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
      }
    };

    if (Platform.OS === 'web') {
      const confirmRepair = window.confirm('คุณซ่อมอุปกรณ์นี้เสร็จแล้ว และต้องการล้างยอดชำรุดเพื่อนำกลับเข้า "สต็อกว่าง" ใช่หรือไม่?');
      if (confirmRepair) executeRepair();
    } else {
      Alert.alert('ยืนยันการซ่อม', 'คุณซ่อมอุปกรณ์นี้เสร็จแล้ว และต้องการล้างยอดชำรุดเพื่อนำกลับเข้า "สต็อกว่าง" ใช่หรือไม่?', [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ยืนยัน', onPress: executeRepair }
      ]);
    }
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, 
      quality: 0.3,
      base64: true, 
    });
    
    if (!result.canceled) {
      const base64String = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setEquipImage(base64String);
    }
  };

  const handleSaveEquipment = async () => {
    if (!equipCode || !equipName || !equipCategory || !equipQty) {
      return showAlert('แจ้งเตือน', 'กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');
    }

    let currentBorrowed = 0;
    let currentBroken = 0;
    
    if (editingId) {
      const existingItem = equipList.find(e => e.id === editingId);
      currentBorrowed = parseInt(existingItem?.borrowed_qty) || 0;
      currentBroken = parseInt(existingItem?.broken_qty) || 0;
    }

    const inputTotalStock = parseInt(equipQty) || 0;
    
    if (inputTotalStock < (currentBorrowed + currentBroken)) {
      return showAlert('แจ้งเตือน', `สต็อกรวมต้องไม่น้อยกว่า ${currentBorrowed + currentBroken} ชิ้น (เนื่องจากมีของกำลังยืมและชำรุดไปแล้ว)`);
    }

    const equipData = {
      equipment_code: equipCode,
      category_id: equipCategory.id, 
      item_name: equipName,
      stock: inputTotalStock, 
      status: equipStatus,
      image_url: equipImage 
    };

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/api/inventory/${editingId}` : `${API_URL}/api/inventory`;

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equipData)
      });
      
      if (res.ok) {
        setSuccessModalVisible(true);
      } else {
        const err = await res.json();
        showAlert('ข้อผิดพลาด', err.message);
      }
    } catch (error) {
      showAlert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (ลองเช็ก IP)');
    }
  };

  if (currentView === 'main') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>จัดการสต็อกอุปกรณ์</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnGreen} onPress={() => setCurrentView('category')}>
              <Text style={styles.btnGreenText}>เพิ่มประเภทอุปกรณ์</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnGreen} onPress={handleAddNewClick}>
              <Ionicons name="add-circle-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.btnGreenText}>เพิ่มอุปกรณ์ใหม่</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{ width: '100%' }} contentContainerStyle={{ minWidth: '100%' }}>
            <View style={styles.tableContainer}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderText, { flex: 0.8, textAlign: 'center' }]}>รหัส</Text>
                <View style={styles.tableDivider} />
                <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'left', paddingLeft: 15 }]}>ชื่ออุปกรณ์</Text>
                <View style={styles.tableDivider} />
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>สต็อกจริง</Text>
                <View style={styles.tableDivider} />
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>ว่าง</Text>
                <View style={styles.tableDivider} />
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>กำลังยืม</Text>
                <View style={styles.tableDivider} />
                <Text style={[styles.tableHeaderText, { flex: 0.8, textAlign: 'center', color: '#D93025' }]}>ชำรุดสะสม</Text>
                <View style={styles.tableDivider} />
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>สถานะ</Text>
                <View style={styles.tableDivider} />
                <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'center' }]}>จัดการ</Text>
              </View>
              
              {isLoading ? (
                 <ActivityIndicator size="small" color="#1E8E3E" style={{ padding: 30 }} />
              ) : (!Array.isArray(equipList) || equipList.length === 0) ? (
                 <Text style={{ textAlign: 'center', padding: 30, color: '#888' }}>ยังไม่มีอุปกรณ์ในระบบ</Text>
              ) : (
                equipList.map((item, index) => {
                  
                  const totalStock = parseInt(item.stock) || 0; 
                  const available = parseInt(item.available_qty) || 0; 
                  const borrowed = parseInt(item.borrowed_qty) || 0; 
                  const broken = parseInt(item.broken_qty) || 0; 

                  return (
                    <View key={item.id} style={[styles.tableDataRow, index === equipList.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={{ flex: 0.8, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={styles.codeBadge}>
                          <Text style={styles.codeBadgeText}>{item.equipment_code || '-'}</Text>
                        </View>
                      </View>
                      <View style={styles.tableDivider} />
                      
                      <View style={{ flex: 1.5, justifyContent: 'center', paddingLeft: 15 }}>
                        <Text style={[styles.tableDataText, { fontWeight: 'bold' }]}>{item.item_name}</Text>
                      </View>
                      <View style={styles.tableDivider} />

                      {/* สต็อกจริง */}
                      <Text style={[styles.tableDataText, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>{totalStock}</Text>
                      <View style={styles.tableDivider} />

                      {/* สต็อกว่าง */}
                      <Text style={[styles.tableDataText, { flex: 1, textAlign: 'center', color: '#1E8E3E', fontWeight: 'bold' }]}>{available}</Text>
                      <View style={styles.tableDivider} />

                      {/* กำลังยืม */}
                      <Text style={[styles.tableDataText, { flex: 1, textAlign: 'center' }]}>{borrowed}</Text>
                      <View style={styles.tableDivider} />

                      {/* ชำรุดสะสม */}
                      <Text style={[styles.tableDataText, { flex: 0.8, textAlign: 'center', color: '#D93025', fontWeight: 'bold' }]}>{broken}</Text>
                      <View style={styles.tableDivider} />

                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusBadgeText}>{item.status || 'เปิดใช้งาน'}</Text>
                        </View>
                      </View>
                      <View style={styles.tableDivider} />

                      <View style={{ flex: 1.2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                        <TouchableOpacity style={styles.btnOutlineBlue} onPress={() => handleEditClick(item)}>
                          <Ionicons name="create-outline" size={14} color="#1A73E8" />
                          <Text style={styles.btnOutlineBlueText}>แก้ไข</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnOutlineRed} onPress={() => handleDeleteEquipment(item.id)}>
                          <Ionicons name="trash-outline" size={14} color="#D93025" />
                          <Text style={styles.btnOutlineRedText}>ลบ</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>

          <Text style={styles.noteText}>
            หมายเหตุ: "สต็อกจริง" คือ จำนวนอุปกรณ์ทั้งหมดที่คุณมี (รวมทั้งของที่ว่าง, ยืมอยู่ และชำรุด)
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ================= หน้าจอ UI 2: เพิ่มประเภทอุปกรณ์ =================
  if (currentView === 'category') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentView('main')} style={{ padding: 5 }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>เพิ่มประเภทอุปกรณ์</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ชื่อประเภท</Text>
            <TextInput style={styles.inputBox} value={newCategoryName} onChangeText={setNewCategoryName} />
          </View>
          <TouchableOpacity style={styles.btnBlue} onPress={handleSaveCategory}>
            <Text style={styles.btnBlueText}>บันทึก</Text>
          </TouchableOpacity>

          <Text style={[styles.inputLabel, { marginTop: 25, marginBottom: 15 }]}>ประเภทอุปกรณ์ (ที่มีในระบบ)</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <View key={cat.id} style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText} numberOfLines={1}>{cat.name}</Text>
                <TouchableOpacity onPress={() => handleDeleteCategory(cat.id)}>
                  <Ionicons name="trash-outline" size={18} color="#888" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ================= หน้าจอ UI 3: เพิ่ม/แก้ไขอุปกรณ์ =================
  if (currentView === 'equipment') {

    let showBorrowed = 0;
    let showBroken = 0;
    if (editingId) {
      const existingItem = equipList.find(e => e.id === editingId);
      showBorrowed = parseInt(existingItem?.borrowed_qty) || 0;
      showBroken = parseInt(existingItem?.broken_qty) || 0;
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentView('main')} style={{ padding: 5 }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editingId ? 'แก้ไขข้อมูลอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          {/* 🌟 แสดงกล่องส้ม ถ้าของชิ้นนี้มีการชำรุดค้างอยู่ */}
          {showBroken > 0 && (
            <View style={styles.repairBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.repairBoxTitle}>⚠️ มีอุปกรณ์ชำรุด {showBroken} ชิ้น</Text>
                <Text style={styles.repairBoxSub}>หากซ่อมเสร็จแล้ว สามารถกดปุ่มเพื่อล้างยอด และนำกลับไปเป็น "สต็อกว่าง" ได้</Text>
              </View>
              <TouchableOpacity 
                style={styles.repairBtn}
                onPress={() => handleRepairEquipment(editingId)}
              >
                <Text style={styles.repairBtnText}>ซ่อมเสร็จแล้ว</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>รหัสอุปกรณ์ *</Text>
            <TextInput style={styles.inputBox} value={equipCode} onChangeText={setEquipCode} />
          </View>

          <CustomDropdown 
            label="ประเภทอุปกรณ์ *"
            options={categories}
            selectedValue={equipCategory}
            onSelect={setEquipCategory}
            placeholder="---- เลือก ----"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ชื่ออุปกรณ์ *</Text>
            <TextInput style={styles.inputBox} value={equipName} onChangeText={setEquipName} />
          </View>

          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: 15 }}>
              <Text style={styles.inputLabel}>สต็อกจริง *</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput style={[styles.inputBox, { flex: 1, marginRight: 10 }]} keyboardType="numeric" value={equipQty} onChangeText={setEquipQty} />
                <Text style={{ fontSize: 14, color: '#333' }}>/ ชิ้น</Text>
              </View>
              {editingId ? (
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>
                  ตอนนี้ถูกยืม <Text style={{color: '#1A73E8', fontWeight: 'bold'}}>{showBorrowed}</Text> ชิ้น, ชำรุด <Text style={{color: '#D93025', fontWeight: 'bold'}}>{showBroken}</Text> ชิ้น (ห้ามกรอกเลขรวมน้อยกว่านี้)
                </Text>
              ) : null}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>รูปภาพ</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity style={styles.btnChooseFile} onPress={handlePickImage}>
                  <Text style={styles.btnChooseFileText}>เลือกไฟล์</Text>
                </TouchableOpacity>
                {equipImage ? (
                  <Image source={{ uri: equipImage }} style={{ width: 35, height: 35, borderRadius: 5 }} />
                ) : (
                  <Text style={styles.fileStatusText} numberOfLines={1}>ไม่ได้เลือก...</Text>
                )}
              </View>
            </View>
          </View>

          <CustomDropdown 
            label="สถานะ"
            options={[{id: '1', name: 'เปิดใช้งาน'}, {id: '2', name: 'ชำรุด'}]}
            selectedValue={{name: equipStatus}}
            onSelect={(item) => setEquipStatus(item.name)}
            placeholder="เปิดใช้งาน"
          />

          <TouchableOpacity style={styles.btnBlue} onPress={handleSaveEquipment}>
            <Text style={styles.btnBlueText}>บันทึกข้อมูล</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal transparent={true} visible={isSuccessModalVisible} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Ionicons name="checkmark-circle" size={65} color="#1E8E3E" />
              <Text style={styles.modalTitle}>สำเร็จ</Text>
              <Text style={styles.modalText}>บันทึกข้อมูลเรียบร้อยแล้ว</Text>
              <TouchableOpacity
                style={styles.btnModalOK}
                onPress={() => {
                  setSuccessModalVisible(false);
                  setEditingId(null);
                  setEquipCode(''); setEquipName(''); setEquipQty(''); setEquipImage(null); setEquipCategory(null);
                  setCurrentView('main');
                  fetchEquipment(); 
                }}
              >
                <Text style={styles.btnModalOKText}>ตกลง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    );
  }
}

// ================= STYLES =================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#1A202C' },
  content: { padding: 20, backgroundColor: '#FFF', margin: 15, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15, gap: 10 },
  btnGreen: { flexDirection: 'row', backgroundColor: '#1E8E3E', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 6, alignItems: 'center' },
  btnGreenText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  btnBlue: { backgroundColor: '#1A73E8', height: 45, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnBlueText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  btnChooseFile: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CCC', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 4, marginRight: 8 },
  btnChooseFileText: { fontSize: 12, color: '#333' },
  tableContainer: { flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden', marginBottom: 15, minWidth: 800 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 12 },
  tableHeaderText: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
  tableDataRow: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 14, alignItems: 'center' },
  tableDataText: { fontSize: 13, color: '#334155' },
  tableDivider: { width: 1, backgroundColor: '#E2E8F0' },
  codeBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  codeBadgeText: { color: '#475569', fontSize: 12, fontWeight: '500' },
  statusBadge: { backgroundColor: '#1E8E3E', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  statusBadgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  btnOutlineBlue: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4, borderWidth: 1, borderColor: '#1A73E8' },
  btnOutlineBlueText: { color: '#1A73E8', fontSize: 11, marginLeft: 4, fontWeight: '500' },
  btnOutlineRed: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4, borderWidth: 1, borderColor: '#D93025' },
  btnOutlineRedText: { color: '#D93025', fontSize: 11, marginLeft: 4, fontWeight: '500' },
  noteText: { fontSize: 12, color: '#64748B', marginTop: 10, paddingHorizontal: 5 },
  inputGroup: { marginBottom: 18, zIndex: 1 },
  inputLabel: { fontSize: 14, color: '#333', marginBottom: 8, fontWeight: '500' },
  inputBox: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 6, backgroundColor: '#FFF', paddingHorizontal: 12, height: 45, fontSize: 14 },
  rowInputs: { flexDirection: 'row', marginBottom: 18, alignItems: 'flex-start', zIndex: 1 },
  fileStatusText: { fontSize: 11, color: '#888', flex: 1, alignSelf: 'center' },
  dropdownBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 6, backgroundColor: '#FFF', paddingHorizontal: 12, height: 45 },
  inputText: { fontSize: 14, color: '#333' },
  dropdownList: { position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 6, maxHeight: 150, elevation: 5 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  dropdownItemText: { fontSize: 14, color: '#333' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 15, width: '47%', backgroundColor: '#FFF' },
  categoryBadgeText: { fontSize: 14, color: '#333', flex: 1 },
  staffRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 25, zIndex: -1 },
  staffLabel: { fontSize: 13, color: '#333', marginRight: 10 },
  staffBadge: { backgroundColor: '#E6F4EA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  staffBadgeText: { color: '#1E8E3E', fontSize: 11, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: 300, backgroundColor: '#FFF', borderRadius: 12, padding: 25, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 5 },
  modalText: { fontSize: 16, color: '#666', marginBottom: 20, textAlign: 'center' },
  btnModalOK: { backgroundColor: '#1A73E8', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 6, width: '100%', alignItems: 'center' },
  btnModalOKText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  // 🌟 กล่องส้มสำหรับแจ้งซ่อม
  repairBox: { backgroundColor: '#FEF3C7', padding: 16, borderRadius: 8, marginBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#FCD34D' },
  repairBoxTitle: { fontSize: 14, fontWeight: 'bold', color: '#D97706' },
  repairBoxSub: { fontSize: 12, color: '#B45309', marginTop: 4 },
  repairBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6, marginLeft: 10 },
  repairBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 }
});
