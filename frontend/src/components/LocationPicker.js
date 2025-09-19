
import React, { useEffect, useRef, useState } from 'react';
import './LocationPicker.css';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2F1aGFyZDA0IiwiYSI6ImNtZm00a3FkZDA5NzkyanFzNWtqYWloa2gifQ.xg8zBaf8sLD87nx7MLChfg';
const DEFAULT_CENTER = [78.9629, 20.5937]; // [lng, lat]

const LocationPicker = ({ value, onChange }) => {
  const mapContainer = useRef(null);
  const markerRef = useRef(null);
  const [coords, setCoords] = useState(
    value
      ? value.split(',').map(Number)
      : [DEFAULT_CENTER[1], DEFAULT_CENTER[0]]
  );

  useEffect(() => {
    if (!window.mapboxgl) {
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = () => initMap();
      document.body.appendChild(script);
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    } else {
      initMap();
    }
    // eslint-disable-next-line
  }, []);

  const initMap = () => {
    window.mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new window.mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [coords[1], coords[0]],
      zoom: 5,
    });
    markerRef.current = new window.mapboxgl.Marker({ draggable: true })
      .setLngLat([coords[1], coords[0]])
      .addTo(map);

    markerRef.current.on('dragend', () => {
      const lngLat = markerRef.current.getLngLat();
      setCoords([lngLat.lat, lngLat.lng]);
      onChange(`${lngLat.lat}, ${lngLat.lng}`);
    });

    map.on('click', (e) => {
      markerRef.current.setLngLat(e.lngLat);
      setCoords([e.lngLat.lat, e.lngLat.lng]);
      onChange(`${e.lngLat.lat}, ${e.lngLat.lng}`);
    });
  };

  const handleUseLiveLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoords([lat, lng]);
          onChange(`${lat}, ${lng}`);
          if (markerRef.current) {
            markerRef.current.setLngLat([lng, lat]);
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
      <div ref={mapContainer} style={{ width: '100%', height: '300px', borderRadius: '12px', marginBottom: '1rem' }} />
      <button type="button" className="live-location-btn" onClick={handleUseLiveLocation} style={{marginBottom: '1rem', padding: '0.5rem 1rem', borderRadius: '8px', background: '#4a90e2', color: '#fff', border: 'none', cursor: 'pointer'}}>Use Live Location</button>
      <div className="location-coords">
        <strong>Selected Coordinates:</strong> {coords[0].toFixed(6)}, {coords[1].toFixed(6)}
      </div>
    </div>
  );
};

export default LocationPicker;
