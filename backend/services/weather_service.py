import httpx
import os
from dotenv import load_dotenv

load_dotenv()

OPENWEATHER_KEY = os.getenv("OPENWEATHER_API_KEY") or os.getenv("WEATHER_API_KEY")
WAQI_TOKEN = os.getenv("WAQI_TOKEN")

#TODO: Add all zone names here that match exactly what is stored in Firestore users/{uid}/zone field. Format: "zone_name": "City Name for API"

ZONE_TO_CITY = {
    "koramangala_bengaluru": "Bengaluru",
    "andheri_mumbai": "Mumbai",
    "velachery_chennai": "Chennai",
    "dwarka_delhi": "Delhi",
    "salt_lake_kolkata": "Kolkata",
    "gachibowli_hyderabad": "Hyderabad",
}

async def get_weather_disruption(city: str) -> dict:
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_KEY}&units=metric"
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url)
            res.raise_for_status()
            data = res.json()

        temp = data["main"]["temp"]
        rain_1h = data.get("rain", {}).get("1h", 0)

        disruption = None
        if rain_1h > 15:
            disruption = "heavy_rain"
        elif temp > 42:
            disruption = "extreme_heat"

        return {
            "city": city,
            "temp_c": temp,
            "rain_mm": rain_1h,
            "disruption_detected": disruption,
            "api_verified": disruption is not None
        }
    except Exception as e:
        print(f"[WARN] Weather API failed for {city}: {e}. Using fallback.")
        return {
            "city": city,
            "temp_c": 33.43,
            "rain_mm": 0,
            "disruption_detected": None,
            "api_verified": False
        }

async def get_aqi_disruption(city: str) -> dict:
    url = f"https://api.waqi.info/feed/{city}/?token={WAQI_TOKEN}"
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url)
            res.raise_for_status()
            data = res.json()

        if data.get("status") != "ok":
            raise ValueError(f"AQI API error: {data.get('data')}")

        aqi = data["data"]["aqi"]
        disruption = "severe_pollution" if aqi > 200 else None

        return {
            "city": city,
            "aqi": aqi,
            "disruption_detected": disruption,
            "api_verified": disruption is not None
        }
    except Exception as e:
        print(f"[WARN] AQI API failed for {city}: {e}. Using fallback.")
        return {
            "city": city,
            "aqi": 30,
            "disruption_detected": None,
            "api_verified": False
        }

async def check_disruption(city: str) -> dict:
    weather = await get_weather_disruption(city)
    aqi = await get_aqi_disruption(city)

    detected = weather["disruption_detected"] or aqi["disruption_detected"]

    return {
        "city": city,
        "disruption_type": detected,
        "api_verified": detected is not None,
        "weather_data": weather,
        "aqi_data": aqi
    }
