import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

export default function ImageComparisonSlider() {
  const { beforeUrl, afterUrl, diffUrl } = useSelector((state) => state.imagery);
  const { regions, activeRegionId } = useSelector((state) => state.boundary);
  const activeRegion = regions.find((r) => r.id === activeRegionId);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => { setRevealed(true); }, []);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPosition(pct);
  }, []);

  const onMouseDown = () => setIsDragging(true);
  const onMouseUp   = () => setIsDragging(false);
  const onMouseMove = (e) => { if (isDragging) handleMove(e.clientX); };
  const onTouchMove = (e) => { if (e.touches[0]) handleMove(e.touches[0].clientX); };

  const rightImage = showHeatmap ? diffUrl : afterUrl;

  return (
    <div className="glass" style={{ padding: 20, opacity: revealed ? 1 : 0, transition: 'opacity 0.5s' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div className="section-title" style={{ marginBottom: 4 }}>
            <span className="dot" style={{ background: '#22d3ee' }} />
            Temporal Satellite Imagery {activeRegion ? `· ${activeRegion.name}` : ''}
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
            {activeRegion ? `Inspection for ${activeRegion.name}` : 'Before / After Comparison'}
          </h3>
        </div>

        <label className="toggle-wrap" title="Toggle diff heatmap">
          <div className={`toggle-track ${showHeatmap ? 'on' : ''}`} onClick={() => setShowHeatmap(!showHeatmap)}>
            <div className="toggle-knob" />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: showHeatmap ? '#22d3ee' : 'var(--text-muted)' }}>
            {showHeatmap ? '🔥 Heatmap' : 'Diff Overlay'}
          </span>
        </label>
      </div>

      {/* Slider Container */}
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onMouseMove={onMouseMove}
        onTouchMove={onTouchMove}
        onTouchEnd={onMouseUp}
        style={{
          position: 'relative',
          width: '100%',
          height: 320,
          borderRadius: 12,
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'ew-resize',
          background: '#04070f',
          border: '1px solid rgba(255,255,255,0.06)',
          userSelect: 'none',
        }}
      >
        {/* Right (After/Heatmap) image — full width beneath */}
        <img
          src={rightImage}
          alt={showHeatmap ? 'Diff heatmap' : 'After'}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Left (Before) image — clipped */}
        <div style={{ position: 'absolute', inset: 0, width: `${sliderPosition}%`, overflow: 'hidden' }}>
          <img
            src={beforeUrl}
            alt="Before"
            style={{
              position: 'absolute',
              inset: 0,
              height: '100%',
              objectFit: 'cover',
              width: containerRef.current ? containerRef.current.clientWidth : '100%',
            }}
          />
        </div>

        {/* Divider Line */}
        <div style={{
          position: 'absolute',
          top: 0, bottom: 0,
          left: `${sliderPosition}%`,
          width: 2,
          background: 'linear-gradient(180deg, rgba(34,211,238,0.2), #22d3ee, rgba(34,211,238,0.2))',
          boxShadow: '0 0 14px rgba(34,211,238,0.8)',
          pointerEvents: 'none',
        }} />

        {/* Handle */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: `${sliderPosition}%`,
          transform: 'translate(-50%, -50%)',
          width: 36, height: 36,
          borderRadius: '50%',
          background: '#0d1525',
          border: '2px solid #22d3ee',
          boxShadow: '0 0 12px rgba(34,211,238,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#22d3ee',
          cursor: 'ew-resize',
          pointerEvents: 'none',
        }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
          </svg>
        </div>

        {/* Corner Labels */}
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          background: 'rgba(4,7,15,0.8)', backdropFilter: 'blur(8px)',
          padding: '4px 10px', borderRadius: 6,
          border: '1px solid rgba(34,211,238,0.2)',
          fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#22d3ee',
          pointerEvents: 'none',
        }}>
          BEFORE · Baseline
        </div>
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
          background: 'rgba(4,7,15,0.8)', backdropFilter: 'blur(8px)',
          padding: '4px 10px', borderRadius: 6,
          border: '1px solid rgba(244,63,94,0.2)',
          fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#f43f5e',
          pointerEvents: 'none',
        }}>
          {showHeatmap ? 'DIFF · Heatmap' : 'AFTER · Current'}
        </div>
      </div>

      {/* Footer hint */}
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
        <span>← Drag divider to compare imagery captures →</span>
        <span>0.5 m/px · Sentinel-2</span>
      </div>
    </div>
  );
}
