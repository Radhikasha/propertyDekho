import React, { useState, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import GOOGLE_MAPS_CONFIG from '../config/googleMaps';
import './LocationPicker.css';

const GoogleLocationPicker = ({ value, onChange }) => {
  const [coords, setCoords] = useState(
    value
      ? value.split(',').map(Number)
      : [GOOGLE_MAPS_CONFIG.DEFAULT_CENTER.lat, GOOGLE_MAPS_CONFIG.DEFAULT_CENTER.lng]
  );
  
  const [markerPosition, setMarkerPosition] = useState({
    lat: coords[0],
    lng: coords[1]
  });

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_CONFIG.API_KEY,
    libraries: GOOGLE_MAPS_CONFIG.LIBRARIES
  });

  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    
    // Create AdvancedMarkerElement
    if (window.google && window.google.maps && window.google.maps.marker) {
      const advancedMarker = new window.google.maps.marker.AdvancedMarkerElement({
        position: markerPosition,
        map: map,
        gmpDraggable: true
      });
      
      advancedMarker.addListener('dragend', (e) => {
        const position = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        };
        setMarkerPosition(position);
        setCoords([position.lat, position.lng]);
        onChange(`${position.lat}, ${position.lng}`);
      });
      
      markerRef.current = advancedMarker;
    }
  }, [markerPosition, onChange]);

  const onMapClick = useCallback((e) => {
    const position = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    setMarkerPosition(position);
    setCoords([position.lat, position.lng]);
    onChange(`${position.lat}, ${position.lng}`);
    
    // Update marker position
    if (markerRef.current) {
      markerRef.current.position = position;
    }
  }, [onChange]);

  const handleUseLiveLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newPosition = { lat, lng };
          setMarkerPosition(newPosition);
          setCoords([lat, lng]);
          onChange(`${lat}, ${lng}`);
          
          if (mapRef.current) {
            mapRef.current.panTo(newPosition);
            mapRef.current.setZoom(15);
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

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const position = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        setMarkerPosition(position);
        setCoords([position.lat, position.lng]);
        onChange(`${position.lat}, ${position.lng}`);
        
        if (mapRef.current) {
          mapRef.current.panTo(position);
          mapRef.current.setZoom(15);
        }
      }
    }
  };

  if (!isLoaded) {
    return (
      <div className="location-picker-container">
        <div style={{ 
          width: '100%', 
          height: '300px', 
          borderRadius: '12px', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f0f0'
        }}>
          Loading Google Maps...
        </div>
      </div>
    );
  }

  return (
    <div className="location-picker-container">
      <div style={{ marginBottom: '1rem' }}>
        <Autocomplete
          onLoad={(autocomplete) => {
            autocompleteRef.current = autocomplete;
          }}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            type="text"
            placeholder="Search for a location..."
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          />
        </Autocomplete>
      </div>
      
      <GoogleMap
        mapContainerStyle={{
          width: '100%',
          height: '300px',
          borderRadius: '12px',
          marginBottom: '1rem'
        }}
        center={markerPosition}
        zoom={15}
        onLoad={onMapLoad}
        onClick={onMapClick}
        options={GOOGLE_MAPS_CONFIG.MAP_OPTIONS}
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

export default GoogleLocationPicker;
