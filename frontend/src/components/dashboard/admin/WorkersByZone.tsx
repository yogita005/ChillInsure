import { useState } from "react";
import { MapPin, Search, Filter, ChevronDown, TrendingUp, AlertCircle, CheckCircle, Clock, MessageSquare } from "lucide-react";

const driversData = {
  "T. Nagar, Chennai": [
    { id: 1, name: "Raj Kumar", phone: "9876543210", vehicle: "Bike", status: "Active", earnings: "₹1,200", claims: 8, rating: 4.8, claimsPending: 0 },
    { id: 2, name: "Priya Singh", phone: "9876543211", vehicle: "Bike", status: "Active", earnings: "₹950", claims: 5, rating: 4.6, claimsPending: 1 },
    { id: 3, name: "Arun Patel", phone: "9876543212", vehicle: "Bike", status: "Inactive", earnings: "₹650", claims: 2, rating: 4.3, claimsPending: 0 },
    { id: 4, name: "Neha Gupta", phone: "9876543213", vehicle: "Bike", status: "Active", earnings: "₹1,450", claims: 12, rating: 4.9, claimsPending: 2 },
    { id: 5, name: "Vikram Desai", phone: "9876543214", vehicle: "Bike", status: "Active", earnings: "₹1,100", claims: 7, rating: 4.7, claimsPending: 0 },
  ],
  "Mylapore, Chennai": [
    { id: 6, name: "Anita Das", phone: "9876543215", vehicle: "Bike", status: "Active", earnings: "₹1,350", claims: 10, rating: 4.8, claimsPending: 1 },
    { id: 7, name: "Rohan Kumar", phone: "9876543216", vehicle: "Bike", status: "Active", earnings: "₹1,050", claims: 4, rating: 4.5, claimsPending: 0 },
    { id: 8, name: "Shweta Rao", phone: "9876543217", vehicle: "Bike", status: "Active", earnings: "₹1,600", claims: 9, rating: 4.9, claimsPending: 2 },
    { id: 9, name: "Manish Singh", phone: "9876543218", vehicle: "Bike", status: "Inactive", earnings: "₹450", claims: 1, rating: 4.2, claimsPending: 0 },
  ],
  "Velachery, Chennai": [
    { id: 10, name: "Deepak Nair", phone: "9876543219", vehicle: "Bike", status: "Active", earnings: "₹2,100", claims: 15, rating: 4.9, claimsPending: 0 },
    { id: 11, name: "Aditi Sharma", phone: "9876543220", vehicle: "Bike", status: "Active", earnings: "₹1,800", claims: 11, rating: 4.8, claimsPending: 1 },
    { id: 12, name: "Suresh Kumar", phone: "9876543221", vehicle: "Bike", status: "Active", earnings: "₹950", claims: 3, rating: 4.4, claimsPending: 0 },
  ],
  "Anna Nagar, Chennai": [
    { id: 13, name: "Pooja Verma", phone: "9876543222", vehicle: "Bike", status: "Active", earnings: "₹1,750", claims: 14, rating: 4.7, claimsPending: 2 },
    { id: 14, name: "Nikhil Joshi", phone: "9876543223", vehicle: "Bike", status: "Active", earnings: "₹1,250", claims: 6, rating: 4.6, claimsPending: 0 },
    { id: 15, name: "Sneha Gupta", phone: "9876543224", vehicle: "Bike", status: "Active", earnings: "₹1,900", claims: 13, rating: 4.9, claimsPending: 1 },
  ],
  "Adyar, Chennai": [
    { id: 16, name: "Karthik Nair", phone: "9876543225", vehicle: "Bike", status: "Active", earnings: "₹1,580", claims: 9, rating: 4.8, claimsPending: 0 },
    { id: 17, name: "Divya Reddy", phone: "9876543226", vehicle: "Bike", status: "Active", earnings: "₹1,420", claims: 11, rating: 4.7, claimsPending: 1 },
    { id: 18, name: "Aravind Kumar", phone: "9876543227", vehicle: "Bike", status: "Active", earnings: "₹2,050", claims: 16, rating: 4.9, claimsPending: 0 },
    { id: 19, name: "Anjali Krishnan", phone: "9876543228", vehicle: "Bike", status: "Active", earnings: "₹1,690", claims: 13, rating: 4.8, claimsPending: 2 },
  ],
};

type ZoneKey = keyof typeof driversData;

