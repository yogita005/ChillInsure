# Pincode to City Mapping
# Used to display which city user's delivery zone is in

PINCODE_TO_CITY = {
    # Bengaluru
    "560034": "Bengaluru",
    "560001": "Bengaluru",
    "560095": "Bengaluru",
    "560068": "Bengaluru",
    
    # Chennai
    "600001": "Chennai",
    "600096": "Chennai",
    "600042": "Chennai",
    "600020": "Chennai",
    
    # Mumbai
    "400001": "Mumbai",
    "400069": "Mumbai",
    "400051": "Mumbai",
    "400078": "Mumbai",
    
    # Delhi
    "110001": "Delhi",
    "110045": "Delhi",
    "110092": "Delhi",
    "110020": "Delhi",
    
    # Hyderabad
    "500001": "Hyderabad",
    "500081": "Hyderabad",
    "500034": "Hyderabad",
    
    # Kolkata
    "700001": "Kolkata",
    "700064": "Kolkata",
    "700041": "Kolkata",
}

# Fallback: resolve city from pincode prefix (first 3 digits)
PINCODE_PREFIX_TO_CITY = {
    "560": "Bengaluru",
    "561": "Bengaluru",
    "600": "Chennai",
    "601": "Chennai",
    "602": "Chennai",
    "603": "Chennai",
    "400": "Mumbai",
    "401": "Mumbai",
    "110": "Delhi",
    "500": "Hyderabad",
    "501": "Hyderabad",
    "700": "Kolkata",
}

# Broadest fallback: 2-digit prefix (state/region level)
PINCODE_2DIGIT_TO_CITY = {
    "56": "Bengaluru",
    "60": "Chennai",
    "40": "Mumbai",
    "11": "Delhi",
    "50": "Hyderabad",
    "70": "Kolkata",
}

def get_city_from_pincode(pincode: str) -> str:
    """Get city name from pincode, with prefix-based fallback"""
    # Try exact match first
    city = PINCODE_TO_CITY.get(pincode)
    if city:
        return city
    # Try 3-digit prefix match
    prefix3 = pincode[:3] if len(pincode) >= 3 else ""
    city = PINCODE_PREFIX_TO_CITY.get(prefix3)
    if city:
        return city
    # Try 2-digit prefix match (state/region level)
    prefix2 = pincode[:2] if len(pincode) >= 2 else ""
    city = PINCODE_2DIGIT_TO_CITY.get(prefix2)
    if city:
        return city
    return "Bengaluru"  # Default to Bengaluru instead of "Your Zone"
