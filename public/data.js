export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const DIETS = { veg: '🥦 Veg', egg: '🥚 Eggetarian', nonveg: '🍗 Non-veg', jain: '🌿 Jain' };

export const AVATARS = ['😎', '🤓', '🥳', '😴', '🤠', '🧔', '👨‍🎤', '🦁', '🐼', '🦊', '🐸', '🔥'];

export const ALLERGIES = ['Peanuts', 'Dairy', 'Gluten', 'Eggs', 'Seafood', 'Soy', 'Brinjal', 'Mushroom'];

export const REGIONS = ['North Indian', 'South Indian', 'Bengali', 'Gujarati', 'Maharashtrian', 'Punjabi', 'Rajasthani', 'Hyderabadi', 'Street-food vibes'];

export const DISHES = [
  'Poha', 'Upma', 'Aloo paratha', 'Idli-sambar', 'Dosa', 'Masala omelette', 'Bread omelette', 'Egg bhurji',
  'Dal-chawal', 'Dal tadka', 'Rajma-chawal', 'Chole', 'Kadhi-chawal', 'Khichdi', 'Veg pulao', 'Biryani',
  'Paneer butter masala', 'Palak paneer', 'Matar paneer', 'Aloo gobi', 'Bhindi fry', 'Baingan bharta', 'Mix veg',
  'Egg curry', 'Chicken curry', 'Fish curry', 'Curd rice', 'Sambar rice', 'Maggi', 'Sev tamatar',
];

const MEAT = ['Chicken curry', 'Fish curry'];
const EGG = ['Egg curry', 'Masala omelette', 'Bread omelette', 'Egg bhurji'];
// hide dishes a person can't eat from their love/hate pickers
export const dishesFor = diet => DISHES.filter(d => (diet === 'nonveg' || !MEAT.includes(d)) && (diet === 'nonveg' || diet === 'egg' || !EGG.includes(d)));

export const PANTRY = [
  { k: 'grains', emoji: '🌾', items: ['atta', 'rice', 'poha', 'suji', 'besan', 'maida', 'oats', 'bread', 'vermicelli', 'idli batter', 'dosa batter'] },
  { k: 'dals', emoji: '🫘', items: ['toor dal', 'moong dal', 'masoor dal', 'chana dal', 'urad dal', 'rajma', 'chole', 'sabut moong'] },
  { k: 'sabzi', emoji: '🥬', items: ['onion', 'tomato', 'potato', 'ginger', 'garlic', 'green chilli', 'coriander', 'lemon', 'capsicum', 'cauliflower', 'cabbage', 'brinjal', 'bhindi', 'peas', 'carrot', 'spinach', 'lauki', 'beans'] },
  { k: 'dairy', emoji: '🥛', items: ['milk', 'curd', 'paneer', 'butter', 'ghee', 'cheese'] },
  { k: 'protein', emoji: '🍗', items: ['eggs', 'chicken', 'fish', 'mutton', 'soya chunks'] },
  { k: 'masala', emoji: '🧂', items: ['salt', 'oil', 'haldi', 'red chilli powder', 'dhania powder', 'jeera', 'mustard seeds', 'garam masala', 'hing', 'sugar', 'tea', 'coffee'] },
  { k: 'misc', emoji: '🥫', items: ['maggi', 'pickle', 'coconut', 'tamarind', 'peanuts', 'jaggery'] },
];

// ponytail: fixed starter pantry; users tap the rest on/off.
export const STAPLES = ['atta', 'rice', 'poha', 'bread', 'toor dal', 'moong dal', 'onion', 'tomato', 'potato', 'ginger', 'garlic', 'green chilli', 'milk', 'curd', 'eggs', 'salt', 'oil', 'haldi', 'red chilli powder', 'dhania powder', 'jeera', 'mustard seeds', 'garam masala', 'sugar', 'tea'];
