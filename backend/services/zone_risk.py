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

def get_zone_risk(pincode: str) -> float:
    # Returns 1.0 (neutral) if pincode not found
    return ZONE_RISK_INDEX.get(pincode, 1.0)

def get_risk_label(pincode: str) -> str:
    risk = get_zone_risk(pincode)
    if risk >= 1.3:
        return "high"
    elif risk >= 1.1:
        return "medium"
    else:
        return "low"
