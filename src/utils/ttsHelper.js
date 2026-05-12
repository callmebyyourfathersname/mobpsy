import * as Speech from 'expo-speech';

export const TtsHelper = {
  speakEnglish: (text) => {
    Speech.speak(text, { language: 'en-US', rate: 0.8, pitch: 1.1 });
  },

  speakFilipino: (text) => {
    Speech.speak(text, { language: 'fil-PH', rate: 0.8, pitch: 1.1 });
  },

  speakLetter: (letter) => {
    Speech.speak(letter, { language: 'en-US', rate: 0.9 });
  },

  speakCelebration: () => {
    Speech.speak('Great job! Amazing!', { language: 'en-US', rate: 0.85, pitch: 1.3 });
  },

  speakEncouragement: () => {
    Speech.speak('Try again! You can do it!', { language: 'en-US', rate: 0.85, pitch: 1.1 });
  },
};
