// English = master dictionary. Other languages fall back to these keys.
// {vars} are replaced by t(); <em> marks the accent word in headlines.
export default {
  'tab.today': 'Today', 'tab.pantry': 'Pantry', 'tab.order': 'Order', 'tab.house': 'House',
  'meal.breakfast': 'Breakfast', 'meal.lunch': 'Lunch', 'meal.dinner': 'Dinner',
  'meal.breakfast.s': 'morning', 'meal.lunch.s': 'midday', 'meal.dinner.s': 'night',
  'unit.min': '{n} min', 'unit.hour': '1 hour',
  'back': 'Back', 'continue': 'Continue', 'they': 'they',

  'lang.t': 'Choose your <em>language</em>', 'lang.s': 'You can change it any time in the House tab.',

  'welcome.tag': "what's cooking?",
  'welcome.body': "Tell us how your flat eats. We'll work out what your cook should make, what you can cook right now, and what to order. About 3 minutes.",
  'welcome.cta': "Let's start →",
  'q.name.warn': 'Add a name to continue 🙂', 'name.ph': 'e.g. Rohan',

  'diet.veg': 'Vegetarian', 'diet.veg.d': 'No meat, fish or eggs',
  'diet.egg': 'Eggetarian', 'diet.egg.d': 'Veg, plus eggs',
  'diet.nonveg': 'Non-veg', 'diet.nonveg.d': 'Anything goes',
  'diet.jain': 'Jain', 'diet.jain.d': 'No onion, garlic or root veg',
  'q.diet.t': 'What does {n} eat?', 'q.diet.s': 'This sets what is safe to cook for the whole flat.',

  'q.spice.t': 'How spicy does {n} like it?', 'q.spice.s': 'Be honest. Nobody is impressed by a fake tolerance.',
  'spice.1': 'Almost none', 'spice.1.d': 'Haldi and namak, basically',
  'spice.2': 'Mild', 'spice.2.d': 'Flavour, not fire',
  'spice.3': 'Medium', 'spice.3.d': 'Normal home-style food',
  'spice.4': 'Spicy', 'spice.4.d': 'Keep water nearby',
  'spice.5': 'Bring the fire', 'spice.5.d': 'Extra green chillies, always',

  'q.allergies.t': "Anything {n} can't eat?", 'q.allergies.s': 'Allergies and strict no-gos. We will never plan these.', 'q.allergies.skip': 'No allergies',

  'goal.none': 'Just eating well', 'goal.none.d': 'No special goal',
  'goal.lose': 'Losing weight', 'goal.lose.d': 'Lighter, low oil',
  'goal.muscle': 'Building muscle', 'goal.muscle.d': 'High protein',
  'goal.sugar': 'Watching sugar', 'goal.sugar.d': 'Low sugar, low refined carbs',
  'goal.gentle': 'Gentle on the stomach', 'goal.gentle.d': 'Simple and easy to digest',
  'q.goal.t': 'Is {n} eating for a goal?', 'q.goal.s': 'We will tilt the menu that way.',

  'q.loves.t': 'What does {n} love?', 'q.loves.s': 'Tap a few comfort foods, or type your own.', 'q.loves.skip': 'Skip for now',
  'q.hates.t': 'And what does {n} hate?', 'q.hates.s': 'These will never show up.', 'q.hates.skip': 'Eats everything',
  'q.regions.t': 'What food did {n} grow up on?', 'q.regions.s': 'Pick as many as you like. It shapes the flavours we suggest.', 'q.regions.skip': 'No preference',

  'brk.light': 'Light and quick', 'brk.light.d': 'Chai, toast, poha',
  'brk.full': 'Proper breakfast', 'brk.full.d': 'Parathas, dosa, the works',
  'brk.skip': 'Usually skips it', 'brk.skip.d': 'Brunch is a lifestyle',
  'q.brk.t': 'How does {n} do mornings?', 'q.brk.s': 'Last question about {n}.',

  'skill.beginner': 'Basic', 'skill.beginner.d': 'Dal, rice, simple sabzi',
  'skill.average': 'Solid', 'skill.average.d': 'Handles most home-style dishes',
  'skill.pro': 'Chef-level', 'skill.pro.d': 'Anything, any cuisine',
  'q.skill.t': 'How good is <em>your cook</em>?', 'q.skill.s': "So we don't plan a 3-hour biryani for a beginner.",
  'q.meals.t': "Which <em>meals</em> does the cook make?", 'q.meals.s': 'We will only plan the ones you pick.', 'q.meals.warn': 'Pick at least one meal',
  'q.time.t': "How much <em>time</em> can a meal take?", 'q.time.s': 'Per meal, start to finish.',
  'time.20.d': 'Quick fixes only', 'time.30.d': 'Weekday friendly', 'time.45.d': 'Room for a proper curry', 'time.60.d': 'Dum and slow-cooked things', 'time.90.d': 'Weekend-project energy',

  'budget.low': 'Tight', 'budget.low.d': 'Pantry staples, minimal ordering',
  'budget.normal': 'Normal', 'budget.normal.d': 'Some paneer is fine',
  'budget.high': 'Treat us', 'budget.high.d': 'Go for the good stuff',
  'q.budget.t': "What's the <em>budget</em> mood?", 'q.budget.s': 'Affects how fancy the shopping list gets.',

  'q.nv.t': 'Any <em>veg-only</em> days?', 'q.nv.s': 'Tap the days the kitchen stays vegetarian.', 'q.nv.skip': 'Non-veg is fine any day',

  'repeat.3': 'Every 2-3 days', 'repeat.3.d': 'We like our favourites',
  'repeat.7': 'Once a week', 'repeat.7.d': 'Some variety please',
  'repeat.14': 'Rarely', 'repeat.14.d': 'Keep it fresh',
  'q.repeat.t': 'How often can a dish <em>repeat</em>?', 'q.repeat.s': 'Dal-chawal every other day is a valid answer.',
  'q.notes.t': "Any other <em>notes</em> for us?", 'q.notes.s': 'Rules, moods, house traditions. Completely optional.', 'q.notes.skip': 'Nothing else',
  'q.notes.ph': 'e.g. no deep fry, Sunday is special, keep dinners light',

  'q.pantry.t': "What's in your <em>kitchen</em> right now?", 'q.pantry.s': 'Tap what is in stock. It takes a minute and makes every suggestion smarter.',
  'q.key.t': "Last step: your <em>AI key</em>", 'q.key.s': "Pick an AI provider and paste its key. The key stays on this device and goes only to that provider. Gemini and Groq are free.", 'q.key.skip': "I'll add it later",

  'q.done.t': "You're <em>all set.</em>", 'done.p1': '{n} flatmate', 'done.pn': '{n} flatmates',
  'done.cook': '{skill}, up to {m} min', 'done.meals': '{n} meals a day', 'done.pantry': '{n} items in the pantry',
  'done.keyok': "AI key saved ✓", 'done.keyno': 'No key yet. Add it in the House tab', 'done.cta': "Plan today's menu ✨",

  'greet.late': 'Up late?', 'greet.morning': 'Good morning', 'greet.afternoon': 'Good afternoon', 'greet.evening': 'Good evening', 'greet.night': 'Good night',
  'today.hungry': 'hungry? 🍛', 'today.plan': '✨ Plan my day', 'today.again': '🔄 Plan again',
  'nudge.t': 'Almost there', 'nudge.s': "Add your AI key and we can start planning meals.", 'nudge.btn': 'Add key',
  'prog.n': '{a} of {b} meals locked', 'prog.all': 'All meals locked 🔒',
  'pill.locked': 'Locked ✓', 'btn.reroll': '🔄 Different ideas', 'btn.cook': '📲 Send menu to the cook',
  'tag.ready': '✅ Ready to cook', 'tag.need': '🛒 Need: {items}',
  'rate.q': 'How was it?', 'rate.good': 'Loved it', 'rate.bad': 'Not great',
  'toast.locked': 'Menu locked 🔒 Send it to the cook!', 'theme.flip': 'Toggle dark mode',

  'cart.t': 'To order 🛒', 'cart.s': 'Everything your locked meals still need. Tap an item once it arrives and it moves to your pantry.',
  'cart.share': '📤 Share list', 'cart.none.t': 'Nothing to order', 'cart.none.s': 'Your pantry already covers every locked meal.',
  'cart.empty.t': 'Nothing to order yet', 'cart.empty.s': 'Lock a meal on Today and anything missing lands here.',
  'toast.bought': '{item} added to pantry ✅', 'share.head': '🛒 To order:',
  'toast.copied': 'Copied. Paste it into WhatsApp 📋', 'toast.sharefail': 'Sharing did not open. Try again.',

  // message for the cook: the cook speaks Hindi, so English users get Hinglish
  'cook.head': 'Namaste bhaiya 🙏 aaj ka menu:', 'cook.miss': 'Kuch saaman mangwa rahe hain: {items}. Aane ke baad bana dena 🙂', 'cook.thanks': 'Shukriya! 🙌',

  'people.t': 'Flatmates 🧑‍🤝‍🧑', 'people.s': "Everyone who eats the cook's food. Every plan balances all of their tastes.",
  'people.add': '➕ Add a flatmate', 'people.edit': 'Edit {name}',
  'house.t': 'Kitchen rules 🍳', 'house.s': 'Keeps the plan realistic for your cook.',
  'h.skill': "Cook's skill", 'h.meals': 'Meals cooked', 'h.time': 'Max cooking time', 'h.budget': 'Budget mood', 'h.repeat': 'Repeats allowed', 'h.veg': 'Veg-only days', 'h.notes': 'Other notes',
  'h.notes.ph': 'e.g. no deep fry, keep dinners light, Sunday = special',
  'key.t': "AI key 🔑", 'key.s': "Stored only on this device and sent only to the provider you picked.",
  'theme.t': 'Appearance 🎨', 'theme.dark': '🌙 Dark', 'theme.light': '☀️ Light', 'theme.auto': '🌓 Auto',
  'lang.sec': 'Language 🌐',
  'reset.btn': '🗑 Reset everything', 'reset.confirm': 'Delete all flatmates, pantry, history and your key from this device? This cannot be undone.',

  'dlg.new': 'New flatmate', 'dlg.edit': 'Edit flatmate', 'dlg.name': 'Name', 'dlg.avatar': 'Avatar', 'dlg.diet': 'Diet', 'dlg.spice': 'Spice level', 'dlg.goal': 'Goal', 'dlg.brk': 'Mornings',
  'dlg.allergy': "Allergies / can't eat", 'dlg.loves': 'Loves 😍', 'dlg.hates': 'Hates 🤢', 'dlg.grew': 'Grew up on',
  'dlg.cancel': 'Cancel', 'dlg.save': 'Save ✓', 'dlg.remove': 'Remove flatmate', 'chips.add': '➕ Add your own + Enter',

  'pantry.t': 'Pantry 🧺', 'pantry.s': "Highlighted means it's in the kitchen. Keep it honest and the plans stay realistic.",
  'pantry.all': '✅ Select all', 'pantry.none': 'Clear all', 'pantry.add': '➕ Something missing? Type it + Enter', 'pantry.extras': 'Your extras',
  'cat.grains': 'Grains & flours', 'cat.dals': 'Dals & beans', 'cat.sabzi': 'Sabzi', 'cat.dairy': 'Dairy', 'cat.protein': 'Protein', 'cat.masala': 'Masala & basics', 'cat.misc': 'Misc',

  'err.nokey': "Add your AI key in the House tab first 🔑", 'err.net': "Could not reach the AI. Check your internet and try again 📡",
  'err.key': "The AI did not accept that key. Check it in the House tab 🔑", 'err.http': "The AI had a problem (error {s}). Try again in a moment.",
  'err.stuck': "The AI could not finish that plan. Tap Plan again 🔄", 'err.parse': "The AI sent back something unreadable. Tap Plan again 🔄",
  'err.storage': 'Could not save on this device. Your browser may be blocking storage.',

  'load.1': 'Checking what is in your pantry… 🧺', 'load.2': 'Asking every aunty for her recipe… 👵', 'load.3': "Matching dishes to everyone's taste… 🍽️",
  'load.4': 'Tempering the tadka… 🔥', 'load.5': 'Counting how much paneer is left… 🧀', 'load.6': 'Keeping your cook happy… 👨‍🍳',

  // one-pass onboarding: group titles + section labels
  'q.names.t': "First up, <em>who's eating?</em>",
  'q.names.s': "Add everyone who eats the cook's food. You can add more any time in the House tab.",
  'q.names.add': "➕ Add another flatmate",
  'g.diet.t': "What does <em>everyone</em> eat?",
  'g.spice.t': "How spicy does <em>everyone</em> like it?",
  'g.allergies.t': "Any allergies in <em>the flat</em>?",
  'g.goal.t': "Any food goals in <em>the flat</em>?",
  'g.loves.t': "What does <em>everyone</em> love?",
  'g.hates.t': "And what does <em>everyone</em> hate?",
  'g.regions.t': "What food did <em>everyone</em> grow up on?",
  'g.brk.t': "How does <em>everyone</em> do mornings?",
  'g.brk.s': "Last question about the flat.",
  'g.who': "Picking for",
  'sec.flat': "Flatmates",
  'sec.kitchen': "Your kitchen",
  'sec.setup': "Setup",
  'chips.more': "+{n} more", 'chips.less': "Show less",

  // AI providers
  'prov.t': "AI provider 🤖",
  'prov.s': "Which AI makes the suggestions. Gemini and Groq offer free keys.",
  'prov.free': "Free",
  'prov.get': "Get a free key →",
  'prov.getpaid': "Get a key →",
  'prov.model': "Model",
  'err.rate': "Free limit reached for now. Wait a minute and try again, or switch provider in the House tab ⏳",
  'tok.note': "A full-day plan ({n} meals) uses about {tot} tokens (roughly {inn} sent, {out} received). \"Different ideas\" for one meal uses about {one}. It grows a little with a bigger pantry or more flatmates.",
};
