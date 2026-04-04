import { useState, useEffect } from "react";

export interface Alert {
  icon: string;
  severity: "high" | "medium" | "low";
  title: string;
  desc: string;
  time: string;
  action: string;
  probability: string;
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

  const fetchAlerts = async (retry = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Get userId from localStorage
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("accessToken");

      if (!userId || !token) {
        setError("User not authenticated");
        return;
      }

      const response = await fetch(
        `http://localhost:3001/api/alerts/risk-alerts/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Unauthorized");
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
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);

      // Fallback to default alerts if fetch fails
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
  };

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
  }, []);

  return {
    alerts,
    loading,
    error,
    zoneRiskMultiplier,
    zoneRiskLabel,
    city,
    zone,
    refetch: fetchAlerts,
  };
}
