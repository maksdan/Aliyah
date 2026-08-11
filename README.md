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

The Hebrew is set in **Taamey Frank CLM** (Culmus project) — Rafael Frank's
Frank-Ruehl of 1908, the classical Hebrew book face, in the Taamey cut that
carries the Tiro Typeworks Biblical Hebrew OpenType layout logic. That layout
logic is the point: cantillation marks stack clear of the vowel points instead
of colliding with them. Measured over all five books, it collides on 0.0% of
multi-mark clusters (21 of 59,368) against 12.9% for Noto Serif Hebrew.
Licence: `assets/fonts/LICENSE-Culmus.txt`.

## Text selection

Passages render as read-only `TextInput`s rather than `Text`, because
`<Text selectable>` on current iOS shows a copy menu without a real selection
(facebook/react-native#54686, #55187). A multiline `TextInput` with
`editable={false}` is a genuine `UITextView`, so press-and-hold, drag handles
and Look Up all behave normally. The cost is that nested press handlers do not
fire inside a `TextInput`, so a definition opens when the selection lands on a
single highlighted word — the same gesture iOS already uses to select a word.

## Tech Stack

- Expo ~54
- React Native
- TypeScript
- Sefaria API
