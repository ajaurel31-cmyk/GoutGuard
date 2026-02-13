import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function jsonResponse(body: any, init?: { status?: number }) {
  return NextResponse.json(body, { ...init, headers: CORS_HEADERS });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MealRequestBody {
  mealType: string;
  dietaryFilters: string[];
  goutStage?: string;
}

interface GeneratedMeal {
  name: string;
  description: string;
  purineLevel: string;
  prepTime: string;
  ingredients: string[];
  instructions: string[];
  goutNotes: string;
  dietaryTags?: string[];
}

// ---------------------------------------------------------------------------
// System prompt for Anthropic Claude
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a nutrition expert specializing in gout-friendly, low-purine meal planning. Generate meal suggestions formatted as a JSON array.

Each meal object must have these fields:
- "name": string (the meal name)
- "description": string (1-2 sentence description of the meal)
- "purineLevel": "low" or "moderate" (most meals should be "low")
- "prepTime": string (e.g. "15 min", "30 min")
- "ingredients": string[] (list of ingredients with amounts)
- "instructions": string[] (step-by-step cooking instructions)
- "goutNotes": string (explanation of how this meal relates to gout management)
- "dietaryTags": string[] (e.g. "vegetarian", "dairy-free", "gluten-free", "low-sodium")

Important guidelines:
- Focus on LOW-PURINE foods that are safe for gout sufferers
- Avoid: organ meats, shellfish, anchovies, sardines, herring, beer, yeast extract, high-fructose corn syrup
- Favor: cherries, low-fat dairy, most vegetables, whole grains, tofu, eggs, moderate amounts of chicken/turkey
- If including fish like salmon, mark as "moderate" purine level and note the moderation needed
- Include practical, easy-to-make meals with common ingredients
- Be specific with ingredient amounts
- Always include a gout-specific note about why the meal is beneficial

Return ONLY a JSON array with 4-5 meal objects. No additional text or markdown formatting.`;

// ---------------------------------------------------------------------------
// Hardcoded fallback meals (used when no API key is available)
// ---------------------------------------------------------------------------

const FALLBACK_MEALS: Record<string, GeneratedMeal[]> = {
  breakfast: [
    {
      name: 'Oatmeal with Tart Cherries and Walnuts',
      description: 'Creamy steel-cut oats topped with tart cherries, walnuts, and a drizzle of honey. A gout-friendly powerhouse breakfast.',
      purineLevel: 'low',
      prepTime: '10 min',
      ingredients: ['1 cup steel-cut oats', '2 cups water', '1/2 cup tart cherries', '2 tbsp walnuts', '1 tbsp honey', 'Pinch of cinnamon'],
      instructions: ['Bring water to a boil and add oats.', 'Cook on medium-low for 5-7 minutes, stirring occasionally.', 'Top with cherries, walnuts, honey, and cinnamon.'],
      goutNotes: 'Tart cherries contain anthocyanins shown to reduce uric acid levels and lower gout flare risk by up to 35%.',
      dietaryTags: ['vegetarian', 'dairy-free'],
    },
    {
      name: 'Greek Yogurt Berry Bowl',
      description: 'Thick low-fat Greek yogurt layered with fresh berries, granola, and chia seeds.',
      purineLevel: 'low',
      prepTime: '5 min',
      ingredients: ['1 cup low-fat Greek yogurt', '1/2 cup mixed berries', '1/4 cup granola', '1 tbsp chia seeds', '1 tsp honey'],
      instructions: ['Spoon yogurt into a bowl.', 'Layer berries and granola on top.', 'Sprinkle with chia seeds and drizzle honey.'],
      goutNotes: 'Low-fat dairy products have been shown to help lower uric acid. Berries provide vitamin C and anti-inflammatory compounds.',
      dietaryTags: ['vegetarian', 'gluten-free'],
    },
    {
      name: 'Veggie Egg White Scramble',
      description: 'Fluffy egg whites scrambled with bell peppers, spinach, and tomatoes served with whole grain toast.',
      purineLevel: 'low',
      prepTime: '12 min',
      ingredients: ['4 egg whites', '1/4 cup diced bell peppers', '1/4 cup spinach', '1/4 cup diced tomatoes', '1 slice whole grain toast', 'Salt and pepper'],
      instructions: ['Heat a non-stick pan with cooking spray.', 'Saute vegetables for 2 minutes.', 'Pour in whisked egg whites and scramble until set.', 'Season and serve with toast.'],
      goutNotes: 'Egg whites are virtually purine-free and an excellent protein source for gout management. Vegetables add anti-inflammatory benefits.',
      dietaryTags: ['vegetarian', 'dairy-free'],
    },
    {
      name: 'Banana Almond Smoothie',
      description: 'Creamy banana smoothie with almond milk, peanut butter, and a hint of vanilla.',
      purineLevel: 'low',
      prepTime: '5 min',
      ingredients: ['1 frozen banana', '1 cup almond milk', '1 tbsp peanut butter', '1/2 tsp vanilla extract', '1 tbsp flaxseed', 'Ice cubes'],
      instructions: ['Add all ingredients to a blender.', 'Blend on high until smooth.', 'Pour and serve immediately.'],
      goutNotes: 'Bananas are low in purines and high in potassium, which may help the kidneys excrete uric acid more efficiently.',
      dietaryTags: ['vegetarian', 'dairy-free', 'gluten-free'],
    },
  ],
  lunch: [
    {
      name: 'Mediterranean Quinoa Bowl',
      description: 'Protein-rich quinoa with roasted vegetables, chickpeas, and a lemon-tahini dressing.',
      purineLevel: 'low',
      prepTime: '25 min',
      ingredients: ['1 cup cooked quinoa', '1/2 cup roasted bell peppers', '1/2 cup roasted zucchini', '1/4 cup chickpeas', '2 tbsp tahini', '1 tbsp lemon juice', 'Fresh parsley'],
      instructions: ['Cook quinoa per package directions.', 'Roast vegetables at 400F for 15 minutes.', 'Whisk tahini with lemon juice and water for dressing.', 'Assemble bowl and drizzle with dressing.'],
      goutNotes: 'Plant-based proteins like quinoa and chickpeas have lower gout risk than animal proteins. Mediterranean diet patterns are associated with lower uric acid.',
      dietaryTags: ['vegetarian', 'dairy-free', 'gluten-free'],
    },
    {
      name: 'Grilled Chicken Caesar Wrap',
      description: 'Lean grilled chicken with romaine, parmesan, and light Caesar dressing in a whole wheat wrap.',
      purineLevel: 'low',
      prepTime: '15 min',
      ingredients: ['4 oz grilled chicken breast', '1 whole wheat tortilla', '1 cup romaine lettuce', '2 tbsp light Caesar dressing', '1 tbsp parmesan cheese'],
      instructions: ['Grill chicken breast and slice.', 'Lay tortilla flat and arrange lettuce.', 'Add chicken, dressing, and parmesan.', 'Roll up tightly and slice in half.'],
      goutNotes: 'Chicken breast in moderate portions (4 oz) is acceptable between gout flares. Romaine provides folate which may support uric acid metabolism.',
      dietaryTags: [],
    },
    {
      name: 'Hearty Vegetable Minestrone',
      description: 'Classic Italian vegetable soup with beans, pasta, and fresh herbs in a tomato broth.',
      purineLevel: 'low',
      prepTime: '30 min',
      ingredients: ['2 carrots, diced', '2 celery stalks', '1 can cannellini beans', '1 cup small pasta', '1 can diced tomatoes', '4 cups vegetable broth', 'Italian seasoning'],
      instructions: ['Saute carrots and celery in olive oil.', 'Add broth, tomatoes, and beans.', 'Bring to a boil and add pasta.', 'Simmer until pasta is cooked. Season with Italian herbs.'],
      goutNotes: 'Soups help with hydration which is crucial for uric acid management. Plant-based beans are low risk for gout despite containing some purines.',
      dietaryTags: ['vegetarian', 'dairy-free'],
    },
    {
      name: 'Caprese Pasta Salad',
      description: 'Chilled pasta salad with fresh mozzarella, tomatoes, basil, and balsamic vinaigrette.',
      purineLevel: 'low',
      prepTime: '15 min',
      ingredients: ['2 cups cooked rotini pasta', '1/2 cup fresh mozzarella balls', '1 cup cherry tomatoes, halved', 'Fresh basil leaves', '2 tbsp balsamic vinaigrette', 'Salt and pepper'],
      instructions: ['Cook and cool pasta.', 'Toss with mozzarella, tomatoes, and basil.', 'Dress with balsamic vinaigrette.', 'Season and chill before serving.'],
      goutNotes: 'Pasta is very low in purines. Mozzarella cheese is a low-fat dairy option that may help reduce uric acid levels.',
      dietaryTags: ['vegetarian'],
    },
  ],
  dinner: [
    {
      name: 'Tofu Vegetable Stir-Fry',
      description: 'Crispy pan-fried tofu with colorful vegetables in a savory ginger-garlic sauce over jasmine rice.',
      purineLevel: 'low',
      prepTime: '25 min',
      ingredients: ['8 oz firm tofu', '1 cup mixed bell peppers', '1/2 cup snap peas', '1/2 cup broccoli', '2 tbsp soy sauce', '1 tbsp sesame oil', '1 tsp ginger', '1 cup jasmine rice'],
      instructions: ['Press and cube tofu. Pan-fry until golden.', 'Stir-fry vegetables in sesame oil for 3-4 minutes.', 'Add soy sauce and ginger, toss to coat.', 'Serve over steamed jasmine rice.'],
      goutNotes: 'Tofu is an excellent low-purine protein source. Soy-based proteins have not been linked to increased gout risk in studies.',
      dietaryTags: ['vegetarian', 'dairy-free'],
    },
    {
      name: 'Herb-Baked Chicken with Sweet Potato',
      description: 'Tender herb-seasoned chicken breast with roasted sweet potato and steamed green beans.',
      purineLevel: 'low',
      prepTime: '30 min',
      ingredients: ['5 oz chicken breast', '1 medium sweet potato', '1 cup green beans', '1 tbsp olive oil', 'Rosemary, thyme, garlic powder', 'Salt and pepper'],
      instructions: ['Preheat oven to 400F.', 'Season chicken with herbs and bake for 20-25 minutes.', 'Cube and roast sweet potato alongside chicken.', 'Steam green beans and serve together.'],
      goutNotes: 'Sweet potatoes are rich in vitamin A and low in purines. Keeping chicken portions to 5 oz keeps purine intake manageable.',
      dietaryTags: ['gluten-free', 'dairy-free'],
    },
    {
      name: 'Pasta Marinara with Roasted Vegetables',
      description: 'Al dente spaghetti in a homemade marinara sauce loaded with roasted zucchini and bell peppers.',
      purineLevel: 'low',
      prepTime: '25 min',
      ingredients: ['8 oz spaghetti', '1 cup marinara sauce', '1 zucchini, diced', '1 bell pepper, diced', '2 tbsp olive oil', 'Fresh basil', 'Parmesan cheese'],
      instructions: ['Cook spaghetti al dente.', 'Roast zucchini and bell pepper at 400F for 15 minutes.', 'Heat marinara and add roasted vegetables.', 'Toss with pasta and garnish with basil and parmesan.'],
      goutNotes: 'Pasta with tomato-based sauce is one of the safest dinner options for gout. Tomatoes contain vitamin C which may help lower uric acid.',
      dietaryTags: ['vegetarian'],
    },
    {
      name: 'Black Bean Tacos',
      description: 'Seasoned black beans with fresh pico de gallo, avocado, and lime in soft corn tortillas.',
      purineLevel: 'low',
      prepTime: '15 min',
      ingredients: ['1 can black beans', '4 corn tortillas', '1/2 avocado', '1/4 cup pico de gallo', '2 tbsp sour cream', 'Lime wedges', 'Cumin, chili powder, garlic'],
      instructions: ['Heat and season beans with cumin, chili powder, and garlic.', 'Warm corn tortillas.', 'Fill tortillas with beans, pico, avocado, and sour cream.', 'Squeeze lime juice on top and serve.'],
      goutNotes: 'Plant-based protein from beans carries lower gout risk than animal protein. Avocado provides healthy fats with anti-inflammatory properties.',
      dietaryTags: ['vegetarian', 'gluten-free'],
    },
  ],
  snacks: [
    {
      name: 'Cherry Almond Energy Bites',
      description: 'No-bake energy bites made with oats, dried cherries, almonds, and honey.',
      purineLevel: 'low',
      prepTime: '10 min',
      ingredients: ['1 cup rolled oats', '1/4 cup dried tart cherries', '1/4 cup almond butter', '2 tbsp honey', '2 tbsp mini chocolate chips', '1 tbsp flaxseed'],
      instructions: ['Mix all ingredients in a bowl until combined.', 'Roll into 1-inch balls.', 'Refrigerate for 30 minutes to firm up.', 'Store in the fridge for up to a week.'],
      goutNotes: 'Tart cherries are one of the most studied foods for gout relief. Regular cherry consumption may reduce flare risk significantly.',
      dietaryTags: ['vegetarian', 'dairy-free'],
    },
    {
      name: 'Apple Slices with Peanut Butter',
      description: 'Crisp apple slices paired with creamy natural peanut butter for a satisfying snack.',
      purineLevel: 'low',
      prepTime: '3 min',
      ingredients: ['1 medium apple', '2 tbsp natural peanut butter', 'Cinnamon (optional)'],
      instructions: ['Slice apple into wedges.', 'Serve with peanut butter for dipping.', 'Sprinkle with cinnamon if desired.'],
      goutNotes: 'Apples are very low in purines and contain quercetin, a flavonoid that may help inhibit uric acid production.',
      dietaryTags: ['vegetarian', 'dairy-free', 'gluten-free'],
    },
    {
      name: 'Greek Yogurt with Honey and Walnuts',
      description: 'Thick low-fat Greek yogurt drizzled with honey and topped with crunchy walnuts.',
      purineLevel: 'low',
      prepTime: '2 min',
      ingredients: ['1 cup low-fat Greek yogurt', '1 tbsp honey', '2 tbsp walnuts'],
      instructions: ['Spoon yogurt into a bowl.', 'Top with walnuts and drizzle with honey.'],
      goutNotes: 'Low-fat dairy consumption is associated with lower uric acid levels. Walnuts provide omega-3 fatty acids with anti-inflammatory benefits.',
      dietaryTags: ['vegetarian', 'gluten-free'],
    },
    {
      name: 'Trail Mix with Dark Chocolate',
      description: 'Custom trail mix with almonds, cashews, dried cranberries, and dark chocolate chips.',
      purineLevel: 'low',
      prepTime: '2 min',
      ingredients: ['1/4 cup almonds', '1/4 cup cashews', '2 tbsp dried cranberries', '2 tbsp dark chocolate chips', 'Pinch of sea salt'],
      instructions: ['Combine all ingredients in a container.', 'Mix well and portion into servings.', 'Store in an airtight container.'],
      goutNotes: 'Nuts are low in purines and dark chocolate contains flavonoids that may help with inflammation. Portion control is key for calorie management.',
      dietaryTags: ['vegetarian', 'dairy-free', 'gluten-free'],
    },
  ],
};

// ---------------------------------------------------------------------------
// Helper: extract JSON from potential markdown/text wrapper
// ---------------------------------------------------------------------------

function extractJSON(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0].trim();
  }

  return text.trim();
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body: MealRequestBody = await request.json();
    const { mealType = 'breakfast', dietaryFilters = [], goutStage = '' } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // If no API key, return the hardcoded fallback meals
    if (!apiKey) {
      console.warn('ANTHROPIC_API_KEY is not set. Returning fallback meal suggestions.');

      const category = mealType.toLowerCase();
      let fallback = FALLBACK_MEALS[category] || FALLBACK_MEALS['breakfast'];

      // Apply dietary filters if any
      if (dietaryFilters.length > 0) {
        fallback = fallback.filter((meal) =>
          dietaryFilters.every((f) => meal.dietaryTags?.includes(f)),
        );
      }

      // If all meals were filtered out, return unfiltered
      if (fallback.length === 0) {
        fallback = FALLBACK_MEALS[category] || FALLBACK_MEALS['breakfast'];
      }

      return jsonResponse({ success: true, meals: fallback });
    }

    // Build user prompt with context
    const filterText = dietaryFilters.length > 0
      ? `Dietary requirements: ${dietaryFilters.join(', ')}.`
      : '';

    const stageText = goutStage
      ? `The user is in the ${goutStage} stage of gout.`
      : '';

    const userPrompt = `Generate 4-5 ${mealType} meal suggestions that are low in purines and safe for someone managing gout.

${filterText}
${stageText}

Return ONLY a JSON array of meal objects. No additional text or explanation.`;

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const rawContent = textBlock && 'text' in textBlock ? textBlock.text : null;

    if (!rawContent) {
      // Fall back to hardcoded meals on empty response
      const category = mealType.toLowerCase();
      const fallback = FALLBACK_MEALS[category] || FALLBACK_MEALS['breakfast'];
      return jsonResponse({ success: true, meals: fallback });
    }

    // Parse the JSON response
    const jsonString = extractJSON(rawContent);
    let meals: GeneratedMeal[];
    try {
      meals = JSON.parse(jsonString);
    } catch {
      console.error('Failed to parse AI meal response as JSON:', rawContent);
      // Fall back to hardcoded meals
      const category = mealType.toLowerCase();
      const fallback = FALLBACK_MEALS[category] || FALLBACK_MEALS['breakfast'];
      return jsonResponse({ success: true, meals: fallback });
    }

    // Validate the response is an array
    if (!Array.isArray(meals)) {
      const category = mealType.toLowerCase();
      const fallback = FALLBACK_MEALS[category] || FALLBACK_MEALS['breakfast'];
      return jsonResponse({ success: true, meals: fallback });
    }

    // Ensure all meals have required fields
    const validatedMeals = meals.map((meal) => ({
      name: meal.name || 'Suggested Meal',
      description: meal.description || '',
      purineLevel: meal.purineLevel || 'low',
      prepTime: meal.prepTime || '15 min',
      ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
      instructions: Array.isArray(meal.instructions) ? meal.instructions : [],
      goutNotes: meal.goutNotes || '',
      dietaryTags: Array.isArray(meal.dietaryTags) ? meal.dietaryTags : [],
    }));

    return jsonResponse({ success: true, meals: validatedMeals });
  } catch (error: any) {
    console.error('Meals API error:', error);

    if (error?.status === 401) {
      return jsonResponse(
        { success: false, error: 'Invalid API key configuration.' },
        { status: 500 },
      );
    }

    if (error?.status === 429) {
      return jsonResponse(
        { success: false, error: 'Rate limit exceeded. Please try again in a moment.' },
        { status: 429 },
      );
    }

    return jsonResponse(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    );
  }
}
