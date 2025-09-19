import React, { useEffect, useRef } from 'react';

const MAPBOX_TOKEN = 'write your api key here';

const MapboxStaticMap = ({ coordinates }) => {
  const mapContainer = useRef(null);
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
  }, [coordinates]);

  const initMap = () => {
    window.mapboxgl.accessToken = MAPBOX_TOKEN;
    const coordsArr = coordinates.split(',').map(Number);
    const map = new window.mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [coordsArr[1], coordsArr[0]],
      zoom: 12,
      interactive: false,
    });
    new window.mapboxgl.Marker()
      .setLngLat([coordsArr[1], coordsArr[0]])
      .addTo(map);
  };

  return <div ref={mapContainer} style={{ width: '100%', height: '300px', borderRadius: '12px' }} />;
};

export default MapboxStaticMap;
