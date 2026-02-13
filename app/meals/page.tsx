'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateId } from '@/lib/storage';
import { getApiUrl } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MealSuggestion {
  id: string;
  name: string;
  description: string;
  purineLevel: 'low' | 'moderate';
  prepTime: string;
  ingredients: string[];
  instructions: string[];
  goutNotes: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  dietaryTags: string[];
}

interface FavoriteMeal {
  id: string;
  meal: MealSuggestion;
  savedAt: string;
}

// ---------------------------------------------------------------------------
// Hardcoded low-purine meal database (fallback / default)
// ---------------------------------------------------------------------------

const HARDCODED_MEALS: MealSuggestion[] = [
  // Breakfast
  {
    id: 'hc_b1',
    name: 'Oatmeal with Cherries',
    description: 'Warm steel-cut oats topped with tart cherries, which are known to help lower uric acid levels naturally.',
    purineLevel: 'low',
    prepTime: '10 min',
    ingredients: ['1 cup steel-cut oats', '2 cups water or milk', '1/2 cup tart cherries (fresh or frozen)', '1 tbsp honey', 'Pinch of cinnamon'],
    instructions: ['Bring water or milk to a boil.', 'Add oats and reduce heat to medium-low.', 'Cook for 5-7 minutes, stirring occasionally.', 'Top with cherries, honey, and cinnamon.'],
    goutNotes: 'Tart cherries contain anthocyanins that may help reduce uric acid levels and gout flare frequency.',
    category: 'breakfast',
    dietaryTags: ['vegetarian', 'dairy-free'],
  },
  {
    id: 'hc_b2',
    name: 'Greek Yogurt Parfait',
    description: 'Layered low-fat Greek yogurt with granola and mixed berries for a protein-rich, gout-friendly breakfast.',
    purineLevel: 'low',
    prepTime: '5 min',
    ingredients: ['1 cup low-fat Greek yogurt', '1/4 cup granola', '1/2 cup mixed berries', '1 tbsp honey', '1 tbsp chia seeds'],
    instructions: ['Layer yogurt in a glass or bowl.', 'Add a layer of granola.', 'Top with mixed berries.', 'Drizzle with honey and sprinkle chia seeds.'],
    goutNotes: 'Low-fat dairy products may help lower uric acid levels. Berries provide anti-inflammatory benefits.',
    category: 'breakfast',
    dietaryTags: ['vegetarian', 'gluten-free'],
  },
  {
    id: 'hc_b3',
    name: 'Egg White Omelet with Veggies',
    description: 'Light and fluffy egg white omelet loaded with bell peppers, spinach, and tomatoes.',
    purineLevel: 'low',
    prepTime: '12 min',
    ingredients: ['4 egg whites', '1/4 cup diced bell peppers', '1/4 cup fresh spinach', '1/4 cup diced tomatoes', '2 tbsp low-fat cheese', 'Salt and pepper to taste', 'Cooking spray'],
    instructions: ['Whisk egg whites with salt and pepper.', 'Heat a non-stick pan with cooking spray over medium heat.', 'Pour in egg whites and cook until edges set.', 'Add vegetables and cheese to one half.', 'Fold omelet and cook another 1-2 minutes until set.'],
    goutNotes: 'Egg whites are very low in purines and high in protein. A great protein source for gout management.',
    category: 'breakfast',
    dietaryTags: ['vegetarian', 'gluten-free', 'low-sodium'],
  },
  {
    id: 'hc_b4',
    name: 'Whole Grain Toast with Avocado',
    description: 'Crunchy whole grain toast topped with creamy avocado, a sprinkle of salt, and red pepper flakes.',
    purineLevel: 'low',
    prepTime: '5 min',
    ingredients: ['2 slices whole grain bread', '1 ripe avocado', 'Squeeze of lemon juice', 'Salt and pepper', 'Red pepper flakes (optional)', 'Cherry tomatoes for garnish'],
    instructions: ['Toast the bread slices to desired crispness.', 'Mash avocado with lemon juice, salt, and pepper.', 'Spread avocado mixture on toast.', 'Top with red pepper flakes and sliced cherry tomatoes.'],
    goutNotes: 'Avocados are low in purines and rich in healthy fats. Whole grains are a gout-friendly carbohydrate source.',
    category: 'breakfast',
    dietaryTags: ['vegetarian', 'dairy-free'],
  },
  {
    id: 'hc_b5',
    name: 'Banana Smoothie with Almond Milk',
    description: 'Creamy, naturally sweet smoothie blended with banana, almond milk, and a touch of peanut butter.',
    purineLevel: 'low',
    prepTime: '5 min',
    ingredients: ['1 large banana (frozen)', '1 cup unsweetened almond milk', '1 tbsp peanut butter', '1/2 cup ice', '1 tsp honey (optional)', '1 tbsp flaxseed (optional)'],
    instructions: ['Add all ingredients to a blender.', 'Blend on high until smooth and creamy.', 'Pour into a glass and serve immediately.'],
    goutNotes: 'Bananas are low in purines and high in potassium. Almond milk is a great dairy alternative that is gout-safe.',
    category: 'breakfast',
    dietaryTags: ['vegetarian', 'dairy-free', 'gluten-free'],
  },

  // Lunch
  {
    id: 'hc_l1',
    name: 'Grilled Chicken Salad',
    description: 'Fresh mixed greens with grilled chicken breast, cherry tomatoes, cucumbers, and a light vinaigrette.',
    purineLevel: 'low',
    prepTime: '20 min',
    ingredients: ['4 oz grilled chicken breast', '3 cups mixed greens', '1/2 cup cherry tomatoes', '1/4 cup sliced cucumbers', '2 tbsp olive oil vinaigrette', '1/4 cup croutons'],
    instructions: ['Grill or pan-sear chicken breast until cooked through.', 'Slice chicken and let rest.', 'Toss greens with tomatoes and cucumbers.', 'Top with sliced chicken and croutons.', 'Drizzle with vinaigrette.'],
    goutNotes: 'Chicken breast in moderate portions (4 oz) is acceptable for gout. Avoid organ meats entirely. The vegetables add anti-inflammatory benefits.',
    category: 'lunch',
    dietaryTags: ['gluten-free'],
  },
  {
    id: 'hc_l2',
    name: 'Vegetable Soup',
    description: 'Hearty homemade vegetable soup with carrots, celery, potatoes, and herbs in a savory broth.',
    purineLevel: 'low',
    prepTime: '30 min',
    ingredients: ['2 carrots, diced', '2 celery stalks, diced', '2 potatoes, cubed', '1 can diced tomatoes', '4 cups low-sodium vegetable broth', '1 cup green beans', '1 tsp dried thyme', 'Salt and pepper to taste'],
    instructions: ['Heat a large pot with a drizzle of olive oil.', 'Saute carrots and celery for 3-4 minutes.', 'Add potatoes, tomatoes, broth, and green beans.', 'Season with thyme, salt, and pepper.', 'Bring to a boil, then simmer for 20 minutes until vegetables are tender.'],
    goutNotes: 'Vegetables are among the safest foods for gout. This soup is very low in purines and helps with hydration.',
    category: 'lunch',
    dietaryTags: ['vegetarian', 'dairy-free', 'gluten-free', 'low-sodium'],
  },
  {
    id: 'hc_l3',
    name: 'Turkey and Cheese Sandwich',
    description: 'Lean turkey breast with Swiss cheese, lettuce, and tomato on whole wheat bread.',
    purineLevel: 'low',
    prepTime: '5 min',
    ingredients: ['3 oz sliced turkey breast', '2 slices whole wheat bread', '1 slice Swiss cheese', 'Lettuce leaves', 'Tomato slices', '1 tbsp mustard or mayo'],
    instructions: ['Layer turkey, cheese, lettuce, and tomato on bread.', 'Add mustard or mayo as desired.', 'Slice in half and serve.'],
    goutNotes: 'Turkey breast in moderate amounts is a reasonable protein choice. Pair with hydrating vegetables and choose whole grain bread.',
    category: 'lunch',
    dietaryTags: [],
  },
  {
    id: 'hc_l4',
    name: 'Quinoa Bowl with Roasted Vegetables',
    description: 'Protein-packed quinoa topped with colorful roasted vegetables and a lemon-tahini dressing.',
    purineLevel: 'low',
    prepTime: '25 min',
    ingredients: ['1 cup cooked quinoa', '1 cup mixed roasted vegetables (bell peppers, zucchini, onion)', '1/4 cup chickpeas', '2 tbsp tahini', '1 tbsp lemon juice', 'Salt and pepper', 'Fresh parsley'],
    instructions: ['Cook quinoa according to package directions.', 'Roast vegetables at 400F for 15-20 minutes.', 'Whisk tahini with lemon juice, salt, and a splash of water.', 'Assemble bowl with quinoa, roasted vegetables, and chickpeas.', 'Drizzle with tahini dressing and garnish with parsley.'],
    goutNotes: 'Quinoa is a complete protein that is low in purines. Roasted vegetables add fiber and anti-inflammatory compounds.',
    category: 'lunch',
    dietaryTags: ['vegetarian', 'dairy-free', 'gluten-free'],
  },
  {
    id: 'hc_l5',
    name: 'Pasta Primavera',
    description: 'Colorful pasta dish loaded with fresh seasonal vegetables in a light garlic and olive oil sauce.',
    purineLevel: 'low',
    prepTime: '20 min',
    ingredients: ['8 oz penne pasta', '1 cup broccoli florets', '1/2 cup sliced bell peppers', '1/2 cup sliced zucchini', '1/4 cup sliced mushrooms', '2 tbsp olive oil', '2 cloves garlic, minced', 'Parmesan cheese for topping'],
    instructions: ['Cook pasta according to package directions, drain.', 'Heat olive oil in a large skillet over medium heat.', 'Add garlic and cook for 30 seconds.', 'Add all vegetables and saute for 5-7 minutes.', 'Toss with cooked pasta and top with Parmesan.'],
    goutNotes: 'Pasta is low in purines and provides good energy. Vegetables are gout-safe. Use mushrooms in moderation as they have slightly more purines than other vegetables.',
    category: 'lunch',
    dietaryTags: ['vegetarian'],
  },

  // Dinner
  {
    id: 'hc_d1',
    name: 'Baked Salmon with Rice',
    description: 'Oven-baked salmon fillet served over fluffy white rice with steamed asparagus.',
    purineLevel: 'moderate',
    prepTime: '25 min',
    ingredients: ['6 oz salmon fillet', '1 cup cooked white rice', '1 tbsp olive oil', '1 lemon, sliced', 'Asparagus spears', 'Salt, pepper, and dill'],
    instructions: ['Preheat oven to 400F.', 'Place salmon on a baking sheet, drizzle with olive oil.', 'Season with salt, pepper, dill, and top with lemon slices.', 'Bake for 12-15 minutes until salmon flakes easily.', 'Serve over rice with steamed asparagus.'],
    goutNotes: 'MODERATE PURINE: Salmon has moderate purine content. Limit to 4-6 oz portions and avoid during active flares. The omega-3 fatty acids may have anti-inflammatory benefits.',
    category: 'dinner',
    dietaryTags: ['gluten-free', 'dairy-free'],
  },
  {
    id: 'hc_d2',
    name: 'Grilled Chicken with Steamed Vegetables',
    description: 'Seasoned grilled chicken breast served alongside a medley of steamed broccoli, carrots, and green beans.',
    purineLevel: 'low',
    prepTime: '20 min',
    ingredients: ['5 oz chicken breast', '1 cup broccoli florets', '1/2 cup sliced carrots', '1/2 cup green beans', '1 tbsp olive oil', 'Garlic powder, paprika, salt, pepper'],
    instructions: ['Season chicken with garlic powder, paprika, salt, and pepper.', 'Grill or pan-sear for 6-7 minutes per side until cooked through.', 'Steam vegetables for 5-7 minutes until tender-crisp.', 'Drizzle vegetables with olive oil and serve with chicken.'],
    goutNotes: 'Chicken breast in moderate portions is a gout-friendly protein. Steaming preserves nutrients in vegetables without adding purines.',
    category: 'dinner',
    dietaryTags: ['gluten-free', 'dairy-free'],
  },
  {
    id: 'hc_d3',
    name: 'Vegetable Stir-Fry with Tofu',
    description: 'Crispy tofu and mixed vegetables stir-fried in a savory ginger-soy sauce served over steamed rice.',
    purineLevel: 'low',
    prepTime: '20 min',
    ingredients: ['8 oz firm tofu, cubed', '1 cup mixed bell peppers', '1/2 cup snap peas', '1/2 cup broccoli florets', '2 tbsp low-sodium soy sauce', '1 tbsp sesame oil', '1 tsp grated ginger', '1 cup steamed rice'],
    instructions: ['Press tofu and cut into cubes.', 'Heat sesame oil in a wok or large skillet over high heat.', 'Cook tofu until golden on all sides, about 5 minutes.', 'Add vegetables and stir-fry for 3-4 minutes.', 'Add soy sauce and ginger, toss to combine.', 'Serve over steamed rice.'],
    goutNotes: 'Tofu is a low-purine plant protein, making it an excellent choice for gout sufferers. Ginger has anti-inflammatory properties.',
    category: 'dinner',
    dietaryTags: ['vegetarian', 'dairy-free'],
  },
  {
    id: 'hc_d4',
    name: 'Pasta with Marinara and Vegetables',
    description: 'Al dente spaghetti tossed in a chunky marinara sauce with zucchini, bell peppers, and fresh basil.',
    purineLevel: 'low',
    prepTime: '20 min',
    ingredients: ['8 oz spaghetti', '1 cup marinara sauce', '1/2 cup diced zucchini', '1/2 cup diced bell peppers', 'Fresh basil leaves', 'Parmesan cheese', '1 tbsp olive oil'],
    instructions: ['Cook spaghetti according to package directions.', 'Heat olive oil in a saucepan over medium heat.', 'Add zucchini and bell peppers, cook 3-4 minutes.', 'Add marinara sauce and simmer 5 minutes.', 'Toss with drained pasta and top with basil and Parmesan.'],
    goutNotes: 'Pasta and tomato sauce are both very low in purines. This is one of the safest dinner options for gout management.',
    category: 'dinner',
    dietaryTags: ['vegetarian'],
  },
  {
    id: 'hc_d5',
    name: 'Bean and Cheese Quesadilla',
    description: 'Crispy tortilla filled with seasoned black beans, melted cheese, and fresh salsa.',
    purineLevel: 'low',
    prepTime: '15 min',
    ingredients: ['2 flour tortillas', '1/2 cup black beans, drained', '1/2 cup shredded cheddar cheese', '1/4 cup salsa', '1/4 avocado, sliced', 'Sour cream for serving', 'Cooking spray'],
    instructions: ['Mash half the beans slightly for texture.', 'Layer beans and cheese on one tortilla, top with second tortilla.', 'Heat in a skillet with cooking spray over medium heat.', 'Cook 2-3 minutes per side until golden and cheese melts.', 'Cut into wedges and serve with salsa, avocado, and sour cream.'],
    goutNotes: 'Beans have moderate purine content but studies suggest plant-based purines do not increase gout risk as much as animal purines. Cheese is low in purines.',
    category: 'dinner',
    dietaryTags: ['vegetarian'],
  },

  // Snacks
  {
    id: 'hc_s1',
    name: 'Cherry Yogurt',
    description: 'Creamy low-fat yogurt mixed with fresh or frozen tart cherries for a gout-fighting snack.',
    purineLevel: 'low',
    prepTime: '3 min',
    ingredients: ['1 cup low-fat yogurt', '1/4 cup tart cherries', '1 tsp honey'],
    instructions: ['Spoon yogurt into a bowl.', 'Top with cherries and drizzle with honey.'],
    goutNotes: 'Both low-fat dairy and tart cherries have been shown to help reduce uric acid levels and gout flare risk.',
    category: 'snacks',
    dietaryTags: ['vegetarian', 'gluten-free'],
  },
  {
    id: 'hc_s2',
    name: 'Mixed Nuts',
    description: 'A handful of heart-healthy mixed nuts including almonds, walnuts, and cashews.',
    purineLevel: 'low',
    prepTime: '1 min',
    ingredients: ['1/4 cup almonds', '1/4 cup walnuts', '2 tbsp cashews', 'Pinch of sea salt (optional)'],
    instructions: ['Combine nuts in a small bowl or container.', 'Enjoy as a quick snack.'],
    goutNotes: 'Nuts are low in purines and high in healthy fats. Walnuts contain omega-3s which may help with inflammation.',
    category: 'snacks',
    dietaryTags: ['vegetarian', 'dairy-free', 'gluten-free'],
  },
  {
    id: 'hc_s3',
    name: 'Apple with Peanut Butter',
    description: 'Crisp apple slices served with creamy peanut butter for a satisfying, gout-friendly snack.',
    purineLevel: 'low',
    prepTime: '3 min',
    ingredients: ['1 medium apple', '2 tbsp natural peanut butter'],
    instructions: ['Wash and slice the apple.', 'Serve with peanut butter for dipping.'],
    goutNotes: 'Apples are very low in purines and high in fiber. Peanut butter provides protein without significant purine content.',
    category: 'snacks',
    dietaryTags: ['vegetarian', 'dairy-free', 'gluten-free'],
  },
  {
    id: 'hc_s4',
    name: 'Cheese and Crackers',
    description: 'Assorted cheese slices with whole grain crackers for a simple and satisfying snack.',
    purineLevel: 'low',
    prepTime: '3 min',
    ingredients: ['2 oz cheese (cheddar, Swiss, or mozzarella)', '8-10 whole grain crackers', 'Grapes or apple slices for pairing'],
    instructions: ['Arrange cheese and crackers on a plate.', 'Add grapes or apple slices on the side.', 'Enjoy as an afternoon snack.'],
    goutNotes: 'Cheese and dairy products are low in purines and may actually help lower uric acid levels.',
    category: 'snacks',
    dietaryTags: ['vegetarian'],
  },
  {
    id: 'hc_s5',
    name: 'Fruit Smoothie',
    description: 'Refreshing blended smoothie with mixed berries, banana, and a splash of orange juice.',
    purineLevel: 'low',
    prepTime: '5 min',
    ingredients: ['1/2 cup mixed berries', '1/2 banana', '1/2 cup orange juice', '1/2 cup ice', '1 tbsp honey (optional)'],
    instructions: ['Add all ingredients to a blender.', 'Blend until smooth.', 'Pour into a glass and serve immediately.'],
    goutNotes: 'Berries are rich in antioxidants and vitamin C, which may help reduce uric acid. Avoid smoothies with high-fructose sweeteners.',
    category: 'snacks',
    dietaryTags: ['vegetarian', 'dairy-free', 'gluten-free'],
  },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MEAL_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snacks'] as const;
const DIETARY_FILTERS = ['all', 'vegetarian', 'dairy-free', 'gluten-free', 'low-sodium'] as const;

const FAVORITES_KEY = 'goutguard_meal_favorites';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadFavorites(): FavoriteMeal[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FavoriteMeal[];
  } catch {
    return [];
  }
}

