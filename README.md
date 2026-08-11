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

## Copying, and why verses are plain `Text`

Copying is the per-verse button, deliberately. Rendering verses as read-only
`TextInput`s to get drag-selection was tried and reverted: RN measures an
auto-sizing multiline `TextInput` with Yoga while `UITextView` lays the text
out itself, and the two disagree once a custom `lineHeight` is involved, so the
last line of every verse — the closing words and the sof pasuq — was clipped.
`Text` measures correctly, and it is also the only way a tap on a highlighted
word can open its definition, since press handlers don't fire inside a
`TextInput`.

## Reading position

The app resumes rather than resetting. Scroll offset is remembered per calendar
date, so returning to a day lands where you left it. Switching between the
English and Aramaic tabs anchors on the *verse* instead of the pixel offset,
because the two languages set to different heights — including a re-anchor once
Onkelos arrives over the network and pushes the verses down.

## Tech Stack

- Expo ~54
- React Native
- TypeScript
- Sefaria API
