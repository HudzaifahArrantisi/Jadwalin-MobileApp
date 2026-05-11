# 📅 Jadwalin App — Beige Edition

**Jadwalin** adalah aplikasi manajemen waktu, produktivitas, dan pengingat jadwal dengan pendekatan desain antarmuka (UI/UX) yang estetik, hangat, dan minimalis (*Beige Edition*). Aplikasi ini didesain khusus agar terasa premium namun tidak kaku, membawa nuansa buku catatan klasik (*planner*) yang modern langsung ke genggaman tangan Anda.

---

## 🌟 Fitur Utama (Highlights)

- **Kalender Interaktif & Multi-Indikator**: Tampilan kalender horizontal bergulir di Beranda (*Home*) dan tampilan bulan-penuh (*Full-month*) dengan indikator titik bergradasi warna atau ikon untuk tiap jadwal yang masuk.
- **Manajemen Jadwal Harian & Mingguan**: Pemisahan visual yang jelas antara jadwal spesifik (*timeline* jam) dan *To-Do List* mingguan yang menampilkan efek *strikethrough* otomatis jika tugas terselesaikan.
- **Daftar Saya (Notes)**: Sistem pencatatan multi-level bergaya binder. Buat berbagai kelompok catatan dengan kustomisasi Emoji dan warna khusus layaknya menempelkan *sticky notes*.
- **Sinkronisasi Cloud Terintegrasi**: Ditenagai oleh ekosistem **Firebase** (*Auth* & *Firestore*) untuk memastikan daftar tugas, personalisasi nama/pekerjaan/alamat, serta foto profil Anda tersimpan aman dan selalu tersinkronisasi di berbagai sesi.
- **Fluid UI & Glassmorphism**: Memanfaatkan kartu mengambang (*floating cards*), bayangan lembut (*soft shadows*), dan animasi halus perpindahan tab menggunakan Reanimated.

## 🎨 Konsep Desain (Beige Palette)

Aplikasi ini mendobrak gaya *template* aplikasi produktivitas yang umumnya kaku. Kami menggunakan palet warna *Earthy/Warm Tones*:
*   **Krem & Beige (`#FFF5E6`)**: Latar kanvas utama yang tidak menyilaukan mata dan menenangkan.
*   **Coklat Pekat (`#5C4033`)**: Memberikan kontras tegas untuk hierarki teks utama, ikonografi, dan tombol navigasi.
*   **Hijau Pastel (`#E6F0E6`) & Merah Pastel**: Aksen tambahan pada komponen penyelesaian tugas (*Checklist/Checkbox*) atau notifikasi/keluar (*Logout*).

## 🛠 Struktur Teknologi

Dibangun untuk berjalan mulus secara *cross-platform* (Android & iOS):
- **Kerangka Utama**: React Native & Expo (TypeScript)
- **State Management**: Zustand
- **Backend/Database**: Firebase Authentication & Cloud Firestore
- **Animasi & Grafis**: React Native Reanimated & Expo Vector Icons

---
*Dibuat untuk memaksimalkan produktivitas dan kedisiplinan jadwal Anda, tanpa harus mengorbankan estetika antarmuka.*
