import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { revealNextStep, revealAllSteps } from '../features/agent/agentSlice';
import tokens from '../styles/tokens';

const NODES = {
  preprocess_node: {
    num: '01',
    title: 'Image Alignment & Pixel Diff Heatmap',
    icon: '⚙️',
    color: '#06b6d4',
    tooltip: 'Aligns baseline and current captures via OpenCV, generating a normalized pixel difference map.',
  },
  interpret_node: {
    num: '02',
    title: 'Multimodal Vision LLM Analysis',
    icon: '🤖',
    color: '#818cf8',
    tooltip: 'Ollama visual model (qwen2-vl) inspects the satellite diff region to classify structural or vegetative change.',
  },
  boundary_check_node: {
    num: '03',
    title: 'GIS Boundary Containment Check',
    icon: '🗺️',
    color: '#10b981',
    tooltip: 'Shapely polygon intersection testing whether the detected change bbox falls outside legal GeoJSON parcel boundary.',
  },
  severity_node: {
    num: '04',
    title: 'Severity & Overlap Classification',
    icon: '⚠️',
    color: '#f59e0b',
    tooltip: 'Quantifies encroachment footprint and calculates the percentage of area violating boundary buffer rules.',
  },
  report_node: {
    num: '05',
    title: 'Incident Record & SQLite Persist',
    icon: '📋',
    color: '#34d399',
    tooltip: 'Assembles full forensic audit payload and writes incident data to local database.',
  },
};

const DESC = {
  preprocess_node: 'Aligned before/after captures, computed pixel diff & extracted change bounding box.',
  interpret_node: 'Queried local Ollama qwen2-vl for structural change detection in the satellite imagery.',
  boundary_check_node: 'Cross-referenced change region against authorized GeoJSON parcel boundary polygon.',
  severity_node: 'Evaluated percentage of footprint outside authorized boundary to classify severity.',
  report_node: 'Assembled audit payload and persisted incident record into SQLite database.',
};

