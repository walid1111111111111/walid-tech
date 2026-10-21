import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ModelOpeningType, Unit, SashConfig, SashFunction } from '../../types';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Camera,
  Play,
  Pause,
  Sun,
  Layers,
  Sparkles,
  Info,
  Ruler,
  Eye,
  Sliders,
  Check,
  Building,
  Volume2,
} from 'lucide-react';

export interface Window3DPreviewProps {
  width: number;
  height: number;
  unit: Unit;
  sashes: number;
  openingType: ModelOpeningType;
  colorHex: string;
  glassTypeName?: string;
  sashConfigs?: SashConfig[];
  activeSashIndex?: number;
  onSelectSash?: (index: number) => void;
  className?: string;
  showDimensions?: boolean;
}

export const Window3DPreview: React.FC<Window3DPreviewProps> = ({
  width,
  height,
  unit,
  sashes,
  openingType,
  colorHex,
  glassTypeName = '',
  sashConfigs,
  activeSashIndex,
  onSelectSash,
  className = '',
  showDimensions = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // User interactive states
  const [isOpenSimulation, setIsOpenSimulation] = useState<boolean>(false);
  const [openAngleRatio, setOpenAngleRatio] = useState<number>(0.75); // 0 to 1
  const [obMode, setObMode] = useState<'tilt' | 'turn'>('turn'); // For OB sashes: tilt (قلاب) or turn (مفصلي)
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [showWall, setShowWall] = useState<boolean>(true);
  const [lightingPreset, setLightingPreset] = useState<'daylight' | 'studio'>('daylight');
  const [show3DDimensions, setShow3DDimensions] = useState<boolean>(showDimensions);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [cameraView, setCameraView] = useState<'perspective' | 'front' | 'side' | 'top'>('perspective');

  // Convert inputs to meters for realistic 3D scale
  const wCm = unit === 'mm' ? width / 10 : width;
  const hCm = unit === 'mm' ? height / 10 : height;
  const widthM = Math.max(0.4, Math.min(4.0, (wCm || 120) / 100));
  const heightM = Math.max(0.4, Math.min(3.0, (hCm || 120) / 100));
  const safeSashesCount = Math.max(1, Math.min(4, sashes));

  // Resolved sash configurations
  const resolvedConfigs: SashConfig[] = useMemo(() => {
    return Array.from({ length: safeSashesCount }).map((_, i) => {
      if (sashConfigs && sashConfigs[i]) return sashConfigs[i];
      let defaultType: SashFunction = 'OF';
      if (openingType === 'tilt_turn') defaultType = 'OB';
      else if (openingType === 'sliding' || openingType === 'door_sliding') defaultType = 'SLIDE';
      else if (openingType === 'fixed') defaultType = 'FIX';
      else if (openingType === 'casement' && safeSashesCount === 2 && i === 0) defaultType = 'OB';
      return {
        id: i,
        type: defaultType,
        openingSide: i % 2 === 0 ? 'left' : 'right',
      };
    });
  }, [safeSashesCount, sashConfigs, openingType]);

  const hasAnyOBSash = resolvedConfigs.some((s) => s.type === 'OB');

  // Scene references for live animation updates
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sashesPivotsRef = useRef<{ group: THREE.Group; config: SashConfig; index: number; origX: number }[]>([]);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const dimensionsGroupRef = useRef<THREE.Group | null>(null);
  const wallGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameIdRef = useRef<number>(0);

  // Setup Three.js Scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 420;

    // Detect software WebGL as per Three.js directives
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(lightingPreset === 'daylight' ? '#EBF2FA' : '#18202F');
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(widthM * 0.9, heightM * 0.7, Math.max(widthM, heightM) * 1.8);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't go too far below ground
    controls.minDistance = 0.5;
    controls.maxDistance = 10;
    controls.target.set(0, heightM / 2, 0);
    controls.update();
    controlsRef.current = controls;

    // 5. Lighting Rig
    const hemiLight = new THREE.HemisphereLight(
      lightingPreset === 'daylight' ? 0xffffff : 0xbfdbfe,
      0x334155,
      lightingPreset === 'daylight' ? 0.9 : 0.6
    );
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    dirLight.position.set(widthM * 1.5, heightM * 2.5, Math.max(widthM, heightM) * 2);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 15;
    const d = Math.max(widthM, heightM) * 1.8;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.45);
    fillLight.position.set(-widthM * 1.5, heightM * 1.2, -Math.max(widthM, heightM));
    scene.add(fillLight);

    // 6. Ground Shadow Contact Plane
    const groundGeo = new THREE.PlaneGeometry(8, 8);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.25 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Subtle floor circular grid for spatial orientation
    const grid = new THREE.GridHelper(6, 12, 0x0b4f9e, 0x94a3b8);
    grid.position.y = -0.015;
    (grid.material as THREE.Material).opacity = 0.25;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    // 7. Animation Loop
    let running = true;
    const animate = () => {
      if (!running) return;
      animationFrameIdRef.current = requestAnimationFrame(animate);

      if (autoRotate && controlsRef.current) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 1.8;
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }

      controlsRef.current?.update();
      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Observer
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      running = false;
      cancelAnimationFrame(animationFrameIdRef.current);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Update Scene Background and Lighting when preset changes
  useEffect(() => {
    if (!sceneRef.current || !hemiLightRef.current || !dirLightRef.current) return;
    if (lightingPreset === 'daylight') {
      sceneRef.current.background = new THREE.Color('#EBF2FA');
      hemiLightRef.current.color.setHex(0xffffff);
      hemiLightRef.current.intensity = 0.9;
      dirLightRef.current.color.setHex(0xfffaed);
      dirLightRef.current.intensity = 1.4;
    } else {
      sceneRef.current.background = new THREE.Color('#101726');
      hemiLightRef.current.color.setHex(0x93c5fd);
      hemiLightRef.current.intensity = 0.6;
      dirLightRef.current.color.setHex(0xe2e8f0);
      dirLightRef.current.intensity = 1.6;
    }
  }, [lightingPreset]);

  // Build the 3D Procedural Model of the Window
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clean up previous window models
    const oldWindow = scene.getObjectByName('pvc_window_assembly');
    if (oldWindow) {
      scene.remove(oldWindow);
      oldWindow.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    sashesPivotsRef.current = [];

    const windowGroup = new THREE.Group();
    windowGroup.name = 'pvc_window_assembly';

    // Dimensions parameters
    const W = widthM;
    const H = heightM;
    const frameDepth = 0.07; // 70 mm standard PVC depth
    const frameFace = 0.06; // 60 mm visible profile width
    const sashFace = 0.055; // 55 mm sash profile
    const glassThickness = 0.024; // 24 mm double glazing (4/16/4)

    // PVC Materials
    const pvcColor = new THREE.Color(colorHex);
    const pvcMaterial = new THREE.MeshStandardMaterial({
      color: pvcColor,
      roughness: 0.35,
      metalness: 0.04,
    });

    const rubberGasketMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.0,
    });

    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.2,
      metalness: 0.9,
    });

    // Glass Material based on selected glass type
    let glassColor = new THREE.Color(0xa7f3d0); // subtle mint/sky tint
    let glassOpacity = 0.42;
    let glassRoughness = 0.06;
    let glassMetalness = 0.15;

    if (glassTypeName.includes('عاكس') || glassTypeName.includes('Réflechissant')) {
      glassColor = new THREE.Color(0x3b82f6);
      glassOpacity = 0.65;
      glassMetalness = 0.7;
      glassRoughness = 0.04;
    } else if (glassTypeName.includes('مصنفر') || glassTypeName.includes('Dépoli')) {
      glassColor = new THREE.Color(0xf1f5f9);
      glassOpacity = 0.85;
      glassRoughness = 0.55;
      glassMetalness = 0.02;
    } else if (glassTypeName.includes('سيكوريت') || glassTypeName.includes('Sécurité')) {
      glassColor = new THREE.Color(0x38bdf8);
      glassOpacity = 0.5;
      glassMetalness = 0.3;
      glassRoughness = 0.05;
    }

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: glassColor,
      transparent: true,
      opacity: glassOpacity,
      roughness: glassRoughness,
      metalness: glassMetalness,
      transmission: 0.6,
      ior: 1.52,
      thickness: 0.05,
      specularIntensity: 1.0,
    });

    const spacerMaterial = new THREE.MeshStandardMaterial({
      color: 0x475569, // aluminum spacer bar
      roughness: 0.4,
      metalness: 0.8,
    });

    // 1. Build Outer Frame (Châssis Dormant)
    const frameGroup = new THREE.Group();
    frameGroup.name = 'outer_frame';

    // Bottom horizontal bar
    const bottomGeo = new THREE.BoxGeometry(W, frameFace, frameDepth);
    const bottomBar = new THREE.Mesh(bottomGeo, pvcMaterial);
    bottomBar.position.set(0, frameFace / 2, 0);
    bottomBar.castShadow = true;
    bottomBar.receiveShadow = true;
    frameGroup.add(bottomBar);

    // Top horizontal bar
    const topGeo = new THREE.BoxGeometry(W, frameFace, frameDepth);
    const topBar = new THREE.Mesh(topGeo, pvcMaterial);
    topBar.position.set(0, H - frameFace / 2, 0);
    topBar.castShadow = true;
    topBar.receiveShadow = true;
    frameGroup.add(topBar);

    // Left vertical bar
    const sideH = H - frameFace * 2;
    const sideGeo = new THREE.BoxGeometry(frameFace, sideH, frameDepth);
    const leftBar = new THREE.Mesh(sideGeo, pvcMaterial);
    leftBar.position.set(-W / 2 + frameFace / 2, H / 2, 0);
    leftBar.castShadow = true;
    leftBar.receiveShadow = true;
    frameGroup.add(leftBar);

    // Right vertical bar
    const rightBar = new THREE.Mesh(sideGeo, pvcMaterial);
    rightBar.position.set(W / 2 - frameFace / 2, H / 2, 0);
    rightBar.castShadow = true;
    rightBar.receiveShadow = true;
    frameGroup.add(rightBar);

    // Add Outer frame aluminum water-drip sill (Rejet d'eau) at bottom
    const sillGeo = new THREE.BoxGeometry(W + 0.08, 0.015, frameDepth + 0.06);
    const sillBar = new THREE.Mesh(sillGeo, pvcMaterial);
    sillBar.position.set(0, -0.008, 0.02);
    sillBar.castShadow = true;
    frameGroup.add(sillBar);

    windowGroup.add(frameGroup);

    // 2. Build Sashes (Ouvrants)
    const innerW = W - frameFace * 2;
    const innerH = H - frameFace * 2;
    const numSashes = safeSashesCount;
    const isSliding = openingType === 'sliding' || openingType === 'door_sliding';

    // For sliding, sashes overlap slightly in 2 tracks (front and rear)
    const slidingOverlap = isSliding ? 0.04 : 0;
    const sashW = (innerW + slidingOverlap * (numSashes - 1)) / numSashes;
    const sashH = innerH;
    const sashDepth = isSliding ? frameDepth * 0.44 : frameDepth * 0.75;

    // Add vertical mullion bars (Meneau) between casement sashes if needed
    if (!isSliding && numSashes > 1) {
      const mullionW = 0.04;
      const mullionGeo = new THREE.BoxGeometry(mullionW, innerH, frameDepth);
      for (let m = 1; m < numSashes; m++) {
        const mullionX = -innerW / 2 + (innerW / numSashes) * m;
        const mullion = new THREE.Mesh(mullionGeo, pvcMaterial);
        mullion.position.set(mullionX, H / 2, 0);
        mullion.castShadow = true;
        windowGroup.add(mullion);
      }
    }

    // Build each individual sash
    resolvedConfigs.forEach((config, idx) => {
      const isRight = config.openingSide === 'right';
      const actualSashW = !isSliding && numSashes > 1 ? innerW / numSashes - 0.015 : sashW;

      // Position along X axis
      const baseX = isSliding
        ? -innerW / 2 + actualSashW / 2 + idx * (actualSashW - slidingOverlap)
        : -innerW / 2 + (innerW / numSashes) * (idx + 0.5);

      // Z track offset for sliding windows
      const trackOffsetZ = isSliding ? (idx % 2 === 0 ? 0.016 : -0.016) : 0;

      // Create Sash Pivot Group
      const sashPivotGroup = new THREE.Group();
      sashPivotGroup.name = `sash_pivot_${idx}`;

      // Assemble Sash Profile Geometry
      const sashMeshGroup = new THREE.Group();

      // Sash Frame: Top, Bottom, Left, Right
      // Bottom sash bar
      const sBottomGeo = new THREE.BoxGeometry(actualSashW, sashFace, sashDepth);
      const sBottom = new THREE.Mesh(sBottomGeo, pvcMaterial);
      sBottom.position.set(0, -sashH / 2 + sashFace / 2, 0);
      sBottom.castShadow = true;
      sashMeshGroup.add(sBottom);

      // Top sash bar
      const sTopGeo = new THREE.BoxGeometry(actualSashW, sashFace, sashDepth);
      const sTop = new THREE.Mesh(sTopGeo, pvcMaterial);
      sTop.position.set(0, sashH / 2 - sashFace / 2, 0);
      sTop.castShadow = true;
      sashMeshGroup.add(sTop);

      // Left sash bar
      const sSideH = sashH - sashFace * 2;
      const sSideGeo = new THREE.BoxGeometry(sashFace, sSideH, sashDepth);
      const sLeft = new THREE.Mesh(sSideGeo, pvcMaterial);
      sLeft.position.set(-actualSashW / 2 + sashFace / 2, 0, 0);
      sLeft.castShadow = true;
      sashMeshGroup.add(sLeft);

      // Right sash bar
      const sRight = new THREE.Mesh(sSideGeo, pvcMaterial);
      sRight.position.set(actualSashW / 2 - sashFace / 2, 0, 0);
      sRight.castShadow = true;
      sashMeshGroup.add(sRight);

      // Rubber Gasket Seal (Beading interior)
      const gasketThickness = 0.008;
      const gasketGeo = new THREE.BoxGeometry(
        actualSashW - sashFace * 2 + 0.01,
        sashH - sashFace * 2 + 0.01,
        sashDepth * 0.4
      );
      const gasket = new THREE.Mesh(gasketGeo, rubberGasketMaterial);
      gasket.position.set(0, 0, 0);
      sashMeshGroup.add(gasket);

      // Double Glazing Glass Pane
      const glassW = actualSashW - sashFace * 2;
      const glassH = sashH - sashFace * 2;
      const glassGeo = new THREE.BoxGeometry(glassW, glassH, glassThickness);
      const glassMesh = new THREE.Mesh(glassGeo, glassMaterial);
      glassMesh.position.set(0, 0, 0);
      glassMesh.castShadow = false;
      glassMesh.receiveShadow = true;
      sashMeshGroup.add(glassMesh);

      // Inner Spacer Bar around glass perimeter
      const spacerGeo = new THREE.BoxGeometry(glassW - 0.02, glassH - 0.02, glassThickness * 0.5);
      const spacerMesh = new THREE.Mesh(spacerGeo, spacerMaterial);
      spacerMesh.position.set(0, 0, 0);
      sashMeshGroup.add(spacerMesh);

      // Metallic Window Handle (Crémone) for operable sashes
      if (config.type !== 'FIX') {
        const handleGroup = new THREE.Group();
        const rosetteGeo = new THREE.BoxGeometry(0.028, 0.065, 0.012);
        const rosette = new THREE.Mesh(rosetteGeo, handleMaterial);
        rosette.castShadow = true;
        handleGroup.add(rosette);

        // Neck
        const neckGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.035, 12);
        const neck = new THREE.Mesh(neckGeo, handleMaterial);
        neck.rotation.x = Math.PI / 2;
        neck.position.set(0, 0, 0.025);
        handleGroup.add(neck);

        // Lever arm
        const leverGeo = new THREE.BoxGeometry(0.018, 0.12, 0.012);
        const lever = new THREE.Mesh(leverGeo, handleMaterial);
        lever.position.set(0, -0.055, 0.042);
        lever.castShadow = true;
        handleGroup.add(lever);

        // Handle position on sash (opposite side of hinge)
        const handleX = isRight ? -actualSashW / 2 + sashFace * 0.6 : actualSashW / 2 - sashFace * 0.6;
        handleGroup.position.set(handleX, 0, sashDepth / 2 + 0.006);
        sashMeshGroup.add(handleGroup);
      }

      // Configure Pivot Point for Natural Opening Animation
      if (config.type === 'SLIDE') {
        // Sliding: pivot at center, slides on X
        sashPivotGroup.position.set(baseX, H / 2, trackOffsetZ);
        sashMeshGroup.position.set(0, 0, 0);
      } else if (config.type === 'OB' || config.type === 'OF') {
        // Casement / Tilt:
        // By default side hinge: left or right edge
        const hingeX = isRight ? baseX + actualSashW / 2 : baseX - actualSashW / 2;
        sashPivotGroup.position.set(hingeX, H / 2, trackOffsetZ);
        // Offset mesh relative to hinge
        sashMeshGroup.position.set(isRight ? -actualSashW / 2 : actualSashW / 2, 0, 0);
      } else {
        // Fixed: center
        sashPivotGroup.position.set(baseX, H / 2, trackOffsetZ);
        sashMeshGroup.position.set(0, 0, 0);
      }

      sashPivotGroup.add(sashMeshGroup);
      windowGroup.add(sashPivotGroup);

      // Record pivot for dynamic animation updates
      sashesPivotsRef.current.push({
        group: sashPivotGroup,
        config,
        index: idx,
        origX: sashPivotGroup.position.x,
      });
    });

    // 3. Wall Context (Embrasure du mur architectural)
    const wallGroup = new THREE.Group();
    wallGroup.name = 'wall_context';
    const wallThickness = 0.22; // 22cm standard wall
    const wallMargin = 0.45;
    const wallColor = new THREE.Color(0xf8fafc);
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.85,
      metalness: 0.01,
    });

    // Wall Left
    const wLeftGeo = new THREE.BoxGeometry(wallMargin, H + wallMargin * 2, wallThickness);
    const wLeft = new THREE.Mesh(wLeftGeo, wallMaterial);
    wLeft.position.set(-W / 2 - wallMargin / 2, H / 2, -wallThickness / 2 + frameDepth / 2);
    wLeft.receiveShadow = true;
    wallGroup.add(wLeft);

    // Wall Right
    const wRight = new THREE.Mesh(wLeftGeo, wallMaterial);
    wRight.position.set(W / 2 + wallMargin / 2, H / 2, -wallThickness / 2 + frameDepth / 2);
    wRight.receiveShadow = true;
    wallGroup.add(wRight);

    // Wall Top (Linteau)
    const wTopGeo = new THREE.BoxGeometry(W + wallMargin * 2, wallMargin, wallThickness);
    const wTop = new THREE.Mesh(wTopGeo, wallMaterial);
    wTop.position.set(0, H + wallMargin / 2, -wallThickness / 2 + frameDepth / 2);
    wTop.receiveShadow = true;
    wallGroup.add(wTop);

    // Wall Bottom (Allège / Sill Base)
    const wBottom = new THREE.Mesh(wTopGeo, wallMaterial);
    wBottom.position.set(0, -wallMargin / 2, -wallThickness / 2 + frameDepth / 2);
    wBottom.receiveShadow = true;
    wallGroup.add(wBottom);

    wallGroup.visible = showWall;
    wallGroupRef.current = wallGroup;
    windowGroup.add(wallGroup);

    // 4. Dimension Markers in 3D (Rulers & Measurement Ticks)
    const dimGroup = new THREE.Group();
    dimGroup.name = 'dimension_markers';
    const dimLineMat = new THREE.LineBasicMaterial({ color: 0x0b4f9e, linewidth: 2 });

    // Top Width Line
    const wLinePoints = [
      new THREE.Vector3(-W / 2, H + 0.08, 0.06),
      new THREE.Vector3(W / 2, H + 0.08, 0.06),
    ];
    const wLineGeo = new THREE.BufferGeometry().setFromPoints(wLinePoints);
    const wLine = new THREE.Line(wLineGeo, dimLineMat);
    dimGroup.add(wLine);

    // Right Height Line
    const hLinePoints = [
      new THREE.Vector3(W / 2 + 0.08, 0, 0.06),
      new THREE.Vector3(W / 2 + 0.08, H, 0.06),
    ];
    const hLineGeo = new THREE.BufferGeometry().setFromPoints(hLinePoints);
    const hLine = new THREE.Line(hLineGeo, dimLineMat);
    dimGroup.add(hLine);

    dimGroup.visible = show3DDimensions;
    dimensionsGroupRef.current = dimGroup;
    windowGroup.add(dimGroup);

    scene.add(windowGroup);

    // Center camera target at window center
    if (controlsRef.current) {
      controlsRef.current.target.set(0, H / 2, 0);
      controlsRef.current.update();
    }
  }, [widthM, heightM, colorHex, glassTypeName, openingType, safeSashesCount, resolvedConfigs]);

  // Update Opening Simulation (Turn / Tilt / Slide)
  useEffect(() => {
    sashesPivotsRef.current.forEach(({ group, config, origX }) => {
      const isRight = config.openingSide === 'right';
      const openProgress = isOpenSimulation ? openAngleRatio : 0;

      if (config.type === 'SLIDE') {
        // Slide along X
        const maxSlide = (widthM / safeSashesCount) * 0.75;
        const targetX = isOpenSimulation ? origX + (isRight ? -maxSlide : maxSlide) : origX;
        group.position.x = targetX;
        group.rotation.set(0, 0, 0);
      } else if (config.type === 'OB') {
        if (obMode === 'tilt') {
          // Tilt inward (Oscillo / Soufflet): tilts from top around bottom X axis
          const tiltAngle = openProgress * -0.22; // ~12 degrees inward
          group.rotation.set(tiltAngle, 0, 0);
        } else {
          // Turn open (Battant): swings open along Y axis
          const maxAngle = isRight ? openProgress * -1.2 : openProgress * 1.2;
          group.rotation.set(0, maxAngle, 0);
        }
      } else if (config.type === 'OF') {
        // Casement swing
        const maxAngle = isRight ? openProgress * -1.2 : openProgress * 1.2;
        group.rotation.set(0, maxAngle, 0);
      } else {
        // Fixed
        group.rotation.set(0, 0, 0);
      }
    });
  }, [isOpenSimulation, openAngleRatio, obMode, widthM, safeSashesCount]);

  // Update wall visibility
  useEffect(() => {
    if (wallGroupRef.current) {
      wallGroupRef.current.visible = showWall;
    }
  }, [showWall]);

  // Update dimensions visibility
  useEffect(() => {
    if (dimensionsGroupRef.current) {
      dimensionsGroupRef.current.visible = show3DDimensions;
    }
  }, [show3DDimensions]);

  // Camera presets handler
  const setCameraPreset = useCallback(
    (preset: 'perspective' | 'front' | 'side' | 'top') => {
      if (!cameraRef.current || !controlsRef.current) return;
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      const dist = Math.max(widthM, heightM) * 1.8;

      setCameraView(preset);

      if (preset === 'perspective') {
        camera.position.set(widthM * 0.9, heightM * 0.7, dist);
      } else if (preset === 'front') {
        camera.position.set(0, heightM / 2, dist * 1.1);
      } else if (preset === 'side') {
        camera.position.set(dist * 1.1, heightM / 2, 0);
      } else if (preset === 'top') {
        camera.position.set(0, dist * 1.2, 0.01);
      }

      controls.target.set(0, heightM / 2, 0);
      controls.update();
    },
    [widthM, heightM]
  );

  // Capture Screenshot of 3D Model
  const handleTakeSnapshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `PVC_Window_${Math.round(wCm)}x${Math.round(hCm)}_${colorHex.replace('#', '')}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-2xl overflow-hidden border border-[#DDE3EA] bg-[#F8FAFC] shadow-inner select-none transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-3xl shadow-2xl border-2 border-[#0B4F9E]' : className
      }`}
      style={{ minHeight: isFullscreen ? 'auto' : '360px' }}
    >
      {/* 3D Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Top Floating Info & Dimension Badges */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
        {/* Spec Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md text-[#10161F] text-xs font-bold shadow-sm border border-gray-200/80 pointer-events-auto">
          <Sparkles className="w-3.5 h-3.5 text-[#0B4F9E]" />
          <span>
            {Math.round(wCm)} × {Math.round(hCm)} {unit}
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-[#5B6675] font-semibold">
            {safeSashesCount} {safeSashesCount === 1 ? 'ضلفة' : 'ضلف'}
          </span>
          {hasAnyOBSash && (
            <span className="text-[10px] font-black bg-blue-100 text-[#0B4F9E] px-1.5 py-0.5 rounded">
              نظام OB
            </span>
          )}
        </div>

        {/* Action icons (Reset, Fullscreen, Snapshot) */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setCameraPreset('perspective')}
            title="إعادة ضبط زاوية الرؤية"
            className="p-2 rounded-xl bg-white/90 backdrop-blur-md text-[#5B6675] hover:text-[#0B4F9E] hover:bg-white transition-all shadow-sm border border-gray-200/80 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleTakeSnapshot}
            title="حفظ لقطة شاشة ثلاثية الأبعاد"
            className="p-2 rounded-xl bg-white/90 backdrop-blur-md text-[#5B6675] hover:text-[#1E9E5A] hover:bg-white transition-all shadow-sm border border-gray-200/80 active:scale-95"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            title={isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة الكاملة'}
            className="p-2 rounded-xl bg-white/90 backdrop-blur-md text-[#5B6675] hover:text-[#0B4F9E] hover:bg-white transition-all shadow-sm border border-gray-200/80 active:scale-95"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Orbit Gesture Hint Overlay */}
      <div className="absolute top-12 right-3 pointer-events-none opacity-60 text-[10px] text-gray-500 font-medium bg-white/80 px-2 py-0.5 rounded-md shadow-xs">
        اسحب للتدوير • عجلة الماوس للتكبير
      </div>

      {/* Sleek Bottom Control Dock (Zero Occlusion, Adheres to Three.js guidelines) */}
      <div className="absolute bottom-3 inset-x-3 sm:inset-x-6 flex flex-col gap-2 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-lg border border-gray-200/80 pointer-events-auto flex flex-wrap items-center justify-between gap-2">
          {/* Camera View Angle Buttons */}
          <div className="flex items-center gap-1 bg-[#F3F6FA] p-1 rounded-xl">
            <button
              onClick={() => setCameraPreset('perspective')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                cameraView === 'perspective'
                  ? 'bg-white text-[#0B4F9E] shadow-xs'
                  : 'text-[#5B6675] hover:text-[#10161F]'
              }`}
            >
              منظور 3D
            </button>
            <button
              onClick={() => setCameraPreset('front')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                cameraView === 'front'
                  ? 'bg-white text-[#0B4F9E] shadow-xs'
                  : 'text-[#5B6675] hover:text-[#10161F]'
              }`}
            >
              أمامي
            </button>
            <button
              onClick={() => setCameraPreset('side')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                cameraView === 'side'
                  ? 'bg-white text-[#0B4F9E] shadow-xs'
                  : 'text-[#5B6675] hover:text-[#10161F]'
              }`}
            >
              جانبي (السمك)
            </button>
            <button
              onClick={() => setCameraPreset('top')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                cameraView === 'top'
                  ? 'bg-white text-[#0B4F9E] shadow-xs'
                  : 'text-[#5B6675] hover:text-[#10161F]'
              }`}
            >
              علوي
            </button>
          </div>

          {/* Interactive Opening Simulation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpenSimulation((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                isOpenSimulation
                  ? 'bg-[#1E9E5A] text-white hover:bg-[#168048]'
                  : 'bg-[#0B4F9E] text-white hover:bg-[#083A75]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isOpenSimulation ? 'إغلاق النافذة' : 'محاكاة فتح النافذة'}</span>
            </button>

            {/* If has OB sash and opened, choose Tilt vs Turn */}
            {isOpenSimulation && hasAnyOBSash && (
              <div className="flex items-center gap-1 bg-blue-50 p-1 rounded-xl border border-blue-200/60">
                <button
                  onClick={() => setObMode('turn')}
                  className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-all ${
                    obMode === 'turn'
                      ? 'bg-[#0B4F9E] text-white shadow-xs'
                      : 'text-[#0B4F9E] hover:bg-blue-100'
                  }`}
                >
                  فتح مفصلي
                </button>
                <button
                  onClick={() => setObMode('tilt')}
                  className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-all ${
                    obMode === 'tilt'
                      ? 'bg-[#0B4F9E] text-white shadow-xs'
                      : 'text-[#0B4F9E] hover:bg-blue-100'
                  }`}
                >
                  فتح قلاب (OB)
                </button>
              </div>
            )}

            {/* Auto-rotate Toggle */}
            <button
              onClick={() => setAutoRotate((prev) => !prev)}
              title={autoRotate ? 'إيقاف الدوران التلقائي' : 'تشغيل الدوران التلقائي'}
              className={`p-1.5 rounded-xl border transition-all ${
                autoRotate
                  ? 'bg-blue-50 border-[#0B4F9E] text-[#0B4F9E]'
                  : 'bg-white border-gray-200 text-[#5B6675] hover:text-[#10161F]'
              }`}
            >
              {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Wall Context Toggle */}
            <button
              onClick={() => setShowWall((prev) => !prev)}
              title={showWall ? 'إخفاء الجدار المحيط' : 'إظهار الجدار المحيط'}
              className={`p-1.5 rounded-xl border transition-all ${
                showWall
                  ? 'bg-blue-50 border-[#0B4F9E] text-[#0B4F9E]'
                  : 'bg-white border-gray-200 text-[#5B6675] hover:text-[#10161F]'
              }`}
            >
              <Building className="w-4 h-4" />
            </button>

            {/* Lighting Preset */}
            <button
              onClick={() => setLightingPreset((prev) => (prev === 'daylight' ? 'studio' : 'daylight'))}
              title={lightingPreset === 'daylight' ? 'التبديل إلى إضاءة الاستوديو' : 'التبديل إلى ضوء النهار'}
              className={`p-1.5 rounded-xl border transition-all ${
                lightingPreset === 'daylight'
                  ? 'bg-amber-50 border-amber-300 text-amber-600'
                  : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <Sun className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
