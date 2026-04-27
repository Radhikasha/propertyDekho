import React, { useState, useEffect } from 'react';
import { FaHospital, FaSchool, FaUtensils, FaShoppingCart, FaGasPump, FaCoffee, FaDumbbell, FaBus, FaHotel, FaStore, FaSearch, FaMapMarkerAlt, FaPhone, FaClock } from 'react-icons/fa';
import './NearbyPlaces.css';

const NearbyPlaces = ({ coordinates }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
    const [error, setError] = useState('');

  const categories = [
    { id: 'all', name: 'All Places', icon: FaSearch, emoji: '🔍' },
    { id: 'school', name: 'Schools', icon: FaSchool, emoji: '🏫' },
    { id: 'hospital', name: 'Hospitals', icon: FaHospital, emoji: '🏥' },
    { id: 'shopping', name: 'Malls / Stores', icon: FaShoppingCart, emoji: '🛍️' },
    { id: 'transport', name: 'Metro / Bus stops', icon: FaBus, emoji: '🚇' },
    { id: 'restaurant', name: 'Restaurants', icon: FaUtensils, emoji: '🍽️' }
  ];

  const categoryQueries = {
    school: 'amenity=school',
    hospital: 'amenity=hospital',
    shopping: 'shop',
    transport: 'highway=bus_stop',
    restaurant: 'amenity=restaurant',
    all: 'amenity'
  };

  useEffect(() => {
    if (coordinates) {
      searchNearbyPlaces();
    }
  }, [coordinates, selectedCategory]);

  const searchNearbyPlaces = async () => {
    if (!coordinates) return;

    setLoading(true);
    setError('');
    
    try {
      const [lat, lng] = coordinates.split(',').map(Number);
      
      // Validate coordinates
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinates format');
      }

      // Define multiple query sets for each category
      const querySets = {
        school: ['amenity=school', 'amenity=university', 'amenity=college'],
        hospital: ['amenity=hospital', 'amenity=clinic', 'amenity=pharmacy'],
        shopping: ['shop', 'amenity=supermarket', 'amenity=mall', 'amenity=convenience'],
        transport: ['highway=bus_stop', 'railway=station', 'railway=tram_stop', 'amenity=bus_station'],
        restaurant: ['amenity=restaurant', 'amenity=fast_food', 'amenity=cafe', 'amenity=food_court'],
        all: ['amenity', 'shop', 'highway=bus_stop', 'railway=station']
      };

      const queries = querySets[selectedCategory];
      
      // Try multiple Overpass API endpoints with fallback
      const endpoints = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://z.overpass-api.de/api/interpreter'
      ];

      let allElements = [];
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          // Process each query separately and combine results
          for (const query of queries) {
            const overpassQuery = `
              [out:json][timeout:15];
              (
                node[${query}](around:5000,${lat},${lng});
                way[${query}](around:5000,${lat},${lng});
                relation[${query}](around:5000,${lat},${lng});
              );
              out center;
            `;

            console.log('Trying endpoint:', endpoint);
            console.log('Overpass Query:', overpassQuery);
            console.log('Coordinates:', lat, lng);

            const response = await fetch(endpoint, {
              method: 'POST',
              body: overpassQuery,
              headers: {
                'Content-Type': 'text/plain'
              }
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('Overpass API Error:', errorText);
              lastError = new Error(`API Error: ${response.status} - ${errorText}`);
              continue;
            }

            const data = await response.json();
            console.log('Overpass Response:', data);
            
            if (data.elements) {
              allElements = allElements.concat(data.elements);
            }
          }
          
          if (allElements.length > 0) break;
        } catch (err) {
          console.error(`Endpoint ${endpoint} failed:`, err);
          lastError = err;
          continue;
        }
      }

      if (allElements.length === 0) {
        throw lastError || new Error('All endpoints failed');
      }

      // Remove duplicates based on ID
      const uniqueElements = allElements.filter((element, index, self) => 
        index === self.findIndex((e) => e.id === element.id)
      );

      if (uniqueElements.length === 0) {
        // Fallback: try broader search with larger radius
        console.log('No places found, trying fallback search...');
        try {
          const fallbackQuery = `
            [out:json][timeout:15];
            (
              node[amenity](around:10000,${lat},${lng});
              way[amenity](around:10000,${lat},${lng});
              relation[amenity](around:10000,${lat},${lng});
            );
            out center;
          `;
          
          const fallbackResponse = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: fallbackQuery,
            headers: {
              'Content-Type': 'text/plain'
            }
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.elements && fallbackData.elements.length > 0) {
              const fallbackPlaces = fallbackData.elements.slice(0, 5).map(element => ({
                id: element.id,
                name: element.tags?.name || 'Unknown Place',
                type: element.tags?.amenity || element.tags?.shop || 'place',
                category: getCategory(element.tags),
                lat: element.lat || element.center?.lat,
                lng: element.lon || element.center?.lon,
                address: formatAddress(element.tags),
                phone: element.tags?.phone || '',
                openingHours: element.tags?.opening_hours || '',
                distance: calculateDistance(lat, lng, element.lat || element.center?.lat, element.lon || element.center?.lon)
              })).filter(place => place.lat && place.lng).sort((a, b) => a.distance - b.distance);
              
              console.log('Fallback places found:', fallbackPlaces);
              setPlaces(fallbackPlaces);
              return;
            }
          }
        } catch (fallbackErr) {
          console.error('Fallback search failed:', fallbackErr);
        }
        
        setPlaces([]);
        return;
      }

      const placesData = uniqueElements.map(element => ({
        id: element.id,
        name: element.tags?.name || 'Unknown Place',
        type: element.tags?.amenity || element.tags?.shop || element.tags?.tourism || element.tags?.highway || element.tags?.railway || 'place',
        category: getCategory(element.tags),
        lat: element.lat || element.center?.lat,
        lng: element.lon || element.center?.lon,
        address: formatAddress(element.tags),
        phone: element.tags?.phone || '',
        openingHours: element.tags?.opening_hours || '',
        distance: calculateDistance(lat, lng, element.lat || element.center?.lat, element.lon || element.center?.lon)
      })).filter(place => place.lat && place.lng).sort((a, b) => a.distance - b.distance);

      console.log('Processed Places:', placesData);
      setPlaces(placesData);
    } catch (err) {
      console.error('Error fetching nearby places:', err);
      setError(`Unable to fetch nearby places: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getCategory = (tags) => {
    if (tags.amenity === 'school') return 'school';
    if (tags.amenity === 'hospital') return 'hospital';
    if (tags.shop) return 'shopping';
    if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food' || tags.amenity === 'cafe' || tags.amenity === 'food_court') return 'restaurant';
    if (tags.highway === 'bus_stop' || tags.railway === 'station') return 'transport';
    return 'other';
  };

  const formatAddress = (tags) => {
    const parts = [];
    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:housenumber']) parts.unshift(tags['addr:housenumber']);
    if (tags['addr:city']) parts.push(tags['addr:city']);
    if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
    return parts.join(', ') || 'Address not available';
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  const getCategoryIcon = (category) => {
    const categoryObj = categories.find(cat => cat.id === category);
    return categoryObj ? categoryObj.icon : FaMapMarkerAlt;
  };

  if (!coordinates) {
    return (
      <div className="nearby-places-container">
        <h3>Nearby Places</h3>
        <p>Location coordinates not available</p>
      </div>
    );
  }

  return (
    <div className="nearby-places-container">
      <h3>Nearby Places</h3>
      
      <div className="places-controls">
        <div className="category-buttons">
          <label>Show nearby:</label>
          <div className="emoji-buttons">
            {categories.map(category => (
              <button
                key={category.id}
                className={`emoji-btn ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
                title={category.name}
              >
                <span className="emoji">{category.emoji}</span>
                <span className="btn-text">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-places">
          <div className="spinner"></div>
          <p>Searching nearby places...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={searchNearbyPlaces} className="retry-btn">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="places-list">
          {places.length === 0 ? (
            <p className="no-places">No places found nearby</p>
          ) : (
            places.map(place => {
              const IconComponent = getCategoryIcon(place.category);
              return (
                <div key={place.id} className="place-item">
                  <div className="place-header">
                    <IconComponent className="place-icon" />
                    <div className="place-info">
                      <h4 className="place-name">{place.name}</h4>
                      <p className="place-type">{place.type}</p>
                    </div>
                    <div className="place-distance">
                      {place.distance}m away
                    </div>
                  </div>
                  
                  <div className="place-details">
                    {place.address && (
                      <p className="place-address">
                        <FaMapMarkerAlt className="detail-icon" />
                        {place.address}
                      </p>
                    )}
                    {place.phone && (
                      <p className="place-phone">
                        <FaPhone className="detail-icon" />
                        {place.phone}
                      </p>
                    )}
                    {place.openingHours && (
                      <p className="place-hours">
                        <FaClock className="detail-icon" />
                        {place.openingHours}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default NearbyPlaces;
