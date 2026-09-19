import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  Image, 
  ActivityIndicator,
  Modal // 🌟 นำเข้า Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; 

const FACULTY_OPTIONS = [
  { label: 'คณะศิลปศาสตร์', value: 'arts' },
  { label: 'คณะวิทยาศาสตร์และเทคโนโลยี', value: 'science' },
  { label: 'คณะครุศาสตร์อุตสาหกรรม', value: 'industrial_education' },
  { label: 'คณะวิศวกรรมศาสตร์', value: 'engineering' },
  { label: 'คณะบริหารธุรกิจ', value: 'business' },
  { label: 'คณะเทคโนโลยีคหกรรมศาสตร์', value: 'home_economics' },
  { label: 'คณะอุตสาหกรรมสิ่งทอ', value: 'textile' },
  { label: 'วิทยาลัยนานาชาติ', value: 'international_college' },
  { label: 'สถาบันวิทยาศาสตร์ นวัตกรรมและวัฒนธรรม', value: 'isic' },
];

const MAJOR_OPTIONS = {
  arts: [
    { label: 'ภาษาอังกฤษเพื่อการสื่อสารสากล', value: 'english' },
    { label: 'ภาษาจีนเพื่อการสื่อสาร', value: 'chinese' },
    { label: 'ภาษาญี่ปุ่น', value: 'japanese' },
    { label: 'การท่องเที่ยว', value: 'tourism' },
    { label: 'การโรงแรม', value: 'hotel' },
  ],
  science: [
    { label: 'วิทยาการคอมพิวเตอร์', value: 'cs' },
    { label: 'เทคโนโลยีสารสนเทศ', value: 'it' },
    { label: 'เคมี', value: 'chemistry' },
    { label: 'ฟิสิกส์', value: 'physics' },
    { label: 'คณิตศาสตร์', value: 'math' },
    { label: 'วิทยาศาสตร์และเทคโนโลยีการอาหาร', value: 'food_science' },
  ],
  industrial_education: [
    { label: 'ครุศาสตร์อุตสาหกรรม (เครื่องกล)', value: 'te_me' },
    { label: 'ครุศาสตร์อุตสาหกรรม (อุตสาหการ)', value: 'te_ie' },
  ],
  engineering: [
    { label: 'วิศวกรรมเครื่องกล', value: 'me' },
    { label: 'วิศวกรรมไฟฟ้า', value: 'ee' },
    { label: 'วิศวกรรมคอมพิวเตอร์', value: 'ce' },
    { label: 'วิศวกรรมโยธา', value: 'civil' },
    { label: 'วิศวกรรมอุตสาหการ', value: 'ie' },
    { label: 'วิศวกรรมเคมี', value: 'che' },
    { label: 'วิศวกรรมสำรวจ', value: 'se' },
    { label: 'วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม', value: 'electronic' },
  ],
  business: [
    { label: 'การบัญชี', value: 'acc' },
    { label: 'ระบบสารสนเทศ', value: 'is' },
    { label: 'การตลาด', value: 'marketing' },
    { label: 'การจัดการ', value: 'management' },
    { label: 'การเงิน', value: 'finance' },
    { label: 'ธุรกิจระหว่างประเทศ', value: 'international_business' },
  ],
  home_economics: [
    { label: 'อาหารและโภชนาการ', value: 'food_nutrition' },
    { label: 'การออกแบบแฟชั่น', value: 'fashion' },
    { label: 'การศึกษาปฐมวัย', value: 'early_childhood' },
  ],
  textile: [
    { label: 'วิศวกรรมสิ่งทอ', value: 'textile_eng' },
    { label: 'การออกแบบสิ่งทอ', value: 'textile_design' },
    { label: 'เทคโนโลยีเสื้อผ้า', value: 'garment' },
  ],
  international_college: [
    { label: 'บริหารธุรกิจ (นานาชาติ)', value: 'ic_biz' },
    { label: 'การท่องเที่ยว (นานาชาติ)', value: 'ic_tourism' },
  ],
  isic: [
    { label: 'นวัตกรรมและวัฒนธรรม', value: 'innovation' },
  ],
};

