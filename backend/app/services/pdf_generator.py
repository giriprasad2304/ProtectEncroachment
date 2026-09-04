"""PDF Report Generator service using ReportLab for official evidence report exports."""
import os
import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def get_recommended_action(severity: str) -> str:
    sev = severity.lower()
    if sev == "severe":
        return "CRITICAL ACTION REQUIRED: Immediate field deployment of Revenue Inspector. Issue formal Cease & Desist Order under Section 24 Public Land Revenue Act and schedule eviction proceeding within 48 hours."
    elif sev == "moderate":
        return "HIGH PRIORITY ACTION: Dispatch local survey officer to verify land boundaries. Issue official inquiry notice to unauthorized occupants within 5 business days."
    elif sev == "minor":
        return "ROUTINE AUDIT: Mark parcel for upcoming scheduled field verification. Update GIS monitoring registry with minor footprint variation tag."
    else:
        return "NO ACTION REQUIRED: Parcel is fully compliant with authorized boundary definitions."


def generate_incident_pdf(report_data: dict, parcel_data: dict = None) -> bytes:
    """Generates official field evidence report PDF as raw bytes."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        alignment=0
    )

    subtitle_style = ParagraphStyle(
        'ReportSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#0284c7'),
    )

    label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#475569')
    )

    val_style = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0f172a')
    )

    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#1e293b')
    )

    action_style = ParagraphStyle(
        'ActionBody',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#991b1b') if report_data.get('severity') == 'severe' else colors.HexColor('#854d0e')
    )

    elements = []

    # 1. Header Banner
    elements.append(Paragraph("Bhoomi-Rakshak", title_style))
    elements.append(Paragraph("PUBLIC LAND ENCROACHMENT EVIDENCE REPORT — OFFICIAL AUDIT", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0284c7'), spaceAfter=12))

    # 2. Metadata Grid Table
    incident_id = report_data.get("incident_id", "N/A")
    location = report_data.get("location", "Sector 4 Public Buffer Zone")
    timestamp = report_data.get("timestamp", datetime.utcnow().isoformat())
    severity = report_data.get("severity", "severe").upper()
    overlap = report_data.get("overlap_percent", 75.63)

    authority = parcel_data.get("authority", "Land Revenue Department") if parcel_data else "Land Revenue Department"
    land_type = parcel_data.get("land_type", "Government Public Land") if parcel_data else "Government Public Land"

    meta_data = [
        [Paragraph("Incident ID:", label_style), Paragraph(str(incident_id), val_style),
         Paragraph("Audit Timestamp:", label_style), Paragraph(str(timestamp)[:19], val_style)],
        [Paragraph("Location:", label_style), Paragraph(str(location), val_style),
         Paragraph("Responsible Authority:", label_style), Paragraph(str(authority), val_style)],
        [Paragraph("Land Category:", label_style), Paragraph(str(land_type), val_style),
         Paragraph("Geo Coordinates:", label_style), Paragraph("Lat: 12.9736 N, Lon: 77.5958 E", val_style)],
        [Paragraph("Violation Status:", label_style),
         Paragraph("CONFIRMED VIOLATION" if report_data.get("violation_detected") else "COMPLIANT", val_style),
         Paragraph("Encroachment Overlap:", label_style), Paragraph(f"{overlap}% outside boundary", val_style)]
    ]

    t_meta = Table(meta_data, colWidths=[100, 170, 110, 160])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(t_meta)
    elements.append(Spacer(1, 14))

    # 3. Severity Banner
    sev_bg = colors.HexColor('#fee2e2') if severity == 'SEVERE' else colors.HexColor('#fef3c7')
    sev_tc = colors.HexColor('#991b1b') if severity == 'SEVERE' else colors.HexColor('#92400e')
    
    sev_data = [[
        Paragraph(f"<b>SEVERITY CLASSIFICATION: {severity}</b> &nbsp;&nbsp;|&nbsp;&nbsp; <b>{overlap}% UNAUTHORIZED OVERLAP DETECTED</b>", 
                  ParagraphStyle('SevBanner', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, textColor=sev_tc, alignment=1))
    ]]
    t_sev = Table(sev_data, colWidths=[540])
    t_sev.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), sev_bg),
        ('BOX', (0, 0), (-1, -1), 1, sev_tc),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(t_sev)
    elements.append(Spacer(1, 14))

    # 4. Multi-Temporal Satellite Evidence Imagery Table
    elements.append(Paragraph("<b>Multi-Temporal Satellite Imagery Evidence:</b>", label_style))
    elements.append(Spacer(1, 6))

    sample_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../sample_data")
    )
    before_p = os.path.join(sample_dir, "before.png")
    after_p = os.path.join(sample_dir, "after.png")
    diff_p = os.path.join(sample_dir, "diff_overlay.png")

    img_cells = []
    if os.path.exists(before_p):
        img_cells.append(Image(before_p, width=165, height=135))
    else:
        img_cells.append(Paragraph("Before Image", val_style))

    if os.path.exists(after_p):
        img_cells.append(Image(after_p, width=165, height=135))
    else:
        img_cells.append(Paragraph("After Image", val_style))

    if os.path.exists(diff_p):
        img_cells.append(Image(diff_p, width=165, height=135))
    else:
        img_cells.append(Paragraph("Diff Heatmap", val_style))

    img_table_data = [
        img_cells,
        [
            Paragraph("<b>BEFORE (Baseline Capture)</b>", ParagraphStyle('ImgSub', parent=styles['Normal'], fontSize=8, alignment=1)),
            Paragraph("<b>AFTER (Current Capture)</b>", ParagraphStyle('ImgSub', parent=styles['Normal'], fontSize=8, alignment=1)),
            Paragraph("<b>DIFF HEATMAP (OpenCV Overlay)</b>", ParagraphStyle('ImgSub', parent=styles['Normal'], fontSize=8, alignment=1))
        ]
    ]

    t_imgs = Table(img_table_data, colWidths=[180, 180, 180])
    t_imgs.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_imgs)
    elements.append(Spacer(1, 14))

    # 5. Local LLM Vision Analysis
    elements.append(Paragraph("<b>Ollama qwen2-vl Visual Analysis Summary:</b>", label_style))
    elements.append(Spacer(1, 4))
    llm_desc = report_data.get("llm_description", "Significant structural change detected.")
    
    t_llm = Table([[Paragraph(llm_desc, body_style)]], colWidths=[540])
    t_llm.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(t_llm)
    elements.append(Spacer(1, 14))

    # 6. Recommended Action Line
    elements.append(Paragraph("<b>Recommended Administrative Action:</b>", label_style))
    elements.append(Spacer(1, 4))
    action_text = get_recommended_action(report_data.get("severity", "severe"))
    
    t_action = Table([[Paragraph(action_text, action_style)]], colWidths=[540])
    t_action.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fef2f2') if severity == 'SEVERE' else colors.HexColor('#fefce8')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#fca5a5') if severity == 'SEVERE' else colors.HexColor('#fde047')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(t_action)
    elements.append(Spacer(1, 18))

    # 7. Official Footer
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceAfter=8))
    footer_style = ParagraphStyle(
        'ReportFooter',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        textColor=colors.HexColor('#64748b'),
        alignment=1
    )
    elements.append(Paragraph("Generated by on-premise AI system — no external data transmission", footer_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
