import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { FaMapMarkerAlt } from "react-icons/fa";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./Report.css";
import Navbar from "../Navbar/Navbar";
import { addIssue } from "../../services/api";
import { statesAndDistricts } from "../../utils/statesAndDistricts";
import { toast } from "react-toastify";
// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// States and districts data (simplified example)


function MapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center);
  }, [center, map]);
  return null;
}

function LocationMarker({ defaultLocation, onLocationSelect }) {
  const [position, setPosition] = useState(null);
  const map = useMap();

  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();
      return data.display_name;
    } catch (error) {
      console.error("Error fetching address:", error);
      return "";
    }
  };

  useEffect(() => {
    if (defaultLocation) {
      const newPos = [defaultLocation.lat, defaultLocation.lng];
      setPosition(newPos);
      map.setView(newPos, 15);
      getAddressFromCoordinates(defaultLocation.lat, defaultLocation.lng).then(
        (address) =>
          onLocationSelect([defaultLocation.lng, defaultLocation.lat], address)
      );
    }
  }, [defaultLocation, map]);

  useMap().on("click", async (e) => {
    const newPosition = [e.latlng.lat, e.latlng.lng];
    setPosition(newPosition);
    const address = await getAddressFromCoordinates(e.latlng.lat, e.latlng.lng);
    onLocationSelect([e.latlng.lng, e.latlng.lat], address);
  });

  return position ? <Marker position={position} /> : null;
}

const Report = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    department:"",
    images: [],
    coordinates: [],
    address: "",
    state: "",
    districtName: "",
  });

  const [districts, setDistricts] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [defaultLocation, setDefaultLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([18.5204, 73.8567]); // Pune default
  const mapRef = useRef(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setDefaultLocation(newLocation);
          setMapCenter([latitude, longitude]);
          setFormData((prev) => ({
            ...prev,
            coordinates: [longitude, latitude],
          }));
        },
        () => {
          setDefaultLocation({ lat: 18.5204, lng: 73.8567 });
        }
      );
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "state" ? { districtName: "" } : {}), // reset district if state changes
    }));

    if (name === "state") {
      const selectedState = statesAndDistricts.find((s) => s.state === value);
      setDistricts(selectedState ? selectedState.districts : []);
    }
  };

  const handleLocationSelect = (coordinates, address) => {
    setFormData((prev) => ({
      ...prev,
      coordinates,
      address: address || prev.address,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    setFormData((prev) => ({
      ...prev,
      images: files.map((file) => URL.createObjectURL(file)),
    }));
  };



const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // Validation
    if (
      !formData.title ||
      !formData.description ||
      !formData.coordinates ||
      !formData.state ||
      !formData.districtName||
      !formData.department
    ) {
      throw new Error("Please fill all required fields");
    }

    // Prepare FormData
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("coordinates", JSON.stringify(formData.coordinates));
    data.append("address", formData.address);
    data.append("state", formData.state);
    data.append("districtName", formData.districtName);
    data.append("department", formData.department);
    imageFiles.forEach((file) => data.append("images", file));

    // API call
    const response = await addIssue(data);
    const result = response.data;

    if (!response.status || response.status >= 400)
      throw new Error(result.message || "Failed to submit issue");

    // ✅ Show success toast
    toast.success(result.message || "Issue submitted successfully!", {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

    // Navigate after submission
    navigate("/dashboard");
  } catch (err) {
    // ✅ Show error toast
    const errorMessage = err.response?.data?.message || err.message;
    toast.error(errorMessage, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="report-page">
      <Navbar />
      <div className="report-page-container">
        <div className="report-page-content">
          <h1 className="report-page-title">Report an Issue</h1>
          <p className="report-page-subtitle">
            Help improve your community by reporting local problems
          </p>

          <form onSubmit={handleSubmit} className="report-page-form">
            <div className="report-page-section">
              <h2 className="report-section-title">Issue Details</h2>

              <div className="report-input-group">
                <label htmlFor="title">Issue Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Brief description of the problem"
                  required
                />
              </div>

              <div className="report-input-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide detailed information about the issue"
                  rows="4"
                  required
                />
              </div>
              <div className="report-input-group">
                <label htmlFor="department">Department *</label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                >
                  <option value="" disabled>Select a department</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Roads & Transport">Roads & Transport</option>
                  <option value="Public Health & Sanitation">Public Health & Sanitation</option>
                  <option value="Waste Management">Waste Management</option>
                  <option value="Drainage & Sewerage">Drainage & Sewerage</option>
                  <option value="Pollution Control">Pollution Control</option>
                  <option value="Water Supply">Water Supply</option>
                  <option value="Parks & Trees">Parks & Trees</option>
                  <option value="Public Safety">Public Safety</option>
                  <option value="Streetlights">Streetlights</option>
                  <option value="Building & Construction">Building & Construction</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="report-input-group">
                <label htmlFor="state">State *</label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select state</option>
                  {statesAndDistricts.map((s) => (
                    <option key={s.state} value={s.state}>
                      {s.state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="report-input-group">
                <label htmlFor="districtName">District *</label>
                <select
                  id="districtName"
                  name="districtName"
                  value={formData.districtName}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.state}
                >
                  <option value="">Select district</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="report-input-group">
                <label htmlFor="address">Location *</label>
                <div className="report-location-wrapper">
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    readOnly
                    placeholder="Select location on map"
                    required
                  />
                  <button
                    type="button"
                    className="report-map-toggle"
                    onClick={() => setShowMap(!showMap)}
                  >
                    <FaMapMarkerAlt /> Pick Location on Map
                  </button>
                </div>
                {showMap && (
                  <div className="report-map-wrapper">
                    <MapContainer
                      center={mapCenter}
                      zoom={15}
                      style={{ height: "400px", width: "100%" }}
                      ref={mapRef}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationMarker
                        defaultLocation={defaultLocation}
                        onLocationSelect={handleLocationSelect}
                      />
                    </MapContainer>
                  </div>
                )}
              </div>

              <div className="report-input-group">
                <label htmlFor="images">Images</label>
                <input
                  type="file"
                  id="images"
                  name="images"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="report-file-input"
                />
                <small className="report-helper-text">
                  You can upload multiple images (optional)
                </small>
                <div className="report-image-preview">
                  {formData.images?.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`preview-${idx}`}
                      className="report-preview-image"
                    />
                  ))}
                </div>
              </div>
            </div>

            {error && <div className="report-error">{error}</div>}

            <div className="report-actions">
              <button
                type="submit"
                className="report-submit"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Report;
