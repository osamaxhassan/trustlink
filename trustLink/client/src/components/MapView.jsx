import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [28, 45],
  iconAnchor: [14, 45],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const technicianIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [28, 45],
  iconAnchor: [14, 45],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapViewController({ center, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [60, 60] });
    } else if (center) {
      map.flyTo(center, 14, { duration: 1.2 });
    }
  }, [center, bounds, map]);
  return null;
}

function LocationPicker({ onLocationSelected }) {
  useMapEvents({
    click(e) {
      onLocationSelected({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapView({ 
  userLocation, 
  technicianLocation, 
  customerName = 'Customer', 
  technicianName = 'Technician', 
  isDraggable = true,
  showCustomerPin = true,
  onSelectLocation 
}) {
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  useEffect(() => {
    let isCancelled = false;

    if (!userLocation || !technicianLocation) {
      return;
    }

    const url = `https://router.project-osrm.org/route/v1/driving/${technicianLocation.lng},${technicianLocation.lat};${userLocation.lng},${userLocation.lat}?overview=full&geometries=geojson`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (isCancelled) return;
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
          setRouteCoordinates(coords);
        } else {
          setRouteCoordinates([[technicianLocation.lat, technicianLocation.lng], [userLocation.lat, userLocation.lng]]);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setRouteCoordinates([[technicianLocation.lat, technicianLocation.lng], [userLocation.lat, userLocation.lng]]);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [userLocation, technicianLocation]);

  const defaultCenter = userLocation && showCustomerPin ? [userLocation.lat, userLocation.lng] : [24.8607, 67.0011];
  const bounds = routeCoordinates.length > 0 ? routeCoordinates : null;

  const eventHandlers = useMemo(
    () => ({
      dragend(e) {
        const marker = e.target;
        const position = marker.getLatLng();
        if (onSelectLocation) {
          onSelectLocation({ lat: position.lat, lng: position.lng });
        }
      },
    }),
    [onSelectLocation]
  );

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={14} 
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapViewController center={defaultCenter} bounds={bounds} />

      {onSelectLocation && <LocationPicker onLocationSelected={onSelectLocation} />}

      {showCustomerPin && userLocation && (
        <Marker 
          position={[userLocation.lat, userLocation.lng]} 
          icon={customerIcon}
          draggable={isDraggable}
          eventHandlers={eventHandlers}
        >
          <Popup>
            <div className="text-xs font-bold text-red-600">
              📍 {customerName} (Destination)
            </div>
          </Popup>
        </Marker>
      )}

      {technicianLocation && (
        <Marker position={[technicianLocation.lat, technicianLocation.lng]} icon={technicianIcon}>
          <Popup>
            <div className="text-xs font-bold text-trustGreen">
              🔧 {technicianName} (Origin)
            </div>
          </Popup>
        </Marker>
      )}

      {routeCoordinates.length > 0 && (
        <Polyline 
          positions={routeCoordinates} 
          pathOptions={{ color: '#E53935', weight: 6, opacity: 0.85 }} 
        />
      )}
    </MapContainer>
  );
}
