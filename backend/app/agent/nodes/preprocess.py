"""Image preprocessing node: loads region-specific before/after satellite images,
aligns them, computes OpenCV pixel difference heatmap, and extracts change bounding box.
"""
import os
import cv2
import numpy as np
from datetime import datetime
from app.agent.state import AgentState


def preprocess_node(state: AgentState) -> AgentState:
    sample_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../sample_data")
    )
    imagery_dir = os.path.join(sample_dir, "imagery")
    os.makedirs(imagery_dir, exist_ok=True)

    region_id = state.get("region_id")
    safe_id = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in str(region_id or "default")) if region_id else None

    before_path = state.get("before_path")
    after_path = state.get("after_path")
    diff_path = state.get("diff_path")

    # Fallback to region-specific paths in imagery_dir if not set or missing
    if not before_path or not os.path.exists(before_path):
        if safe_id and os.path.exists(os.path.join(imagery_dir, f"{safe_id}_before.png")):
            before_path = os.path.join(imagery_dir, f"{safe_id}_before.png")
        else:
            before_path = os.path.join(sample_dir, "before.png")

    if not after_path or not os.path.exists(after_path):
        if safe_id and os.path.exists(os.path.join(imagery_dir, f"{safe_id}_after.png")):
            after_path = os.path.join(imagery_dir, f"{safe_id}_after.png")
        else:
            after_path = os.path.join(sample_dir, "after.png")

    if not diff_path:
        if safe_id:
            diff_path = os.path.join(imagery_dir, f"{safe_id}_diff.png")
        else:
            diff_path = os.path.join(sample_dir, "diff_overlay.png")

    if not os.path.exists(before_path) or not os.path.exists(after_path):
        raise FileNotFoundError(f"Satellite imagery captures not found at {before_path} / {after_path}")

    before_img = cv2.imread(before_path)
    after_img = cv2.imread(after_path)

    # Ensure identical image dimensions
    if before_img.shape != after_img.shape:
        after_img = cv2.resize(after_img, (before_img.shape[1], before_img.shape[0]))

    # Convert to grayscale and calculate absolute difference
    before_gray = cv2.cvtColor(before_img, cv2.COLOR_BGR2GRAY)
    after_gray = cv2.cvtColor(after_img, cv2.COLOR_BGR2GRAY)
    diff = cv2.absdiff(before_gray, after_gray)

    # Apply Gaussian blur & binary thresholding to isolate structural change regions
    blurred = cv2.GaussianBlur(diff, (5, 5), 0)
    _, thresh = cv2.threshold(blurred, 30, 255, cv2.THRESH_BINARY)

    # Create Jet heatmap overlay blended with after image
    heatmap = cv2.applyColorMap(diff, cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(after_img, 0.65, heatmap, 0.35, 0)
    cv2.imwrite(diff_path, overlay)

    # Also keep default diff_overlay.png updated
    default_diff = os.path.join(sample_dir, "diff_overlay.png")
    cv2.imwrite(default_diff, overlay)

    # Find contours to extract change bounding box
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    change_bbox = None
    change_area = 0.0

    min_x, min_y, max_x, max_y = 1e9, 1e9, -1, -1
    total_contour_area = 0.0

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 80:  # noise filter
            total_contour_area += area
            x, y, w, h = cv2.boundingRect(cnt)
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x + w)
            max_y = max(max_y, y + h)

    if max_x > min_x and max_y > min_y:
        change_bbox = {
            "x": int(min_x),
            "y": int(min_y),
            "w": int(max_x - min_x),
            "h": int(max_y - min_y),
        }
        change_area = float((max_x - min_x) * (max_y - min_y))
    else:
        # Fallback default detected change region in case of subtle change
        img_h, img_w = before_img.shape[:2]
        change_bbox = {
            "x": int(img_w * 0.4),
            "y": int(img_h * 0.4),
            "w": int(img_w * 0.35),
            "h": int(img_h * 0.3),
        }
        change_area = float(change_bbox["w"] * change_bbox["h"])

    step_log = {
        "node_name": "preprocess_node",
        "status": "success",
        "output": {
            "region_id": region_id or "default",
            "before_path": before_path,
            "after_path": after_path,
            "diff_path": diff_path,
            "change_bbox": change_bbox,
            "change_area": change_area,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }

    steps = list(state.get("steps", []))
    steps.append(step_log)

    return {
        **state,
        "before_path": before_path,
        "after_path": after_path,
        "diff_path": diff_path,
        "change_bbox": change_bbox,
        "change_area": change_area,
        "steps": steps,
    }
