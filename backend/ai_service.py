import os
import google.generativeai as genai
from typing import List, Dict, Any
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Configure Gemini API
GENAI_API_KEY = os.getenv("GEMINI_API_KEY")

def configure_genai():
    if not GENAI_API_KEY:
        print("Warning: GEMINI_API_KEY not found in environment variables.")
        return False
    genai.configure(api_key=GENAI_API_KEY)
    return True

async def get_ai_prediction(historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generates carbon emission forecasts and recommendations using Gemini AI.
    """
    if not configure_genai():
        return {
            "error": "AI service not configured. Please set GEMINI_API_KEY.",
            "forecast": [],
            "recommendations": []
        }

    # Prepare data for prompt
    data_summary = json.dumps(historical_data, default=str)
    
    prompt = f"""
    You are an environmental data analyst. Analyze the following carbon emission data for a Gram Panchayat (local government unit).
    The data includes monthly resource usage (electricity, fuel, etc.) and the CALCULATED TOTAL EMISSION (in kg CO2e) based on standard factors.

    Historical Data:
    {data_summary}

    Task:
    1. Analyze the trend of 'calculated_total_emission_kg' over time, handling any gaps in dates intelligently.
    2. Provide a 6-month forecast of 'calculated_net_footprint_kg'.
    3. IMPORTANT: The forecast MUST NOT be a flat line. If historical data is sparse or flat, simulate realistic seasonal variations (e.g. higher in summer/winter) or growth trends based on the data context.
    4. Provide 3 specific, actionable recommendations.

    Return the response in the following STRICT JSON format (do not include markdown formatting or explanations outside the JSON):
    {{
      "forecast": [
        {{ "month": "MonthName", "year": 2024, "predicted_emission": 123.45 }},
        ... (6 months)
      ],
      "recommendations": [
        "Recommendation 1...",
        "Recommendation 2...",
        "Recommendation 3..."
      ]
    }}
    """

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        
        # Clean response text (remove markdown if present)
        text = response.text.replace('```json', '').replace('```', '').strip()
        
        result = json.loads(text)
        return result
    except Exception as e:
        print(f"AI Prediction Error: {e}")
        return {
            "error": f"Failed to generate prediction: {str(e)}",
            "forecast": [],
            "recommendations": []
        }
