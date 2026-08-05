import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { RotateCw, Sparkles, Download, Camera, Box, FileCode, Layers } from 'lucide-react';
import { parsePlateText, type PlateConfig } from './PlateVisualizer2D';

interface PlateVisualizer3DProps {
  config: PlateConfig;
  showExportControls?: boolean;
  orderNumber?: string;
}

export const PlateVisualizer3D: React.FC<PlateVisualizer3DProps> = ({
  config,
  showExportControls = false,
  orderNumber,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Helper to draw realistic Kyrgyz Flag on 2D Context
  const drawKyrgyzFlagOnCanvas = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    ctx.save();

    // Rounded Flag border clip
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, 4);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.clip();

    // Crimson Red Field
    ctx.fillStyle = '#E11D48';
    ctx.fillRect(x, y, w, h);

    // Sun emblem center
    const cx = x + w / 2;
    const cy = y + h / 2;
    
    // Scale factor to match the SVG dimensions (base h = 26, scaled by 0.6 group scale)
    const scale = (h / 26) * 0.6;

    // 40 Sun Rays
    ctx.fillStyle = '#FBBF24';
    for (let i = 0; i < 40; i++) {
      const angle = (i * Math.PI * 2) / 40;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      
      ctx.beginPath();
      // SVG path: M 0 -7.2 C 0.8 -9.2, 1.6 -10.2, 0 -11.6 C -1.6 -10.2, -0.8 -9.2, 0 -7.2 Z
      ctx.moveTo(0, -7.2 * scale);
      ctx.bezierCurveTo(0.8 * scale, -9.2 * scale, 1.6 * scale, -10.2 * scale, 0, -11.6 * scale);
      ctx.bezierCurveTo(-1.6 * scale, -10.2 * scale, -0.8 * scale, -9.2 * scale, 0, -7.2 * scale);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }

    // Sun Disk Ring (radius = 6 in SVG)
    ctx.beginPath();
    ctx.arc(cx, cy, 6 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Inner Red Gap (radius = 4.8 in SVG)
    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.arc(cx, cy, 4.8 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Tunduk Arches (Yellow crossing lines)
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 0.8 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Horizontal curves
    ctx.beginPath();
    ctx.moveTo(cx - 3.6 * scale, cy - 2.6 * scale);
    ctx.bezierCurveTo(cx - 1.3 * scale, cy - 0.8 * scale, cx + 1.3 * scale, cy - 0.8 * scale, cx + 3.6 * scale, cy - 2.6 * scale);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 4.2 * scale, cy);
    ctx.bezierCurveTo(cx - 1.5 * scale, cy + 1.6 * scale, cx + 1.5 * scale, cy + 1.6 * scale, cx + 4.2 * scale, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 3.6 * scale, cy + 2.6 * scale);
    ctx.bezierCurveTo(cx - 1.3 * scale, cy + 0.8 * scale, cx + 1.3 * scale, cy + 0.8 * scale, cx + 3.6 * scale, cy + 2.6 * scale);
    ctx.stroke();

    // Vertical curves
    ctx.beginPath();
    ctx.moveTo(cx - 2.6 * scale, cy - 3.6 * scale);
    ctx.bezierCurveTo(cx - 0.8 * scale, cy - 1.3 * scale, cx - 0.8 * scale, cy + 1.3 * scale, cx - 2.6 * scale, cy + 3.6 * scale);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - 4.2 * scale);
    ctx.bezierCurveTo(cx + 1.6 * scale, cy - 1.5 * scale, cx + 1.6 * scale, cy + 1.5 * scale, cx, cy + 4.2 * scale);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 2.6 * scale, cy - 3.6 * scale);
    ctx.bezierCurveTo(cx + 0.8 * scale, cy - 1.3 * scale, cx + 0.8 * scale, cy + 1.3 * scale, cx + 2.6 * scale, cy + 3.6 * scale);
    ctx.stroke();

    ctx.restore();

    // Border around flag
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 4);
      ctx.stroke();
    }
  };

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, width, height, radius);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }
  };

  const drawOuterFrame = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    
    // Create rounded rect path for clip
    ctx.beginPath();
    drawRoundedRect(ctx, 0, 0, w, h, 24);
    ctx.clip();
    
    // Fill gradient based on material
    let grad;
    if (config.material === 'black_matte') {
      grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#1f2937');
      grad.addColorStop(1, '#111827');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else if (config.material === 'gold_edge') {
      grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#bf953f');
      grad.addColorStop(0.25, '#fcf6ba');
      grad.addColorStop(0.5, '#b38728');
      grad.addColorStop(0.75, '#fbf5b7');
      grad.addColorStop(1, '#aa771c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else if (config.material === 'carbon') {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, w, h);
      
      ctx.fillStyle = '#000000';
      for (let x = 0; x < w; x += 16) {
        for (let y = 0; y < h; y += 16) {
          ctx.beginPath();
          ctx.arc(x, y, 2.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x + 8, y + 8, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let x = 0; x < w; x += 16) {
        for (let y = 0; y < h; y += 16) {
          ctx.beginPath();
          ctx.arc(x, y + 2, 2.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x + 8, y + 10, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // chrome
      grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#e2e8f0');
      grad.addColorStop(0.3, '#ffffff');
      grad.addColorStop(0.5, '#cbd5e1');
      grad.addColorStop(0.7, '#f8fafc');
      grad.addColorStop(1, '#94a3b8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    
    // Stroke border
    let strokeColor = '#ffffff';
    if (config.material === 'black_matte') strokeColor = '#374151';
    else if (config.material === 'gold_edge') strokeColor = '#fcf6ba';
    else if (config.material === 'carbon') strokeColor = '#52525b';
    
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    drawRoundedRect(ctx, 2, 2, w - 4, h - 4, 22);
    ctx.stroke();
    
    ctx.restore();
  };

  const drawInnerPlateBase = (ctx: CanvasRenderingContext2D, isBack: boolean) => {
    ctx.save();
    ctx.beginPath();
    drawRoundedRect(ctx, 10, 10, 1040, 224, 16);
    ctx.clip();
    
    if (!isBack) {
      const grad = ctx.createLinearGradient(10, 10, 10, 234);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(1, '#F8FAFC');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = config.material === 'black_matte' ? '#111827' : '#ffffff';
    }
    ctx.fillRect(10, 10, 1040, 224);
    ctx.restore();
  };

  const drawFrontSide = (ctx: CanvasRenderingContext2D) => {
    drawOuterFrame(ctx, 1060, 244);
    drawInnerPlateBase(ctx, false);
    
    // Black frame line
    ctx.save();
    ctx.strokeStyle = '#1E1E1E';
    ctx.lineWidth = 9;
    ctx.beginPath();
    drawRoundedRect(ctx, 14.5, 14.5, 1031, 215, 12);
    ctx.stroke();
    ctx.restore();
    
    // Vertical line separator
    ctx.save();
    ctx.strokeStyle = '#1E1E1E';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(290, 10);
    ctx.lineTo(290, 234);
    ctx.stroke();
    ctx.restore();
    
    // Region code
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowOffsetX = 1.2;
    ctx.shadowOffsetY = 1.2;
    ctx.shadowBlur = 0.8;
    ctx.fillStyle = '#1E1E1E';
    ctx.font = "600 112px 'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Bebas Neue', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(config.regionCode, 150, 124);
    ctx.restore();
    
    // Flag of Kyrgyz Republic
    const flagX = 66;
    const flagY = 154;
    const flagW = 80;
    const flagH = 52;
    drawKyrgyzFlagOnCanvas(ctx, flagX, flagY, flagW, flagH);
    
    // "KG" text
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowOffsetX = 1.2;
    ctx.shadowOffsetY = 1.2;
    ctx.shadowBlur = 0.8;
    ctx.fillStyle = '#1E1E1E';
    ctx.font = "700 60px 'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Outfit', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText('KG', 162, 202);
    ctx.restore();
    
    // Right plate text
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowOffsetX = 1.2;
    ctx.shadowOffsetY = 1.2;
    ctx.shadowBlur = 0.8;
    
    const parsed = parsePlateText(config.plateNumber);
    if (parsed.isStandard) {
      ctx.font = "600 184px 'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Bebas Neue', monospace";
      const digitsW = ctx.measureText(parsed.digits).width;
      
      ctx.font = "600 152px 'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Bebas Neue', monospace";
      const lettersW = parsed.letters ? ctx.measureText(parsed.letters).width : 0;
      
      const dx = 48;
      const totalW = digitsW + (parsed.letters ? dx + lettersW : 0);
      const startX = 670 - totalW / 2;
      
      ctx.fillStyle = '#1E1E1E';
      ctx.font = "600 184px 'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Bebas Neue', monospace";
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(parsed.digits, startX, 194);
      
      if (parsed.letters) {
        ctx.font = "600 152px 'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Bebas Neue', monospace";
        ctx.fillText(parsed.letters, startX + digitsW + dx, 194);
      }
    } else {
      const textLen = parsed.digits.length;
      const fontSize = (textLen > 8 ? 54 : textLen > 6 ? 70 : 86) * 2;
      ctx.fillStyle = '#1E1E1E';
      ctx.font = `600 ${fontSize}px 'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Bebas Neue', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      try {
        ctx.letterSpacing = '4px';
      } catch (e) {}
      ctx.fillText(parsed.digits, 670, 192);
    }
    ctx.restore();
    
    // Key chain ring hole (top right)
    ctx.save();
    ctx.fillStyle = '#0c0e12';
    ctx.beginPath();
    ctx.arc(1021, 39, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e1e1e';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(1021, 39, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };

  const drawBackSide = (ctx: CanvasRenderingContext2D, logoImg?: HTMLImageElement) => {
    drawOuterFrame(ctx, 1060, 244);
    drawInnerPlateBase(ctx, true);
    
    // Inner border line
    ctx.save();
    ctx.strokeStyle = config.material === 'black_matte' ? '#ffffff' : '#1e1e1e';
    ctx.lineWidth = 5;
    ctx.beginPath();
    drawRoundedRect(ctx, 14.5, 14.5, 1031, 215, 12);
    ctx.stroke();
    ctx.restore();
    
    const hasText = !!(config.backSideText && config.backSideText.trim());
    const hasLogo = config.backSideLogo && config.backSideLogo !== 'none';
    
    ctx.save();
    ctx.shadowColor = config.material === 'black_matte' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.15)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 0.8;
    
    let logoW = 153;
    let logoH = 125;
    if (['toyota', 'lexus', 'hyundai', 'kia', 'audi', 'chevrolet'].includes(config.backSideLogo)) {
      logoW = 192;
    }
    
    if (hasLogo && hasText) {
      ctx.font = "700 72px 'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', monospace";
      const textW = ctx.measureText(config.backSideText).width;
      const gap = 48;
      const totalW = logoW + gap + textW;
      const startX = 530 - totalW / 2;
      
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        ctx.save();
        if (config.material === 'black_matte' && config.backSideLogo !== 'bmw') {
          ctx.filter = 'brightness(0) invert(1)';
        }
        ctx.drawImage(logoImg, startX, 122 - logoH / 2, logoW, logoH);
        ctx.restore();
      }
      
      ctx.fillStyle = config.material === 'black_matte' ? '#ffffff' : '#1e1e1e';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.backSideText, startX + logoW + gap, 122);
      
    } else if (hasLogo) {
      const startX = 530 - logoW / 2;
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        ctx.save();
        if (config.material === 'black_matte' && config.backSideLogo !== 'bmw') {
          ctx.filter = 'brightness(0) invert(1)';
        }
        ctx.drawImage(logoImg, startX, 122 - logoH / 2, logoW, logoH);
        ctx.restore();
      }
      
    } else if (hasText) {
      ctx.fillStyle = config.material === 'black_matte' ? '#ffffff' : '#1e1e1e';
      ctx.font = "700 72px 'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', monospace";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.backSideText, 530, 122);
    }
    ctx.restore();
    
    // Key chain ring hole (top left - mirrored from front top right)
    ctx.save();
    ctx.fillStyle = '#0c0e12';
    ctx.beginPath();
    ctx.arc(39, 39, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e1e1e';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(39, 39, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };

  const createTextureCanvas = (isBack: boolean, logoImg?: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1060;
    canvas.height = 244;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    if (!isBack) {
      drawFrontSide(ctx);
    } else {
      drawBackSide(ctx, logoImg);
    }

    return canvas;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 360;

    let active = true;
    let cleanupFn: (() => void) | undefined;

    const logoImg = new Image();
    const hasLogo = config.backSideLogo && config.backSideLogo !== 'none';

    const startRender = () => {
      if (!active) return;

      // Scene, Camera, Renderer
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 0, 12);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      rendererRef.current = renderer;

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // Studio Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
      scene.add(ambientLight);

      const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.2);
      dirLight1.position.set(6, 12, 8);
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0xffd700, 0.8);
      dirLight2.position.set(-6, -6, -5);
      scene.add(dirLight2);

      // Create 3D Keychain Group
      const group = new THREE.Group();
      groupRef.current = group;

      // Generate textures from canvas
      const frontCanvas = createTextureCanvas(false);
      const backCanvas = createTextureCanvas(true, logoImg);

      const frontTexture = new THREE.CanvasTexture(frontCanvas);
      const backTexture = new THREE.CanvasTexture(backCanvas);
      frontTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      backTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

      // Normalize UV mapping for ExtrudeGeometry (since ExtrudeGeometry maps UV coordinates
      // directly to the vertex coordinates which are in [-4, 4] for X and [-0.92, 0.92] for Y)
      frontTexture.repeat.set(1 / 8.0, 1 / 1.84);
      frontTexture.offset.set(0.5, 0.5);

      backTexture.wrapS = THREE.RepeatWrapping;
      backTexture.repeat.set(1 / 8.0, 1 / 1.84);
      backTexture.offset.set(0.5, 0.5);

      // Material properties
      let metalness = 0.8;
      let roughness = 0.2;
      let baseColor = 0xffffff;

      if (config.material === 'gold_edge') {
        baseColor = 0xffd700;
        metalness = 0.9;
        roughness = 0.12;
      } else if (config.material === 'black_matte') {
        baseColor = 0x1f2937;
        metalness = 0.2;
        roughness = 0.7;
      } else if (config.material === 'carbon') {
        baseColor = 0x27272a;
        metalness = 0.4;
        roughness = 0.35;
      }

      const sideMaterial = new THREE.MeshStandardMaterial({
        color: baseColor,
        metalness,
        roughness,
      });

      let frontBackMetalness = 0.3;
      let frontBackRoughness = 0.2;
      
      if (config.material === 'gold_edge') {
        frontBackMetalness = 0.6;
        frontBackRoughness = 0.15;
      } else if (config.material === 'black_matte') {
        frontBackMetalness = 0.1;
        frontBackRoughness = 0.7;
      } else if (config.material === 'carbon') {
        frontBackMetalness = 0.35;
        frontBackRoughness = 0.3;
      } else { // chrome
        frontBackMetalness = 0.5;
        frontBackRoughness = 0.18;
      }

      const frontMaterial = new THREE.MeshStandardMaterial({
        map: frontTexture,
        metalness: frontBackMetalness,
        roughness: frontBackRoughness,
      });

      const backMaterial = new THREE.MeshStandardMaterial({
        map: backTexture,
        metalness: frontBackMetalness,
        roughness: frontBackRoughness,
      });

      // Create rounded rectangle shape matching the plate dimensions
      const width3d = 8.0;
      const height3d = 1.84;
      const radius3d = 0.18; // corner radius matching 2D border-radius (approx 10px on 440px width)

      const shape = new THREE.Shape();
      const x = -width3d / 2;
      const y = -height3d / 2;

      shape.moveTo(x + radius3d, y);
      shape.lineTo(x + width3d - radius3d, y);
      shape.quadraticCurveTo(x + width3d, y, x + width3d, y + radius3d);
      shape.lineTo(x + width3d, y + height3d - radius3d);
      shape.quadraticCurveTo(x + width3d, y + height3d, x + width3d - radius3d, y + height3d);
      shape.lineTo(x + radius3d, y + height3d);
      shape.quadraticCurveTo(x, y + height3d, x, y + height3d - radius3d);
      shape.lineTo(x, y + radius3d);
      shape.quadraticCurveTo(x, y, x + radius3d, y);

      const extrudeSettings = {
        depth: 0.1,
        bevelEnabled: false,
        steps: 1,
      };

      const plateGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

      // Create two meshes placed back-to-back at z=0 to support separate front/back textures
      // Front mesh spans z ∈ [0, 0.1]
      const frontMesh = new THREE.Mesh(plateGeo, [frontMaterial, sideMaterial]);
      frontMesh.position.set(0, 0, 0);
      group.add(frontMesh);

      // Back mesh rotated 180 degrees around Y, spans z ∈ [-0.1, 0]
      const backMesh = new THREE.Mesh(plateGeo, [backMaterial, sideMaterial]);
      backMesh.position.set(0, 0, 0);
      backMesh.rotation.y = Math.PI;
      group.add(backMesh);

      scene.add(group);

      // Mouse Drag Rotation Logic
      let isDragging = false;
      let previousMousePosition = { x: 0, y: 0 };

      const onMouseDown = (e: MouseEvent) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        group.rotation.y += deltaX * 0.01;
        group.rotation.x += deltaY * 0.01;

        previousMousePosition = { x: e.clientX, y: e.clientY };
      };

      const onMouseUp = () => {
        isDragging = false;
      };

      const domElement = renderer.domElement;
      domElement.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      // Touch support
      const onTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          isDragging = true;
          previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!isDragging || e.touches.length !== 1) return;
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;

        group.rotation.y += deltaX * 0.01;
        group.rotation.x += deltaY * 0.01;

        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      };

      const onTouchEnd = () => {
        isDragging = false;
      };

      domElement.addEventListener('touchstart', onTouchStart);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);

      // Responsive Canvas Resize Observer
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const newWidth = entry.contentRect.width;
          if (newWidth > 0 && cameraRef.current && rendererRef.current) {
            cameraRef.current.aspect = newWidth / height;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(newWidth, height);
          }
        }
      });
      resizeObserver.observe(container);

      // Animation Loop
      let animationFrameId: number;
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        if (autoRotate && !isDragging) {
          group.rotation.y += 0.015;
        }

        renderer.render(scene, camera);
      };

      animate();

      cleanupFn = () => {
        resizeObserver.disconnect();
        cancelAnimationFrame(animationFrameId);
        domElement.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        domElement.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        renderer.dispose();
        plateGeo.dispose();
        frontTexture.dispose();
        backTexture.dispose();
        sideMaterial.dispose();
        frontMaterial.dispose();
        backMaterial.dispose();
      };
    };

    if (hasLogo) {
      logoImg.src = `${import.meta.env.BASE_URL}logos/${config.backSideLogo}.svg`;
      logoImg.onload = startRender;
      logoImg.onerror = startRender;
    } else {
      startRender();
    }

    return () => {
      active = false;
      if (cleanupFn) cleanupFn();
      sceneRef.current = null;
      groupRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
    };
  }, [config, autoRotate]);

  // Download Blob Utility
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getBaseFileName = () => {
    const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
    const plate = sanitize(config.plateNumber || 'Keyfob');
    const order = orderNumber ? `Order_${sanitize(orderNumber)}` : 'Model';
    return `PlateKeyFob_${order}_${plate}`;
  };

  // Export 3D GLB (GLTF Binary format)
  const handleExportGLTF = () => {
    if (!groupRef.current) return;
    setIsExporting('glb');
    try {
      const exporter = new GLTFExporter();
      exporter.parse(
        groupRef.current,
        (gltf) => {
          if (gltf instanceof ArrayBuffer) {
            const blob = new Blob([gltf], { type: 'application/octet-stream' });
            downloadBlob(blob, `${getBaseFileName()}.glb`);
          } else {
            const output = JSON.stringify(gltf, null, 2);
            const blob = new Blob([output], { type: 'application/json' });
            downloadBlob(blob, `${getBaseFileName()}.gltf`);
          }
          setIsExporting(null);
        },
        (error) => {
          console.error('GLTF Export Error:', error);
          setIsExporting(null);
        },
        { binary: true, embedImages: true }
      );
    } catch (err) {
      console.error(err);
      setIsExporting(null);
    }
  };

  // Export 3D OBJ format
  const handleExportOBJ = () => {
    if (!groupRef.current) return;
    setIsExporting('obj');
    try {
      const exporter = new OBJExporter();
      const result = exporter.parse(groupRef.current);
      const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
      downloadBlob(blob, `${getBaseFileName()}.obj`);
    } catch (err) {
      console.error('OBJ Export Error:', err);
    } finally {
      setIsExporting(null);
    }
  };

  // Export 3D STL format (3D Printing / CNC)
  const handleExportSTL = () => {
    if (!groupRef.current) return;
    setIsExporting('stl');
    try {
      const exporter = new STLExporter();
      const result = exporter.parse(groupRef.current, { binary: true });
      const buffer = result instanceof DataView ? result.buffer : result;
      const blob = new Blob([buffer as ArrayBuffer], { type: 'application/octet-stream' });
      downloadBlob(blob, `${getBaseFileName()}.stl`);
    } catch (err) {
      console.error('STL Export Error:', err);
    } finally {
      setIsExporting(null);
    }
  };

  // Export High-Res PNG Image
  const handleExportPNG = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    setIsExporting('png');
    try {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${getBaseFileName()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('PNG Export Error:', err);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '360px',
          cursor: 'grab',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          className="btn btn-secondary"
          onClick={() => setAutoRotate(!autoRotate)}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <RotateCw size={16} className={autoRotate ? 'spin' : ''} />
          <span>{autoRotate ? 'Остановить вращение' : 'Включить 360° вращение'}</span>
        </button>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={14} color="#f59e0b" /> Тяните мышкой для вращения 3D модели
        </span>
      </div>

      {/* Admin Export Toolbar */}
      {showExportControls && (
        <div
          className="glass-elevated"
          style={{
            width: '100%',
            marginTop: '20px',
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={16} color="var(--primary)" /> Экспорт 3D Модели и Макетная Выгрузка:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <button
              className="btn btn-primary"
              style={{ padding: '10px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={handleExportGLTF}
              disabled={isExporting !== null}
            >
              <Box size={16} />
              {isExporting === 'glb' ? 'Экспорт...' : 'GLTF / GLB (3D)'}
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: '10px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={handleExportOBJ}
              disabled={isExporting !== null}
            >
              <FileCode size={16} />
              {isExporting === 'obj' ? 'Экспорт...' : 'OBJ (CAD Mesh)'}
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: '10px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={handleExportSTL}
              disabled={isExporting !== null}
            >
              <Layers size={16} />
              {isExporting === 'stl' ? 'Экспорт...' : 'STL (3D Принтер)'}
            </button>

            <button
              className="btn btn-gold"
              style={{ padding: '10px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={handleExportPNG}
              disabled={isExporting !== null}
            >
              <Camera size={16} />
              {isExporting === 'png' ? 'Сохранение...' : 'PNG Снимок'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
