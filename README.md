# iSpy World — React Native Migration

A complete React Native (Expo) port of the iSpy World Flutter educational app.

## Stack
| Tool | Version | Purpose |
|------|---------|---------|
| Expo | ~54 | Build toolchain |
| React Native | 0.81 | UI framework |
| React Navigation v7 | Stack + Bottom Tabs | Navigation |
| Zustand | ^5 | State management (replaces Flutter Provider) |
| AsyncStorage | ~2.1 | Local persistence (replaces SharedPreferences) |
| expo-speech | ~13 | Text-to-Speech (English + Filipino) |
| expo-linear-gradient | ~14 | Gradient backgrounds |

## Project Structure
```
src/
├── components/
│   ├── LensFrame.js       ← Magnifying glass shape widget
│   ├── HudBracket.js      ← AR corner bracket widget
│   └── DiscoveryCard.js   ← Pokédex-style word card
├── data/
│   ├── constants.js       ← App-wide constants
│   └── vocabularyData.js  ← 15 vocabulary words DB
├── screens/
│   ├── SplashScreen.js
│   ├── RoleSelectScreen.js
│   ├── ProfileSelectScreen.js
│   ├── TeacherPinScreen.js
│   ├── DashboardScreen.js
│   ├── ScanScreen.js
│   ├── IdentificationScreen.js
│   ├── SpellingScreen.js
│   └── GalleryScreen.js
├── store/
│   └── store.js           ← Zustand stores (Profile, Progress, AppLock)
├── theme/
│   └── colors.js          ← Color palette (mirrors Flutter AppColors)
└── utils/
    └── ttsHelper.js       ← TTS wrapper (expo-speech)
```

## How to Run

```bash
# 1. Install dependencies (if not already done)
npm install --legacy-peer-deps

# 2. Start the Expo dev server
npm start

# 3. Press 'a' to open in Android emulator
#    or scan QR code with Expo Go app on your phone
```

## Flutter → React Native Key Mappings
| Flutter | React Native |
|---------|-------------|
| `Provider` | `Zustand store` |
| `SharedPreferences` | `AsyncStorage` |
| `flutter_tts` | `expo-speech` |
| `LinearGradient` | `expo-linear-gradient` |
| `flutter_animate` | `Animated` API |
| `Column` / `Row` | `View` with flexbox |
| `GridView.builder` | `FlatList numColumns={2}` |
| `Navigator.pushNamed` | `navigation.navigate()` |
| `BottomNavigationBar` | `@react-navigation/bottom-tabs` |

## Navigation Flow
```
Splash → RoleSelect → ProfileSelect ─── StudentArea (Tabs)
                    ↘ TeacherPin             ├─ Dashboard
                                             ├─ Scan
                                             └─ Gallery
                                        ↓ (pushed on top)
                                      Identification / Spelling
```

## Notes
- Camera scanning is **mock** (random word after 3s) — same as Flutter version
- TTS works on device; may be limited in Expo Go simulator
- Move this folder out of the Flutter project before building