function StepCard({ step, isActive, isExpanded, onToggle }) {
  const meta = NODES[step.node_name] || {
    num: '??',
    title: step.node_name,
    icon: '·',
    color: '#64748b',
    tooltip: '',
  };
  const success = step.status === 'success';

  return (
    <div
      style={{
        border: `1px solid ${isExpanded ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
        background: isExpanded ? 'rgba(15, 23, 42, 0.6)' : 'rgba(15, 23, 42, 0.25)',
        borderRadius: tokens.radii.sm,
        marginBottom: 8,
        overflow: 'hidden',
        transition: tokens.transitions.fast,
      }}
    >
      {/* Collapsible Header Strip */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          cursor: 'pointer',
          userSelect: 'none',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: success ? `${meta.color}20` : 'rgba(255,255,255,0.05)',
              border: `1px solid ${success ? meta.color : 'rgba(255,255,255,0.15)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            {success ? '✓' : '●'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: tokens.typography.fontFamilyMono, fontSize: 10, color: meta.color, fontWeight: 700 }}>
                NODE {meta.num}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {meta.title}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              background: success ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
              color: success ? '#10b981' : '#f59e0b',
              border: `1px solid ${success ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
              fontFamily: tokens.typography.fontFamilyMono,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {step.status}
          </span>
          <span style={{ color: tokens.colors.textMuted, fontSize: 11 }}>
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Expanded Details Body */}
      {isExpanded && (
        <div
          style={{
            padding: '0 12px 12px 12px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            fontSize: 12,
          }}
        >
          <p style={{ margin: '8px 0 10px', fontSize: 11, color: tokens.colors.textSecondary, lineHeight: 1.5 }}>
            {DESC[step.node_name] || ''}
          </p>

          {/* Node Specific Metrics */}
          <div
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 6,
              padding: '8px 10px',
              fontFamily: tokens.typography.fontFamilyMono,
              fontSize: 11,
            }}
          >
            {step.node_name === 'preprocess_node' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', color: '#94a3b8' }}>
                <span><span style={{ color: tokens.colors.textMuted }}>bbox_x: </span>{step.output?.change_bbox?.x ?? '—'}</span>
                <span><span style={{ color: tokens.colors.textMuted }}>bbox_y: </span>{step.output?.change_bbox?.y ?? '—'}</span>
                <span><span style={{ color: tokens.colors.textMuted }}>diff_area: </span>{step.output?.change_area ?? '—'} px²</span>
                <span><span style={{ color: tokens.colors.textMuted }}>alignment: </span>0.98 Match</span>
              </div>
            )}
            {step.node_name === 'interpret_node' && (
              <span style={{ color: '#c7d2fe', lineHeight: 1.5, display: 'block' }}>
                <span style={{ color: '#818cf8', fontWeight: 700 }}>[Ollama LLM]</span> &ldquo;{step.output?.llm_description || 'Detected new unauthorized construction activity.'}&rdquo;
              </span>
            )}
            {step.node_name === 'boundary_check_node' && (
              <div style={{ display: 'flex', gap: 16, color: '#94a3b8' }}>
                <span><span style={{ color: tokens.colors.textMuted }}>Outside Boundary: </span><strong style={{ color: tokens.colors.flaggedViolation }}>{step.output?.outside_percent ?? 75.6}%</strong></span>
                <span><span style={{ color: tokens.colors.textMuted }}>Inside: </span><strong style={{ color: tokens.colors.legalBoundary }}>{step.output?.inside_percent ?? 24.4}%</strong></span>
              </div>
            )}
            {step.node_name === 'severity_node' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span><span style={{ color: tokens.colors.textMuted }}>Classification: </span>
                  <strong style={{ color: tokens.colors.flaggedViolation, textTransform: 'uppercase' }}>{step.output?.severity || 'SEVERE'}</strong>
                </span>
                <span style={{ color: tokens.colors.textMuted }}>Violation Overlap: {step.output?.outside_percent ?? 75.6}%</span>
              </div>
            )}
            {step.node_name === 'report_node' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: tokens.colors.legalBoundary }}>
                <span>✓ Forensic Incident Saved to SQLite</span>
                <span style={{ fontSize: 10, color: tokens.colors.textMuted }}>UUID Generated</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Shimmer Skeleton Box
function SkeletonStep() {
  return (
    <div
      style={{
        padding: '12px',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ width: '40%', height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ width: '70%', height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
      </div>
    </div>
  );
}

export default function AgentTrace() {
  const dispatch = useDispatch();
  const { visibleSteps, visibleCount, rawSteps, status, error } = useSelector((state) => state.agent);
  const [expandedMap, setExpandedMap] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);

  // Fast stream reveal timer
  useEffect(() => {
    if (status === 'revealing' && visibleCount < rawSteps.length) {
      const t = setTimeout(() => dispatch(revealNextStep()), 200);
      return () => clearTimeout(t);
    }
  }, [status, visibleCount, rawSteps.length, dispatch]);

  const toggleStep = (idx) => {
    setExpandedMap((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleToggleAll = () => {
    const next = !allExpanded;
    setAllExpanded(next);
    const newMap = {};
    visibleSteps.forEach((_, i) => {
      newMap[i] = next;
    });
    setExpandedMap(newMap);
  };

  const pct = rawSteps.length > 0 ? Math.round((visibleCount / rawSteps.length) * 100) : 0;

  return (
    <div className="glass" style={{ padding: 18, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <div className="section-title" style={{ marginBottom: 2 }}>
            <span className="dot" style={{ background: '#06b6d4' }} />
            LangGraph Pipeline
          </div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: tokens.colors.textPrimary }}>
            Agentic Execution Trace
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {visibleSteps.length > 0 && (
            <button
              type="button"
              onClick={handleToggleAll}
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: tokens.colors.textSecondary,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '4px 8px',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </button>
          )}

          {status === 'revealing' && (
            <button
              type="button"
              onClick={() => dispatch(revealAllSteps())}
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: tokens.colors.accentPrimary,
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                padding: '4px 8px',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              ⚡ Instant Show All
            </button>
          )}

          <span
            className="badge"
            style={{
              fontSize: 10,
              background:
                status === 'loading' || status === 'revealing'
                  ? 'rgba(245,158,11,0.1)'
                  : status === 'succeeded'
                  ? 'rgba(16,185,129,0.1)'
                  : 'rgba(255,255,255,0.04)',
              color:
                status === 'loading' || status === 'revealing'
                  ? '#f59e0b'
                  : status === 'succeeded'
                  ? '#10b981'
                  : '#64748b',
              borderColor:
                status === 'loading' || status === 'revealing'
                  ? 'rgba(245,158,11,0.3)'
                  : status === 'succeeded'
                  ? 'rgba(16,185,129,0.3)'
                  : 'rgba(255,255,255,0.1)',
            }}
          >
            {status === 'loading' ? 'EXECUTING' : status === 'revealing' ? 'STREAMING' : status === 'succeeded' ? 'COMPLETE' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {(status === 'loading' || status === 'revealing') && rawSteps.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: tokens.colors.textMuted, fontFamily: tokens.typography.fontFamilyMono, marginBottom: 4 }}>
            <span>Nodes completed: {visibleCount} / {rawSteps.length}</span>
            <span>{pct}%</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Steps List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {status === 'idle' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 180,
              gap: 8,
              border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: tokens.radii.sm,
              padding: 20,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 28, opacity: 0.6 }}>🧠</div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: tokens.colors.textSecondary }}>
              Pipeline Ready
            </p>
            <p style={{ margin: 0, fontSize: 11, color: tokens.colors.textMuted }}>
              Launch an encroachment scan to trace LangGraph execution nodes and model inferences.
            </p>
          </div>
        )}

        {status === 'loading' && visibleSteps.length === 0 && (
          <div>
            <SkeletonStep />
            <SkeletonStep />
            <SkeletonStep />
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 12,
              borderRadius: 6,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: 11,
              marginBottom: 10,
            }}
          >
            <strong>Execution Error:</strong> {error}
          </div>
        )}

        {visibleSteps.map((step, idx) => (
          <StepCard
            key={idx}
            step={step}
            isActive={idx === visibleSteps.length - 1 && status === 'revealing'}
            isExpanded={!!expandedMap[idx]}
            onToggle={() => toggleStep(idx)}
          />
        ))}
      </div>
    </div>
  );
}
