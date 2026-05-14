# Jadwalin App — Design System & UI/UX Refactor Guide

> Dokumen ini adalah **single source of truth** untuk tampilan visual Jadwalin.
> Tujuannya: menjaga konsistensi warna, tipografi, spacing, dan komponen
> di seluruh aplikasi — serta menyediakan prompt yang siap digunakan
> untuk meminta AI (Claude Opus, dsb.) melakukan refactor UI **tanpa mengubah logika**.

---

## 📐 Arsitektur File yang Terdampak

### Theme (Sumber Kebenaran Warna & Spacing)
| File | Peran |
|------|-------|
| `constants/theme.ts` | **File utama**. Semua token desain (Colors, Spacing, Radius, FontSize, Shadow, scaling utils) didefinisikan di sini. **Setiap perubahan visual harus dimulai dari file ini.** |

### Screens (Halaman Utama)
| File | Nama Layar | Komponen Kunci |
|------|-----------|----------------|
| `app/(tabs)/index.tsx` | Home | Header, Horizontal Week Calendar, Daily Section (Brown Card), Weekly Task List (Collapsible), Mini Calendar Modal |
| `app/(tabs)/calendar.tsx` | Kalender | Full-month Calendar (react-native-calendars, custom `dayComponent`), Add Task Form (icon picker, time type selector), Timeline View |
| `app/(tabs)/notes.tsx` | Daftar Saya | Write Section Card, Note List, Note Detail Modal (Brown Card), Create Note Sheet |
| `app/(tabs)/settings.tsx` | Profil | Profile Header (avatar + beige bg), Personal Info Form Card, Logout Button |
| `app/(tabs)/_layout.tsx` | Tab Bar | Custom Pill Tab Bar + Profile Circle Button |

### Komponen Reusable
| File | Komponen | Dipakai Di |
|------|----------|------------|
| `components/InteractivePressable.tsx` | Tombol interaktif dengan haptic | Semua screen |
| `components/TaskCard.tsx` | Card task dengan swipe-to-delete | (Legacy, tidak aktif di tab screens saat ini) |
| `components/TaskItem.tsx` | Item task detail | Calendar timeline |
| `components/EmptyState.tsx` | Placeholder kosong | Berbagai list |
| `components/Skeleton.tsx` | Loading skeleton | List loading |
| `components/OfflineIndicator.tsx` | Banner offline | Layout |

---

## 🎨 Color Palette — Status Saat Ini vs. Rekomendasi Pastel

### Status Saat Ini (`constants/theme.ts`)

```
Colors.cream           = '#FFF8F0'     ← bg utama (agak warm)
Colors.beige           = '#F5E6D3'     ← header bg
Colors.beigeDark       = '#D4B896'     ← tab bar pill bg
Colors.brown           = '#8B7355'     ← aksen teks
Colors.brownDark       = '#5C4A32'     ← teks penting, selected state
Colors.brownLight      = '#C4A882'     ← card aksen
Colors.dailyCardBg     = '#C9B99A'     ← card daily task
Colors.pastelGreen     = '#D4E8C2'     ← note items, weekly list
Colors.checkGreen      = '#4CAF50'     ← checkmark
Colors.textPrimary     = '#2C2C2C'
Colors.textSecondary   = '#6B6B6B'
Colors.textMuted       = '#999999'
Colors.danger          = '#F44336'     ← logout (terlalu tajam/saturated)
Colors.warning         = '#FF9800'     ← (terlalu saturated)
Colors.success         = '#4CAF50'     ← (terlalu saturated)
```

