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

def get_city_from_pincode(pincode: str) -> str:
    """Get city name from pincode, default to 'Your Zone' if not found"""
    return PINCODE_TO_CITY.get(pincode, "Your Zone")