function saveFavorites(favorites: FavoriteMeal[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {
    // Storage full or unavailable
  }
}

function filterMeals(
  meals: MealSuggestion[],
  category: string,
  filters: string[],
): MealSuggestion[] {
  let filtered = meals.filter((m) => m.category === category);
  if (filters.length > 0 && !filters.includes('all')) {
    filtered = filtered.filter((m) =>
      filters.every((f) => m.dietaryTags.includes(f)),
    );
  }
  return filtered;
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function LockIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? '#ef4444' : 'none'}
      stroke={filled ? '#ef4444' : 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Meal Card Component
// ---------------------------------------------------------------------------

function MealCard({
  meal,
  isFavorite,
  onToggleFavorite,
}: {
  meal: MealSuggestion;
  isFavorite: boolean;
  onToggleFavorite: (meal: MealSuggestion) => void;
}) {
  const [showIngredients, setShowIngredients] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const purineColor = meal.purineLevel === 'low' ? '#22c55e' : '#eab308';
  const purineBg = meal.purineLevel === 'low' ? '#f0fdf4' : '#fefce8';
  const purineText = meal.purineLevel === 'low' ? '#15803d' : '#a16207';

  return (
    <div
      style={{
        background: 'var(--color-gray-50)',
        border: '1px solid var(--color-gray-200)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: 'var(--foreground)' }}>
            {meal.name}
          </h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-block',
                background: purineBg,
                color: purineText,
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {meal.purineLevel} purine
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-gray-500)' }}>
              <ClockIcon /> {meal.prepTime}
            </span>
          </div>
        </div>
        <button
          onClick={() => onToggleFavorite(meal)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-gray-400)',
          }}
          aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
        >
          <HeartIcon filled={isFavorite} />
        </button>
      </div>

      {/* Description */}
      <p style={{ fontSize: 13, color: 'var(--color-gray-500)', lineHeight: 1.5, marginBottom: 10 }}>
        {meal.description}
      </p>

      {/* Gout Notes */}
      {meal.goutNotes && (
        <div
          style={{
            background: meal.purineLevel === 'moderate' ? '#fefce8' : '#eff6ff',
            border: `1px solid ${meal.purineLevel === 'moderate' ? '#fde68a' : '#bfdbfe'}`,
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 10,
            fontSize: 12,
            color: meal.purineLevel === 'moderate' ? '#92400e' : '#1e40af',
            lineHeight: 1.5,
          }}
        >
          {meal.goutNotes}
        </div>
      )}

      {/* Expandable Ingredients */}
      <button
        onClick={() => setShowIngredients(!showIngredients)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '8px 0',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--color-primary)',
          fontFamily: 'inherit',
          borderTop: '1px solid var(--color-gray-200)',
        }}
      >
        <span>Ingredients ({meal.ingredients.length})</span>
        {showIngredients ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </button>
      {showIngredients && (
        <ul style={{ paddingLeft: 20, marginBottom: 8 }}>
          {meal.ingredients.map((ing, i) => (
            <li key={i} style={{ fontSize: 13, color: 'var(--color-gray-600)', lineHeight: 1.8 }}>
              {ing}
            </li>
          ))}
        </ul>
      )}

      {/* Expandable Instructions */}
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '8px 0',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--color-primary)',
          fontFamily: 'inherit',
          borderTop: '1px solid var(--color-gray-200)',
        }}
      >
        <span>Instructions ({meal.instructions.length} steps)</span>
        {showInstructions ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </button>
      {showInstructions && (
        <ol style={{ paddingLeft: 20, marginBottom: 8 }}>
          {meal.instructions.map((step, i) => (
            <li key={i} style={{ fontSize: 13, color: 'var(--color-gray-600)', lineHeight: 1.8 }}>
              {step}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Meals Page Component
// ---------------------------------------------------------------------------

export default function MealsPage() {
  const router = useRouter();

  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('breakfast');
  const [activeFilters, setActiveFilters] = useState<string[]>(['all']);
  const [meals, setMeals] = useState<MealSuggestion[]>(HARDCODED_MEALS);
  const [aiMeals, setAiMeals] = useState<MealSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    const premiumStatus = localStorage.getItem('goutguard_premium');
    setIsPremium(premiumStatus === 'true');
    setFavorites(loadFavorites());
  }, []);

  // Combine hardcoded + AI meals
  const allMeals = [...aiMeals, ...meals];
  const displayMeals = filterMeals(allMeals, activeCategory, activeFilters);
  const favoriteIds = new Set(favorites.map((f) => f.meal.id));

  // Toggle dietary filter
  function toggleFilter(filter: string) {
    if (filter === 'all') {
      setActiveFilters(['all']);
      return;
    }
    let next = activeFilters.filter((f) => f !== 'all');
    if (next.includes(filter)) {
      next = next.filter((f) => f !== filter);
    } else {
      next.push(filter);
    }
    if (next.length === 0) next = ['all'];
    setActiveFilters(next);
  }

  // Toggle favorite
  function toggleFavorite(meal: MealSuggestion) {
    let updated: FavoriteMeal[];
    if (favoriteIds.has(meal.id)) {
      updated = favorites.filter((f) => f.meal.id !== meal.id);
    } else {
      updated = [
        ...favorites,
        { id: generateId(), meal, savedAt: new Date().toISOString() },
      ];
    }
    setFavorites(updated);
    saveFavorites(updated);
  }

  // Remove favorite
  function removeFavorite(favoriteId: string) {
    const updated = favorites.filter((f) => f.id !== favoriteId);
    setFavorites(updated);
    saveFavorites(updated);
  }

  // Generate AI meals
  async function handleGenerateMeals() {
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const profile = localStorage.getItem('goutguard_profile');
      let goutStage = '';
      if (profile) {
        try {
          goutStage = JSON.parse(profile).goutStage || '';
        } catch {
          // ignore parse errors
        }
      }

      const response = await fetch(getApiUrl('/api/meals'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType: activeCategory,
          dietaryFilters: activeFilters.filter((f) => f !== 'all'),
          goutStage,
        }),
      });

      const data = await response.json();

      if (data.success && data.meals) {
        const generated: MealSuggestion[] = data.meals.map(
          (m: any, idx: number) => ({
            id: `ai_${Date.now()}_${idx}`,
            name: m.name || 'AI Suggested Meal',
            description: m.description || '',
            purineLevel: m.purineLevel === 'moderate' ? 'moderate' : 'low',
            prepTime: m.prepTime || '15 min',
            ingredients: m.ingredients || [],
            instructions: m.instructions || [],
            goutNotes: m.goutNotes || '',
            category: activeCategory,
            dietaryTags: m.dietaryTags || [],
          }),
        );
        setAiMeals((prev) => [...generated, ...prev]);
      } else {
        setGenerateError(data.error || 'Failed to generate meals. Showing pre-built suggestions.');
      }
    } catch {
      setGenerateError('Network error. Showing pre-built meal suggestions instead.');
    } finally {
      setIsGenerating(false);
    }
  }

  // Loading state
  if (isPremium === null) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-gray-400)', fontSize: 14 }}>Loading...</p>
      </div>
    );
  }

  // =========================================================================
  // Premium Gate
  // =========================================================================
  if (!isPremium) {
    return (
      <div className="page">
        {/* Blurred preview meals */}
        <div style={{ position: 'relative', marginBottom: 0 }}>
          <div style={{ filter: 'blur(6px)', opacity: 0.5, pointerEvents: 'none' }}>
            <h2 className="section-title" style={{ marginBottom: 12 }}>AI Meal Suggestions</h2>
            {HARDCODED_MEALS.slice(0, 2).map((meal) => (
              <div
                key={meal.id}
                style={{
                  background: 'var(--color-gray-50)',
                  border: '1px solid var(--color-gray-200)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{meal.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--color-gray-500)' }}>{meal.description}</p>
              </div>
            ))}
          </div>

          {/* Gate overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                background: 'var(--color-gray-50)',
                border: '1px solid var(--color-gray-200)',
                borderRadius: 16,
                padding: '32px 24px',
                textAlign: 'center',
                maxWidth: 340,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div style={{ color: 'var(--color-primary)', marginBottom: 12 }}>
                <LockIcon />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>
                Premium Feature
              </h2>
              <p style={{ fontSize: 14, color: 'var(--color-gray-500)', lineHeight: 1.6, marginBottom: 20 }}>
                Get personalized low-purine meal suggestions with GoutCare Premium
              </p>
              <button
                onClick={() => router.push('/settings')}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Start 7-day free trial
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // Premium User: Full Meal Recommendations Page
  // =========================================================================
  return (
    <div className="page">
      <section style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: 'var(--foreground)' }}>
          Meal Suggestions
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-gray-500)' }}>
          AI-powered low-purine meal ideas tailored for gout management
        </p>
      </section>

      {/* ── Meal Category Tabs ──────────────────────────────── */}
      <section style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            background: 'var(--color-gray-100)',
            borderRadius: 10,
            padding: 3,
            gap: 2,
          }}
        >
          {MEAL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                flex: 1,
                padding: '10px 4px',
                background: activeCategory === cat ? 'var(--color-primary)' : 'transparent',
                color: activeCategory === cat ? '#fff' : 'var(--color-gray-500)',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'background 0.15s, color 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── Dietary Filters ─────────────────────────────────── */}
      <section style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {DIETARY_FILTERS.map((filter) => {
            const isActive = activeFilters.includes(filter);
            return (
              <button
                key={filter}
                onClick={() => toggleFilter(filter)}
                style={{
                  padding: '6px 14px',
                  background: isActive ? 'var(--color-primary-light)' : 'var(--color-gray-50)',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-gray-500)',
                  border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-gray-200)'}`,
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  textTransform: 'capitalize',
                  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Generate AI Meals Button ────────────────────────── */}
      <section style={{ marginBottom: 20 }}>
        <button
          onClick={handleGenerateMeals}
          disabled={isGenerating}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: isGenerating
              ? 'var(--color-gray-300)'
              : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: 'inherit',
            transition: 'opacity 0.15s',
          }}
        >
          {isGenerating ? (
            <>
              <span
                style={{
                  display: 'inline-block',
                  width: 18,
                  height: 18,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Generating Meals...
            </>
          ) : (
            <>
              <SparklesIcon />
              Get AI Meal Suggestions
            </>
          )}
        </button>
        {generateError && (
          <p style={{ fontSize: 12, color: 'var(--color-orange)', marginTop: 8, textAlign: 'center' }}>
            {generateError}
          </p>
        )}
      </section>

      {/* ── Meal Cards ──────────────────────────────────────── */}
      <section style={{ marginBottom: 24 }}>
        <h2 className="section-title">
          {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Ideas
        </h2>
        {displayMeals.length > 0 ? (
          displayMeals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              isFavorite={favoriteIds.has(meal.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))
        ) : (
          <div className="empty-state">
            <p>No meals match the selected filters.</p>
            <p style={{ marginTop: 4 }}>Try adjusting your dietary filters or generate AI suggestions.</p>
          </div>
        )}
      </section>

      {/* ── Saved Favorites ─────────────────────────────────── */}
      <section style={{ marginBottom: 24 }}>
        <button
          onClick={() => setShowFavorites(!showFavorites)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            background: 'none',
            border: 'none',
            padding: '0 0 10px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <h2 className="section-title" style={{ margin: 0 }}>
            Saved Favorites ({favorites.length})
          </h2>
          {showFavorites ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>

        {showFavorites && (
          <>
            {favorites.length > 0 ? (
              favorites.map((fav) => (
                <div
                  key={fav.id}
                  style={{
                    background: 'var(--color-gray-50)',
                    border: '1px solid var(--color-gray-200)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', marginBottom: 2 }}>
                      {fav.meal.name}
                    </h4>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          background: fav.meal.purineLevel === 'low' ? '#f0fdf4' : '#fefce8',
                          color: fav.meal.purineLevel === 'low' ? '#15803d' : '#a16207',
                          padding: '1px 6px',
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {fav.meal.purineLevel}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-gray-400)', textTransform: 'capitalize' }}>
                        {fav.meal.category}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFavorite(fav.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 6,
                      color: 'var(--color-gray-400)',
                      borderRadius: 6,
                    }}
                    aria-label="Remove from favorites"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No favorites saved yet.</p>
                <p style={{ marginTop: 4 }}>Tap the heart icon on any meal to save it here.</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Disclaimer */}
      <footer className="disclaimer">
        Meal suggestions are for informational purposes only and are not a substitute for professional dietary advice.
        Always consult your doctor or dietitian regarding your gout management diet plan.
      </footer>
    </div>
  );
}
