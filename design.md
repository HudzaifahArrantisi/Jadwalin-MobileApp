# Jadwalin Mobile — Design System & UI/UX Guidelines

Dokumen ini adalah sumber kebenaran (Single Source of Truth) untuk *styling* dan interaksi di seluruh aplikasi mobile Jadwalin. Tujuannya adalah menciptakan pengalaman pengguna yang mahal, modern, dan sangat *"native mobile"*, bukan sekadar *website* yang dibungkus jadi aplikasi.

---

## 🎨 1. Core Palette (Beige Premium)
Warna harus terasa *calm, organic, dan tidak menyilaukan mata di malam hari*. Jangan gunakan Hex bawaan Tailwind/CSS generik.

- **Background Dasar Layar:** `#FFF8F0` (Bukan putih murni, krem sangat pucat).
- **Surface / Card:** `#F5E6D3` (Lapisan di atas background, untuk kotak/wadah).
- **Teks Utama (Headers & Title):** `#5C4A32` (Coklat kopi, kontras tinggi tapi lebih lembut dari hitam).
- **Teks Sekunder (Caption/Jam):** `#8B7355` (Coklat teh susu, untuk metadata).
- **Garis Pemisah (Dividers):** `#E8DCC8` (Sangat tipis, 1px).
- **Brand Accent (Tombol Utama):** `#5C4A32` dengan teks `#FFF8F0`.

---

## 📐 2. Mobile Layout & Spacing (Pernapasan UI)
Aplikasi modern tidak pernah terlihat sumpek. Biarkan elemen "bernapas".

- **Safe Area:** Selalu gunakan `SafeAreaView` agar UI tidak tertutup poni (notch) atau *home indicator* di iPhone/Android modern.
- **Margin Layar Horizontal:** Wajib `24px` di sisi kiri dan kanan untuk semua konten utama.
- **Jarak Antar Seksi (Vertical Margin):** Gunakan `32px` untuk memisahkan grup konten yang berbeda (contoh: antara daftar hari ini dan daftar besok).
- **Jarak Dalam Card (Padding):** Minimal `16px`, idealnya `20px`.
- **Bottom Navigation:** Harus melayang (*floating*) sedikit di atas batas bawah layar dengan efek *glassmorphism* (blur) jika memungkinkan, bukan kotak kaku yang menempel mati di bawah.

---

## 🔲 3. Anatomi Komponen Mobile
Jangan gunakan komponen berbentuk persegi kaku. Semua harus membulat dan natural.

- **Bentuk (Border Radius):**
  - **Card/Wadah Besar:** `24px`
  - **Bottom Sheet / Modal:** `32px` (hanya di sudut atas)
  - **Tombol Utama:** `16px` (atau membulat penuh/pil `999px`)
  - **Icon Box:** `12px`
- **Elevasi & Bayangan (Shadows):** 
  - Gaya Jadwalin adalah *Flat/Pastel*. JANGAN gunakan drop shadow tebal ala Android lawas. 
  - Jika butuh bayangan, gunakan: `shadowColor: '#5C4A32'`, `shadowOpacity: 0.05`, `shadowRadius: 10`, `elevation: 2`.
- **Tombol (Buttons):** 
  - Tinggi tombol utama minimal `56px` agar mudah ditekan jempol (aturan *hit-target* mobile).
  - Teks tombol harus di-*center* secara vertikal dan horizontal dengan font *Bold*.

---

## ✨ 4. Interaksi & Gestur (Micro-Interactions)
Aplikasi harus terasa "hidup" di jari pengguna.

- **Efek Tekan (Feedback):** DILARANG keras menggunakan tombol yang mati saat disentuh. Wajib gunakan `Pressable` dari React Native atau `TouchableOpacity`. Tambahkan efek mengecil sedikit (scale 0.95) saat ditekan menggunakan Reanimated.
- **Haptic Feedback:** Setiap aksi penting (menandai tugas selesai, menghapus tugas) WAJIB memicu getaran halus (*light haptic feedback*).
- **Transisi Halaman:** Gunakan animasi *fade-in* atau geser layar (*slide*) bawaan Expo Router. Jangan ada pergantian layar yang *nge-blink* kasar.
- **Bottom Sheet:** Gunakan laci yang ditarik dari bawah (*bottom sheet*) untuk fitur seperti "Tambah Tugas" atau "Filter", daripada memindahkan pengguna ke halaman baru. Ini standar aplikasi mobile iOS/Android masa kini.

---

## 🤖 5. Aturan Ketat Untuk Asisten AI
Saat menulis komponen untuk Jadwalin, AI **wajib**:
1. Mengimpor warna hanya dari `constants/theme.ts`.
2. Menghindari `View` standar untuk tombol. Selalu buat elemen interaktif.
3. Menghindari struktur HTML/Web. Berpikir dalam komponen Native (`ScrollView`, `FlatList`, `SafeAreaView`).
4. Tidak membuat UI yang terlalu rapat. Jika ragu, berikan margin lebih besar. UI yang lapang terlihat jauh lebih mewah.
