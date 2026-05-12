// iSpy World Vocabulary Database — ported from Flutter VocabularyData
export const allWords = [
  // Animals
  { id: 'cat',   englishName: 'Cat',   filipinoName: 'Pusa',     category: 'Animals',   difficulty: 'CVC',   emoji: '🐱' },
  { id: 'dog',   englishName: 'Dog',   filipinoName: 'Aso',      category: 'Animals',   difficulty: 'CVC',   emoji: '🐶' },
  { id: 'fish',  englishName: 'Fish',  filipinoName: 'Isda',     category: 'Animals',   difficulty: 'CVC',   emoji: '🐟' },
  { id: 'bird',  englishName: 'Bird',  filipinoName: 'Ibon',     category: 'Animals',   difficulty: 'CVC',   emoji: '🐦' },
  // Furniture
  { id: 'chair', englishName: 'Chair', filipinoName: 'Upuan',    category: 'Furniture', difficulty: 'Multi', emoji: '🪑' },
  { id: 'table', englishName: 'Table', filipinoName: 'Mesa',     category: 'Furniture', difficulty: 'CVC',   emoji: '🪵' },
  { id: 'door',  englishName: 'Door',  filipinoName: 'Pinto',    category: 'Furniture', difficulty: 'CVC',   emoji: '🚪' },
  // School
  { id: 'book',  englishName: 'Book',  filipinoName: 'Libro',    category: 'School',    difficulty: 'CVC',   emoji: '📚' },
  { id: 'pen',   englishName: 'Pen',   filipinoName: 'Bolpen',   category: 'School',    difficulty: 'CVC',   emoji: '🖊️' },
  { id: 'bag',   englishName: 'Bag',   filipinoName: 'Bag',      category: 'School',    difficulty: 'CVC',   emoji: '🎒' },
  // Food
  { id: 'apple', englishName: 'Apple', filipinoName: 'Mansanas', category: 'Food',      difficulty: 'Multi', emoji: '🍎' },
  { id: 'rice',  englishName: 'Rice',  filipinoName: 'Kanin',    category: 'Food',      difficulty: 'CVC',   emoji: '🍚' },
  // Kitchen
  { id: 'cup',   englishName: 'Cup',   filipinoName: 'Tasa',     category: 'Kitchen',   difficulty: 'CVC',   emoji: '☕' },
  { id: 'spoon', englishName: 'Spoon', filipinoName: 'Kutsara',  category: 'Kitchen',   difficulty: 'Multi', emoji: '🥄' },
  // Toys
  { id: 'ball',  englishName: 'Ball',  filipinoName: 'Bola',     category: 'Toys',      difficulty: 'CVC',   emoji: '⚽' },
];

export const byCategory = (category) => allWords.filter((w) => w.category === category);
export const byDifficulty = (diff) => allWords.filter((w) => w.difficulty === diff);
export const byId = (id) => allWords.find((w) => w.id === id) || null;
export const categories = [...new Set(allWords.map((w) => w.category))];

export const getWrongOptions = (correctWord, count = 3) => {
  const others = allWords.filter((w) => w.id !== correctWord.id);
  const shuffled = [...others].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
