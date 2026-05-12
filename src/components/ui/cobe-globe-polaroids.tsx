"use client";

import { useCallback, useEffect, useRef } from "react";
import createGlobe from "cobe";

interface PolaroidMarker {
  id: string;
  location: [number, number];
  image: string;
  caption: string;
  rotate: number;
}

interface GlobePolaroidsProps {
  markers?: PolaroidMarker[];
  className?: string;
  speed?: number;
}

const defaultMarkers: PolaroidMarker[] = [
  {
    id: "polaroid-sf",
    location: [37.78, -122.44],
    image:
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=120&h=120&fit=crop",
    caption: "San Francisco",
    rotate: -5,
  },
  {
    id: "polaroid-nyc",
    location: [40.71, -74.01],
    image:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=120&h=120&fit=crop",
    caption: "New York",
    rotate: 4,
  },
  {
    id: "polaroid-tokyo",
    location: [35.68, 139.65],
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=120&h=120&fit=crop",
    caption: "Tokyo",
    rotate: -3,
  },
  {
    id: "polaroid-sydney",
    location: [-33.87, 151.21],
    image:
      "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=120&h=120&fit=crop",
    caption: "Sydney",
    rotate: 6,
  },
  {
    id: "polaroid-cape-town",
    location: [-33.92, 18.42],
    image:
      "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=120&h=120&fit=crop",
    caption: "Cape Town",
    rotate: -6,
  },
  {
    id: "polaroid-rio",
    location: [-22.91, -43.17],
    image:
      "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=120&h=120&fit=crop",
    caption: "Rio",
    rotate: 5,
  },
  {
    id: "polaroid-buenos-aires",
    location: [-34.6, -58.38],
    image:
      "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=120&h=120&fit=crop",
    caption: "Buenos Aires",
    rotate: -3,
  },
  {
    id: "polaroid-queenstown",
    location: [-45.03, 168.66],
    image:
      "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=120&h=120&fit=crop",
    caption: "Queenstown",
    rotate: 4,
  },
  {
    id: "polaroid-bali",
    location: [-8.34, 115.09],
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=120&h=120&fit=crop",
    caption: "Bali",
    rotate: -5,
  },
    {
      id: "polaroid-paris",
      location: [48.86, 2.35],
      image:
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=120&h=120&fit=crop",
      caption: "Paris",
      rotate: -4,
    },
  ];

export function GlobePolaroids({
  markers = defaultMarkers,
  className = "",
  speed = 0.003,
}: GlobePolaroidsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const isPausedRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    isPausedRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        };
      }
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerUp]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let globe: ReturnType<typeof createGlobe> | null = null;
    let animationId = 0;
    let phi = 0;
    let resizeObserver: ResizeObserver | null = null;

    function init() {
      const width = canvas.offsetWidth;
      if (width === 0 || globe) return;

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
        phi: 0,
        theta: 0.2,
        dark: 1,
        diffuse: 1.4,
        mapSamples: 16000,
        mapBrightness: 7,
        baseColor: [0.12, 0.16, 0.22],
        markerColor: [0.35, 0.6, 1],
        glowColor: [0.12, 0.35, 0.75],
        markerElevation: 0,
        markers: markers.map((marker) => ({
          location: marker.location,
          size: 0.035,
          id: marker.id,
        })),
        arcs: [],
        arcColor: [0.5, 0.7, 1],
        arcWidth: 0.5,
        arcHeight: 0.25,
        opacity: 0.95,
      });

      function animate() {
        if (!isPausedRef.current) phi += speed;
        globe?.update({
          phi: phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: 0.2 + thetaOffsetRef.current + dragOffset.current.theta,
        });
        animationId = requestAnimationFrame(animate);
      }

      animate();
      window.setTimeout(() => {
        canvas.style.opacity = "1";
      });
    }

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      resizeObserver = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          resizeObserver?.disconnect();
          init();
        }
      });
      resizeObserver.observe(canvas);
    }

    return () => {
      resizeObserver?.disconnect();
      if (animationId) cancelAnimationFrame(animationId);
      globe?.destroy();
    };
  }, [markers, speed]);

  return (
    <div className={`relative aspect-square select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1.2s ease",
          borderRadius: "50%",
          touchAction: "none",
        }}
      />
      {markers.map((marker) => (
        <div
          key={marker.id}
          style={{
            position: "absolute",
            positionAnchor: `--cobe-${marker.id}`,
            bottom: "anchor(top)",
            left: "anchor(center)",
            translate: "-50% 0",
            marginBottom: 8,
            background: "#fff",
            padding: "6px 6px 24px",
            boxShadow:
              "0 16px 40px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.18)",
            transform: `rotate(${marker.rotate}deg)`,
            pointerEvents: "none",
            opacity: `var(--cobe-visible-${marker.id}, 0)`,
            filter: `blur(calc((1 - var(--cobe-visible-${marker.id}, 0)) * 8px))`,
            transition: "opacity 0.3s, filter 0.3s",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={marker.image}
            alt={marker.caption}
            style={{
              display: "block",
              width: 64,
              height: 64,
              objectFit: "cover",
            }}
          />
          <span
            style={{
              position: "absolute",
              bottom: 5,
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: "system-ui, sans-serif",
              fontSize: "0.5rem",
              color: "#333",
              letterSpacing: "0.02em",
            }}
          >
            {marker.caption}
          </span>
        </div>
      ))}
    </div>
  );
}
