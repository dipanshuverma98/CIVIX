import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Navbar from "../Navbar/Navbar";
import "./HeatmapPage.css";

// HELPER COMPONENT: This forces the map to move when the coordinates change
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

const HeatmapPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const heatmapData = location.state?.heatmapData || [];
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [hasSetInitialLocation, setHasSetInitialLocation] = useState(false);

  // Determine if we are on the worker route or admin route to fix the click links
  const isWorker = location.pathname.includes("worker");

  // 🐛 DEBUG LOG: Check your browser console to see if data is actually arriving here
  useEffect(() => {
    console.log("Raw Heatmap Data received:", heatmapData);
  }, [heatmapData]);

  const extractCoordinates = (loc) => {
    if (!loc) return null;
    if (loc.type === "Point" && Array.isArray(loc.coordinates)) {
      return [loc.coordinates[1], loc.coordinates[0]]; 
    }
    if (loc.lat !== undefined && (loc.lng !== undefined || loc.lon !== undefined)) {
      return [loc.lat, loc.lng || loc.lon];
    }
    return null;
  };

  const visibleIssues = useMemo(() => {
    return heatmapData.filter((issue) => {
      // 🛠️ FIXED: Added trim() and included "in progress" (with a space) and "pending"
      const status = issue.status?.toLowerCase().trim();
      return (
        status === "unsolved" || 
        status === "in-progress" || 
        status === "in progress" || 
        status === "progress" ||
        status === "pending" 
      );
    });
  }, [heatmapData]);

  // 🐛 DEBUG LOG: See how many issues passed the filter
  useEffect(() => {
    console.log("Visible Issues after filtering:", visibleIssues);
  }, [visibleIssues]);

  useEffect(() => {
    // 1. Try to get User's Live Location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = [position.coords.latitude, position.coords.longitude];
          setMapCenter(userLocation);
          setHasSetInitialLocation(true);
        },
        (error) => {
          console.error("Error getting location:", error);
          // 2. FALLBACK: If GPS fails or is denied, use the first issue's location
          const firstIssue = visibleIssues.find(i => extractCoordinates(i.location) !== null);
          if (firstIssue) {
            setMapCenter(extractCoordinates(firstIssue.location));
          }
        }
      );
    }
  }, [visibleIssues]);

  const getMarkerColor = (status) => {
    const s = status?.toLowerCase().trim();
    switch (s) {
      case "unsolved": 
      case "pending": return "#ef4444"; // Red
      case "in-progress":
      case "in progress":
      case "progress": return "#f59e0b"; // Orange
      default: return "#ef4444"; 
    }
  };

  const createCustomPin = (color) => {
    return new L.DivIcon({
      className: "custom-pin",
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32px" height="32px" style="filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.4));"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  };

  return (
    <div className="heatmap-page-wrapper">
      <Navbar />
      <div className="heatmap-container">
        <div className="heatmap-header">
          <h1>Active Issues Map</h1>
          <button className="back-button" onClick={() => navigate(-1)}>&larr; Back</button>
        </div>

        <div className="heatmap-legend">
          <div className="legend-item"><span className="color-dot" style={{ backgroundColor: "#ef4444" }}></span> Unsolved</div>
          <div className="legend-item"><span className="color-dot" style={{ backgroundColor: "#f59e0b" }}></span> In Progress</div>
        </div>

        <div className="map-wrapper" style={{ position: "relative" }}>
          
          {visibleIssues.length === 0 && (
            <div style={{ 
              position: "absolute", 
              top: "20px", 
              left: "50%", 
              transform: "translateX(-50%)", 
              background: "white", 
              padding: "10px 20px", 
              borderRadius: "8px", 
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
              zIndex: 1000, 
              fontWeight: "600",
              color: "#4b5563"
            }}>
              No active location data available right now.
            </div>
          )}

          <MapContainer 
            center={mapCenter} 
            zoom={13} 
            style={{ minHeight: "500px", height: "100%", width: "100%", borderRadius: "12px", zIndex: 0 }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            <RecenterMap center={mapCenter} />

            {visibleIssues.map((issue) => {
              const pos = extractCoordinates(issue.location);
              if (!pos) return null;
              
              // 🛠️ FIXED: Dynamic navigation based on whether it's a worker or admin
              const issueUrl = isWorker ? `/worker/issue/${issue.id}` : `/admin/issue/${issue.id}`;

              return (
                <Marker 
                  key={issue.id} 
                  position={pos} 
                  icon={createCustomPin(getMarkerColor(issue.status))}
                  eventHandlers={{ click: () => navigate(issueUrl) }}
                >
                  <Tooltip direction="top" offset={[0, -10]}>
                    <strong>{issue.title}</strong><br/>
                    <span style={{ textTransform: "capitalize", color: getMarkerColor(issue.status) }}>
                      Status: {issue.status}
                    </span>
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default HeatmapPage;