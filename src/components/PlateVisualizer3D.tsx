import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { RotateCw, Sparkles, Download, Camera, Box, FileCode, Layers } from 'lucide-react';
import type { PlateConfig } from './PlateVisualizer2D';

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
    const sunR = h * 0.22;

    // 40 Sun Rays
    ctx.fillStyle = '#FBBF24';
    for (let i = 0; i < 40; i++) {
      const angle = (i * Math.PI * 2) / 40;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -sunR * 1.1);
      ctx.quadraticCurveTo(sunR * 0.2, -sunR * 1.5, 0, -sunR * 1.85);
      ctx.quadraticCurveTo(-sunR * 0.2, -sunR * 1.5, 0, -sunR * 1.1);
      ctx.fill();
      ctx.restore();
    }

    // Sun Disk Ring
    ctx.beginPath();
    ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
    ctx.fill();

    // Inner Red Gap
    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.arc(cx, cy, sunR * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Tunduk Arches (Yellow crossing lines)
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(cx - sunR * 0.6, cy - sunR * 0.4);
    ctx.quadraticCurveTo(cx, cy, cx + sunR * 0.6, cy + sunR * 0.4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - sunR * 0.6, cy + sunR * 0.4);
    ctx.quadraticCurveTo(cx, cy, cx + sunR * 0.6, cy - sunR * 0.4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - sunR * 0.4, cy - sunR * 0.6);
    ctx.quadraticCurveTo(cx, cy, cx + sunR * 0.4, cy + sunR * 0.6);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - sunR * 0.4, cy + sunR * 0.6);
    ctx.quadraticCurveTo(cx, cy, cx + sunR * 0.4, cy - sunR * 0.6);
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

  // Helper to generate dynamic high-res canvas texture for 3D model
  const createTextureCanvas = (isBack: boolean) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Background fill based on material
    if (config.material === 'black_matte') {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (!isBack) {
      // FRONT SIDE - Single Crisp Black Border Line around License Plate Face
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 14;
      ctx.strokeStyle = '#1e1e1e';
      ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

      const leftBlockWidth = 205;

      // Vertical line separator between Region and Main Number
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#1e1e1e';
      ctx.beginPath();
      ctx.moveTo(12 + leftBlockWidth, 12);
      ctx.lineTo(12 + leftBlockWidth, canvas.height - 12);
      ctx.stroke();

      // Top part of left block: Region Code ("01")
      ctx.fillStyle = '#1e1e1e';
      ctx.font = '900 155px "FE-Schrift", "License Plate", "Oswald", "Bebas Neue", "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(config.regionCode, 12 + leftBlockWidth / 2, 160);

      // Bottom part of left block: Flag + "KG"
      const flagX = 40;
      const flagY = canvas.height - 145;
      const flagW = 82;
      const flagH = 54;

      drawKyrgyzFlagOnCanvas(ctx, flagX, flagY, flagW, flagH);

      // "KG" text next to flag
      ctx.fillStyle = '#1e1e1e';
      ctx.font = '900 62px "FE-Schrift", "License Plate", "Oswald", "Outfit", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('KG', flagX + flagW + 12, flagY + flagH - 8);

      // Right Main Plate Text (e.g. "777 AAA")
      const pText = config.plateNumber || '777 AAA';
      const fontSize = pText.length > 8 ? 140 : 190;
      ctx.font = `900 ${fontSize}px "FE-Schrift", "License Plate", "Oswald", "Bebas Neue", "Share Tech Mono", monospace`;
      ctx.textAlign = 'center';

      // Subtle shadow effect on plate text for 3D embossed look
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillText(pText, (canvas.width + leftBlockWidth + 26) / 2 + 2, canvas.height / 2 + 52);

      ctx.fillStyle = '#1e1e1e';
      ctx.fillText(pText, (canvas.width + leftBlockWidth + 26) / 2, canvas.height / 2 + 50);

    } else {
      // BACK SIDE
      ctx.fillStyle = config.material === 'black_matte' ? '#111827' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 14;
      ctx.strokeStyle = config.material === 'black_matte' ? '#ffffff' : '#1e1e1e';
      ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

      // Draw Selected Car Logo on Back Side Canvas
      if (config.backSideLogo && config.backSideLogo !== 'none') {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2 - 45);
        ctx.fillStyle = config.material === 'black_matte' ? '#ffffff' : '#1e1e1e';
        ctx.strokeStyle = config.material === 'black_matte' ? '#ffffff' : '#1e1e1e';
        ctx.lineWidth = 6;

        if (config.backSideLogo === 'bmw') {
          ctx.beginPath();
          ctx.arc(0, 0, 50, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-50, 0); ctx.lineTo(50, 0);
          ctx.moveTo(0, -50); ctx.lineTo(0, 50);
          ctx.stroke();
        } else if (config.backSideLogo === 'toyota') {
          ctx.beginPath();
          ctx.ellipse(0, 0, 60, 35, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(0, 0, 25, 30, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (config.backSideLogo === 'mercedes') {
          ctx.beginPath();
          ctx.arc(0, 0, 50, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, -50); ctx.lineTo(0, 0);
          ctx.moveTo(-43, 25); ctx.lineTo(0, 0);
          ctx.moveTo(43, 25); ctx.lineTo(0, 0);
          ctx.stroke();
        } else if (config.backSideLogo === 'lexus') {
          ctx.beginPath();
          ctx.ellipse(0, 0, 60, 35, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.font = 'bold 50px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('L', 0, 18);
        }

        ctx.restore();
      }

      // Back side phone / custom text
      ctx.fillStyle = config.material === 'black_matte' ? '#ffffff' : '#1e1e1e';
      ctx.font = '800 84px Share Tech Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(config.backSideText || '+996 555 123 456', canvas.width / 2, canvas.height - 75);
    }

    return canvas;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 360;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 13);
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
    const backCanvas = createTextureCanvas(true);

    const frontTexture = new THREE.CanvasTexture(frontCanvas);
    const backTexture = new THREE.CanvasTexture(backCanvas);
    frontTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    backTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

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

    const frontMaterial = new THREE.MeshStandardMaterial({
      map: frontTexture,
      metalness: 0.3,
      roughness: 0.2,
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      map: backTexture,
      metalness: 0.3,
      roughness: 0.2,
    });

    // Box Geometry: Width=6.8, Height=2.8 (Authentic 4.7:1 license plate proportion), Depth=0.22
    const materials = [
      sideMaterial, // right
      sideMaterial, // left
      sideMaterial, // top
      sideMaterial, // bottom
      frontMaterial, // front
      backMaterial, // back
    ];

    const plateGeo = new THREE.BoxGeometry(6.8, 2.8, 0.22);
    const plateMesh = new THREE.Mesh(plateGeo, materials);
    group.add(plateMesh);

    // Top Keyring Attach Loop
    const ringGeo = new THREE.TorusGeometry(0.5, 0.08, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: config.material === 'gold_edge' ? 0xffd700 : 0xd1d5db,
      metalness: 0.9,
      roughness: 0.1,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(0, 1.85, 0);
    group.add(ringMesh);

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

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
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