export function WorkersByZone() {
  const [expandedZone, setExpandedZone] = useState<ZoneKey | null>("T. Nagar, Chennai");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const zones = Object.keys(driversData) as ZoneKey[];

  const getStatusColor = (status: string) => {
    if (status === "Active") return "bg-green-500/20 text-green-600 border-green-500/30";
    if (status === "Inactive") return "bg-gray-500/20 text-gray-600 border-gray-500/30";
    return "bg-amber-500/20 text-amber-600 border-amber-500/30";
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.8) return "text-green-500";
    if (rating >= 4.5) return "text-blue-500";
    if (rating >= 4.0) return "text-amber-500";
    return "text-orange-500";
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="sticky top-0 z-10 bg-card rounded-2xl border border-border p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search driver by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-muted/30 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50"
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
      </div>

      {/* Zone Accordion List */}
      <div className="space-y-4">
        {zones.map((zone) => {
          const zoneDrivers = driversData[zone];
          const activeCount = zoneDrivers.filter(d => d.status === "Active").length;
          const totalEarnings = zoneDrivers.reduce((sum, d) => sum + parseInt(d.earnings.replace("₹", "").replace(",", "")), 0);
          const avgRating = (zoneDrivers.reduce((sum, d) => sum + d.rating, 0) / zoneDrivers.length).toFixed(1);
          const isExpanded = expandedZone === zone;

          return (
            <div key={zone} className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 transition-colors">
              {/* Zone Header */}
              <button
                onClick={() => setExpandedZone(isExpanded ? null : zone)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-lg text-foreground">{zone}</h3>
                    <p className="text-sm text-muted-foreground">{zoneDrivers.length} drivers • {activeCount} active</p>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-8 mr-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Earnings</p>
                    <p className="font-display font-bold text-primary">₹{Math.round(totalEarnings / 1000)}K</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Avg Rating</p>
                    <p className={`font-display font-bold text-lg ${getRatingColor(parseFloat(avgRating as string))}`}>
                      {avgRating} ⭐
                    </p>
                  </div>
                </div>

                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "transform rotate-180" : ""}`}
                />
              </button>

              {/* Zone Content */}
              {isExpanded && (
                <div className="border-t border-border px-6 py-4 bg-muted/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Driver</th>
                          <th className="text-left py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact</th>
                          <th className="text-left py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Earnings</th>
                          <th className="text-center py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Claims</th>
                          <th className="text-center py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Rating</th>
                          <th className="text-center py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="text-center py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {zoneDrivers
                          .filter(driver => 
                            (statusFilter === "All" || driver.status === statusFilter) &&
                            (driver.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             driver.phone.includes(searchTerm))
                          )
                          .map((driver) => (
                            <tr key={driver.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                              <td className="py-3">
                                <div>
                                  <p className="font-semibold text-foreground">{driver.name}</p>
                                  <p className="text-xs text-muted-foreground">{driver.vehicle}</p>
                                </div>
                              </td>
                              <td className="py-3">
                                <a href={`tel:${driver.phone}`} className="text-primary hover:underline text-sm font-medium">
                                  {driver.phone}
                                </a>
                              </td>
                              <td className="py-3">
                                <p className="font-semibold text-foreground">{driver.earnings}</p>
                              </td>
                              <td className="py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <span className="font-semibold text-foreground">{driver.claims}</span>
                                  {driver.claimsPending > 0 && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-amber/20 text-amber">
                                      +{driver.claimsPending}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 text-center">
                                <span className={`font-bold text-lg ${getRatingColor(driver.rating)}`}>
                                  {driver.rating}
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${getStatusColor(driver.status)}`}>
                                  {driver.status}
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary hover:text-primary-foreground">
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-2">Total Drivers</p>
          <p className="text-3xl font-display font-bold text-foreground">
            {Object.values(driversData).flat().length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Across all zones</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-2">Active Now</p>
          <p className="text-3xl font-display font-bold text-primary">
            {Object.values(driversData).flat().filter(d => d.status === "Active").length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Currently working</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-2">Total Claimed</p>
          <p className="text-3xl font-display font-bold text-sage">
            ₹{Math.round(
              Object.values(driversData)
                .flat()
                .reduce((sum, d) => sum + (d.claims * 500), 0) / 100000
            )}L
          </p>
          <p className="text-xs text-muted-foreground mt-1">Claims processed</p>
        </div>
      </div>
    </div>
  );
}
