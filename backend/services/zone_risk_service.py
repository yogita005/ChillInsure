from dotenv import load_dotenv

load_dotenv()

# TODO for teammates: Add all pincodes relevant to your target cities here
# Format: "pincode": risk_multiplier (0.8 = low risk, 1.4 = high risk)
ZONE_RISK_INDEX = {
    # Bengaluru
    "560034": 1.3,   # Koramangala
    "560001": 1.2,   # MG Road
    "560095": 1.0,   # Whitefield
    "560068": 1.1,   # JP Nagar

    # Chennai
    "600001": 1.1,   # Chennai Central
    "600096": 1.4,   # Velachery (flood-prone)
    "600042": 1.2,   # Adyar
    "600020": 1.0,   # Nungambakkam

    # Mumbai
    "400001": 1.2,   # South Mumbai
    "400069": 1.0,   # Andheri
    "400051": 1.3,   # Bandra
    "400078": 1.4,   # Kurla (flood-prone)

    # Delhi
    "110001": 1.1,   # Connaught Place
    "110045": 1.3,   # Dwarka
    "110092": 1.2,   # Shahdara
    "110020": 1.0,   # Saket

    # Hyderabad
    "500001": 1.0,   # Old City
    "500081": 1.1,   # Gachibowli
    "500034": 1.2,   # Secunderabad

    # Kolkata
    "700001": 1.2,   # Central Kolkata
    "700064": 1.3,   # Salt Lake
    "700041": 1.1,   # Park Street
}

# Fallback risk multipliers by pincode prefix (city-level)
PINCODE_PREFIX_RISK = {
    "560": 1.2,  # Bengaluru
    "561": 1.2,  # Bengaluru
    "600": 1.3,  # Chennai (flood-prone)
    "601": 1.3,  # Chennai
    "602": 1.3,  # Chennai
    "603": 1.3,  # Chennai
    "400": 1.3,  # Mumbai (flood-prone)
    "401": 1.3,  # Mumbai
    "110": 1.2,  # Delhi (pollution)
    "500": 1.1,  # Hyderabad
    "501": 1.1,  # Hyderabad
    "700": 1.2,  # Kolkata
}

# Broadest fallback: 2-digit prefix
PINCODE_2DIGIT_RISK = {
    "56": 1.2,
    "60": 1.3,
    "40": 1.3,
    "11": 1.2,
    "50": 1.1,
    "70": 1.2,
}

def get_zone_risk(pincode: str) -> float:
    # Try exact pincode first
    risk = ZONE_RISK_INDEX.get(pincode)
    if risk is not None:
        return risk
    # Try 3-digit prefix match
    prefix3 = pincode[:3] if len(pincode) >= 3 else ""
    risk = PINCODE_PREFIX_RISK.get(prefix3)
    if risk is not None:
        return risk
    # Try 2-digit prefix match
    prefix2 = pincode[:2] if len(pincode) >= 2 else ""
    return PINCODE_2DIGIT_RISK.get(prefix2, 1.0)

def get_risk_label(pincode: str) -> str:
    risk = get_zone_risk(pincode)
    if risk >= 1.3:
        return "high"
    elif risk >= 1.1:
        return "medium"
    else:
        return "low"
