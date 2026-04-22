// components/CoinCanvas.jsx
import React, { useRef, useEffect, useCallback } from "react";

const Canvas = ({ gamePhase, result, onFlipComplete }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const angleRef = useRef(0);
  const yOffRef = useRef(0);
  const yVelRef = useRef(0);
  const bouncesRef = useRef(0);

  // Constants
  const R = 105;
  const EDGE_SEGS = 60;
  const EDGE_HALF = 14;
  const IDLE_SPEED = 0.008;
  const FAST_ROTATIONS = 8;
  const FLIP_MS = 2100;

  // Flip animation state
  const flipStartRef = useRef(0);
  const flipTargetRef = useRef(0);
  const flipDurRef = useRef(0);
  const isFlippingRef = useRef(false);

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // Draw shadow
  const drawShadow = useCallback(
    (ctx, CX, CY, yOff) => {
      const lift = Math.max(0, -yOff);
      const scale = Math.max(0.3, 1 - lift / 160);
      ctx.save();
      ctx.translate(CX, CY + R + 18 + yOff * 0.08);
      ctx.scale(scale, scale * 0.18);
      const g = ctx.createRadialGradient(0, 0, 8, 0, 0, R * 1.1);
      g.addColorStop(0, "rgba(0,0,0,0.7)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, R * 1.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
    [R],
  );

  // Draw 3D edge
  const drawEdge = useCallback(
    (ctx, CX, CY, angle, cy) => {
      for (let i = 0; i < EDGE_SEGS; i++) {
        const theta = (i / EDGE_SEGS) * Math.PI * 2;
        const viewTheta = theta + angle;
        const cosV = Math.cos(viewTheta);
        const sinV = Math.sin(viewTheta);

        const sx = CX + cosV * R;
        const rawWidth = ((2 * Math.PI * R) / EDGE_SEGS) * Math.abs(sinV);
        const sw = Math.max(1.2, rawWidth);
        const top = cy - EDGE_HALF;
        const height = EDGE_HALF * 2;

        const diffuse = (cosV + 1) / 2;
        const specular = Math.pow(Math.max(0, cosV), 8);

        const r = Math.round(60 + diffuse * 168 + specular * 40);
        const g = Math.round(30 + diffuse * 120 + specular * 30);
        const b = Math.round(0 + diffuse * 10 + specular * 10);

        ctx.fillStyle = `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
        ctx.fillRect(sx - sw / 2, top, sw, height);
      }

      // Top bevel
      for (let i = 0; i < EDGE_SEGS; i++) {
        const theta = (i / EDGE_SEGS) * Math.PI * 2;
        const viewTheta = theta + angle;
        const cosV = Math.cos(viewTheta);
        const sinV = Math.sin(viewTheta);
        const sx = CX + cosV * R;
        const sw = Math.max(
          1.2,
          ((2 * Math.PI * R) / EDGE_SEGS) * Math.abs(sinV),
        );

        const bevel = EDGE_HALF * 0.35;
        const brightness = (cosV + 1) / 2;
        const rv = Math.round(100 + brightness * 155);
        const gv = Math.round(60 + brightness * 100);
        ctx.fillStyle = `rgb(${rv},${gv},0)`;
        ctx.fillRect(sx - sw / 2, cy - EDGE_HALF - bevel, sw, bevel);
        ctx.fillRect(sx - sw / 2, cy + EDGE_HALF, sw, bevel);
      }

      // Knurling
      const knurlCount = 36;
      for (let k = 0; k < knurlCount; k++) {
        const theta = (k / knurlCount) * Math.PI * 2;
        const viewTheta = theta + angle;
        const cosV = Math.cos(viewTheta);
        const sinV = Math.sin(viewTheta);
        const abssin = Math.abs(sinV);
        if (abssin < 0.12) continue;
        const sx = CX + cosV * R;
        const alpha = abssin * 0.35;
        ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        ctx.fillRect(sx - 0.8, cy - EDGE_HALF, 1.6, EDGE_HALF * 2);
      }
    },
    [R, EDGE_SEGS, EDGE_HALF],
  );

  // Draw coin face
  const drawFace = useCallback(
    (ctx, CX, CY, angle, cy) => {
      const cosA = Math.cos(angle);
      const abscos = Math.abs(cosA);
      if (abscos < 0.008) return;

      const isHeads = cosA >= 0;

      ctx.save();
      ctx.translate(CX, cy);
      ctx.scale(abscos, 1);

      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.clip();

      const lx = -R * 0.28,
        ly = -R * 0.35;
      const fg = ctx.createRadialGradient(lx, ly, R * 0.04, 0, 0, R * 1.1);
      if (isHeads) {
        fg.addColorStop(0, "#fff5b0");
        fg.addColorStop(0.14, "#fde06a");
        fg.addColorStop(0.38, "#f0b429");
        fg.addColorStop(0.68, "#c28010");
        fg.addColorStop(1, "#7a4f00");
      } else {
        fg.addColorStop(0, "#eaf0fc");
        fg.addColorStop(0.14, "#ccd8ec");
        fg.addColorStop(0.38, "#a8b8d0");
        fg.addColorStop(0.68, "#4a6080");
        fg.addColorStop(1, "#1a2a40");
      }
      ctx.fillStyle = fg;
      ctx.fillRect(-R, -R, R * 2, R * 2);

      // Outer rim
      ctx.beginPath();
      ctx.arc(0, 0, R - 1, 0, Math.PI * 2);
      ctx.strokeStyle = isHeads ? "rgba(60,35,0,0.7)" : "rgba(10,20,50,0.6)";
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, R - 7, 0, Math.PI * 2);
      ctx.strokeStyle = isHeads
        ? "rgba(255,240,120,0.25)"
        : "rgba(200,220,255,0.2)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center letter
      if (abscos > 0.14) {
        const alpha = Math.min(1, (abscos - 0.14) / 0.32);
        ctx.globalAlpha = alpha;

        const fs = Math.round(R * 0.78);
        ctx.font = `900 ${fs}px 'Bebas Neue','Arial Black',sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillStyle = isHeads ? "rgba(50,28,0,0.6)" : "rgba(6,14,38,0.55)";
        ctx.fillText(isHeads ? "H" : "T", 2.8 / abscos, 3.5);

        const lg = ctx.createLinearGradient(0, -R * 0.38, 0, R * 0.38);
        if (isHeads) {
          lg.addColorStop(0, "#fff8cc");
          lg.addColorStop(0.45, "#f5c832");
          lg.addColorStop(1, "#7a4f00");
        } else {
          lg.addColorStop(0, "#ffffff");
          lg.addColorStop(0.45, "#a8b8d0");
          lg.addColorStop(1, "#1a2a40");
        }
        ctx.fillStyle = lg;
        ctx.fillText(isHeads ? "H" : "T", 0, 1.5);

        ctx.globalAlpha = 1;
      }

      ctx.restore();
    },
    [R],
  );

  // Main draw function
  const draw = useCallback(
    (ctx, W, H, angle, yOff) => {
      const CX = W / 2,
        CY = H / 2;
      ctx.clearRect(0, 0, W, H);
      const cy = CY + yOff;
      drawShadow(ctx, CX, CY, yOff);
      drawEdge(ctx, CX, CY, angle, cy);
      drawFace(ctx, CX, CY, angle, cy);
    },
    [drawShadow, drawEdge, drawFace],
  );

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const W = canvas.width,
      H = canvas.height;

    const now = performance.now();

    if (gamePhase === "flipping" && isFlippingRef.current) {
      const elapsed = now - flipStartRef.current;
      const t = Math.min(elapsed / flipDurRef.current, 1);

      const totalSpin = Math.PI * 2 * FAST_ROTATIONS;
      angleRef.current =
        totalSpin * easeOut(t) + flipTargetRef.current * easeInOut(t);

      const arc = t < 0.42 ? -(t / 0.42) : -(1 - (t - 0.42) / 0.58);
      yOffRef.current = arc * 95;

      if (t >= 1) {
        angleRef.current = flipTargetRef.current;
        yOffRef.current = 0;
        isFlippingRef.current = false;
        gamePhase = "landing";
        yVelRef.current = -5;
        bouncesRef.current = 0;
      }
    } else if (gamePhase === "landing") {
      yOffRef.current += yVelRef.current;
      yVelRef.current += 0.9;
      if (yOffRef.current >= 0) {
        yOffRef.current = 0;
        yVelRef.current *= -0.3;
        bouncesRef.current++;
        if (Math.abs(yVelRef.current) < 0.65 || bouncesRef.current > 5) {
          yOffRef.current = 0;
          yVelRef.current = 0;
          if (onFlipComplete) {
            onFlipComplete();
          }
        }
      }
    } else if (gamePhase === "idle" || gamePhase === "countdown") {
      angleRef.current += IDLE_SPEED;
      yOffRef.current = Math.sin(now * 0.0007) * 2.5;
    } else if (gamePhase === "result") {
      yOffRef.current = Math.sin(now * 0.0007) * 1.5;
    }

    draw(ctx, W, H, angleRef.current, yOffRef.current);
    animationRef.current = requestAnimationFrame(animate);
  }, [
    gamePhase,
    onFlipComplete,
    draw,
    IDLE_SPEED,
    FAST_ROTATIONS,
    easeOut,
    easeInOut,
  ]);

  // Trigger flip from parent
  const triggerFlip = useCallback(
    (flipResult) => {
      flipTargetRef.current = flipResult === "heads" ? 0 : Math.PI;
      flipDurRef.current = FLIP_MS + (Math.random() - 0.5) * 300;
      flipStartRef.current = performance.now();
      isFlippingRef.current = true;
    },
    [FLIP_MS],
  );

  // Listen for external flip trigger
  useEffect(() => {
    const handleTriggerFlip = (e) => {
      triggerFlip(e.detail);
    };

    window.addEventListener("triggerFlip", handleTriggerFlip);
    return () => window.removeEventListener("triggerFlip", handleTriggerFlip);
  }, [triggerFlip]);

  // Start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 300;
      canvas.height = 300;
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return (
    <div className="coin-stage">
      <canvas
        ref={canvasRef}
        id="coin-canvas"
        width="300"
        height="300"
      ></canvas>
    </div>
  );
};

export default Canvas;
