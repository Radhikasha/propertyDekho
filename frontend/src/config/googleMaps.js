// Google Maps Configuration
export const GOOGLE_MAPS_CONFIG = {
  // Replace with your actual Google Maps API key
  API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
  
  // Default map settings
  DEFAULT_CENTER: {
    lat: 20.5937, // India center
    lng: 78.9629
  },
  
  DEFAULT_ZOOM: 5,
  
  // Map options
  MAP_OPTIONS: {
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: true,
    rotateControl: true,
    fullscreenControl: true,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }
    ]
  },
  
  // Libraries to load - include 'marker' for AdvancedMarkerElement
  LIBRARIES: ['places', 'geometry', 'marker']
};

export default GOOGLE_MAPS_CONFIG;