const InputField = ({ label, placeholder, isRequired, keyboardType, secureTextEntry, value, onChangeText }) => (
  <View style={styles.inputContainer}>
    <View style={styles.labelContainer}>
      <Text style={styles.labelText}>{label}</Text>
      {isRequired && <Text style={styles.requiredAsterisk}> *</Text>}
    </View>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#A0A0A0"
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
    />
  </View>
);

const CustomDropdown = ({ options, selectedValue, onSelect, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleSelect = (value) => { onSelect(value); setIsOpen(false); };

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={[styles.dropdown, disabled && styles.dropdownDisabled]}
        onPress={() => !disabled && setIsOpen(!isOpen)}
        activeOpacity={0.8}
      >
        <Text style={[styles.dropdownText, (!selectedValue || disabled) && { color: '#A0A0A0' }]}>
          {selectedValue ? options.find(o => o.value === selectedValue)?.label : placeholder}
        </Text>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={disabled ? "#ccc" : "#666"} />
      </TouchableOpacity>

      {isOpen && !disabled && (
        <View style={styles.dropdownList}>
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {options.map((item) => (
              <TouchableOpacity key={item.value} style={styles.dropdownItem} onPress={() => handleSelect(item.value)}>
                <Text style={styles.dropdownItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default function RegisterStudent({ navigation }) {
  const [profileImage, setProfileImage] = useState(null); 
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [phone, setPhone] = useState('');
  
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  
  const [verificationStep, setVerificationStep] = useState(0); 
  const [isLoading, setIsLoading] = useState(false);

  // 🌟 State สำหรับ Pop-up
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState('success'); 
  const [popupMessage, setPopupMessage] = useState('');

  const handleFacultyChange = (val) => {
    setSelectedFaculty(val);
    setSelectedMajor(null);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, 
      aspect: [1, 1], 
      quality: 0.8,
      base64: true, 
    });
    if (!result.canceled) {
      const imageBase64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setProfileImage(imageBase64);
    }
  };

  // 🌟 ฟังก์ชันจัดการ Pop-up
  const showPopup = (type, message) => {
    setPopupType(type);
    setPopupMessage(message);
    setPopupVisible(true);
  };

  const closePopup = () => {
    setPopupVisible(false);
    // ถ้าสมัครสำเร็จ พอกดปิด Pop-up ให้เด้งกลับหน้า Login
    if (popupType === 'success' && popupMessage.includes('ระบบได้บันทึกข้อมูล')) {
      navigation.goBack();
    }
  };

  const requestOtp = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail.endsWith('@mail.rmutk.ac.th')) {
      showPopup('error', 'กรุณาใช้อีเมลของมหาวิทยาลัย (@mail.rmutk.ac.th)');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://rmutk-sport.onrender.com/api/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const result = await response.json();
      
      if (response.ok) {
        showPopup('success', 'ส่งรหัส OTP ไปที่อีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย');
        setVerificationStep(1); 
      } else {
        showPopup('error', result.message || 'ไม่สามารถส่งอีเมลได้');
      }
    } catch (error) {
      showPopup('error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otpCode.length !== 6) {
      showPopup('error', 'กรุณากรอกรหัส OTP 6 หลัก');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://rmutk-sport.onrender.com/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otpCode }),
      });
      const result = await response.json();
      
      if (response.ok) {
        setVerificationStep(2); 
      } else {
        showPopup('error', result.message || 'รหัส OTP ไม่ถูกต้อง');
      }
    } catch (error) {
      showPopup('error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!studentId || !name || !selectedFaculty || !selectedMajor || !phone || !password) {
      showPopup('error', 'กรุณากรอกข้อมูลและตั้งรหัสผ่านให้ครบถ้วน');
      return;
    }

    setIsLoading(true);
    const studentData = {
      profileImage: profileImage, 
      studentId: studentId,
      name: name,
      faculty: selectedFaculty,
      major: selectedMajor,
      phone: phone,
      email: email.trim(),
      password: password,
      otp: otpCode 
    };

    try {
      const response = await fetch('https://rmutk-sport.onrender.com/api/register/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });

      const result = await response.json();

      if (response.ok) {
        // 🌟 เรียก Pop-up สีเขียวเมื่อสำเร็จ
        showPopup('success', 'ระบบได้บันทึกข้อมูลของคุณเรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบได้ทันที');
      } else {
        showPopup('error', result.message || 'มีข้อผิดพลาดบางอย่างเกิดขึ้น กรุณาลองใหม่');
      }
    } catch (error) {
      showPopup('error', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ฐานข้อมูลได้ กรุณาลองใหม่อีกครั้งในภายหลัง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#4B5563" />
        <Text style={styles.backText}>ย้อนกลับ</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>สมัครสมาชิก - นักศึกษา</Text>
            <Text style={styles.headerSubtitle}>กรอกข้อมูลให้ครบถ้วนเพื่อสมัครใช้งานระบบ</Text>
          </View>

          <View style={styles.imagePickerContainer}>
            <TouchableOpacity style={styles.imagePickerCircle} onPress={pickImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Ionicons name="camera-outline" size={40} color="#A0A0A0" />
                  <Text style={styles.imagePlaceholderText}>เพิ่มรูปถ่าย</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <InputField label="รหัสนักศึกษา" placeholder="เช่น 6550210000" isRequired keyboardType="numeric" value={studentId} onChangeText={setStudentId} />
          <InputField label="ชื่อ-นามสกุล" placeholder="กรอกชื่อ-นามสกุล" isRequired value={name} onChangeText={setName} />

          <View style={[styles.groupedDropdownContainer, { zIndex: 100 }]}>
            <View style={styles.labelRow}>
              <View style={styles.dropdownColumn}><View style={styles.labelContainer}><Text style={styles.labelText}>คณะ</Text><Text style={styles.requiredAsterisk}> *</Text></View></View>
              <View style={styles.dropdownColumn}><View style={styles.labelContainer}><Text style={styles.labelText}>สาขาวิชา</Text><Text style={styles.requiredAsterisk}> *</Text></View></View>
            </View>
            <View style={styles.dropdownRow}>
              <View style={[styles.dropdownColumn, { zIndex: 200 }]}><CustomDropdown options={FACULTY_OPTIONS} selectedValue={selectedFaculty} onSelect={handleFacultyChange} placeholder="เลือกคณะ" /></View>
              <View style={[styles.dropdownColumn, { zIndex: 100 }]}><CustomDropdown options={selectedFaculty ? MAJOR_OPTIONS[selectedFaculty] : []} selectedValue={selectedMajor} onSelect={setSelectedMajor} placeholder="เลือกสาขา" disabled={!selectedFaculty} /></View>
            </View>
          </View>

          <InputField label="เบอร์โทรศัพท์" placeholder="08X-XXX-XXXX" isRequired keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.labelText}>Email มหาวิทยาลัย</Text><Text style={styles.requiredAsterisk}> *</Text>
            </View>
            <View style={styles.rowInputGroup}>
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: verificationStep > 0 ? '#F3F4F6' : '#F9F9F9' }]}
                placeholder="655xxxxxx@mail.rmutk.ac.th"
                placeholderTextColor="#A0A0A0"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={verificationStep === 0} 
              />
              {verificationStep === 0 && (
                <TouchableOpacity style={styles.inlineButton} onPress={requestOtp} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.inlineButtonText}>ขอรหัส OTP</Text>}
                </TouchableOpacity>
              )}
              {verificationStep === 2 && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#00A87E" />
                  <Text style={{color: '#00A87E', fontWeight: 'bold', marginLeft: 4}}>ยืนยันแล้ว</Text>
                </View>
              )}
            </View>
          </View>

          {verificationStep === 1 && (
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.labelText}>รหัส OTP (6 หลัก)</Text><Text style={styles.requiredAsterisk}> *</Text>
              </View>
              <View style={styles.rowInputGroup}>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: '#F9F9F9' }]}
                  placeholder="------"
                  keyboardType="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={setOtpCode}
                />
                <TouchableOpacity style={[styles.inlineButton, { backgroundColor: '#F59E0B' }]} onPress={verifyOtp} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.inlineButtonText}>ยืนยัน OTP</Text>}
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => setVerificationStep(0)} style={{ marginTop: 8 }}>
                <Text style={{ color: '#00A87E', fontSize: 12, textDecorationLine: 'underline' }}>อีเมลผิด? กลับไปแก้ไขอีเมล</Text>
              </TouchableOpacity>
            </View>
          )}

          {verificationStep === 2 && (
            <>
              <InputField 
                label="ตั้งรหัสผ่านสำหรับเข้าสู่ระบบ" 
                placeholder="อย่างน้อย 6 ตัวอักษร" 
                isRequired 
                secureTextEntry 
                value={password} 
                onChangeText={setPassword} 
              />

              <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.registerButtonText}>สมัครสมาชิก</Text>}
              </TouchableOpacity>
            </>
          )}

        </View>
      </ScrollView>

      {/* ================= 🌟 Custom Pop-up ================= */}
      <Modal transparent={true} visible={popupVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Ionicons 
              name={popupType === 'success' ? 'checkmark-circle' : 'close-circle'} 
              size={65} 
              color={popupType === 'success' ? '#1E8E3E' : '#D93025'} 
            />
            <Text style={styles.modalTitle}>
              {popupType === 'success' ? 'สำเร็จ' : 'ข้อผิดพลาด'}
            </Text>
            <Text style={styles.modalMessage}>{popupMessage}</Text>
            
            <TouchableOpacity 
              style={[styles.btnModalOK, popupType === 'error' && { backgroundColor: '#D93025' }]} 
              onPress={closePopup}
            >
              <Text style={styles.btnModalOKText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  backButton: { flexDirection: 'row', alignItems: 'center', padding: 20, marginTop: Platform.OS === 'android' ? 20 : 0, alignSelf: 'flex-start', zIndex: 10 },
  backText: { fontSize: 16, color: '#4B5563', marginLeft: 8, fontWeight: '500' },
  scrollContent: { padding: 20, paddingTop: 10, alignItems: 'center' },
  formContainer: { width: '100%', maxWidth: 500 },
  header: { alignItems: 'center', marginBottom: 20, width: '100%' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  headerSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 10 },
  
  imagePickerContainer: { alignItems: 'center', marginBottom: 30 },
  imagePickerCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', overflow: 'hidden' },
  profileImage: { width: '100%', height: '100%' },
  placeholderContainer: { alignItems: 'center' },
  imagePlaceholderText: { fontSize: 12, color: '#A0A0A0', marginTop: 5 },
  
  inputContainer: { width: '100%', marginBottom: 20 },
  labelContainer: { flexDirection: 'row', marginBottom: 8 },
  labelText: { fontSize: 16, fontWeight: '500', color: '#333' },
  requiredAsterisk: { color: 'red' },
  input: { height: 50, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 15, backgroundColor: '#F9F9F9', fontSize: 16, color: '#333' },
  
  rowInputGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inlineButton: { backgroundColor: '#00A87E', height: 50, paddingHorizontal: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  inlineButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },

  groupedDropdownContainer: { width: '100%', marginBottom: 20 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  dropdownRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  dropdownColumn: { width: '47%' },
  dropdownContainer: { position: 'relative' },
  dropdown: { flexDirection: 'row', height: 50, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 15, backgroundColor: '#F9F9F9', alignItems: 'center', justifyContent: 'space-between' },
  dropdownDisabled: { backgroundColor: '#F0F0F0', borderColor: '#E8E8E8' },
  dropdownText: { fontSize: 16, color: '#333' },
  dropdownList: { position: 'absolute', top: 55, left: 0, right: 0, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, maxHeight: 160, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  dropdownItemText: { fontSize: 16, color: '#333' },
  
  registerButton: { width: '100%', height: 55, backgroundColor: '#00A87E', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 30 },
  registerButtonText: { fontSize: 18, fontWeight: 'bold', color: 'white' },

  // 🌟 Styles สำหรับ Pop-up
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: 300, backgroundColor: '#FFF', borderRadius: 16, padding: 25, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 8 },
  modalMessage: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  btnModalOK: { backgroundColor: '#00A87E', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8, width: '100%', alignItems: 'center' },
  btnModalOKText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
