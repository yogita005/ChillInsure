"""
ChillInsure Dark Store Disruption Engine
Detects when a dark store goes offline and suggests optimal alternative stores
Uses A* pathfinding for fastest route calculation
"""

import math
import heapq
from typing import List, Dict, Tuple, Optional
from datetime import datetime
from dataclasses import dataclass

@dataclass
class Store:
    """Represents a dark store location"""
    store_id: str
    name: str
    lat: float
    lng: float
    status: str  # "online" or "offline"
    capacity: int  # orders per hour
    distance_from_partner: float = 0.0
    travel_time_minutes: float = 0.0
    opportunity_loss: float = 0.0  # ₹ potential earnings lost if goes there
    earnings_boost: float = 0.0  # ₹ incentive offered

@dataclass
class RouteNode:
    """Graph node for A* pathfinding"""
    lat: float
    lng: float
    node_id: str
    edge_cost: float = 0.0

# Mock dark store database
DARK_STORES_DB = {
    "HSR_Layout": {
        "store_id": "store_hsr_001",
        "name": "HSR Layout Hub Prime",
        "lat": 13.0827,
        "lng": 77.6055,
        "location": (13.0827, 77.6055),
        "status": "online",
        "capacity": 150,
        "zone": "HSR Layout"
    },
    "Koramangala": {
        "store_id": "store_kor_001",
        "name": "Koramangala Central",
        "lat": 12.9352,
        "lng": 77.6245,
        "location": (12.9352, 77.6245),
        "status": "online",
        "capacity": 120,
        "zone": "Koramangala"
    },
    "Whitefield": {
        "store_id": "store_wf_001",
        "name": "Whitefield Tech Hub",
        "lat": 12.9698,
        "lng": 77.7499,
        "location": (12.9698, 77.7499),
        "status": "online",
        "capacity": 130,
        "zone": "Whitefield"
    },
    "JP_Nagar": {
        "store_id": "store_jp_001",
        "name": "JP Nagar Distribution",
        "lat": 12.9352,
        "lng": 77.5945,
        "location": (12.9352, 77.5945),
        "status": "online",
        "capacity": 110,
        "zone": "JP Nagar"
    },
    "Indiranagar": {
        "store_id": "store_ind_001",
        "name": "Indiranagar Express",
        "lat": 13.0359,
        "lng": 77.6245,
        "location": (13.0359, 77.6245),
        "status": "online",
        "capacity": 125,
        "zone": "Indiranagar"
    },
    "MG_Road": {
        "store_id": "store_mg_001",
        "name": "MG Road Central Hub",
        "lat": 13.0352,
        "lng": 77.6245,
        "location": (13.0352, 77.6245),
        "status": "online",
        "capacity": 180,
        "zone": "MG Road"
    }
}

