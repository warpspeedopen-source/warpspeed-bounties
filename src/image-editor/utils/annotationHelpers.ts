/**
 * Annotation Helpers
 * 
 * Utility functions for creating and manipulating annotations.
 * Generates unique IDs, validates geometry, and provides defaults.
 */

import {
  Annotation,
  PenAnnotation,
  TextAnnotation,
  ArrowAnnotation,
  HighlightAnnotation,
  AnnotationType,
  Point,
  Rect,
  Dimensions,
} from '../types';

let annotationCounter = 0;

/**
 * Generate a unique annotation ID
 */
export function generateAnnotationId(): string {
  annotationCounter++;
  return `ann_${Date.now()}_${annotationCounter}`;
}

// ─── Annotation Factories ──────────────────────────────────────

const DEFAULT_COLOR = '#FF0000';
const DEFAULT_OPACITY = 1.0;
const DEFAULT_STROKE_WIDTH = 3;
const DEFAULT_FONT_SIZE = 24;
const DEFAULT_FONT_FAMILY = 'System';

/**
 * Create a pen annotation from a series of points
 */
export function createPenAnnotation(
  points: Point[],
  options: Partial<Pick<PenAnnotation, 'color' | 'opacity' | 'strokeWidth'>> = {}
): PenAnnotation {
  return {
    id: generateAnnotationId(),
    type: 'pen',
    color: options.color ?? DEFAULT_COLOR,
    opacity: options.opacity ?? DEFAULT_OPACITY,
    timestamp: Date.now(),
    points: simplifyPoints(points),
    strokeWidth: options.strokeWidth ?? DEFAULT_STROKE_WIDTH,
  };
}

/**
 * Create a text annotation at a position
 */
export function createTextAnnotation(
  text: string,
  position: Point,
  options: Partial<
    Pick<TextAnnotation, 'color' | 'opacity' | 'fontSize' | 'fontFamily' | 'backgroundColor'>
  > = {}
): TextAnnotation {
  return {
    id: generateAnnotationId(),
    type: 'text',
    color: options.color ?? DEFAULT_COLOR,
    opacity: options.opacity ?? DEFAULT_OPACITY,
    timestamp: Date.now(),
    text,
    position,
    fontSize: options.fontSize ?? DEFAULT_FONT_SIZE,
    fontFamily: options.fontFamily ?? DEFAULT_FONT_FAMILY,
    backgroundColor: options.backgroundColor,
  };
}

/**
 * Create an arrow annotation between two points
 */
export function createArrowAnnotation(
  startPoint: Point,
  endPoint: Point,
  options: Partial<Pick<ArrowAnnotation, 'color' | 'opacity' | 'strokeWidth'>> = {}
): ArrowAnnotation {
  return {
    id: generateAnnotationId(),
    type: 'arrow',
    color: options.color ?? DEFAULT_COLOR,
    opacity: options.opacity ?? DEFAULT_OPACITY,
    timestamp: Date.now(),
    startPoint,
    endPoint,
    strokeWidth: options.strokeWidth ?? DEFAULT_STROKE_WIDTH,
  };
}

/**
 * Create a highlight annotation over a rectangle
 */
export function createHighlightAnnotation(
  region: Rect,
  options: Partial<Pick<HighlightAnnotation, 'color' | 'opacity' | 'fillColor'>> = {}
): HighlightAnnotation {
  return {
    id: generateAnnotationId(),
    type: 'highlight',
    color: options.color ?? '#FFFF00',
    opacity: options.opacity ?? 0.4,
    timestamp: Date.now(),
    region,
    fillColor: options.fillColor ?? 'rgba(255, 255, 0, 0.4)',
  };
}

// ─── Geometry Helpers ──────────────────────────────────────────

/**
 * Calculate the distance between two points
 */
