# Aliyah Yomi

A React Native (Expo) app for daily Torah aliyah reading. Shows today's parasha portion in Hebrew, English, or Aramaic, fetched from [Sefaria](https://www.sefaria.org/).

## Features

- Daily aliyah based on the current day of the week
- Hebrew, English (JPS) and Targum Onkelos text from Sefaria
- Friday haftarah with an Ashkenazi / Sephardi toggle
- Tap a highlighted word for a plain-English definition
- Long-press any passage to select and copy it; a per-verse button copies the whole verse
- Resumes each day where you left off
- Mark the reading as complete; weekly streak and notification reminders

## Getting Started

```bash
npm install
npm start
```

Press `i` to open in the iOS simulator, or scan the QR code with Expo Go.

## Hebrew type

The Hebrew text is set in **Keter YG** (Culmus project), not a general-purpose
Hebrew face. It carries the Tiro Typeworks Biblical Hebrew OpenType layout
logic, so cantillation marks stack clear of the vowel points. Measured across
all five books, Keter YG collides on 0.0% of multi-mark clusters versus 12.9%
for Noto Serif Hebrew. Licence: `assets/fonts/LICENSE-KeterYG.txt`.

## Tech Stack

- Expo ~54
- React Native
- TypeScript
- Sefaria API