# Road network edges (simplified graph for Bangalore zones)
ROAD_NETWORK = {
    "HSR_Layout": {
        "neighbors": ["Koramangala", "Indiranagar", "MG_Road"],
        "travel_times": {"Koramangala": 12, "Indiranagar": 8, "MG_Road": 10}
    },
    "Koramangala": {
        "neighbors": ["HSR_Layout", "JP_Nagar", "MG_Road"],
        "travel_times": {"HSR_Layout": 12, "JP_Nagar": 15, "MG_Road": 9}
    },
    "Whitefield": {
        "neighbors": ["Indiranagar", "MG_Road"],
        "travel_times": {"Indiranagar": 18, "MG_Road": 20}
    },
    "JP_Nagar": {
        "neighbors": ["Koramangala", "Indiranagar"],
        "travel_times": {"Koramangala": 15, "Indiranagar": 12}
    },
    "Indiranagar": {
        "neighbors": ["HSR_Layout", "Whitefield", "JP_Nagar", "MG_Road"],
        "travel_times": {"HSR_Layout": 8, "Whitefield": 18, "JP_Nagar": 12, "MG_Road": 7}
    },
    "MG_Road": {
        "neighbors": ["HSR_Layout", "Koramangala", "Whitefield", "Indiranagar"],
        "travel_times": {"HSR_Layout": 10, "Koramangala": 9, "Whitefield": 20, "Indiranagar": 7}
    }
}

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Haversine distance in kilometers"""
    R = 6371  # Earth radius in km
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    a = math.sin(delta_lat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def estimate_travel_time(distance_km: float, avg_speed_kmh: float = 20) -> float:
    """Estimate travel time in minutes (default 20 km/h for Bangalore traffic)"""
    return (distance_km / avg_speed_kmh) * 60

def get_nearby_stores(
    partner_lat: float,
    partner_lng: float,
    radius_km: float = 5.0,
    exclude_zone: Optional[str] = None
) -> List[Store]:
    """Find all stores within radius, excluding offline stores"""
    nearby = []
    
    for zone, store_info in DARK_STORES_DB.items():
        if exclude_zone and zone == exclude_zone:
            continue
        
        if store_info["status"] != "online":
            continue
        
        dist = calculate_distance(partner_lat, partner_lng, store_info["lat"], store_info["lng"])
        
        if dist <= radius_km:
            nearby.append(Store(
                store_id=store_info["store_id"],
                name=store_info["name"],
                lat=store_info["lat"],
                lng=store_info["lng"],
                status=store_info["status"],
                capacity=store_info["capacity"],
                distance_from_partner=dist,
                travel_time_minutes=estimate_travel_time(dist)
            ))
    
    return sorted(nearby, key=lambda s: s.distance_from_partner)

def astar_pathfinding(
    start_zone: str,
    target_zone: str,
    heuristic_distance: float
) -> Tuple[int, float]:
    """
    A* pathfinding algorithm to find shortest path between stores
    Returns: (travel_time_minutes, path_distance)
    """
    if start_zone == target_zone:
        return (0, 0)
    
    if start_zone not in ROAD_NETWORK or target_zone not in ROAD_NETWORK:
        return (25, 10)  # Default estimate if zones not in network
    
    # A* priority queue: (f_score, g_score, current_zone, path)
    open_set = [(0, 0, start_zone, [start_zone])]
    visited = set()
    closest_time = float('inf')
    
    while open_set:
        f_score, g_score, current, path = heapq.heappop(open_set)
        
        if current in visited:
            continue
        
        visited.add(current)
        
        # Found target
        if current == target_zone:
            return (g_score, len(path) - 1)
        
        # Explore neighbors (A* uses heuristic + known cost)
        if current in ROAD_NETWORK:
            for neighbor in ROAD_NETWORK[current]["neighbors"]:
                if neighbor not in visited:
                    travel_time = ROAD_NETWORK[current]["travel_times"][neighbor]
                    new_g_score = g_score + travel_time
                    h_score = heuristic_distance * (len(path) + 1)  # Estimated remaining
                    new_f_score = new_g_score + h_score
                    
                    heapq.heappush(open_set, (new_f_score, new_g_score, neighbor, path + [neighbor]))
    
    # No path found, return default
    return (25, 10)

def analyze_store_opportunity(
    target_store: Store,
    current_earnings_velocity: float,  # ₹/minute
    disruption_duration_minutes: int
) -> Dict:
    """
    Calculate opportunity loss if partner relocation to target store
    Loss = (orders lost during travel time) + (capacity constraints)
    """
    travel_downtime_loss = current_earnings_velocity * target_store.travel_time_minutes
    
    # Capacity constraint: if store is busy, may lose orders
    capacity_penalty = min(0.15, target_store.travel_time_minutes / 30)  # Up to 15% if >30min away
    
    total_loss = travel_downtime_loss * (1 + capacity_penalty)
    
    return {
        "travel_time_minutes": target_store.travel_time_minutes,
        "downtime_loss": round(travel_downtime_loss, 2),  # ₹
        "capacity_penalty": round(capacity_penalty * 100, 1),  # % reduction
        "total_loss": round(total_loss, 2)  # ₹
    }

async def find_alternative_stores(
    partner_lat: float,
    partner_lng: float,
    current_zone: str,
    disrupted_store: str,
    expected_earnings_hourly: float = 300,
    disruption_duration_hours: float = 1.0
) -> Dict:
    """
    MAIN FUNCTION: Find alternative stores when current store disrupted
    Returns ranked list with routing, incentives, and opportunity analysis
    """
    
    current_earnings_velocity = expected_earnings_hourly / 60  # ₹/minute
    
    # 1. Find nearby online stores (exclude disrupted zone)
    nearby_stores = get_nearby_stores(
        partner_lat,
        partner_lng,
        radius_km=10.0,
        exclude_zone=disrupted_store
    )
    
    if not nearby_stores:
        return {
            "status": "no_alternatives_found",
            "message": "No active stores within 10 km radius",
            "disrupted_store": disrupted_store,
            "recommendation": "WAIT_FOR_RECOVERY"
        }
    
    # 2. Score each alternative store
    alternatives = []
    for store in nearby_stores:
        # Get optimal route via A* pathfinding
        travel_time, path_distance = astar_pathfinding(
            current_zone,
            store.name.split()[0],  # Use first word of store name as zone key
            heuristic_distance=calculate_distance(partner_lat, partner_lng, store.lat, store.lng)
        )
        
        store.travel_time_minutes = travel_time if travel_time < 30 else estimate_travel_time(store.distance_from_partner)
        
        # Analyze opportunity loss
        opportunity = analyze_store_opportunity(
            store,
            current_earnings_velocity,
            int(disruption_duration_hours * 60)
        )
        
        store.opportunity_loss = opportunity["total_loss"]
        
        # Calculate incentive offered by platform (partial subsidy)
        # Platform wants to minimize total loss, so offers incentive if relocation makes sense
        incentive = 0
        if opportunity["total_loss"] > 200:
            # If loss is significant, offer incentive to encourage relocation
            incentive = min(500, int(opportunity["total_loss"] * 0.4))  # Cover 40% of loss
        
        store.earnings_boost = incentive
        
        # Overall score (lower is better: short distance + low loss + high capacity)
        score = (
            store.distance_from_partner * 50 +  # Weight on distance
            opportunity["total_loss"] * 0.1 +    # Weight on opportunity loss
            (1 - store.capacity / 200) * 100     # Weight on capacity availability
        )
        
        alternatives.append({
            "store": {
                "store_id": store.store_id,
                "name": store.name,
                "lat": store.lat,
                "lng": store.lng,
                "capacity": store.capacity,
                "zone": current_zone
            },
            "routing": {
                "distance_km": round(store.distance_from_partner, 2),
                "travel_time_minutes": int(store.travel_time_minutes),
                "route_path": [current_zone, store.name.split()[0]]
            },
            "opportunity_analysis": {
                "downtime_loss_during_travel": round(opportunity["downtime_loss"], 2),
                "capacity_penalty_percent": opportunity["capacity_penalty"],
                "total_opportunity_loss": round(opportunity["total_loss"], 2)
            },
            "platform_incentive": {
                "amount": int(store.earnings_boost),
                "coverage_percent": round((store.earnings_boost / max(1, opportunity["total_loss"])) * 100, 1) if opportunity["total_loss"] > 0 else 0,
                "incentive_type": "relocation_boost"
            },
            "net_impact": {
                "gross_loss": round(opportunity["total_loss"], 2),
                "platform_incentive": int(store.earnings_boost),
                "net_impact": round(opportunity["total_loss"] - store.earnings_boost, 2)
            },
            "recommendation_score": round(score, 2)
        })
    
    # Sort by recommendation score (lower is better)
    alternatives.sort(key=lambda x: x["recommendation_score"])
    
    # 3. Build response
    best_alternative = alternatives[0] if alternatives else None
    
    return {
        "status": "alternatives_found",
        "disrupted_store": disrupted_store,
        "disruption_duration_hours": disruption_duration_hours,
        "alternatives": alternatives[:3],  # Top 3 recommendations
        "best_alternative": best_alternative,
        "action": "REDIRECT_TO_BEST" if best_alternative else "WAIT_FOR_RECOVERY",
        "total_alternatives_available": len(alternatives),
        "timestamp": datetime.utcnow().isoformat()
    }

def simulate_store_outage(store_name: str, duration_minutes: int = 45):
    """
    SIMULATION: Trigger a store outage for testing
    """
    if store_name in DARK_STORES_DB:
        DARK_STORES_DB[store_name]["status"] = "offline"
        return {
            "store": store_name,
            "status": "offline",
            "duration_minutes": duration_minutes,
            "timestamp": datetime.utcnow().isoformat()
        }
    return {"error": f"Store {store_name} not found"}

def restore_store(store_name: str):
    """
    SIMULATION: Restore store after outage
    """
    if store_name in DARK_STORES_DB:
        DARK_STORES_DB[store_name]["status"] = "online"
        return {"store": store_name, "status": "online"}
    return {"error": f"Store {store_name} not found"}

def get_store_status_report() -> Dict:
    """Real-time store status report"""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "stores": [
            {
                "zone": zone,
                "status": info["status"],
                "capacity": info["capacity"],
                "lat": info["lat"],
                "lng": info["lng"]
            }
            for zone, info in DARK_STORES_DB.items()
        ],
        "online_count": sum(1 for info in DARK_STORES_DB.values() if info["status"] == "online"),
        "offline_count": sum(1 for info in DARK_STORES_DB.values() if info["status"] == "offline")
    }
