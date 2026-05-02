import { useState, useCallback, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { stateData } from "./stateData";
import "./App.css";

/** GeoJSON polygon style aligned with typical GitHub/geo previews: sage fill, charcoal strokes */
const GEO_STYLE = {
  fill: "#88b2a1",
  fillOpacity: 0.55,
  stroke: "#333333",
  weight: 1,
  hoverFill: "#7aab95",
  hoverOpacity: 0.62,
  selectedFill: "#6b957c",
  selectedOpacity: 0.68,
  selectedStroke: "#2a2a2a",
  selectedWeight: 1.25,
};

/** GADM GeoJSON NAME_1 (and similar) → keys used in stateData */
const GEO_NAME_TO_APP_STATE = {
  Orissa: "Odisha",
  "Andaman and Nicobar": "Andaman & Nicobar",
  Delhi: "Delhi (NCT)",
  "Jammu and Kashmir": "Jammu & Kashmir",
  Uttaranchal: "Uttarakhand",
  "Dadra and Nagar Haveli": "Dadra & Nagar Haveli and Daman & Diu",
  "Daman and Diu": "Dadra & Nagar Haveli and Daman & Diu",
};

function normalizeStateLabel(raw) {
  if (!raw || raw === "Unknown") return raw;
  return GEO_NAME_TO_APP_STATE[raw] ?? raw;
}

function Tooltip({ state, position }) {
  if (!state || !position) return null;
  const info = stateData[state] || {};

  return (
    <div
      className="tooltip"
      style={{
        left: position.x + 18,
        top: position.y - 10,
        position: "fixed",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div className="tooltip-header">
        <span className="tooltip-name">{state}</span>
        {info.established && (
          <span className="tooltip-badge">Est. {info.established}</span>
        )}
      </div>
      <div className="tooltip-body">
        {info.capital && (
          <div className="tooltip-row">
            <span className="tooltip-label">🏛 Capital</span>
            <span className="tooltip-value">{info.capital}</span>
          </div>
        )}
        {info.population && (
          <div className="tooltip-row">
            <span className="tooltip-label">👥 Population</span>
            <span className="tooltip-value">{info.population}</span>
          </div>
        )}
        {info.area && (
          <div className="tooltip-row">
            <span className="tooltip-label">📐 Area</span>
            <span className="tooltip-value">{info.area}</span>
          </div>
        )}
        {info.language && (
          <div className="tooltip-row">
            <span className="tooltip-label">🗣 Language</span>
            <span className="tooltip-value">{info.language}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoPanel({ state, onClose }) {
  if (!state) return null;
  const info = stateData[state] || {};

  return (
    <div className="info-panel">
      <button className="info-close" onClick={onClose}>✕</button>
      <div className="info-accent" />
      <h2 className="info-title">{state}</h2>
      {info.established && (
        <span className="info-badge">Est. {info.established}</span>
      )}
      <div className="info-grid">
        {info.capital && (
          <div className="info-item">
            <div className="info-icon">🏛</div>
            <div>
              <div className="info-item-label">Capital</div>
              <div className="info-item-value">{info.capital}</div>
            </div>
          </div>
        )}
        {info.population && (
          <div className="info-item">
            <div className="info-icon">👥</div>
            <div>
              <div className="info-item-label">Population</div>
              <div className="info-item-value">{info.population}</div>
            </div>
          </div>
        )}
        {info.area && (
          <div className="info-item">
            <div className="info-icon">📐</div>
            <div>
              <div className="info-item-label">Total Area</div>
              <div className="info-item-value">{info.area}</div>
            </div>
          </div>
        )}
        {info.language && (
          <div className="info-item">
            <div className="info-icon">🗣</div>
            <div>
              <div className="info-item-label">Language(s)</div>
              <div className="info-item-value">{info.language}</div>
            </div>
          </div>
        )}
      </div>
      <div className="info-footer">Tap map to dismiss</div>
    </div>
  );
}

export default function App() {
  const [hoveredState, setHoveredState] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [geoData, setGeoData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/pritiranjan-01/map-explorer/main/public/india-states.geojson")
      .then((r) => r.json())
      .then((d) => { setGeoData(d); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  const getStateName = (feature) => {
    const raw =
      feature?.properties?.NAME_1 ||
      feature?.properties?.ST_NM ||
      feature?.properties?.name ||
      "Unknown";
    return normalizeStateLabel(raw);
  };

  const styleFeature = useCallback(
    (feature) => {
      const name = getStateName(feature);
      const isHovered = hoveredState === name;
      const isSelected = selectedState === name;
      return {
        fillColor: isSelected
          ? GEO_STYLE.selectedFill
          : isHovered
            ? GEO_STYLE.hoverFill
            : GEO_STYLE.fill,
        fillOpacity: isSelected
          ? GEO_STYLE.selectedOpacity
          : isHovered
            ? GEO_STYLE.hoverOpacity
            : GEO_STYLE.fillOpacity,
        color: isSelected ? GEO_STYLE.selectedStroke : GEO_STYLE.stroke,
        weight: isSelected ? GEO_STYLE.selectedWeight : GEO_STYLE.weight,
      };
    },
    [hoveredState, selectedState]
  );

  const onEachFeature = useCallback((feature, layer) => {
    const name = getStateName(feature);
    layer.on({
      mouseover: (e) => {
        setHoveredState(name);
        e.target.bringToFront();
      },
      mouseout: () => setHoveredState(null),
      click: () => setSelectedState((p) => (p === name ? null : name)),
    });
  }, []);

  const handleMouseMove = useCallback((e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <div className="app" onMouseMove={handleMouseMove}>
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <span className="header-flag">🇮🇳</span>
            <div>
              <h1 className="header-title">India Explorer</h1>
              <p className="header-subtitle">Interactive State &amp; UT Map</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat">
              <span className="stat-num">28</span>
              <span className="stat-label">States</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">8</span>
              <span className="stat-label">UTs</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">1.44B</span>
              <span className="stat-label">People</span>
            </div>
          </div>
        </div>
        {hoveredState && (
          <div className="hover-indicator">
            <span className="pulse-dot" />
            {hoveredState}
          </div>
        )}
      </header>

      <main className="map-wrapper">
        {isLoading ? (
          <div className="loading">
            <div className="spinner" />
            <p>Loading India Map…</p>
          </div>
        ) : (
          <MapContainer
            center={[22.5, 82.5]}
            zoom={5}
            minZoom={4}
            maxZoom={8}
            zoomControl={false}
            className="map-container"
            onClick={() => setSelectedState(null)}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            <ZoomControl position="bottomright" />
            {geoData && (
              <GeoJSON
                key={`${hoveredState}-${selectedState}`}
                data={geoData}
                style={styleFeature}
                onEachFeature={onEachFeature}
              />
            )}
          </MapContainer>
        )}

        <Tooltip state={hoveredState} position={mousePos} />

        {selectedState && (
          <InfoPanel
            state={selectedState}
            onClose={() => setSelectedState(null)}
          />
        )}
      </main>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: GEO_STYLE.fill }} />
          <span>State / UT</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: GEO_STYLE.hoverFill }} />
          <span>Hover</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: GEO_STYLE.selectedFill }} />
          <span>Selected</span>
        </div>
        <div className="legend-hint">Hover for info · Click to pin</div>
      </div>
    </div>
  );
}
