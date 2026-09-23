import React, { useState, useRef } from 'react';
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
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

export default function RegisterOutsider({ navigation }) {
  const [profileImage, setProfileImage] = useState(null); 
  const [idCardImage, setIdCardImage] = useState(null); 
  
  const [citizenId, setCitizenId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false); 

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState('success'); 
  const [popupMessage, setPopupMessage] = useState('');

  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [facing, setFacing] = useState('front'); 

  const pickProfileImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['image'], 
      allowsEditing: true, 
      aspect: [1, 1], 
      quality: 0.8,
      base64: true,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const rawBase64 = result.assets[0].base64;
      const fullImageUri = rawBase64.startsWith('data:image') 
        ? rawBase64 
        : `data:image/jpeg;base64,${rawBase64}`;
        
      setProfileImage(fullImageUri);
    }
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        showPopup('error', 'กรุณาอนุญาตให้แอปพลิเคชันเข้าถึงกล้องถ่ายรูป');
        return;
      }
    }
    setIsCameraVisible(true);
  };

  // 🌟 ฟังก์ชัน OCR ที่ฉลาดขึ้น: ตรวจจับคำขยะและตัวเลขไทย/อารบิก ป้องกันชื่อเพี้ยน
  const processOcrData = async (base64Image) => {
    try {
      const response = await fetch('https://envision-stumble-kept.ngrok-free.dev/api/ocr', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true' 
        },
        body: JSON.stringify({ image: base64Image })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
      }

      setIsCameraVisible(false);

      let finalId = '';
      let finalName = '';

      // ฟังก์ชันช่วยเช็คว่าเป็น "ชื่อคน" ที่ถูกต้องไหม
      const isValidName = (str) => {
        if (!str) return false;
        // ถ้ามีตัวเลข (0-9 หรือ ๐-๙) หรือสัญลักษณ์พิเศษ แปลว่า AI อ่านโฮโลแกรมเพี้ยน ให้ปัดตกทันที
        if (/[0-9๐-๙!@#$%^&*()_+={}\[\]:;"'<>,.?/\\]/.test(str)) return false;
        // ถ้ามีคำพวกนี้อยู่บนบัตร ไม่ใช่ชื่อคน
        const garbage = ['ชื่อตัว', 'ชื่อสกุล', 'บัตร', 'ประชาชน', 'ศาสนา', 'เกิด', 'Date', 'Name', 'Thai', 'National'];
        if (garbage.some(g => str.includes(g))) return false;
        if (str.replace(/\s/g, '').length < 4) return false;
        return true;
      };

      if (result.text) {
        // 1. ดึงเฉพาะตัวเลข 13 หลัก
        const cleanNumbers = result.text.replace(/[^\d]/g, ''); 
        const idMatch = cleanNumbers.match(/\d{13}/); 
        if (idMatch) {
          finalId = idMatch[0];
        }

        // 2. ดึงชื่อ-นามสกุล
        const textLines = result.text.split('\n');
        const nameRegex = /(นาย|นาง|นางสาว|น\.ส\.|ด\.ช\.|ด\.ญ\.)\s*([ก-ฮะ-์]+)\s+([ก-ฮะ-์]+)/;
        
        for (let line of textLines) {
          let cleanLine = line.trim();
          if (isValidName(cleanLine)) {
            const match = cleanLine.match(nameRegex);
            if (match) {
              finalName = `${match[1]}${match[2]} ${match[3]}`;
              break; 
            }
          }
        }
      }

      // 3. กรองจาก Backend อีกชั้น
      if (!finalId && result.citizenId) {
        const cleanBackendId = result.citizenId.replace(/[^\d]/g, '');
        if (cleanBackendId.length >= 13) {
          finalId = cleanBackendId.substring(0, 13);
        }
      }
      if (!finalName && result.fullName) {
        if (isValidName(result.fullName)) {
          finalName = result.fullName.trim();
        }
      }

      // 4. สรุปผลลัพธ์ลงหน้าจอ
      if (finalId || finalName) {
        if (finalId && finalId.length === 13) setCitizenId(finalId);
        if (finalName) setName(finalName);
        
        if (finalId && !finalName) {
           showPopup('success', 'สแกนสำเร็จ!\nได้เลขบัตรประชาชนเรียบร้อยแล้ว (ระบบอ่านชื่อไม่ชัดเจน กรุณาพิมพ์ชื่อด้วยตนเอง)');
        } else {
           showPopup('success', 'สแกนสำเร็จ กรุณาตรวจสอบและแก้ไขข้อมูลให้ถูกต้องอีกครั้ง');
        }
      } else {
        showPopup('error', 'ระบบ AI อ่านข้อความไม่ชัดเจน เนื่องจากภาพอาจมีแสงสะท้อน กรุณากรอกข้อมูลด้วยตนเอง');
      }

    } catch (error) {
      console.error("OCR Error: ", error);
      setIsCameraVisible(false);
      showPopup('error', error.message || 'ไม่สามารถอ่านข้อความจากบัตรได้');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && !isOcrProcessing) {
      setIsOcrProcessing(true); 
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.8 });
        
        const rawBase64 = photo.base64;
        const base64Uri = rawBase64.startsWith('data:image') 
          ? rawBase64 
          : `data:image/jpeg;base64,${rawBase64}`;
        
        setIdCardImage(base64Uri);
        
        await processOcrData(photo.base64);

      } catch (error) {
        console.error(error);
        showPopup('error', 'เกิดข้อผิดพลาดในการถ่ายรูป');
        setIsOcrProcessing(false);
      } finally {
        setIsOcrProcessing(false);
      }
    }
  };

  const showPopup = (type, message) => {
    setPopupType(type);
    setPopupMessage(message);
    setPopupVisible(true);
  };

  const closePopup = () => {
    setPopupVisible(false);
    if (popupType === 'success' && popupMessage.includes('ระบบได้บันทึกข้อมูล')) {
      navigation.goBack();
    }
  };

  const handleRegister = async () => {
    if (!citizenId || !name || !phone || !email || !password || !idCardImage) {
      showPopup('error', 'กรุณากรอกข้อมูลส่วนตัวและสแกนบัตรให้ครบถ้วน');
      return;
    }

    setIsLoading(true);

    const cleanCitizenId = citizenId.replace(/[^0-9]/g, '');
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const outsiderData = {
      profileImage: profileImage, 
      profile_image: profileImage, 
      idCardImage: idCardImage, 
      id_card_image: idCardImage,
      citizenId: cleanCitizenId,
      citizen_id: cleanCitizenId,
      name: name,
      full_name: name,
      phone: cleanPhone,
      email: email.trim(),
      password: password,
    };

    try {
      const response = await fetch('https://envision-stumble-kept.ngrok-free.dev/api/register/outsider', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true' 
        },
        body: JSON.stringify(outsiderData),
      });
      const result = await response.json();

      if (response.ok) {
        showPopup('success', 'ระบบได้บันทึกข้อมูลของคุณเรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบได้ทันที');
      } else {
        showPopup('error', result.message || 'ไม่สามารถสมัครได้');
      }
    } catch (error) {
      showPopup('error', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
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
            <Text style={styles.headerTitle}>สมัครสมาชิก - บุคคลภายนอก</Text>
            <Text style={styles.headerSubtitle}>กรอกข้อมูลให้ครบถ้วนเพื่อสมัครใช้งานระบบ</Text>
          </View>

          <View style={styles.imagePickerContainer}>
            <TouchableOpacity style={styles.imagePickerCircle} onPress={pickProfileImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Ionicons name="image-outline" size={40} color="#A0A0A0" />
                  <Text style={styles.imagePlaceholderText}>รูปโปรไฟล์</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.idCardRowContainer}>
            <View style={styles.idCardInputWrapper}>
              <View style={styles.labelContainer}>
                <Text style={styles.labelText}>รหัสบัตรประชาชน</Text>
                <Text style={styles.requiredAsterisk}> *</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="เลข 13 หลัก"
                placeholderTextColor="#A0A0A0"
                keyboardType="numeric"
                value={citizenId}
                onChangeText={setCitizenId}
                maxLength={13}
              />
            </View>

            <View style={styles.idCardImageWrapper}>
              <View style={styles.labelContainer}>
                <Text style={styles.labelText}>สแกนบัตร</Text>
                <Text style={styles.requiredAsterisk}> *</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.idCardSmallPicker} 
                onPress={idCardImage ? () => setIdCardImage(null) : openCamera}
              >
                {idCardImage ? (
                  <>
                    <Image source={{ uri: idCardImage }} style={styles.idCardSmallImage} />
                    <View style={styles.deleteImageOverlay}>
                      <Ionicons name="trash" size={18} color="#FFF" />
                    </View>
                  </>
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Ionicons name="scan-outline" size={22} color="#4B5563" />
                    <Text style={styles.imagePlaceholderTextSmall}>เปิดกล้อง</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <InputField label="ชื่อ-นามสกุล" placeholder="เช่น นายสมชาย ใจดี" isRequired value={name} onChangeText={setName} />
          <InputField label="เบอร์โทรศัพท์" placeholder="08X-XXX-XXXX" isRequired keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          <InputField label="Email" placeholder="example@gmail.com" isRequired keyboardType="email-address" value={email} onChangeText={setEmail} />
          <InputField label="ตั้งรหัสผ่านสำหรับเข้าสู่ระบบ" placeholder="อย่างน้อย 6 ตัวอักษร" isRequired secureTextEntry value={password} onChangeText={setPassword} />

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.registerButtonText}>สมัครสมาชิก</Text>}
          </TouchableOpacity>

        </View>
      </ScrollView>

      <Modal visible={isCameraVisible} animationType="fade" transparent={true}>
        <View style={styles.popupCameraOverlay}>
          <View style={styles.popupCameraBox}>
            
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>สแกนบัตรประชาชน</Text>
              <TouchableOpacity onPress={() => setIsCameraVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.popupCameraViewContainer}>
              <CameraView 
                key={facing} 
                ref={cameraRef} 
                style={styles.cameraFrame} 
                facing={facing} 
                autofocus="on" 
                mirror={false}
              />
              <View style={styles.idCardGuideFrame} />
            </View>

            <View style={styles.popupFooter}>
              <TouchableOpacity 
                style={styles.popupFlipBtn} 
                onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
                disabled={isOcrProcessing}
              >
                <Ionicons name="camera-reverse-outline" size={24} color="#4B5563" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.popupCaptureBtn} 
                onPress={takePicture} 
                disabled={isOcrProcessing}
              >
                <Ionicons name="camera" size={28} color="#FFF" />
                <Text style={styles.popupCaptureText}>ถ่ายภาพ</Text>
              </TouchableOpacity>

              <View style={{ width: 44 }} />
            </View>

          </View>
        </View>
      </Modal>

      <Modal transparent={true} visible={isOcrProcessing} animationType="fade">
        <View style={styles.fullScreenLoading}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#00A87E" />
            <Text style={styles.loadingText}>กำลังอ่านข้อมูลจากบัตร...</Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>อาจใช้เวลา 5-15 วินาที</Text>
          </View>
        </View>
      </Modal>

      <Modal transparent={true} visible={popupVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Ionicons 
              name={popupType === 'success' ? 'checkmark-circle' : 'close-circle'} 
              size={65} 
              color={popupType === 'success' ? '#1E8E3E' : '#D93025'} 
            />
            <Text style={styles.modalTitle}>
              {popupType === 'success' ? 'สำเร็จ' : 'แจ้งเตือน'}
            </Text>
            <Text style={styles.modalMessage}>{popupMessage}</Text>
            
            <TouchableOpacity 
              style={[styles.btnModalOK, popupType === 'error' && { backgroundColor: '#F59E0B' }]} 
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
  profileImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  idCardRowContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  idCardInputWrapper: { flex: 1, marginRight: 15 },
  idCardImageWrapper: { width: 100 }, 
  idCardSmallPicker: { height: 50, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, overflow: 'hidden', position: 'relative' },
  idCardSmallImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  deleteImageOverlay: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.5)', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  
  imagePlaceholderTextSmall: { fontSize: 11, color: '#4B5563', marginTop: 2 },
  
  placeholderContainer: { alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { fontSize: 12, color: '#A0A0A0', marginTop: 8 },
  
  inputContainer: { width: '100%', marginBottom: 20 },
  labelContainer: { flexDirection: 'row', marginBottom: 8 },
  labelText: { fontSize: 16, fontWeight: '500', color: '#333' },
  requiredAsterisk: { color: 'red' },
  input: { height: 50, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 15, backgroundColor: '#F9F9F9', fontSize: 16, color: '#333' },
  
  registerButton: { width: '100%', height: 55, backgroundColor: '#00A87E', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 30 },
  registerButtonText: { fontSize: 18, fontWeight: 'bold', color: 'white' },

  popupCameraOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  popupCameraBox: { width: Math.min(SCREEN_WIDTH * 0.9, 400), backgroundColor: '#FFF', borderRadius: 16, padding: 20, elevation: 5 },
  
  popupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  popupTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  
  popupCameraViewContainer: { width: '100%', height: 250, borderRadius: 12, overflow: 'hidden', position: 'relative', backgroundColor: '#000' },
  cameraFrame: { width: '100%', height: '100%' },
  
  idCardGuideFrame: { position: 'absolute', top: 20, bottom: 20, left: 15, right: 15, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 8, borderStyle: 'dashed' },

  popupFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  popupFlipBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  
  popupCaptureBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00A87E', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 30, elevation: 2 },
  popupCaptureText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },

  fullScreenLoading: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  loadingBox: { backgroundColor: '#FFF', padding: 25, borderRadius: 16, alignItems: 'center', elevation: 5, width: '80%', maxWidth: 300 },
  loadingText: { color: '#333', fontSize: 16, marginTop: 15, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: 300, backgroundColor: '#FFF', borderRadius: 16, padding: 25, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 8 },
  modalMessage: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  btnModalOK: { backgroundColor: '#00A87E', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8, width: '100%', alignItems: 'center' },
  btnModalOKText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
