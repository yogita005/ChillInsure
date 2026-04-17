import { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface Alert {
  icon: string;
  severity: "high" | "medium" | "low";
  title: string;
  desc: string;
  time: string;
  action: string;
  probability: string;
}

export interface WeatherData {
  city: string;
  temp_c: number;
  rain_mm: number;
  disruption_detected: boolean | null;
  api_verified: boolean;
}

export interface AqiData {
  city: string;
  aqi: number;
  disruption_detected: boolean | null;
  api_verified: boolean;
}

export interface AlertsResponse {
  status: string;
  user_id: string;
  zone: string;
  city: string;
  zone_risk_multiplier: number;
  zone_risk_label: string;
  alerts_count: number;
  alerts: Alert[];
  weather?: WeatherData;
  aqi?: AqiData;
  error?: string;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoneRiskMultiplier, setZoneRiskMultiplier] = useState<number>(1.0);
  const [zoneRiskLabel, setZoneRiskLabel] = useState<string>("medium");
  const [city, setCity] = useState<string>("Your Zone");
  const [zone, setZone] = useState<string>("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [aqi, setAqi] = useState<AqiData | null>(null);

  const fetchAlerts = useCallback(async (retry = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Get userId and token from localStorage
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("accessToken");

      console.log("[useAlerts] Auth check:", { 
        hasUserId: !!userId, 
        hasToken: !!token, 
        retry 
      });

      if (!userId || !token) {
        // On first attempt, retry after a short delay — localStorage may not
        // be populated yet if the component mounted immediately after auth
        if (retry < 3) {
          console.warn(`[useAlerts] Auth not ready, retrying in 1s... (${retry + 1}/3)`);
          setTimeout(() => {
            fetchAlerts(retry + 1);
          }, 1000);
          return;
        }
        setError("User not authenticated");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/alerts/risk-alerts/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("[useAlerts] API response status:", response.status);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          const errBody = await response.json().catch(() => ({}));
          console.error("[useAlerts] Auth error from backend:", errBody);
          throw new Error("Unauthorized — token may be expired. Try logging in again.");
        }
        throw new Error(`Failed to fetch alerts: ${response.statusText}`);
      }

      const data: AlertsResponse = await response.json();

      if (data.status === "success") {
        setAlerts(data.alerts);
        setZoneRiskMultiplier(data.zone_risk_multiplier);
        setZoneRiskLabel(data.zone_risk_label);
        setCity(data.city);
        setZone(data.zone);
        if (data.weather) setWeather(data.weather);
        if (data.aqi) setAqi(data.aqi);
        setError(null);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("[useAlerts] Error:", errorMsg);
      setError(errorMsg);

      // Fallback to default alerts if fetch fails after retries
      if (retry < 2) {
        console.warn(`[useAlerts] Fetch failed, retrying... (${retry + 1}/2)`, err);
        setTimeout(() => {
          fetchAlerts(retry + 1);
        }, 2000);
      } else {
        setAlerts(getFallbackAlerts());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const getFallbackAlerts = (): Alert[] => {
    return [
      {
        severity: "low",
        icon: "radio",
        title: "Live monitoring active",
        desc: "Real-time zone risk monitoring is currently running",
        time: "Now",
        action: "System is monitoring — no trigger needed",
        probability: "0%",
      },
    ];
  };

  useEffect(() => {
    // Fetch alerts on component mount
    fetchAlerts();

    // Set up interval to refetch every 5 minutes
    const interval = setInterval(() => {
      fetchAlerts();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    zoneRiskMultiplier,
    zoneRiskLabel,
    city,
    zone,
    weather,
    aqi,
    refetch: fetchAlerts,
  };
}
