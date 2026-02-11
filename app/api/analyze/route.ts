import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are a gout nutrition expert AI. Analyze the food in this image and provide a detailed purine content analysis for someone managing gout.

Return your analysis as JSON with this exact structure:
{
  "foodIdentified": "Description of what you see",
  "overallRiskLevel": "low" | "moderate" | "high" | "very-high",
  "purineEstimate": number (total mg per serving),
  "items": [
    {
      "name": "Item name",
      "purineLevel": "low" | "moderate" | "high" | "very-high",
      "purineEstimate": number (mg per 100g),
      "notes": "Brief explanation for gout sufferers"
    }
  ],
  "goutImpact": "Detailed explanation of how this food affects gout",
  "saferAlternatives": ["Alternative 1", "Alternative 2"],
  "flareAdvice": "Advice about eating this during vs. between flares",
  "recommendation": "Overall recommendation for gout management"
}

Purine levels reference:
- Low: <100 mg per 100g (safe for gout)
- Moderate: 100-200 mg per 100g (eat in moderation)
- High: 200-300 mg per 100g (limit intake)
- Very High: >300 mg per 100g (avoid)

High-risk foods for gout: organ meats (liver, kidney), shellfish, red meat, beer, anchovies, sardines, herring, yeast extract, high-fructose corn syrup.
Gout-friendly foods: cherries, low-fat dairy, most vegetables, whole grains, coffee, vitamin C rich foods, water.

Be specific with purine estimates based on established nutritional data. Always err on the side of caution for gout sufferers.`;

const MOCK_RESULT = {
  foodIdentified: 'Grilled Chicken Salad with Mixed Greens',
  overallRiskLevel: 'moderate',
  purineEstimate: 145,
  items: [
    {
      name: 'Grilled Chicken Breast',
      purineLevel: 'moderate',
      purineEstimate: 175,
      notes:
        'Chicken has moderate purine content. Grilling is a better preparation method than frying for gout management.',
    },
    {
      name: 'Mixed Salad Greens',
      purineLevel: 'low',
      purineEstimate: 20,
      notes:
        'Leafy greens are very low in purines and high in beneficial nutrients. Excellent choice for gout sufferers.',
    },
    {
      name: 'Cherry Tomatoes',
      purineLevel: 'low',
      purineEstimate: 10,
      notes:
        'Tomatoes are low in purines and contain vitamin C, which may help lower uric acid levels.',
    },
    {
      name: 'Olive Oil Dressing',
      purineLevel: 'low',
      purineEstimate: 0,
      notes:
        'Healthy fats from olive oil do not contribute to purine intake and have anti-inflammatory properties.',
    },
  ],
  goutImpact:
    'This meal has a moderate purine content, primarily from the chicken. The vegetables and olive oil dressing are gout-friendly choices. The overall meal is reasonably balanced for someone managing gout, though portion size of chicken should be monitored.',
  saferAlternatives: [
    'Replace chicken with tofu or tempeh for a lower-purine protein source',
    'Add cherries or strawberries for their anti-inflammatory and uric-acid-lowering properties',
    'Consider low-fat cheese crumbles as a partial protein replacement',
    'Increase the proportion of vegetables relative to chicken',
  ],
  flareAdvice:
    'During an active gout flare, it is best to avoid this meal due to the moderate purine content from chicken. Stick to the salad greens portion only during a flare. Between flares, this meal is acceptable in moderation as part of a balanced diet.',
  recommendation:
    'This meal is acceptable between flares when consumed in moderate portions. Limit chicken to 3-4 oz per serving and load up on the vegetables. Pair with plenty of water to help flush uric acid. For optimal gout management, limit meals with moderate-purine proteins to once daily.',
};

function extractJSON(text: string): string {
  // Try to extract JSON from markdown code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0].trim();
  }

  return text.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, prompt } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image provided.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // If no API key configured, return mock response for testing
    if (!apiKey) {
      console.warn(
        'OPENAI_API_KEY is not set. Returning mock analysis result for testing.'
      );
      return NextResponse.json({ success: true, result: MOCK_RESULT });
    }

    const openai = new OpenAI({ apiKey });

    // Ensure the image is a proper data URL
    let imageUrl = image;
    if (!image.startsWith('data:')) {
      imageUrl = `data:image/jpeg;base64,${image}`;
    }

    const userMessage = prompt
      ? `${prompt}\n\nAnalyze this food image for purine content and gout risk.`
      : 'Analyze this food image for purine content and gout risk. Return the analysis as JSON only, no additional text.';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: userMessage },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const rawContent = response.choices[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json(
        { success: false, error: 'No response from AI model.' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    const jsonString = extractJSON(rawContent);
    let result;
    try {
      result = JSON.parse(jsonString);
    } catch {
      console.error('Failed to parse AI response as JSON:', rawContent);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse AI analysis. Please try again.',
        },
        { status: 500 }
      );
    }

    // Validate required fields exist
    if (!result.foodIdentified || !result.overallRiskLevel) {
      return NextResponse.json(
        {
          success: false,
          error: 'Incomplete analysis result. Please try again.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Analyze API error:', error);

    if (error?.status === 401) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key configuration.' },
        { status: 500 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again in a moment.',
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
