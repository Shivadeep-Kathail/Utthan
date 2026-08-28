import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';

/**
 * Fix Leaflet's default marker icon paths that break under bundlers.
 * Vite doesn't resolve the default icon URLs from leaflet's CSS.
 */
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Default center (India) when no location is selected yet
const DEFAULT_CENTER = [20.5937, 78.9629]; // [lat, lng] — Leaflet order
const DEFAULT_ZOOM = 5;
const SELECTED_ZOOM = 15;

/**
 * Debounce helper — returns a debounced version of `fn`.
 */
function useDebouncedCallback(fn, delay) {
  const timeoutRef = useRef(null);

  const debounced = useCallback(
    (...args) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  );

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return debounced;
}

/**
 * Inner component — handles map click events to reposition marker.
 */
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

/**
 * DraggableMarker — a marker the user can drag to fine-tune position.
 */
function DraggableMarker({ position, onDragEnd }) {
  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          onDragEnd(marker.getLatLng());
        }
      },
    }),
    [onDragEnd],
  );

  return (
    <Marker
      position={position}
      draggable
      ref={markerRef}
      eventHandlers={eventHandlers}
    />
  );
}

/**
 * LocationPicker — address search + interactive map.
 *
 * Props:
 *   value     — current location value: { type, coordinates: [lng, lat], address }
 *   onChange  — called with updated location object
 *   error     — error message to display
 *
 * Outputs GeoJSON-style: coordinates are [longitude, latitude].
 * Leaflet uses [latitude, longitude] internally — this component handles the swap.
 */
export function LocationPicker({ value, onChange, error }) {
  const [query, setQuery] = useState(value?.address ?? '');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef(null);

  // Convert GeoJSON [lng, lat] → Leaflet [lat, lng]
  const markerPosition =
    value?.coordinates?.length === 2
      ? [value.coordinates[1], value.coordinates[0]]
      : null;

  /**
   * Update form state with new position.
   * Accepts Leaflet's {lat, lng} and converts to GeoJSON [lng, lat].
   */
  const updatePosition = useCallback(
    (latlng, address) => {
      onChange({
        type: 'Point',
        coordinates: [latlng.lng, latlng.lat], // GeoJSON: [lng, lat]
        address: address || value?.address || '',
      });
    },
    [onChange, value?.address],
  );

  /**
   * Geocode an address string via Nominatim.
   */
  const geocode = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        {
          headers: {
            'User-Agent': 'Utthan/1.0 (utthan-campaign-app)',
          },
        },
      );
      const data = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedGeocode = useDebouncedCallback(geocode, 500);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    debouncedGeocode(val);
  };

  const handleSuggestionClick = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    const address = suggestion.display_name;

    setQuery(address);
    setSuggestions([]);

    updatePosition({ lat, lng }, address);

    // Fly the map to the selected location
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], SELECTED_ZOOM);
    }
  };

  const handleMarkerDrag = useCallback(
    (latlng) => {
      updatePosition(latlng);
    },
    [updatePosition],
  );

  const handleMapClick = useCallback(
    (latlng) => {
      updatePosition(latlng);
    },
    [updatePosition],
  );

  return (
    <div className="location-picker">
      {/* Address search */}
      <div className="location-picker-search">
        <label htmlFor="location-search" className="form-label">
          <MapPin className="inline size-4 mr-1" aria-hidden="true" />
          Campaign Location
        </label>
        <div className="location-picker-input-wrap">
          <Search
            className="location-picker-search-icon"
            aria-hidden="true"
          />
          <Input
            id="location-search"
            type="text"
            placeholder="Search for an address..."
            value={query}
            onChange={handleInputChange}
            className="location-picker-input"
            aria-describedby={error ? 'location-error' : undefined}
            aria-invalid={!!error}
            autoComplete="off"
          />
          {isSearching && (
            <span className="location-picker-searching">Searching…</span>
          )}
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <ul className="location-picker-suggestions" role="listbox">
            {suggestions.map((s) => (
              <li key={s.place_id} role="option">
                <button
                  type="button"
                  className="location-picker-suggestion"
                  onClick={() => handleSuggestionClick(s)}
                >
                  <MapPin className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span>{s.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <div className="location-picker-map-wrap">
        <MapContainer
          center={markerPosition || DEFAULT_CENTER}
          zoom={markerPosition ? SELECTED_ZOOM : DEFAULT_ZOOM}
          className="location-picker-map"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {markerPosition && (
            <DraggableMarker
              position={markerPosition}
              onDragEnd={handleMarkerDrag}
            />
          )}
        </MapContainer>
        <p className="location-picker-hint">
          Click the map or drag the marker to fine-tune the location.
        </p>
      </div>

      {error && (
        <p id="location-error" className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
