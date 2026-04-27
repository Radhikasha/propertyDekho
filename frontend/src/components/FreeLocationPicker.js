import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LocationPicker.css';

// Fix for default marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const FreeLocationPicker = ({ value, onChange }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [coords, setCoords] = useState(
    value
      ? value.split(',').map(Number)
      : [20.5937, 78.9629] // Default to India center
  );

  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      // Initialize map
      const map = L.map(mapRef.current).setView([coords[0], coords[1]], 13);
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Add marker
      const marker = L.marker([coords[0], coords[1]], {
        draggable: true
      }).addTo(map);

      // Handle marker drag
      marker.on('dragend', (e) => {
        const position = e.target.getLatLng();
        const newCoords = [position.lat, position.lng];
        setCoords(newCoords);
        onChange(`${position.lat}, ${position.lng}`);
      });

      // Handle map click
      map.on('click', (e) => {
        const position = e.latlng;
        marker.setLatLng(position);
        const newCoords = [position.lat, position.lng];
        setCoords(newCoords);
        onChange(`${position.lat}, ${position.lng}`);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position when coords change from outside
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      const newCoords = value ? value.split(',').map(Number) : [20.5937, 78.9629];
      if (newCoords[0] !== coords[0] || newCoords[1] !== coords[1]) {
        markerRef.current.setLatLng(newCoords);
        setCoords(newCoords);
        mapInstanceRef.current.setView(newCoords, 13);
      }
    }
  }, [value, coords]);

  const handleUseLiveLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newCoords = [lat, lng];
          setCoords(newCoords);
          onChange(`${lat}, ${lng}`);
          
          if (markerRef.current && mapInstanceRef.current) {
            markerRef.current.setLatLng(newCoords);
            mapInstanceRef.current.setView(newCoords, 15);
          }
        },
        (error) => {
          alert('Unable to fetch your location. Please allow location access and try again.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="location-picker-container">
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '300px', 
          borderRadius: '12px', 
          marginBottom: '1rem',
          zIndex: 1
        }} 
      />
      <button 
        type="button" 
        className="live-location-btn" 
        onClick={handleUseLiveLocation}
        style={{
          marginBottom: '1rem', 
          padding: '0.5rem 1rem', 
          borderRadius: '8px', 
          background: '#4a90e2', 
          color: '#fff', 
          border: 'none', 
          cursor: 'pointer',
          width: '100%'
        }}
      >
        Use Live Location
      </button>
      <div className="location-coords">
        <strong>Selected Coordinates:</strong> {coords[0].toFixed(6)}, {coords[1].toFixed(6)}
      </div>
    </div>
  );
};

export default FreeLocationPicker;