export function distanceBetween(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the midpoint of a line
 */
export function midpoint(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

/**
 * Calculate the bounding box of a set of points
 */
export function boundingBox(points: Point[]): Rect {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Check if a point is inside a rectangle
 */
export function pointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Check if a point is near a line segment
 */
export function pointNearLine(
  point: Point,
  lineStart: Point,
  lineEnd: Point,
  threshold: number = 10
): boolean {
  const lineLength = distanceBetween(lineStart, lineEnd);
  if (lineLength === 0) return distanceBetween(point, lineStart) <= threshold;

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) +
        (point.y - lineStart.y) * (lineEnd.y - lineStart.x)) /
        (lineLength * lineLength)
    )
  );

  const projection: Point = {
    x: lineStart.x + t * (lineEnd.x - lineStart.x),
    y: lineStart.y + t * (lineEnd.y - lineStart.y),
  };

  return distanceBetween(point, projection) <= threshold;
}

/**
 * Simplify a polyline using the Ramer-Douglas-Peucker algorithm
 * Reduces point count while preserving shape
 */
export function simplifyPoints(points: Point[], tolerance: number = 1.5): Point[] {
  if (points.length <= 2) return points;

  // Find the point with the maximum distance from the line between first and last
  const first = points[0];
  const last = points[points.length - 1];
  let maxDist = 0;
  let maxIndex = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  // If max distance exceeds tolerance, recursively simplify
  if (maxDist > tolerance) {
    const left = simplifyPoints(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPoints(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [first, last];
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lineLengthSq = dx * dx + dy * dy;

  if (lineLengthSq === 0) return distanceBetween(point, lineStart);

  const t = Math.max(
    0,
    Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lineLengthSq)
  );

  const projection: Point = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };

  return distanceBetween(point, projection);
}

// ─── Annotation Rendering Helpers ──────────────────────────────

/**
 * Get the bounding rect of any annotation type
 */
export function getAnnotationBounds(annotation: Annotation): Rect {
  switch (annotation.type) {
    case 'pen':
      return boundingBox(annotation.points);
    case 'text':
      // Estimate text bounding box
      return {
        x: annotation.position.x,
        y: annotation.position.y,
        width: annotation.text.length * annotation.fontSize * 0.6,
        height: annotation.fontSize * 1.3,
      };
    case 'arrow':
      return boundingBox([annotation.startPoint, annotation.endPoint]);
    case 'highlight':
      return annotation.region;
  }
}

/**
 * Check if an annotation is within canvas bounds
 */
export function isAnnotationInBounds(annotation: Annotation, canvasSize: Dimensions): boolean {
  const bounds = getAnnotationBounds(annotation);
  return (
    bounds.x < canvasSize.width &&
    bounds.y < canvasSize.height &&
    bounds.x + bounds.width > 0 &&
    bounds.y + bounds.height > 0
  );
}

/**
 * Convert an annotation to an SVG path string (for pen strokes)
 */
export function penAnnotationToSvgPath(annotation: PenAnnotation): string {
  if (annotation.points.length < 2) return '';

  const [first, ...rest] = annotation.points;
  let path = `M ${first.x} ${first.y}`;

  for (const point of rest) {
    path += ` L ${point.x} ${point.y}`;
  }

  return path;
}

/**
 * Convert an arrow annotation to SVG line + arrowhead data
 */
export function arrowToSvgData(annotation: ArrowAnnotation): {
  line: { x1: number; y1: number; x2: number; y2: number };
  arrowhead: Point[];
} {
  const { startPoint, endPoint } = annotation;
  const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
  const headLength = 15;
  const headAngle = Math.PI / 6;

  return {
    line: {
      x1: startPoint.x,
      y1: startPoint.y,
      x2: endPoint.x,
      y2: endPoint.y,
    },
    arrowhead: [
      endPoint,
      {
        x: endPoint.x - headLength * Math.cos(angle - headAngle),
        y: endPoint.y - headLength * Math.sin(angle - headAngle),
      },
      {
        x: endPoint.x - headLength * Math.cos(angle + headAngle),
        y: endPoint.y - headLength * Math.sin(angle + headAngle),
      },
    ],
  };
}
