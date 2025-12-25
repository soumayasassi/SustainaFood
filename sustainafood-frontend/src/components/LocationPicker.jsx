import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../assets/styles/LocationPicker.css';

const LocationPicker = ({
  isOpen,
  onClose,
  onLocationChange,
  onAddressChange,
  onSelect,
  initialAddress
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [location, setLocation] = useState({ type: 'Point', coordinates: [10.1658, 36.8188] });
  const [address, setAddress] = useState(initialAddress || '');

  useEffect(() => {
    if (!isOpen) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{
          id: 'osm',
          type: 'raster',
          source: 'osm',
        }],
      },
      center: location.coordinates,
      zoom: 12,
    });

    map.current.addControl(new maplibregl.NavigationControl());

    map.current.on('load', () => {
      marker.current = new maplibregl.Marker({ draggable: true, color: '#FF0000' })
        .setLngLat(location.coordinates)
        .addTo(map.current);

      marker.current.on('dragend', () => {
        const { lng, lat } = marker.current.getLngLat();
        updateLocation(lng, lat);
      });

      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        marker.current.setLngLat([lng, lat]);
        updateLocation(lng, lat);
      });

      if (!address && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => updateLocation(coords.longitude, coords.latitude, true),
          () => alert('Geolocation failed. Defaulting to Tunis.')
        );
      }
    });

    return () => {
      if (map.current) map.current.remove();
    };
  }, [isOpen]);

  const updateLocation = async (lng, lat, move = false) => {
    const newLoc = { type: 'Point', coordinates: [lng, lat] };
    setLocation(newLoc);
    onLocationChange(newLoc);

    const addr = await reverseGeocode(lng, lat);
    setAddress(addr);
    onAddressChange(addr);

    if (move) map.current?.flyTo({ center: [lng, lat], zoom: 15 });
  };

  const geocodeAddress = async (query) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        const lng = parseFloat(lon);
        const latNum = parseFloat(lat);
        marker.current?.setLngLat([lng, latNum]);
        map.current?.flyTo({ center: [lng, latNum], zoom: 15 });
        updateLocation(lng, latNum);
      } else {
        alert('Adresse introuvable.');
      }
    } catch (err) {
      alert('Échec de la géolocalisation par adresse.');
    }
  };

  const reverseGeocode = async (lng, lat) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lon=${lng}&lat=${lat}`);
      const data = await res.json();
      return data.display_name || 'Lieu inconnu';
    } catch {
      return 'Lieu inconnu';
    }
  };

  return isOpen ? (
    <div className="location-picker-localisation">
      <div className="address-search-localisation">
        <input
          className="signup-input-localisation"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Entrer une adresse"
        />
        <button className="search-button-localisation" onClick={() => geocodeAddress(address)}>Rechercher</button>
        <button
          className="geolocation-button-localisation"
          onClick={() => navigator.geolocation.getCurrentPosition(
            ({ coords }) => updateLocation(coords.longitude, coords.latitude, true),
            () => alert('Échec de la géolocalisation.')
          )}
        >
          📍
        </button>
      </div>
      <div ref={mapContainer} className="map-container-localisation" />
      <div className="location-picker-buttons-localisation">
        <button className="confirm-button-localisation" onClick={() => onSelect(location, address)}>Confirmer</button>
        <button className="cancel-button-localisation" onClick={onClose}>Annuler</button>
      </div>
    </div>
  ) : null;
};

export default LocationPicker;