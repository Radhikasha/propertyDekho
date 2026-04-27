import React, { useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import GOOGLE_MAPS_CONFIG from '../config/googleMaps';

const GoogleStaticMap = ({ coordinates }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_CONFIG.API_KEY,
    libraries: GOOGLE_MAPS_CONFIG.LIBRARIES
  });

  const mapRef = useRef(null);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    
    // Create AdvancedMarkerElement
    if (window.google && window.google.maps && window.google.maps.marker && coordinates) {
      const coordsArray = coordinates.split(',').map(Number);
      const position = {
        lat: coordsArray[0],
        lng: coordsArray[1]
      };
      
      new window.google.maps.marker.AdvancedMarkerElement({
        position: position,
        map: map
      });
    }
  }, [coordinates]);

  const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '12px'
  };

  if (!coordinates) {
    return (
      <div style={mapContainerStyle}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          backgroundColor: '#f0f0f0',
          borderRadius: '12px'
        }}>
          Location not available
        </div>
      </div>
    );
  }

  const coordsArray = coordinates.split(',').map(Number);
  const position = {
    lat: coordsArray[0],
    lng: coordsArray[1]
  };

  if (!isLoaded) {
    return (
      <div style={mapContainerStyle}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          backgroundColor: '#f0f0f0',
          borderRadius: '12px'
        }}>
          Loading map...
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={position}
      zoom={12}
      onLoad={onMapLoad}
      options={{
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        gestureHandling: 'none',
        keyboardShortcuts: false,
        disableDoubleClickZoom: true,
        scrollwheel: false,
        draggable: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      }}
    />
  );
};

export default GoogleStaticMap;
