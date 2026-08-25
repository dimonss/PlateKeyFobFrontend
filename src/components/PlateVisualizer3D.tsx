import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { zipSync, strToU8 } from 'fflate';
import { RotateCw, Sparkles, Download, Camera, Box, FileCode, Layers, Printer, Info } from 'lucide-react';
import { parsePlateText, type PlateConfig } from './PlateVisualizer2D';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const prevConfigRef = useRef<PlateConfig | null>(null);
  const lastInteractionTimeRef = useRef<number>(0);
  const focusedSideRef = useRef<'front' | 'back' | null>(null);
  const currentRotationYRef = useRef<number>(0);
  const currentRotationXRef = useRef<number>(0.1);
  const logoImgRef = useRef<HTMLImageElement | null>(null);

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

  const drawFrontSide = (ctx: CanvasRenderingContext2D, flagImg?: HTMLImageElement) => {
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
    
    ctx.save();
    // Clip to rounded rect matching 2D style rx=1.5 (scaled: 3)
    ctx.beginPath();
    drawRoundedRect(ctx, flagX, flagY, flagW, flagH, 3);
    ctx.clip();
    
    if (flagImg && flagImg.complete && flagImg.naturalWidth > 0) {
      // Draw flag keeping 5:3 aspect ratio (width = 52 * 1.666 = 86.666, offset = (80 - 86.666) / 2 = -3.333)
      ctx.drawImage(flagImg, flagX - 3.333, flagY, 86.666, flagH);
    } else {
      // Simple red fallback
      ctx.fillStyle = '#E11D48';
      ctx.fillRect(flagX, flagY, flagW, flagH);
    }
    ctx.restore();

    // Flag border stroke matching 2D style stroke="rgba(0,0,0,0.2)"
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    drawRoundedRect(ctx, flagX, flagY, flagW, flagH, 3);
    ctx.stroke();
    ctx.restore();
    
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
    
    // Key chain ring hole area (Clean background, 3D physical hole is extruded in geometry)
    ctx.save();
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
    
    let maxW = 240;
    let maxH = 190;
    if (['toyota', 'lexus', 'hyundai', 'kia', 'audi', 'chevrolet'].includes(config.backSideLogo)) {
      maxW = 300;
      maxH = 180;
    }

    let logoW = maxW;
    let logoH = maxH;

    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0 && logoImg.naturalHeight > 0) {
      const imgRatio = logoImg.naturalWidth / logoImg.naturalHeight;
      if (maxW / maxH > imgRatio) {
        logoW = maxH * imgRatio;
      } else {
        logoH = maxW / imgRatio;
      }
    }
    
    if (hasLogo && hasText) {
      ctx.font = "700 88px 'Oswald', 'Outfit', 'Inter', sans-serif";
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
      ctx.fillText(config.backSideText, startX + logoW + gap, 126);
      
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
      ctx.font = "700 88px 'Oswald', 'Outfit', 'Inter', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.backSideText, 530, 126);
    }
    ctx.restore();
    
    // Key chain ring hole area (Clean background, 3D physical hole is extruded in geometry)
    ctx.save();
    ctx.restore();
  };

  const createTextureCanvas = (isBack: boolean, flagImg?: HTMLImageElement, logoImg?: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1060;
    canvas.height = 244;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    if (!isBack) {
      drawFrontSide(ctx, flagImg);
      // Punch transparent hole in texture at top-right (x = 1015, y = 45, r = 21)
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(1015, 45, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      drawBackSide(ctx, logoImg);
      // Punch transparent hole in texture at top-left of back side (x = 45, y = 45, r = 21)
      // This matches the physical 3D hole location on back view
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(45, 45, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    return canvas;
  };

  useEffect(() => {
    if (prevConfigRef.current) {
      const prev = prevConfigRef.current;
      const frontChanged = prev.plateNumber !== config.plateNumber || prev.regionCode !== config.regionCode;
      const backChanged = prev.backSideText !== config.backSideText || prev.backSideLogo !== config.backSideLogo;

      if (frontChanged) {
        focusedSideRef.current = 'front';
        lastInteractionTimeRef.current = Date.now();
      } else if (backChanged) {
        focusedSideRef.current = 'back';
        lastInteractionTimeRef.current = Date.now();
      }
    }
    prevConfigRef.current = config;

    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 360;

    let active = true;
    let cleanupFn: (() => void) | undefined;

    const logoImg = new Image();
    const flagImg = new Image();
    const hasLogo = config.backSideLogo && config.backSideLogo !== 'none';

    let loadedCount = 0;
    let targetLoadCount = 1; // flag is always loaded
    if (hasLogo) targetLoadCount++;

    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount === targetLoadCount) {
        startRender();
      }
    };

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

      // Restore rotation from refs
      group.rotation.y = currentRotationYRef.current;
      group.rotation.x = currentRotationXRef.current;

      // Generate textures from canvas
      const frontCanvas = createTextureCanvas(false, flagImg);
      const backCanvas = createTextureCanvas(true, undefined, logoImg);

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
      const x = -width3d / 2;
      const y = -height3d / 2;

      // Create front shape with hole at top-right
      const frontShape = new THREE.Shape();
      frontShape.moveTo(x + radius3d, y);
      frontShape.lineTo(x + width3d - radius3d, y);
      frontShape.quadraticCurveTo(x + width3d, y, x + width3d, y + radius3d);
      frontShape.lineTo(x + width3d, y + height3d - radius3d);
      frontShape.quadraticCurveTo(x + width3d, y + height3d, x + width3d - radius3d, y + height3d);
      frontShape.lineTo(x + radius3d, y + height3d);
      frontShape.quadraticCurveTo(x, y + height3d, x, y + height3d - radius3d);
      frontShape.lineTo(x, y + radius3d);
      frontShape.quadraticCurveTo(x, y, x + radius3d, y);

      const frontHole = new THREE.Path();
      frontHole.absarc(x + width3d - 0.34, y + height3d - 0.36, 0.16, 0, Math.PI * 2, true);
      frontShape.holes.push(frontHole);

      // Create back shape with hole at top-left (so when rotated 180° on Y, hole perfectly aligns at top-right of scene / top-left of back view)
      const backShape = new THREE.Shape();
      backShape.moveTo(x + radius3d, y);
      backShape.lineTo(x + width3d - radius3d, y);
      backShape.quadraticCurveTo(x + width3d, y, x + width3d, y + radius3d);
      backShape.lineTo(x + width3d, y + height3d - radius3d);
      backShape.quadraticCurveTo(x + width3d, y + height3d, x + width3d - radius3d, y + height3d);
      backShape.lineTo(x + radius3d, y + height3d);
      backShape.quadraticCurveTo(x, y + height3d, x, y + height3d - radius3d);
      backShape.lineTo(x, y + radius3d);
      backShape.quadraticCurveTo(x, y, x + radius3d, y);

      const backHole = new THREE.Path();
      backHole.absarc(x + 0.34, y + height3d - 0.36, 0.16, 0, Math.PI * 2, true);
      backShape.holes.push(backHole);

      const extrudeSettings = {
        depth: 0.04,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.02,
        bevelThickness: 0.02,
        bevelOffset: -0.02,
      };

      const frontGeo = new THREE.ExtrudeGeometry(frontShape, extrudeSettings);
      const backGeo = new THREE.ExtrudeGeometry(backShape, extrudeSettings);

      const frontMesh = new THREE.Mesh(frontGeo, [frontMaterial, sideMaterial]);
      frontMesh.position.set(0, 0, 0);
      group.add(frontMesh);

      const backMesh = new THREE.Mesh(backGeo, [backMaterial, sideMaterial]);
      backMesh.position.set(0, 0, 0);
      backMesh.rotation.y = Math.PI;
      group.add(backMesh);

      scene.add(group);

      // Mouse Drag Rotation Logic
      let isDragging = false;
      let previousMousePosition = { x: 0, y: 0 };

      const updateInteraction = () => {
        lastInteractionTimeRef.current = Date.now();
        focusedSideRef.current = null;
      };

      const onMouseDown = (e: MouseEvent) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
        updateInteraction();
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        group.rotation.y += deltaX * 0.01;
        group.rotation.x += deltaY * 0.01;

        previousMousePosition = { x: e.clientX, y: e.clientY };
        updateInteraction();
      };

      const onMouseUp = () => {
        if (isDragging) {
          isDragging = false;
          updateInteraction();
        }
      };

      const domElement = renderer.domElement;
      domElement.style.touchAction = 'none';
      domElement.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      // Touch support
      const onTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          isDragging = true;
          previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          updateInteraction();
        }
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!isDragging || e.touches.length !== 1) return;
        if (e.cancelable) {
          e.preventDefault();
        }
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;

        group.rotation.y += deltaX * 0.01;
        group.rotation.x += deltaY * 0.01;

        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        updateInteraction();
      };

      const onTouchEnd = () => {
        if (isDragging) {
          isDragging = false;
          updateInteraction();
        }
      };

      domElement.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
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

        const now = Date.now();
        const timeSinceInteraction = now - lastInteractionTimeRef.current;

        if (isDragging) {
          currentRotationYRef.current = group.rotation.y;
          currentRotationXRef.current = group.rotation.x;
          focusedSideRef.current = null;
        } else {
          if (focusedSideRef.current !== null && timeSinceInteraction < 5000) {
            // Target orientation: 0 for front, Math.PI for back
            const targetY = focusedSideRef.current === 'front' ? 0 : Math.PI;

            // Gentle swaying using sine/cosine waves
            const swayY = Math.sin(timeSinceInteraction * 0.001 * 2.5) * 0.12;
            const swayX = Math.cos(timeSinceInteraction * 0.001 * 2.0) * 0.04;

            const targetWithSwayY = targetY + swayY;
            const targetWithSwayX = 0.1 + swayX;

            // Interpolate smoothly
            let diffY = targetWithSwayY - group.rotation.y;
            diffY = Math.atan2(Math.sin(diffY), Math.cos(diffY));
            group.rotation.y += diffY * 0.08;
            group.rotation.x += (targetWithSwayX - group.rotation.x) * 0.08;
          } else if (timeSinceInteraction < 5000) {
            // Pause auto-rotation for 5 seconds after mouse/touch drag interaction
            group.rotation.x += (0.1 - group.rotation.x) * 0.05;
          } else {
            if (autoRotate) {
              group.rotation.y += 0.015;
            }
            // Smoothly return X to default tilt
            group.rotation.x += (0.1 - group.rotation.x) * 0.05;
          }

          currentRotationYRef.current = group.rotation.y;
          currentRotationXRef.current = group.rotation.x;
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
        frontGeo.dispose();
        backGeo.dispose();
        frontTexture.dispose();
        backTexture.dispose();
        sideMaterial.dispose();
        frontMaterial.dispose();
        backMaterial.dispose();
      };
    };

    if (hasLogo) {
      logoImg.src = `${import.meta.env.BASE_URL}logos/${config.backSideLogo}.svg`;
      logoImg.onload = () => {
        logoImgRef.current = logoImg;
        checkLoaded();
      };
      logoImg.onerror = checkLoaded;
    } else {
      logoImgRef.current = null;
    }
    
    flagImg.src = `${import.meta.env.BASE_URL}flag.svg`;
    flagImg.onload = checkLoaded;
    flagImg.onerror = checkLoaded;

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
  };  // Helper to construct a flat, 1:7 scale (74.3mm x 16.0mm x 2.6mm) 3D printable solid mesh with real 3D raised text, borders & multi-color flag
  const buildPrintable3DGroup = (): THREE.Group => {
    const printableGroup = new THREE.Group();

    const width = 74.3;    // 74.3 mm length (exact 1:7 scale of 520mm real plate)
    const height = 16.0;   // 16.0 mm height (exact 1:7 scale of 112mm real plate)
    const radius = 1.85;   // 1.85 mm corner radius
    const baseThickness = 2.0; // 2.0 mm base thickness (10 layers at 0.2mm)
    const holeX = 34.0;    // 34.0 mm hole center X (moved to edge, right against black border)
    const holeY = 5.0;     // 5.0 mm hole center Y (moved to edge, right against black border)
    const holeRadius = 1.7; // 1.7 mm hole radius (3.4 mm diameter through-hole)

    // 1. Base Plate Solid Body with Keyring Hole
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;

    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);

    // Keyring hole at top-right (through-hole with smooth 32 segments)
    const holePath = new THREE.Path();
    holePath.absarc(holeX, holeY, holeRadius, 0, Math.PI * 2, true);
    shape.holes = [holePath];

    const extrudeSettings = {
      depth: baseThickness,
      bevelEnabled: false,
      steps: 1,
      curveSegments: 32,
    };

    let baseColorHex = 0xffffff;
    if (config.material === 'black_matte') baseColorHex = 0x1f2937;
    else if (config.material === 'gold_edge') baseColorHex = 0xffd700;
    else if (config.material === 'carbon') baseColorHex = 0x27272a;
    else if (config.material === 'plastic') baseColorHex = 0xcbd5e1;

    const baseGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const baseMat = new THREE.MeshStandardMaterial({ color: baseColorHex, roughness: 0.3 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.name = 'BasePlate_Color_0';
    printableGroup.add(baseMesh);

    const positionsByColor: Record<number, number[]> = { 1: [], 2: [], 3: [] };
    const sampleW = 1060;
    const sampleH = 244;
    const cellW = width / sampleW;
    const cellH = height / sampleH;

    // Helper to generate 100% watertight, closed 2-manifold solid mesh with merged horizontal quads
    const buildWatertightRelief = (
      grid: number[][],
      isBack: boolean,
      cz1: number,
      cz2Default: number
    ) => {
      for (const cIdx of [1, 2, 3]) {
        const cz2 = (cIdx === 2 || cIdx === 3) && !isBack ? cz2Default - 0.15 : cz2Default;
        const targetArr = positionsByColor[cIdx];

        // 1. Top Face (+Z normal) and 2. Bottom Face (-Z normal) with Horizontal Run-Length Merging
        for (let gy = 0; gy < sampleH; gy++) {
          let gx = 0;
          while (gx < sampleW) {
            if (grid[gy][gx] === cIdx) {
              const startGx = gx;
              while (gx < sampleW && grid[gy][gx] === cIdx) {
                gx++;
              }
              const endGx = gx;

              const spanCy1 = height / 2 - (gy + 1) * cellH;
              const spanCy2 = spanCy1 + cellH;

              let spanCx1: number;
              let spanCx2: number;

              if (!isBack) {
                spanCx1 = -width / 2 + startGx * cellW;
                spanCx2 = -width / 2 + endGx * cellW;
              } else {
                // Mirrored for back view looking from -Z
                spanCx1 = width / 2 - endGx * cellW;
                spanCx2 = width / 2 - startGx * cellW;
              }

              // Top Face (+Z normal)
              targetArr.push(
                spanCx1, spanCy1, cz2,   spanCx2, spanCy1, cz2,   spanCx2, spanCy2, cz2,
                spanCx1, spanCy1, cz2,   spanCx2, spanCy2, cz2,   spanCx1, spanCy2, cz2
              );

              // Bottom Face (-Z normal)
              targetArr.push(
                spanCx1, spanCy1, cz1,   spanCx2, spanCy2, cz1,   spanCx2, spanCy1, cz1,
                spanCx1, spanCy1, cz1,   spanCx1, spanCy2, cz1,   spanCx2, spanCy2, cz1
              );
            } else {
              gx++;
            }
          }
        }

        // 3. Side Walls (North, South, West, East) connecting cz1 to cz2 with correct outward normals
        for (let gy = 0; gy < sampleH; gy++) {
          for (let gx = 0; gx < sampleW; gx++) {
            if (grid[gy][gx] !== cIdx) continue;

            const cy1 = height / 2 - (gy + 1) * cellH;
            const cy2 = cy1 + cellH;

            let cx1: number;
            let cx2: number;

            if (!isBack) {
              cx1 = -width / 2 + gx * cellW;
              cx2 = cx1 + cellW;
            } else {
              cx1 = width / 2 - (gx + 1) * cellW;
              cx2 = width / 2 - gx * cellW;
            }

            // North Wall (facing +Y normal)
            if (gy === 0 || grid[gy - 1][gx] !== cIdx) {
              targetArr.push(
                cx1, cy2, cz1,   cx2, cy2, cz2,   cx2, cy2, cz1,
                cx1, cy2, cz1,   cx1, cy2, cz2,   cx2, cy2, cz2
              );
            }

            // South Wall (facing -Y normal)
            if (gy === sampleH - 1 || grid[gy + 1][gx] !== cIdx) {
              targetArr.push(
                cx1, cy1, cz1,   cx2, cy1, cz1,   cx2, cy1, cz2,
                cx1, cy1, cz1,   cx2, cy1, cz2,   cx1, cy1, cz2
              );
            }

            // West Wall (facing -X in world space, at cx1)
            const isWestBoundary = !isBack
              ? (gx === 0 || grid[gy][gx - 1] !== cIdx)
              : (gx === sampleW - 1 || grid[gy][gx + 1] !== cIdx);

            if (isWestBoundary) {
              targetArr.push(
                cx1, cy1, cz1,   cx1, cy1, cz2,   cx1, cy2, cz2,
                cx1, cy1, cz1,   cx1, cy2, cz2,   cx1, cy2, cz1
              );
            }

            // East Wall (facing +X in world space, at cx2)
            const isEastBoundary = !isBack
              ? (gx === sampleW - 1 || grid[gy][gx + 1] !== cIdx)
              : (gx === 0 || grid[gy][gx - 1] !== cIdx);

            if (isEastBoundary) {
              targetArr.push(
                cx2, cy1, cz1,   cx2, cy2, cz2,   cx2, cy1, cz2,
                cx2, cy1, cz1,   cx2, cy2, cz1,   cx2, cy2, cz2
              );
            }
          }
        }
      }
    };

    // 2. High-Definition FRONT 3D Relief Canvas (1060 x 244)
    const cleanCanvas = document.createElement('canvas');
    cleanCanvas.width = sampleW;
    cleanCanvas.height = sampleH;
    const cleanCtx = cleanCanvas.getContext('2d');

    if (cleanCtx) {
      cleanCtx.fillStyle = '#FFFFFF';
      cleanCtx.fillRect(0, 0, sampleW, sampleH);

      // Black frame line
      cleanCtx.save();
      cleanCtx.strokeStyle = '#1E1E1E';
      cleanCtx.lineWidth = 9;
      cleanCtx.beginPath();
      drawRoundedRect(cleanCtx, 14.5, 14.5, 1031, 215, 12);
      cleanCtx.stroke();
      cleanCtx.restore();

      // Vertical separator line
      cleanCtx.save();
      cleanCtx.strokeStyle = '#1E1E1E';
      cleanCtx.lineWidth = 9;
      cleanCtx.beginPath();
      cleanCtx.moveTo(290, 10);
      cleanCtx.lineTo(290, 234);
      cleanCtx.stroke();
      cleanCtx.restore();

      // Region code
      cleanCtx.save();
      cleanCtx.fillStyle = '#1E1E1E';
      cleanCtx.font = "600 112px 'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Bebas Neue', monospace";
      cleanCtx.textAlign = 'center';
      cleanCtx.textBaseline = 'alphabetic';
      cleanCtx.fillText(config.regionCode || '01', 150, 124);
      cleanCtx.restore();

      // Flag of Kyrgyz Republic
      const flagX = 66;
      const flagY = 154;
      const flagW = 80;
      const flagH = 52;
      cleanCtx.save();
      cleanCtx.beginPath();
      drawRoundedRect(cleanCtx, flagX, flagY, flagW, flagH, 3);
      cleanCtx.clip();
      cleanCtx.fillStyle = '#E11D48';
      cleanCtx.fillRect(flagX, flagY, flagW, flagH);
      // Yellow sun emblem circle
      cleanCtx.fillStyle = '#F59E0B';
      cleanCtx.beginPath();
      cleanCtx.arc(flagX + flagW / 2, flagY + flagH / 2, 14, 0, Math.PI * 2);
      cleanCtx.fill();
      cleanCtx.restore();

      // "KG" text
      cleanCtx.save();
      cleanCtx.fillStyle = '#1E1E1E';
      cleanCtx.font = "700 60px 'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Outfit', sans-serif";
      cleanCtx.textAlign = 'left';
      cleanCtx.textBaseline = 'alphabetic';
      cleanCtx.fillText('KG', 162, 202);
      cleanCtx.restore();

      // Main plate number
      cleanCtx.save();
      const parsed = parsePlateText(config.plateNumber);
      if (parsed.isStandard) {
        cleanCtx.font = "600 184px 'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Bebas Neue', monospace";
        const digitsW = cleanCtx.measureText(parsed.digits).width;
        cleanCtx.font = "600 152px 'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Bebas Neue', monospace";
        const lettersW = parsed.letters ? cleanCtx.measureText(parsed.letters).width : 0;
        const dx = 48;
        const totalW = digitsW + (parsed.letters ? dx + lettersW : 0);
        const startX = 670 - totalW / 2;

        cleanCtx.fillStyle = '#1E1E1E';
        cleanCtx.font = "600 184px 'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Bebas Neue', monospace";
        cleanCtx.textAlign = 'left';
        cleanCtx.textBaseline = 'alphabetic';
        cleanCtx.fillText(parsed.digits, startX, 194);

        if (parsed.letters) {
          cleanCtx.font = "600 152px 'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Bebas Neue', monospace";
          cleanCtx.fillText(parsed.letters, startX + digitsW + dx, 194);
        }
      } else {
        const textLen = parsed.digits.length;
        const fontSize = (textLen > 8 ? 54 : textLen > 6 ? 70 : 86) * 2;
        cleanCtx.fillStyle = '#1E1E1E';
        cleanCtx.font = `600 ${fontSize}px 'Euro Plate', 'FE-Schrift', 'License Plate', 'Oswald', 'Bebas Neue', monospace`;
        cleanCtx.textAlign = 'center';
        cleanCtx.textBaseline = 'alphabetic';
        cleanCtx.fillText(parsed.digits, 670, 192);
      }
      cleanCtx.restore();

      const imgData = cleanCtx.getImageData(0, 0, sampleW, sampleH);
      const pixels = imgData.data;

      // Build 2D color grid for 3D extrusion
      const grid: number[][] = Array.from({ length: sampleH }, () => new Array(sampleW).fill(0));

      for (let gy = 0; gy < sampleH; gy++) {
        for (let gx = 0; gx < sampleW; gx++) {
          const cellCenterX = -width / 2 + (gx + 0.5) * cellW;
          const cellCenterY = height / 2 - (gy + 0.5) * cellH;

          // Always ensure keyring hole is 100% clear and unobstructed
          if (Math.hypot(cellCenterX - holeX, cellCenterY - holeY) <= holeRadius + 0.25) {
            continue;
          }

          const idx = (gy * sampleW + gx) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];
          const a = pixels[idx + 3];

          if (a < 128) continue;

          let colorIdx = 0;
          if (r > 140 && g < 100 && b < 120) {
            colorIdx = 2; // Flag Red
          } else if (r > 170 && g > 130 && b < 100) {
            colorIdx = 3; // Flag Yellow
          } else if ((r * 0.299 + g * 0.587 + b * 0.114) < 160) {
            colorIdx = 1; // Black Text/Digits/Border
          }
          grid[gy][gx] = colorIdx;
        }
      }

      // Front relief: Flush with top of base plate (z = 2.0mm) and raised to 2.6mm (+0.6mm above base plate)
      buildWatertightRelief(grid, false, baseThickness, baseThickness + 0.6);
    }

    // 3. High-Definition BACK 3D Relief Canvas (1060 x 244)
    const hasBackContent = (config.backSideText && config.backSideText.trim()) || (config.backSideLogo && config.backSideLogo !== 'none');
    if (hasBackContent) {
      const cleanBackCanvas = document.createElement('canvas');
      cleanBackCanvas.width = sampleW;
      cleanBackCanvas.height = sampleH;
      const cleanBackCtx = cleanBackCanvas.getContext('2d');

      if (cleanBackCtx) {
        cleanBackCtx.fillStyle = '#FFFFFF';
        cleanBackCtx.fillRect(0, 0, sampleW, sampleH);

        // Black frame line
        cleanBackCtx.save();
        cleanBackCtx.strokeStyle = '#1E1E1E';
        cleanBackCtx.lineWidth = 9;
        cleanBackCtx.beginPath();
        drawRoundedRect(cleanBackCtx, 14.5, 14.5, 1031, 215, 12);
        cleanBackCtx.stroke();
        cleanBackCtx.restore();

        const hasText = !!(config.backSideText && config.backSideText.trim());
        const hasLogo = config.backSideLogo && config.backSideLogo !== 'none';
        const logoImg = logoImgRef.current;

        let maxW = 240;
        let maxH = 190;
        if (['toyota', 'lexus', 'hyundai', 'kia', 'audi', 'chevrolet'].includes(config.backSideLogo)) {
          maxW = 300;
          maxH = 180;
        }

        let logoW = maxW;
        let logoH = maxH;
        if (logoImg && logoImg.complete && logoImg.naturalWidth > 0 && logoImg.naturalHeight > 0) {
          const imgRatio = logoImg.naturalWidth / logoImg.naturalHeight;
          if (maxW / maxH > imgRatio) {
            logoW = maxH * imgRatio;
          } else {
            logoH = maxW / imgRatio;
          }
        }

        if (hasLogo && hasText) {
          cleanBackCtx.font = "700 88px 'Oswald', 'Outfit', 'Inter', sans-serif";
          const textW = cleanBackCtx.measureText(config.backSideText).width;
          const gap = 48;
          const totalW = logoW + gap + textW;
          const startX = 530 - totalW / 2;

          if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
            cleanBackCtx.save();
            if (config.backSideLogo !== 'bmw') {
              cleanBackCtx.filter = 'brightness(0)';
            }
            cleanBackCtx.drawImage(logoImg, startX, 122 - logoH / 2, logoW, logoH);
            cleanBackCtx.restore();
          }

          cleanBackCtx.fillStyle = '#1E1E1E';
          cleanBackCtx.textAlign = 'left';
          cleanBackCtx.textBaseline = 'middle';
          cleanBackCtx.fillText(config.backSideText, startX + logoW + gap, 126);

        } else if (hasLogo) {
          const startX = 530 - logoW / 2;
          if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
            cleanBackCtx.save();
            if (config.backSideLogo !== 'bmw') {
              cleanBackCtx.filter = 'brightness(0)';
            }
            cleanBackCtx.drawImage(logoImg, startX, 122 - logoH / 2, logoW, logoH);
            cleanBackCtx.restore();
          }

        } else if (hasText) {
          cleanBackCtx.fillStyle = '#1E1E1E';
          cleanBackCtx.font = "700 88px 'Oswald', 'Outfit', 'Inter', sans-serif";
          cleanBackCtx.textAlign = 'center';
          cleanBackCtx.textBaseline = 'middle';
          cleanBackCtx.fillText(config.backSideText, 530, 126);
        }

        const imgDataBack = cleanBackCtx.getImageData(0, 0, sampleW, sampleH);
        const pixelsBack = imgDataBack.data;

        const gridBack: number[][] = Array.from({ length: sampleH }, () => new Array(sampleW).fill(0));

        for (let gy = 0; gy < sampleH; gy++) {
          for (let gx = 0; gx < sampleW; gx++) {
            // Check hole in back world coordinates
            const cellWorldX = width / 2 - (gx + 0.5) * cellW;
            const cellWorldY = height / 2 - (gy + 0.5) * cellH;

            if (Math.hypot(cellWorldX - holeX, cellWorldY - holeY) <= holeRadius + 0.25) {
              continue;
            }

            const idx = (gy * sampleW + gx) * 4;
            const r = pixelsBack[idx];
            const g = pixelsBack[idx + 1];
            const b = pixelsBack[idx + 2];
            const a = pixelsBack[idx + 3];

            if (a < 128) continue;

            let colorIdx = 0;
            if (r > 140 && g < 100 && b < 120) {
              colorIdx = 2; // Red
            } else if (r > 170 && g > 130 && b < 100) {
              colorIdx = 3; // Yellow
            } else if ((r * 0.299 + g * 0.587 + b * 0.114) < 160) {
              colorIdx = 1; // Black
            }
            gridBack[gy][gx] = colorIdx;
          }
        }

        // Back relief: Flush with build plate (z = 0.0mm) and inlaid 0.4mm into base plate
        buildWatertightRelief(gridBack, true, 0.0, 0.4);
      }
    }

    const colorMaterials: Record<number, number> = {
      1: 0x1e1e1e, // Black Text / Border / Logo
      2: 0xe11d48, // Flag Red
      3: 0xf59e0b, // Flag Yellow / Gold
    };

    for (const [cIdxStr, posArray] of Object.entries(positionsByColor)) {
      const cIdx = Number(cIdxStr);
      if (posArray.length > 0) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(posArray, 3));
        geo.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({ color: colorMaterials[cIdx], roughness: 0.3 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.name = `Relief_Color_${cIdx}`;
        printableGroup.add(mesh);
      }
    }

    return printableGroup;
  };

  // Export 3D 3MF format (Native BambuStudio / PrusaSlicer Multi-part Assembly format for Bambu Lab P2S)
  // Exported as a multi-part assembly with separate components for Base, Text/Borders, Flag Red, Flag Yellow
  const handleExport3MF = async () => {
    setIsExporting('3mf');
    try {
      if (document.fonts) {
        try {
          await document.fonts.load("600 184px 'Euro Plate'");
          await document.fonts.load("700 88px 'Oswald'");
        } catch (e) {}
        await document.fonts.ready;
      }

      const hasLogo = config.backSideLogo && config.backSideLogo !== 'none';
      if (hasLogo && (!logoImgRef.current || !logoImgRef.current.complete || logoImgRef.current.naturalWidth === 0)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = `${import.meta.env.BASE_URL}logos/${config.backSideLogo}.svg`;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        logoImgRef.current = img;
      }

      const printableGroup = buildPrintable3DGroup();
      printableGroup.updateMatrixWorld(true);

      let baseColorHex = '#FFFFFF';
      if (config.material === 'black_matte') baseColorHex = '#1F2937';
      else if (config.material === 'gold_edge') baseColorHex = '#FFD700';
      else if (config.material === 'carbon') baseColorHex = '#27272A';
      else if (config.material === 'plastic') baseColorHex = '#CBD5E1';

      interface ModelPart {
        name: string;
        colorIndex: number;
        mesh: THREE.Mesh;
      }

      const parts: ModelPart[] = [];

      printableGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.name === 'BasePlate_Color_0') {
            parts.push({ name: 'Base_Plate', colorIndex: 0, mesh });
          } else if (mesh.name === 'Relief_Color_1') {
            parts.push({ name: 'Text_and_Border', colorIndex: 1, mesh });
          } else if (mesh.name === 'Relief_Color_2') {
            parts.push({ name: 'Flag_Red', colorIndex: 2, mesh });
          } else if (mesh.name === 'Relief_Color_3') {
            parts.push({ name: 'Flag_Yellow', colorIndex: 3, mesh });
          }
        }
      });

      let objectsXml = '';
      let componentsXml = '';
      let nextObjectId = 2;

      for (const part of parts) {
        const objectId = nextObjectId++;
        const geometry = part.mesh.geometry.clone();
        geometry.applyMatrix4(part.mesh.matrixWorld);

        const posAttr = geometry.attributes.position;
        const indexAttr = geometry.index;

        if (!posAttr || posAttr.count === 0) continue;

        let verticesXml = '';
        for (let i = 0; i < posAttr.count; i++) {
          const x = posAttr.getX(i);
          const y = posAttr.getY(i);
          const z = posAttr.getZ(i);
          verticesXml += `        <vertex x="${x.toFixed(4)}" y="${y.toFixed(4)}" z="${z.toFixed(4)}" />\n`;
        }

        let trianglesXml = '';
        if (indexAttr) {
          for (let i = 0; i < indexAttr.count; i += 3) {
            const v1 = indexAttr.getX(i);
            const v2 = indexAttr.getX(i + 1);
            const v3 = indexAttr.getX(i + 2);
            trianglesXml += `        <triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="1" p1="${part.colorIndex}" />\n`;
          }
        } else {
          for (let i = 0; i < posAttr.count; i += 3) {
            trianglesXml += `        <triangle v1="${i}" v2="${i + 1}" v3="${i + 2}" pid="1" p1="${part.colorIndex}" />\n`;
          }
        }

        objectsXml += `    <object id="${objectId}" type="model" name="${part.name}" pid="1" pindex="${part.colorIndex}">
      <metadata name="extruder">${part.colorIndex + 1}</metadata>
      <mesh>
        <vertices>
${verticesXml}        </vertices>
        <triangles>
${trianglesXml}        </triangles>
      </mesh>
    </object>\n`;

        componentsXml += `      <component objectid="${objectId}" />\n`;
      }

      const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US"
  xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"
  xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02"
  xmlns:BambuStudio="http://schemas.bambulab.com/package/2021/bambustudio">
  <metadata name="Application">BambuStudio</metadata>
  <metadata name="BambuStudio:Version">01.09.00.00</metadata>
  <metadata name="PrinterModel">Bambu Lab P2S</metadata>
  <metadata name="Title">${getBaseFileName()}</metadata>
  <resources>
    <m:colorgroup id="1">
      <m:color color="${baseColorHex.toUpperCase()}FF" />
      <m:color color="#1E1E1EFF" />
      <m:color color="#E11D48FF" />
      <m:color color="#F59E0BFF" />
    </m:colorgroup>
