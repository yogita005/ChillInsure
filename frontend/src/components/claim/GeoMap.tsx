import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Circle, Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: string;
  accuracy?: number;
}

interface GeoMapProps {
  gpsTrail?: GPSPoint[];
  zoneLat: number;
  zoneLng: number;
  zoneName?: string;
  zoneRadius?: number;
}

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const lat1_rad = (Math.PI / 180) * lat1;
  const lat2_rad = (Math.PI / 180) * lat2;
  const delta_lat = (Math.PI / 180) * (lat2 - lat1);
  const delta_lng = (Math.PI / 180) * (lng2 - lng1);
  const a =
    Math.sin(delta_lat / 2) ** 2 +
    Math.cos(lat1_rad) * Math.cos(lat2_rad) * Math.sin(delta_lng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if point is inside zone
function isPointInZone(
  lat: number,
  lng: number,
  zoneCenterLat: number,
  zoneCenterLng: number,
  zoneRadius: number
): boolean {
  const distance = calculateDistance(lat, lng, zoneCenterLat, zoneCenterLng);
  return distance <= zoneRadius;
}

export function GeoMap({
  gpsTrail = [],
  zoneLat,
  zoneLng,
  zoneName = "Delivery Zone",
  zoneRadius = 800,  // Increased from 500m to 800m to match backend zone definitions
}: GeoMapProps) {
  const [polylineCoords, setPolylineCoords] = useState<[number, number][]>([]);
  const [pointsInZone, setPointsInZone] = useState<GPSPoint[]>([]);
  const [pointsOutZone, setPointsOutZone] = useState<GPSPoint[]>([]);

  useEffect(() => {
    if (gpsTrail && gpsTrail.length > 0) {
      const coords = gpsTrail.map((point) => [point.lat, point.lng] as [number, number]);
      setPolylineCoords(coords);

      // Categorize points as in-zone or out-zone
      const inZone = gpsTrail.filter((point) =>
        isPointInZone(point.lat, point.lng, zoneLat, zoneLng, zoneRadius)
      );
      const outZone = gpsTrail.filter(
        (point) => !isPointInZone(point.lat, point.lng, zoneLat, zoneLng, zoneRadius)
      );

      setPointsInZone(inZone);
      setPointsOutZone(outZone);
    }
  }, [gpsTrail, zoneLat, zoneLng, zoneRadius]);

  // Center map on zone or first GPS point
  const mapCenter = polylineCoords.length > 0 ? polylineCoords[0] : [zoneLat, zoneLng];
  const zoom = 16;

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-border">
      <MapContainer
        center={mapCenter as [number, number]}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        {/* OpenStreetMap Tiles */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Zone Boundary Circle - Dashed Primary Color */}
        <Circle
          center={[zoneLat, zoneLng]}
          radius={zoneRadius}
          pathOptions={{
            color: "hsl(var(--primary))",
            fillOpacity: 0.08,
            weight: 2,
            dashArray: "8, 5",
          }}
          children={
            <Popup>
              <div className="text-sm font-semibold">{zoneName}</div>
              <div className="text-xs text-muted-foreground">
                Geofence Radius: {zoneRadius}m
              </div>
            </Popup>
          }
        />

        {/* Zone Center Marker */}
        <Marker position={[zoneLat, zoneLng]}>
          <Popup>
            <div className="font-semibold">Zone Center</div>
            <div className="text-xs">{zoneName}</div>
          </Popup>
        </Marker>

        {/* GPS Trail Polyline - Shows path */}
        {polylineCoords.length > 0 && (
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: "hsl(var(--muted-foreground))",
              weight: 2,
              opacity: 0.6,
              dashArray: "4, 4",
            }}
          />
        )}

        {/* GPS Points INSIDE Zone - Green circles */}
        {pointsInZone.map((point, idx) => (
          <Circle
            key={`in-${idx}`}
            center={[point.lat, point.lng]}
            radius={20}
            pathOptions={{
              color: "#10b981", // Green
              fillOpacity: 0.85,
              weight: 2,
              fillColor: "#10b981",
            }}
            children={
              <Popup>
                <div className="text-xs font-semibold text-green-700">✓ In Zone</div>
                <div className="text-[10px] text-muted-foreground">
                  {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Accuracy: ±{point.accuracy || 25}m
                </div>
              </Popup>
            }
          />
        ))}

        {/* GPS Points OUTSIDE Zone - Red circles */}
        {pointsOutZone.map((point, idx) => (
          <Circle
            key={`out-${idx}`}
            center={[point.lat, point.lng]}
            radius={20}
            pathOptions={{
              color: "#ef4444", // Red
              fillOpacity: 0.85,
              weight: 2,
              fillColor: "#ef4444",
            }}
            children={
              <Popup>
                <div className="text-xs font-semibold text-red-700">✗ Out of Zone</div>
                <div className="text-[10px] text-muted-foreground">
                  {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Accuracy: ±{point.accuracy || 25}m
                </div>
              </Popup>
            }
          />
        ))}

        {/* Latest position marker */}
        {polylineCoords.length > 0 && (
          <Marker position={polylineCoords[polylineCoords.length - 1]}>
            <Popup>
              <div className="text-xs font-semibold">📍 Final Position</div>
              <div className="text-xs">
                {polylineCoords[polylineCoords.length - 1][0].toFixed(6)},
                {polylineCoords[polylineCoords.length - 1][1].toFixed(6)}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

// Map legend/info component
export function MapLegend({ 
  gpsTrail = [], 
  zoneLat = 13.0827, 
  zoneLng = 77.6055, 
  zoneRadius = 750,
  storeAgentData = null
}: { 
  gpsTrail?: GPSPoint[], 
  zoneLat?: number, 
  zoneLng?: number, 
  zoneRadius?: number,
  storeAgentData?: any
}) {
  // Calculate zone scanning stats using the same logic as the map
  const inZonePoints = gpsTrail.filter((p) =>
    isPointInZone(p.lat, p.lng, zoneLat, zoneLng, zoneRadius)
  );
  const outZonePoints = gpsTrail.filter(
    (p) => !isPointInZone(p.lat, p.lng, zoneLat, zoneLng, zoneRadius)
  );

  const inZonePercentage =
    gpsTrail.length > 0 ? ((inZonePoints.length / gpsTrail.length) * 100).toFixed(0) : 0;
  const avgAccuracy =
    gpsTrail.length > 0
      ? (gpsTrail.reduce((sum, p) => sum + (p.accuracy || 0), 0) / gpsTrail.length).toFixed(1)
      : "N/A";

  // Determine zone agent verdict based on in-zone percentage
  let agentVerdict = "REJECT";
  let verdictColor = "text-red-600";
  if (Number(inZonePercentage) >= 80) {
    agentVerdict = "PAY";
    verdictColor = "text-green-600";
  } else if (Number(inZonePercentage) >= 50) {
    agentVerdict = "PARTIAL";
    verdictColor = "text-amber-600";
  }

  // Extract store data if available
  const storeCount = storeAgentData?.store_count || 0;
  const storesDisrupted = storeAgentData?.stores_disrupted || 0;
  const storeVerdict = storeAgentData?.verdict || "N/A";

  return (
    <div className="space-y-3">
      <div className="bg-card rounded-lg border border-border p-4 space-y-3 text-xs">
        <div>
          <h4 className="font-semibold mb-3">🔍 Zone Agent Scan Results</h4>
          <div className={`inline-block px-3 py-1 rounded font-bold mb-3 ${verdictColor}`}>
            Verdict: <span className={verdictColor}>{agentVerdict}</span>
          </div>
        </div>

        <div className="space-y-2 bg-muted/30 rounded p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600" />
              <span className="font-medium">Inside Zone</span>
            </div>
            <span className="font-mono font-bold text-green-600">{inZonePoints.length}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600" />
              <span className="font-medium">Outside Zone</span>
            </div>
            <span className="font-mono font-bold text-red-600">{outZonePoints.length}</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border">
            <span className="font-medium">Coverage</span>
            <span className="font-mono font-bold text-primary">{inZonePercentage}%</span>
          </div>
        </div>

        <div className="space-y-1.5 text-muted-foreground">
          <div className="flex justify-between">
            <span>Total GPS Points:</span>
            <span className="font-mono font-semibold text-foreground">{gpsTrail.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Avg GPS Accuracy:</span>
            <span className="font-mono font-semibold text-foreground">±{avgAccuracy}m</span>
          </div>
        </div>
      </div>

      {/* Store Agent Verification */}
      {storeCount > 0 && (
        <div className="bg-card rounded-lg border border-border p-4 space-y-3 text-xs">
          <div>
            <h4 className="font-semibold mb-3">🏪 Store Agent Verification</h4>
            <div className={`inline-block px-3 py-1 rounded font-bold mb-3 ${
              storeVerdict === "PAY" ? "bg-green-500/20 text-green-600" :
              storeVerdict === "PARTIAL" ? "bg-amber-500/20 text-amber-600" :
              "bg-red-500/20 text-red-600"
            }`}>
              Verdict: <span>{storeVerdict}</span>
            </div>
          </div>

          <div className="space-y-2 bg-muted/30 rounded p-2.5">
            <div className="flex items-center justify-between">
              <span className="font-medium">Dark Stores in Zone</span>
              <span className="font-mono font-bold text-primary">{storeCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Disrupted Stores</span>
              <span className="font-mono font-bold text-coral">{storesDisrupted}</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span className="font-medium">Operations Status</span>
              <span className="font-mono font-bold text-amber">
                {storeCount > 0 ? `${((storesDisrupted / storeCount) * 100).toFixed(0)}% affected` : "N/A"}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="pt-2 mt-2 border-t border-border space-y-2">
        <div className="text-[11px] font-semibold text-primary">Map Legend:</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-dashed rounded" />
            <span>750m Geofence</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
            <span>GPS Point (In Zone)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span>GPS Point (Out Zone)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
