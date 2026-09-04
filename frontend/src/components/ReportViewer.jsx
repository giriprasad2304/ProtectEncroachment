import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { markFalsePositive } from '../features/report/reportSlice';
import { addToast } from '../features/ui/uiSlice';
import client from '../api/client';
import tokens from '../styles/tokens';

const SEVERITY_CONFIG = {
  none: { label: 'No Encroachment Detected', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', icon: '✓' },
  minor: { label: 'Minor Encroachment', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', icon: '⚠' },
  moderate: { label: 'Moderate Encroachment', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)', icon: '⚠' },
  severe: { label: 'Critical Encroachment Violation', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', icon: '🚨' },
};

function EmptyState() {
  return (
    <div
      className="glass"
      style={{
        padding: 32,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 220,
      }}
    >
      <div style={{ fontSize: 32, opacity: 0.4 }}>📋</div>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: tokens.colors.textSecondary }}>
        No Audit Report Generated
      </p>
      <p style={{ margin: 0, fontSize: 11, color: tokens.colors.textMuted, maxWidth: 360 }}>
        Select or draw an authorized boundary above, then launch an encroachment scan to generate a forensic audit dossier.
      </p>
    </div>
  );
}

export default function ReportViewer() {
  const dispatch = useDispatch();
  const { data, incidentId, isFalsePositive } = useSelector((state) => state.report);
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!data) return <EmptyState />;

  const activeId = incidentId || data.incident_id || 'demo_incident';
  const sev = SEVERITY_CONFIG[data.severity?.toLowerCase()] || SEVERITY_CONFIG.severe;

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    dispatch(
      addToast({
        type: 'info',
        title: 'Generating Audit Dossier',
        message: 'Building forensic PDF report with coordinate overlays...',
        duration: 3000,
      })
    );
    try {
      const link = document.createElement('a');
      link.href = `/api/report/${activeId}/pdf`;
      link.setAttribute('download', `bhoomi_rakshak_${activeId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      dispatch(
        addToast({
          type: 'success',
          title: 'PDF Downloaded',
          message: `Forensic audit report ${activeId.slice(0, 8)}.pdf saved.`,
        })
      );
    } catch (e) {
      dispatch(
        addToast({
          type: 'error',
          title: 'PDF Generation Error',
          message: e.message || 'Failed to download PDF dossier.',
        })
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleMarkFalsePositive = async () => {
    setIsFeedbackSubmitting(true);
    try {
      await client.post('/api/feedback', { incident_id: activeId, is_false_positive: true });
      dispatch(markFalsePositive());
      dispatch(
        addToast({
          type: 'warning',
          title: 'Marked as False Positive',
          message: 'Feedback submitted to SQLite feedback loop for model calibration.',
        })
      );
    } catch (e) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Feedback Submission Failed',
          message: e.message || 'Could not record feedback.',
        })
      );
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  return (
    <div className="glass animate-fadeUp" style={{ padding: 18 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div>
          <div className="section-title" style={{ marginBottom: 2 }}>
            <span className="dot" style={{ background: sev.color }} />
            Automated Forensic Incident Report
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: tokens.colors.textPrimary }}>
              {data.location}
            </h3>
            <span
              style={{
                fontFamily: tokens.typography.fontFamilyMono,
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(6, 182, 212, 0.1)',
                color: tokens.colors.accentPrimary,
                border: '1px solid rgba(6, 182, 212, 0.25)',
              }}
            >
              ID: {activeId.slice(0, 8)}
            </span>
            {isFalsePositive && (
              <span
                style={{
                  fontFamily: tokens.typography.fontFamilyMono,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                ⚡ Marked False Positive
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: 11 }}
          >
            <span>📥</span>
            <span>{isDownloading ? 'Downloading…' : 'Download PDF Report'}</span>
          </button>

          <button
            onClick={handleMarkFalsePositive}
            disabled={isFalsePositive || isFeedbackSubmitting}
            className="btn-ghost"
            style={{
              padding: '6px 12px',
              fontSize: 11,
              background: isFalsePositive ? 'rgba(16,185,129,0.1)' : undefined,
              borderColor: isFalsePositive ? 'rgba(16,185,129,0.3)' : undefined,
              color: isFalsePositive ? '#10b981' : undefined,
              cursor: isFalsePositive ? 'default' : 'pointer',
            }}
          >
            {isFalsePositive ? '✓ Marked False Positive' : '⊘ Mark False Positive'}
          </button>
        </div>
      </div>

      {/* Severity Banner */}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 8,
          marginBottom: 12,
          background: sev.bg,
          border: `1px solid ${sev.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{sev.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: sev.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {sev.label}
          </span>
        </div>
        <span style={{ fontSize: 11, fontFamily: tokens.typography.fontFamilyMono, fontWeight: 700, color: sev.color }}>
          SEVERITY: {data.severity?.toUpperCase()}
        </span>
      </div>

      {/* Key Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 12 }}>
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px' }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, color: tokens.colors.textMuted, fontFamily: tokens.typography.fontFamilyMono, textTransform: 'uppercase' }}>
            Compliance Status
          </p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isFalsePositive ? '#f59e0b' : data.violation_detected ? tokens.colors.flaggedViolation : tokens.colors.legalBoundary }}>
            {isFalsePositive ? '⚡ False Positive' : data.violation_detected ? '⚠️ Violation Confirmed' : '✓ Compliant'}
          </p>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px' }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, color: tokens.colors.textMuted, fontFamily: tokens.typography.fontFamilyMono, textTransform: 'uppercase' }}>
            Unauthorized Overlap
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: tokens.typography.fontFamilyMono, color: tokens.colors.flaggedViolation, lineHeight: 1 }}>
              {data.overlap_percent}
            </span>
            <span style={{ fontSize: 11, color: tokens.colors.textMuted }}>%</span>
          </div>
          <div className="progress-bar-track" style={{ marginTop: 6 }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(data.overlap_percent, 100)}%`,
                background: tokens.colors.flaggedViolation,
              }}
            />
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px' }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, color: tokens.colors.textMuted, fontFamily: tokens.typography.fontFamilyMono, textTransform: 'uppercase' }}>
            Incident Record UUID
          </p>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: tokens.colors.accentPrimary, fontFamily: tokens.typography.fontFamilyMono, wordBreak: 'break-all' }}>
            {activeId}
          </p>
        </div>
      </div>

      {/* LLM Interpretation Box */}
      <div style={{ background: 'rgba(129,140,248,0.05)', border: '1px solid rgba(129,140,248,0.18)', borderRadius: 8, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 14 }}>🤖</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#a5b4fc' }}>Ollama qwen2-vl Multimodal Description</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: '#c7d2fe', lineHeight: 1.55, fontStyle: 'italic', borderLeft: '2px solid rgba(129,140,248,0.4)', paddingLeft: 10 }}>
          &ldquo;{data.llm_description}&rdquo;
        </p>
      </div>
    </div>
  );
}
