import React from 'react';
import RiskBadge from './RiskBadge';
import { AlertTriangle, Info } from 'lucide-react';

const DigitalWellTwin = ({ well, events = [], currentDepth }) => {
  if (!well) return <div className="text-slate-400 text-sm p-4">Select a well to view the digital twin.</div>;

  const formations = well.formations || [];
  const targetDepth = well.targetDepth || 3500;
  const activeDepth = currentDepth || well.currentDepth || 0;

  const getDepthPercent = (depth) => Math.min((depth / targetDepth) * 100, 100);

  const formationColors = [
    '#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc',
    '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1',
  ];

  const severityColors = {
    LOW: { bg: '#dcfce7', border: '#16a34a', text: '#15803d' },
    MEDIUM: { bg: '#fef3c7', border: '#d97706', text: '#b45309' },
    HIGH: { bg: '#ffedd5', border: '#ea580c', text: '#c2410c' },
    CRITICAL: { bg: '#fee2e2', border: '#dc2626', text: '#b91c1c' },
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800">{well.wellName} — Digital Well Twin</h3>
          <p className="text-xs text-slate-400 mt-0.5">Representative stratigraphic visualization</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Target Depth</div>
          <div className="text-sm font-bold text-slate-700">{targetDepth.toLocaleString()}m</div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Well Column */}
        <div className="relative flex-1" style={{ minHeight: '500px' }}>
          {/* Depth scale */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-2">
            {[0, 25, 50, 75, 100].map(pct => (
              <span key={pct} className="text-xs text-slate-400" style={{ lineHeight: 1 }}>
                {Math.round(pct * targetDepth / 100)}m
              </span>
            ))}
          </div>

          {/* Well Borehole */}
          <div className="ml-14 relative rounded-lg overflow-hidden" style={{ height: '500px', width: '120px' }}>
            {/* Formations */}
            {formations.map((f, idx) => {
              const top = getDepthPercent(f.topDepth);
              const height = getDepthPercent(f.bottomDepth) - top;
              return (
                <div
                  key={f.name}
                  style={{
                    position: 'absolute',
                    top: `${top}%`,
                    height: `${height}%`,
                    left: 0,
                    right: 0,
                    background: formationColors[idx % formationColors.length],
                    borderBottom: '1px solid #e2e8f0',
                  }}
                  title={`${f.name}: ${f.topDepth}m — ${f.bottomDepth}m`}
                >
                  <div style={{ padding: '2px 6px', fontSize: 9, color: '#475569', fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {f.name}
                  </div>
                </div>
              );
            })}

            {/* Casing indicator */}
            <div style={{ position: 'absolute', top: 0, left: '20%', width: '60%', height: `${getDepthPercent(Math.min(activeDepth * 0.6, targetDepth * 0.5))}%`, border: '2px solid #94a3b8', borderBottom: 'none', background: 'transparent', zIndex: 5 }} title="Casing string" />

            {/* Events */}
            {events.map((event, idx) => {
              const colors = severityColors[event.severity] || severityColors.MEDIUM;
              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    top: `${getDepthPercent(event.depth)}%`,
                    left: 0,
                    right: 0,
                    zIndex: 10,
                  }}
                  title={`${event.eventType?.replace(/_/g, ' ')} at ${event.depth}m`}
                >
                  <div style={{
                    height: 2,
                    background: colors.border,
                    margin: '0 10%',
                  }} />
                  <div style={{
                    position: 'absolute',
                    right: '-105px',
                    top: '-8px',
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontSize: 9,
                    color: colors.text,
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                  }}>
                    ⚠ {event.eventType?.replace(/_/g, ' ')} {event.depth}m
                  </div>
                </div>
              );
            })}

            {/* Current Depth Indicator */}
            <div
              style={{
                position: 'absolute',
                top: `${getDepthPercent(activeDepth)}%`,
                left: 0,
                right: 0,
                zIndex: 20,
              }}
            >
              <div style={{ height: 3, background: '#2563EB', margin: 0 }} />
              <div style={{
                position: 'absolute',
                left: '-105px',
                top: '-8px',
                background: '#eff6ff',
                border: '2px solid #2563EB',
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 9,
                color: '#1d4ed8',
                whiteSpace: 'nowrap',
                fontWeight: 700,
              }}>
                ▶ Current: {activeDepth}m
              </div>
            </div>

            {/* Target Depth */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15 }}>
              <div style={{ height: 2, background: '#7c3aed', margin: 0 }} />
            </div>
          </div>
        </div>

        {/* Event Legend */}
        {events.length > 0 && (
          <div className="w-48 space-y-2">
            <p className="text-xs font-semibold text-slate-600 mb-2">Historical Events</p>
            {events.slice(0, 6).map((event, idx) => {
              const colors = severityColors[event.severity] || severityColors.MEDIUM;
              return (
                <div key={idx} style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '6px 8px' }}>
                  <div className="text-xs font-semibold" style={{ color: colors.text }}>
                    {event.eventType?.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-slate-500">{event.depth}m · {event.formation || 'N/A'}</div>
                  {event.mitigation && (
                    <div className="text-xs text-slate-400 mt-1 truncate" title={event.mitigation}>
                      {event.mitigation.substring(0, 60)}...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2 text-xs text-slate-400">
        <Info className="w-3 h-3" />
        Visualization uses actual well formation and event data from the knowledge base.
      </div>
    </div>
  );
};

export default DigitalWellTwin;
