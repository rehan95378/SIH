import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import RiskBadge from './RiskBadge';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createWellIcon = (type) => {
  const colors = {
    active: '#2563EB',
    normal: '#64748B',
    risk: '#F97316',
    critical: '#DC2626',
    selected: '#7C3AED',
  };
  const color = colors[type] || colors.normal;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    <path d="M16 0C7.16 0 0 7.16 0 16C0 26 16 40 16 40S32 26 32 16C32 7.16 24.84 0 16 0Z" fill="${color}"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
    ${type === 'active' ? '<circle cx="16" cy="16" r="3" fill="' + color + '"/>' : ''}
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

const WellMap = ({ activeWell, nearbyWells = [], onWellClick, radius = 20, height = '500px' }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);
  const [selectedWell, setSelectedWell] = useState(null);

  useEffect(() => {
    if (mapInstanceRef.current) return;
    
    const center = activeWell
      ? [activeWell.latitude, activeWell.longitude]
      : [27.385, 95.32];
    
    const map = L.map(mapRef.current, {
      center,
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (circleRef.current) circleRef.current.remove();

    // Add radius circle
    if (activeWell) {
      circleRef.current = L.circle(
        [activeWell.latitude, activeWell.longitude],
        { radius: radius * 1000, color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.03, weight: 1.5, dashArray: '6,6' }
      ).addTo(map);
    }

    // Add active well marker
    if (activeWell) {
      const marker = L.marker([activeWell.latitude, activeWell.longitude], {
        icon: createWellIcon('active'),
        zIndexOffset: 1000,
      }).addTo(map);

      marker.bindPopup(`
        <div style="min-width:200px;font-family:system-ui,sans-serif">
          <div style="font-weight:700;font-size:14px;color:#1e293b;margin-bottom:6px">🔵 ${activeWell.wellName}</div>
          <div style="font-size:12px;color:#475569"><b>Field:</b> ${activeWell.field}</div>
          <div style="font-size:12px;color:#475569"><b>Depth:</b> ${activeWell.currentDepth?.toLocaleString()}m</div>
          <div style="font-size:12px;color:#475569"><b>Formation:</b> ${activeWell.currentFormation || 'N/A'}</div>
          <div style="font-size:12px;color:#2563EB;font-weight:600;margin-top:4px">▶ ACTIVE WELL</div>
        </div>
      `);
      markersRef.current.push(marker);
    }

    // Add nearby well markers
    nearbyWells.forEach(well => {
      const isHighRisk = ['HIGH', 'CRITICAL'].includes(well.riskLevel);
      const iconType = well.riskLevel === 'CRITICAL' ? 'critical' : isHighRisk ? 'risk' : 'normal';
      
      const marker = L.marker([well.latitude, well.longitude], {
        icon: createWellIcon(iconType),
      }).addTo(map);

      const riskColor = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' };
      
      marker.bindPopup(`
        <div style="min-width:200px;font-family:system-ui,sans-serif">
          <div style="font-weight:700;font-size:14px;color:#1e293b;margin-bottom:6px">${well.wellName}</div>
          <div style="font-size:12px;color:#475569"><b>Field:</b> ${well.field}</div>
          <div style="font-size:12px;color:#475569"><b>Status:</b> ${well.status}</div>
          <div style="font-size:12px;color:#475569"><b>Depth:</b> ${well.currentDepth?.toLocaleString()}m</div>
          <div style="font-size:12px;color:#475569"><b>Formation:</b> ${well.currentFormation || 'N/A'}</div>
          ${well.distance !== undefined ? `<div style="font-size:12px;color:#2563EB"><b>Distance:</b> ${well.distance.toFixed(2)} km</div>` : ''}
          ${well.eventCount ? `<div style="font-size:12px;color:#7c3aed"><b>Historical Events:</b> ${well.eventCount}</div>` : ''}
          <div style="margin-top:6px;display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;background:${riskColor[well.riskLevel] || '#94a3b8'}22;color:${riskColor[well.riskLevel] || '#94a3b8'};border:1px solid ${riskColor[well.riskLevel] || '#94a3b8'}44">${well.riskLevel || 'LOW'} RISK</div>
        </div>
      `);
      
      marker.on('click', () => {
        setSelectedWell(well);
        onWellClick?.(well);
      });
      
      markersRef.current.push(marker);
    });

    // Fit bounds
    if (activeWell || nearbyWells.length > 0) {
      const allCoords = [
        ...(activeWell ? [[activeWell.latitude, activeWell.longitude]] : []),
        ...nearbyWells.map(w => [w.latitude, w.longitude]),
      ];
      if (allCoords.length > 0) {
        try {
          map.fitBounds(allCoords, { padding: [40, 40], maxZoom: 13 });
        } catch {}
      }
    }
  }, [activeWell, nearbyWells, radius]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapRef} style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }} />
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        background: 'white',
        borderRadius: 8,
        padding: '8px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        fontSize: 11,
        zIndex: 1000,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563EB' }} />
            <span style={{ color: '#475569' }}>Active Well</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#64748B' }} />
            <span style={{ color: '#475569' }}>Offset Well</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F97316' }} />
            <span style={{ color: '#475569' }}>High Risk Well</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#DC2626' }} />
            <span style={{ color: '#475569' }}>Critical Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellMap;
