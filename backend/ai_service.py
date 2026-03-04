import os
import google.generativeai as genai
from typing import List, Dict, Any
from dotenv import load_dotenv
import json
from datetime import datetime

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
    
    # Determine forecast start: the month AFTER the last data entry (not today)
    MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']
    MONTH_ABBR  = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    # Sort chronologically so the last element is always the most recent month
    def _sort_key(entry):
        try:
            y = int(entry.get('year', 0))
            m = MONTH_ABBR.index(entry.get('month', 'Jan'))
        except (ValueError, IndexError):
            y, m = 0, 0
        return (y, m)

    sorted_data = sorted(historical_data, key=_sort_key)

    try:
        last_entry    = sorted_data[-1]
        last_month_str = last_entry.get('month', '')          # e.g. "Mar"
        last_year      = int(last_entry.get('year', datetime.now().year))
        last_month_idx = MONTH_ABBR.index(last_month_str)     # 0-based index
    except (ValueError, IndexError):
        # Fallback to current date if we can't parse
        now = datetime.now()
        last_month_idx = now.month - 1           # 0-based
        last_year      = now.year

    # Next month after last entry
    next_month_idx = (last_month_idx + 1) % 12
    next_year      = last_year + 1 if next_month_idx == 0 else last_year
    forecast_start_month = MONTH_NAMES[next_month_idx]
    forecast_start_year  = next_year

    prompt = f"""
    You are an environmental data analyst. Analyze the following carbon emission data for a Gram Panchayat (local government unit).
    The data includes monthly resource usage (electricity, fuel, etc.) and the CALCULATED TOTAL EMISSION (in kg CO2e) based on standard factors.

    Historical Data:
    {data_summary}

    Task:
    1. Analyze the trend of 'calculated_total_emission_kg' over time, handling any gaps in dates intelligently.
    2. Provide a 6-month forecast STARTING from {forecast_start_month} {forecast_start_year} (the month immediately following the last data entry).
    3. IMPORTANT: The forecast MUST NOT be a flat line. If historical data is sparse or flat, simulate realistic seasonal variations (e.g. higher in summer/winter) or growth trends based on the data context.
    4. Provide 3 specific, actionable recommendations.

    Return the response in the following STRICT JSON format (do not include markdown formatting or explanations outside the JSON):
    {{
      "forecast": [
        {{ "month": "MonthName", "year": {forecast_start_year}, "predicted_emission": 123.45 }},
        ... (6 consecutive months starting from {forecast_start_month} {forecast_start_year})
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