### Masalah Visual Saat Ini
1. **Warna `danger`, `warning`, `success`** terlalu saturated — terlihat "Material Design default" / AI-generated.
2. **`dailyCardBg` (#C9B99A)** dan **`brownDark` (#5C4A32)** kontrasnya terlalu kuat — terlihat berat.
3. Banyak hardcoded hex di dalam screen files (misalnya `#A39074`, `#E4EBCC`, `#19D231`, `#D1C6B8`) yang **tidak menggunakan token dari theme**, membuat inkonsisten.
4. Shadow menggunakan warna brown — bagus, tapi `shadowOpacity` bisa dikurangi lagi agar lebih lembut.

### Rekomendasi Palet Pastel Premium

| Token | Hex Baru | Nama | Catatan |
|-------|----------|------|---------|
| `cream` | `#FFFDF8` | Cloud Cream | Sedikit lebih netral, kurang kuning |
| `beige` | `#F5EDE3` | Warm Linen | Bg section |
| `beigeDark` | `#E8D9C5` | Almond | Tab bar pill, lebih lembut |
| `brown` | `#9C8B75` | Driftwood | Aksen teks ringan |
| `brownDark` | `#6B5D4F` | Espresso Muted | Teks penting, tombol utama, tapi lebih soft |
| `brownLight` | `#D4C4AD` | Sand Dollar | Card aksen |
| `dailyCardBg` | `#C4B8A4` | Warm Stone | Card harian — sedikit lebih netral |
| `pastelGreen` | `#E2EDDA` | Sage Mist | Note/weekly — lebih muted |
| `pastelGreenDark` | `#C8D9BC` | Sage | Hover/active state |
| `checkGreen` | `#7FB685` | Soft Fern | Checkmark — desaturated |
| `pastelRose` | `#F5E4DF` | Dusty Rose | Aksen deadline/priority (BARU) |
| `pastelBlue` | `#E4ECF3` | Mist Blue | Informational card (BARU) |
| `pastelLavender` | `#EDE5F2` | Soft Lavender | Alternatif aksen (BARU) |
| `danger` | `#D4816B` | Terracotta | Soft danger — bukan merah murni |
| `warning` | `#D4A96A` | Amber Muted | Soft warning |
| `success` | `#7FB685` | Soft Fern | Sama dengan checkGreen |
| `textPrimary` | `#2D2B28` | Charcoal Warm | Sedikit warm undertone |
| `textSecondary` | `#7A7570` | Pebble | Muted tapi masih terbaca |
| `textMuted` | `#A8A29E` | Stone | Placeholder, metadata |
| `borderLight` | `#EDE8E1` | Parchment | Border/divider |

---

## ✏️ Typography

| Level | Token Saat Ini | Size | Weight | Penggunaan |
|-------|---------------|------|--------|------------|
| Hero | `FontSize.hero` | 28 | 700 | Tanggal di header home |
| Title | `FontSize.title` | 32 | 800 | Judul modal |
| XL | `FontSize.xl` | 20 | 700-800 | Section titles |
| LG | `FontSize.lg` | 18 | 700 | Sub-headers |
| MD | `FontSize.md` | 15 | 500-700 | Body text, form labels |
| SM | `FontSize.sm` | 13 | 400-600 | Sub-text, time labels |
| XS | `FontSize.xs` | 11 | 500-600 | Metadata, field labels |
| XXS | `FontSize.xxs` | 10 | 600 | Calendar day headers |

**Rekomendasi**: Semua `fontWeight: '800'` (extrabold) bisa diturunkan ke `'700'` (bold) agar tidak terlalu "tebal/kasar". Gunakan `'600'` (semibold) untuk label dan sub-text.

---

## 📏 Spacing & Radius

### Spacing (berbasis kelipatan 8)
| Token | Nilai | Penggunaan |
|-------|-------|------------|
| `xxs` | 2 | Micro-gap |
| `xs` | 4 | Icon gap |
| `sm` | 8 | Antar elemen kecil |
| `md` | 16 | Padding card, form field gap |
| `lg` | 24 | Section padding |
| `xl` | 32 | Antar section |
| `xxl` | 48 | Large gap |

### Border Radius
| Token | Nilai | Penggunaan |
|-------|-------|------------|
| `xs` | 4 | Tiny chips |
| `sm` | 8 | Input fields |
| `md` | 12 | Small cards |
| `lg` | 16 | Medium cards |
| `xl` | 20 | Large cards, modals |
| `xxl` | 28 | Sections, note cards |
| `full` | 999 | Pills, circular |

**Rekomendasi**: Konsistenkan semua card utama menggunakan `Radius.xl` (20) atau `Radius.xxl` (28). Hindari mix antara `Radius.md` dan `Radius.xl` dalam satu screen.

---

## 🔲 Shadow

### Saat Ini
```ts
Shadow.sm  → shadowOpacity: 0.08, radius: 4, elevation: 2
Shadow.md  → shadowOpacity: 0.12, radius: 8, elevation: 4
Shadow.lg  → shadowOpacity: 0.15, radius: 12, elevation: 6
```

### Rekomendasi Soft
```ts
Shadow.sm  → shadowOpacity: 0.05, radius: 6, elevation: 1
Shadow.md  → shadowOpacity: 0.08, radius: 10, elevation: 2
Shadow.lg  → shadowOpacity: 0.10, radius: 16, elevation: 3
```
Kurangi `elevation` di Android agar shadow tidak terlalu "keras". Gunakan `shadowColor` yang mengikuti warna card (bukan hitam murni).

---

## 🧩 Hardcoded Colors yang Harus Dibuang

Berikut hex yang tertulis langsung di screen files dan **harus diganti** dengan token dari `Colors`:

| Hex | Ditemukan Di | Ganti Dengan |
|-----|-------------|--------------|
| `#F7EFE5` | `index.tsx` (container bg, indicator border) | `Colors.cream` |
| `#A39074` | `index.tsx` (daily section bg), `_layout.tsx` (profile btn) | `Colors.dailyCardBg` |
| `#D1C6B8` | `index.tsx` (daily dot) | `Colors.brownLight` |
| `#9C625A` | `index.tsx` (date year color) | Buat token baru: `Colors.dateAccent` |
| `#2C2C2C` | `index.tsx` (avatar placeholder) | `Colors.textPrimary` |
| `#E4EBCC` | `index.tsx` (weekly item bg) | `Colors.pastelGreen` |
| `#19D231` | `index.tsx` (check icon) | `Colors.checkGreen` |
| `#a28896`, `#8797c2`, `#86b88b` | `index.tsx` (calendar dot colors) | Buat array token baru di theme |

---

## 🚀 PROMPT SIAP PAKAI UNTUK CLAUDE OPUS

Salin **seluruh blok** di bawah ini. Paste ke Claude Opus, lalu lampirkan file-file yang ingin diubah.

---

```
Kamu adalah seorang UI/UX designer senior yang mengkhususkan diri pada
aesthetic "Japanese Minimalism meets Scandinavian Warmth". Tugasmu adalah
me-refactor tampilan visual file-file React Native (TSX) yang aku lampirkan.

═══════════════════════════════════════════
KONTEKS PROYEK
═══════════════════════════════════════════
- Nama: Jadwalin (Productivity / Planner app)
- Framework: Expo + React Native + TypeScript
- Styling: StyleSheet.create + theme tokens dari @/constants/theme
- Animasi: react-native-reanimated (FadeInDown, FadeIn, Layout, dll.)
- Navigasi: expo-router (file-based routing)

═══════════════════════════════════════════
PRINSIP DESAIN YANG HARUS DIIKUTI
═══════════════════════════════════════════
1. SOFT PASTEL PREMIUM — Semua warna harus muted/desaturated.
   Jangan pernah gunakan warna murni (pure red, green, blue).
   Referensi palet:
   - Background: #FFFDF8 (Cloud Cream)
   - Section bg: #F5EDE3 (Warm Linen)
   - Aksen utama: #6B5D4F (Espresso Muted) — untuk teks penting & tombol
   - Card daily: #C4B8A4 (Warm Stone)
   - Card note/weekly: #E2EDDA (Sage Mist)
   - Danger: #D4816B (Terracotta) bukan #F44336
   - Check/Success: #7FB685 (Soft Fern) bukan #4CAF50
   - Text: #2D2B28 / #7A7570 / #A8A29E

2. TIPOGRAFI — Hierarki yang jelas tapi tidak agresif:
   - Judul: fontWeight '700' (bukan '800')
   - Sub-text: fontWeight '500' dengan warna muted
   - Label kecil: fontWeight '600', textTransform uppercase, letterSpacing 1

3. RADIUS & SHAPE — Organik dan soft:
   - Card utama: borderRadius 20-28
   - Input: borderRadius 12
   - Pill/button: borderRadius 999
   - JANGAN mix radius tajam (4-8) dan bulat (20+) dalam satu card

4. SHADOW — Sangat halus, hampir tidak terlihat:
   - shadowOpacity maksimal 0.08
   - Gunakan shadowColor yang senada dengan background card
   - elevation Android: maksimal 2-3

5. SPACING — Konsisten kelipatan 8:
   - Gunakan token Spacing.sm (8), Spacing.md (16), Spacing.lg (24)
   - Padding card minimal 16, sebaiknya 20-24

6. WARNA HARDCODED — Hapus semua hex langsung di StyleSheet.
   Ganti dengan token Colors.xxx dari theme.
   Jika token belum ada, BUAT token baru di Colors object.

═══════════════════════════════════════════
ATURAN TEKNIS — SANGAT PENTING
═══════════════════════════════════════════
1. ❌ DILARANG mengubah LOGIKA APAPUN:
   - useState, useEffect, useCallback, useMemo
   - onPress handlers, navigation logic
   - Firebase/Firestore calls
   - Zustand store operations
   - Data filtering, sorting, mapping
   - Conditional rendering logic (if/ternary untuk data)

2. ✅ HANYA ubah hal-hal VISUAL:
   - StyleSheet.create — ubah values di properties
   - Inline style props (color, size pada Ionicons)
   - Komponen JSX: boleh ubah style={} prop values
   - Boleh tambah/ubah entering animation parameters

3. ✅ BOLEH menambah token baru di Colors, Spacing, Radius
   di constants/theme.ts jika diperlukan

4. ❌ JANGAN ubah struktur komponen (jangan pindah View, 
   jangan hapus komponen, jangan ubah props non-visual)

5. ❌ JANGAN tambah/hapus import kecuali menambah token theme baru

═══════════════════════════════════════════
FILE YANG HARUS DIUBAH (PRIORITAS)
═══════════════════════════════════════════
1. constants/theme.ts — Ubah palet warna, shadow values
2. app/(tabs)/index.tsx — Home screen (paling banyak hardcoded hex)
3. app/(tabs)/calendar.tsx — Calendar screen
4. app/(tabs)/notes.tsx — Notes screen
5. app/(tabs)/settings.tsx — Profile screen
6. app/(tabs)/_layout.tsx — Tab bar
7. components/TaskCard.tsx — Task card komponen

═══════════════════════════════════════════
OUTPUT YANG DIHARAPKAN
═══════════════════════════════════════════
Untuk setiap file, berikan kode LENGKAP yang sudah direfactor.
Tandai setiap perubahan dengan komentar // ← CHANGED jika memungkinkan.
Pastikan kode TETAP BERJALAN 100% sama secara fungsional.
Hanya tampilannya yang berubah menjadi Premium Pastel.
```

---

## 📝 Cara Pakai

1. **Copy seluruh prompt** di atas (dari `Kamu adalah...` sampai akhir blok kode).
2. **Buka Claude Opus** (atau AI editor lain).
3. **Paste prompt** tersebut.
4. **Lampirkan file-file** yang ingin diubah (mulai dari `constants/theme.ts`).
5. **Tunggu hasilnya**, lalu review dan paste ke proyek.
6. **Ulangi** untuk file berikutnya jika diperlukan.

> **Tips**: Mulai dari `constants/theme.ts` terlebih dahulu.
> Setelah token warna diperbarui, screen-screen lain yang sudah menggunakan
> `Colors.xxx` akan otomatis ikut berubah tanpa perlu diedit manual.