${objectsXml}    <object id="1" type="model" name="${getBaseFileName()}">
      <components>
${componentsXml}      </components>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;

      const zipped = zipSync({
        '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
 <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
 <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`),
        '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`),
        '3D/3dmodel.model': strToU8(modelXml)
      });

      const blob = new Blob([zipped.buffer], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel' });
      downloadBlob(blob, `${getBaseFileName()}_BambuStudio.3mf`);
    } catch (err) {
      console.error('3MF Export Error:', err);
    } finally {
      setIsExporting(null);
    }
  };

  // Export 3D STL format (3D Printing / CNC)
  const handleExportSTL = async () => {
    setIsExporting('stl');
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
      const printableGroup = buildPrintable3DGroup();
      printableGroup.updateMatrixWorld(true);

      const exporter = new STLExporter();
      const result = exporter.parse(printableGroup, { binary: true });
      const buffer = result instanceof DataView ? result.buffer : result;
      const blob = new Blob([buffer as ArrayBuffer], { type: 'application/octet-stream' });
      downloadBlob(blob, `${getBaseFileName()}_BambuStudio.stl`);
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
          touchAction: 'none',
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

      {/* Export Toolbar (Admin Only) */}
      {showExportControls && user?.isAdmin && (
        <div
          className="glass-elevated"
          style={{
            width: '100%',
            marginTop: '20px',
            padding: '20px',
            borderRadius: '16px',
            background: 'var(--bg-glass-elevated)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* BambuStudio Dedicated Section */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={20} color="#10b981" /> Готовность к 3D Печати: Bambu Lab P2S (BambuStudio)
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>
              Скачайте файл 3D модели в формате <strong>.3mf</strong> или <strong>.stl</strong> и откройте его прямо в BambuStudio для отправки на ваш принтер Bambu Lab P2S.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              <button
                className="btn btn-primary"
                style={{
                  padding: '12px 14px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                }}
                onClick={handleExport3MF}
                disabled={isExporting !== null}
              >
                <Printer size={18} />
                {isExporting === '3mf' ? 'Генерация 3MF...' : 'Скачать 3MF (BambuStudio)'}
              </button>

              <button
                className="btn btn-secondary"
                style={{
                  padding: '12px 14px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                onClick={handleExportSTL}
                disabled={isExporting !== null}
              >
                <Layers size={18} />
                {isExporting === 'stl' ? 'Экспорт STL...' : 'Скачать STL (Mesh)'}
              </button>
            </div>

            {/* Recommended Bambu P2S Settings */}
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                background: 'var(--bg-input)',
                borderRadius: '8px',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info size={14} color="#10b981" /> Рекомендуемые настройки в BambuStudio для P2S:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                <li><strong>Размер модели:</strong> 74.3 × 16.0 × 2.6 мм (оптимальный масштаб 1:7 для сопла 0.4 мм)</li>
                <li><strong>Принтер:</strong> Bambu Lab P2S / X1C / P1S / A1 | <strong>Сопло:</strong> 0.4 мм (или 0.2 мм)</li>
                <li><strong>Высота слоя (Layer height):</strong> 0.16 мм или 0.20 мм (рельеф +0.6 мм)</li>
                <li><strong>Генератор линий:</strong> Arachne (рекомендуется для идеальной четкости мелкого шрифта)</li>
                <li><strong>Заполнение (Infill):</strong> 20% Gyroid | <strong>Стенки (Wall loops):</strong> 3-4</li>
                <li><strong>AMS / Многоцветная печать:</strong> Автоматическая сборка деталей (Base, Text, Flag Red, Flag Yellow). Пауза для смены цвета без AMS на высоте Z = 2.0 мм</li>
              </ul>
            </div>
          </div>

          {/* Other Export Formats */}
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={15} /> Другие форматы и снимки:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '8px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={handleExportGLTF}
              disabled={isExporting !== null}
            >
              <Box size={15} />
              {isExporting === 'glb' ? 'Экспорт...' : 'GLTF / GLB'}
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: '8px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={handleExportOBJ}
              disabled={isExporting !== null}
            >
              <FileCode size={15} />
              {isExporting === 'obj' ? 'Экспорт...' : 'OBJ Mesh'}
            </button>

            <button
              className="btn btn-gold"
              style={{ padding: '8px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={handleExportPNG}
              disabled={isExporting !== null}
            >
              <Camera size={15} />
              {isExporting === 'png' ? 'Сохранение...' : 'PNG Снимок'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
