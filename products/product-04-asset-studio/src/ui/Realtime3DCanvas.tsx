import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type {
  VehicleSpec,
  CargoPackageSpec,
  RenderStyle3D,
  GridPlacement,
} from '../engine/types';

interface Realtime3DCanvasProps {
  vehicle: VehicleSpec;
  selectedPackage: CargoPackageSpec;
  placements: GridPlacement[];
  renderStyle: RenderStyle3D;
  doorsOpen: boolean;
  onToggleDoors: () => void;
  onSetRenderStyle: (style: RenderStyle3D) => void;
}

export const Realtime3DCanvas: React.FC<Realtime3DCanvasProps> = ({
  vehicle,
  selectedPackage,
  placements,
  renderStyle,
  doorsOpen,
  onToggleDoors,
  onSetRenderStyle,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(false);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const vehicleGroupRef = useRef<THREE.Group | null>(null);
  const cargoGroupRef = useRef<THREE.Group | null>(null);

  // Orbit control interaction
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const rotRef = useRef({ theta: Math.PI / 4, phi: 0.55 });
  const radiusRef = useRef(85);

  // Camera preset handler
  const setCameraPreset = (preset: 'iso' | 'front' | 'rear' | 'side' | 'top') => {
    switch (preset) {
      case 'iso':
        rotRef.current = { theta: Math.PI / 4, phi: 0.55 };
        radiusRef.current = 85;
        break;
      case 'front':
        rotRef.current = { theta: 0.2, phi: 0.25 };
        radiusRef.current = 75;
        break;
      case 'rear':
        rotRef.current = { theta: Math.PI - 0.15, phi: 0.25 };
        radiusRef.current = 65;
        break;
      case 'side':
        rotRef.current = { theta: Math.PI / 2, phi: 0.2 };
        radiusRef.current = 80;
        break;
      case 'top':
        rotRef.current = { theta: Math.PI / 2, phi: 1.5 };
        radiusRef.current = 90;
        break;
    }
  };

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 900;
    const height = 480;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.008);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 500);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(40, 60, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const blueRimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    blueRimLight.position.set(-40, 20, -40);
    scene.add(blueRimLight);

    // Ground Grid
    const gridHelper = new THREE.GridHelper(160, 40, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // Ground Shadow Plane
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.45 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Groups
    const vehicleGroup = new THREE.Group();
    vehicleGroupRef.current = vehicleGroup;
    scene.add(vehicleGroup);

    const cargoGroup = new THREE.Group();
    cargoGroupRef.current = cargoGroup;
    scene.add(cargoGroup);

    // Mouse Controls
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };

      rotRef.current.theta -= dx * 0.008;
      rotRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, rotRef.current.phi + dy * 0.008));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      radiusRef.current = Math.max(30, Math.min(180, radiusRef.current + e.deltaY * 0.08));
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (autoRotate) {
        rotRef.current.theta += 0.005;
      }

      const { theta, phi } = rotRef.current;
      const r = radiusRef.current;
      camera.position.x = r * Math.sin(theta) * Math.cos(phi);
      camera.position.y = r * Math.sin(phi);
      camera.position.z = r * Math.cos(theta) * Math.cos(phi);
      camera.lookAt(0, 5, 0);

      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      cameraRef.current.aspect = w / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [autoRotate]);

  // Update 3D Vehicle Geometry when vehicle, renderStyle, or doors change
  useEffect(() => {
    const vg = vehicleGroupRef.current;
    if (!vg) return;

    // Clear old vehicle meshes
    while (vg.children.length > 0) {
      const obj = vg.children[0];
      vg.remove(obj);
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
    }

    const isWire = renderStyle === 'wireframe';
    const isCutaway = renderStyle === 'cutaway';
    const bodyOpacity = isCutaway ? 0.28 : 1.0;
    const transparent = isCutaway;

    // Shared Materials
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.3,
      wireframe: isWire,
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.1,
      wireframe: isWire,
    });
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      wireframe: isWire,
    });
    const cabColor =
      vehicle.category === 'alternative_powertrain'
        ? 0x06b6d4 // Electric cyan
        : vehicle.category === 'light_commercial_van'
        ? 0xf59e0b // Amber van
        : 0x2563eb; // Royal blue tractor

    const cabMat = new THREE.MeshStandardMaterial({
      color: cabColor,
      metalness: 0.5,
      roughness: 0.3,
      wireframe: isWire,
    });

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.2,
      roughness: 0.4,
      transparent,
      opacity: bodyOpacity,
      wireframe: isWire,
    });

    const isClass8 = vehicle.category === 'class_8_combination' || vehicle.category === 'alternative_powertrain';
    const isStraight = vehicle.category === 'straight_truck_class_6_7';
    const isVan = vehicle.category === 'light_commercial_van';

    // Scale factors (1 Three.js unit = 1 foot)
    const extL = vehicle.exterior.lengthFt;
    const extW = vehicle.exterior.widthFt;
    const extH = vehicle.exterior.heightFt;

    if (isClass8) {
      // 1. TRACTOR CAB
      const cabGroup = new THREE.Group();
      cabGroup.position.set(0, 0, extL * 0.32);

      // Cab lower chassis
      const chassisGeo = new THREE.BoxGeometry(extW * 0.85, 1.2, 18);
      const chassisMesh = new THREE.Mesh(chassisGeo, darkMetalMat);
      chassisMesh.position.set(0, 2.0, 0);
      chassisMesh.castShadow = true;
      cabGroup.add(chassisMesh);

      // Main Cab body
      const cabBodyGeo = new THREE.BoxGeometry(extW * 0.9, extH * 0.65, 12);
      const cabBodyMesh = new THREE.Mesh(cabBodyGeo, cabMat);
      cabBodyMesh.position.set(0, 6.2, 1);
      cabBodyMesh.castShadow = true;
      cabGroup.add(cabBodyMesh);

      // Windshield & Glass
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.1,
        metalness: 0.9,
      });
      const glassGeo = new THREE.BoxGeometry(extW * 0.82, 3.2, 0.4);
      const glassMesh = new THREE.Mesh(glassGeo, glassMat);
      glassMesh.position.set(0, 7.5, 7.1);
      cabGroup.add(glassMesh);

      // Roof aerodynamic deflector
      const deflectorGeo = new THREE.ConeGeometry(extW * 0.45, 3.5, 4);
      const deflectorMesh = new THREE.Mesh(deflectorGeo, cabMat);
      deflectorMesh.rotation.y = Math.PI / 4;
      deflectorMesh.rotation.x = -Math.PI / 2;
      deflectorMesh.position.set(0, 10.5, 1);
      cabGroup.add(deflectorMesh);

      // Dual Chrome Exhaust Stacks (if diesel)
      if (vehicle.fuelEnergy.fuelType === 'diesel') {
        const stackGeo = new THREE.CylinderGeometry(0.35, 0.35, 12, 16);
        const stackLeft = new THREE.Mesh(stackGeo, chromeMat);
        stackLeft.position.set(-extW * 0.42, 8.0, -4.5);
        const stackRight = new THREE.Mesh(stackGeo, chromeMat);
        stackRight.position.set(extW * 0.42, 8.0, -4.5);
        cabGroup.add(stackLeft, stackRight);
      }

      // Tractor Wheels
      // Front steer axle
      const wheelGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.9, 20);
      wheelGeo.rotateZ(Math.PI / 2);

      const frontLeft = new THREE.Mesh(wheelGeo, tireMat);
      frontLeft.position.set(-extW * 0.45, 1.6, 6.5);
      const frontRight = new THREE.Mesh(wheelGeo, tireMat);
      frontRight.position.set(extW * 0.45, 1.6, 6.5);
      cabGroup.add(frontLeft, frontRight);

      // Drive tandem rear axles
      const drivePos = [-1.5, -6.0];
      for (const zOff of drivePos) {
        const dL = new THREE.Mesh(wheelGeo, tireMat);
        dL.position.set(-extW * 0.45, 1.6, zOff);
        const dR = new THREE.Mesh(wheelGeo, tireMat);
        dR.position.set(extW * 0.45, 1.6, zOff);
        cabGroup.add(dL, dR);
      }

      vg.add(cabGroup);

      // 2. TRAILER BODY
      const trailerGroup = new THREE.Group();
      trailerGroup.position.set(0, 0, -extL * 0.12);

      const trailL = vehicle.interior.lengthFt;
      const trailW = vehicle.interior.widthFt;
      const trailH = vehicle.interior.heightFt;

      const isFlatbed =
        vehicle.subtype.includes('flatbed') ||
        vehicle.subtype.includes('step_deck') ||
        vehicle.subtype.includes('lowboy') ||
        vehicle.subtype.includes('logging');
      const isTanker = vehicle.subtype.includes('tanker');
      const isHopper = vehicle.subtype.includes('hopper');

      if (isFlatbed) {
        // Flatbed / Lowboy Platform Deck
        const deckGeo = new THREE.BoxGeometry(trailW, 0.8, trailL);
        const deckMat = new THREE.MeshStandardMaterial({
          color: 0x475569,
          roughness: 0.6,
          metalness: 0.5,
          wireframe: isWire,
        });
        const deckMesh = new THREE.Mesh(deckGeo, deckMat);
        deckMesh.position.set(0, 4.2, 0);
        deckMesh.castShadow = true;
        deckMesh.receiveShadow = true;
        trailerGroup.add(deckMesh);

        // Headache Rack behind tractor
        const rackGeo = new THREE.BoxGeometry(trailW * 0.95, 7.5, 0.6);
        const rackMesh = new THREE.Mesh(rackGeo, darkMetalMat);
        rackMesh.position.set(0, 7.5, trailL / 2 - 0.5);
        trailerGroup.add(rackMesh);
      } else if (isTanker) {
        // Cylindrical Tanker Body
        const tankGeo = new THREE.CylinderGeometry(trailW * 0.48, trailW * 0.48, trailL * 0.95, 28);
        tankGeo.rotateX(Math.PI / 2);
        const tankMat = new THREE.MeshStandardMaterial({
          color: 0xe2e8f0,
          metalness: 0.9,
          roughness: 0.2,
          transparent,
          opacity: bodyOpacity,
          wireframe: isWire,
        });
        const tankMesh = new THREE.Mesh(tankGeo, tankMat);
        tankMesh.position.set(0, 6.8, 0);
        tankMesh.castShadow = true;
        trailerGroup.add(tankMesh);
      } else if (isHopper) {
        // Pneumatic Hopper Funnels
        const hopperBodyGeo = new THREE.BoxGeometry(trailW, trailH * 0.7, trailL * 0.95);
        const hopperMesh = new THREE.Mesh(hopperBodyGeo, bodyMat);
        hopperMesh.position.set(0, 7.5, 0);
        trailerGroup.add(hopperMesh);

        // 3 V-shaped funnels
        for (let i = -1; i <= 1; i++) {
          const funnelGeo = new THREE.ConeGeometry(trailW * 0.4, 3.2, 16);
          const funnelMesh = new THREE.Mesh(funnelGeo, darkMetalMat);
          funnelMesh.rotation.x = Math.PI;
          funnelMesh.position.set(0, 4.0, i * (trailL * 0.28));
          trailerGroup.add(funnelMesh);
        }
      } else {
        // Standard Dry Van or Reefer Box
        const boxGeo = new THREE.BoxGeometry(trailW, trailH, trailL);
        const boxMesh = new THREE.Mesh(boxGeo, bodyMat);
        boxMesh.position.set(0, 4.2 + trailH / 2, 0);
        boxMesh.castShadow = true;
        boxMesh.receiveShadow = true;
        trailerGroup.add(boxMesh);

        // Reefer nose refrigeration unit
        if (vehicle.regulatory.tempControl) {
          const reeferUnitGeo = new THREE.BoxGeometry(trailW * 0.7, 4.5, 2.5);
          const reeferUnitMat = new THREE.MeshStandardMaterial({
            color: 0x0284c7,
            metalness: 0.6,
            roughness: 0.3,
          });
          const reeferMesh = new THREE.Mesh(reeferUnitGeo, reeferUnitMat);
          reeferMesh.position.set(0, 4.2 + trailH * 0.7, trailL / 2 + 1.25);
          trailerGroup.add(reeferMesh);
        }

        // Rear Cargo Swing Doors
        if (!isWire) {
          const doorGeo = new THREE.BoxGeometry(trailW * 0.48, trailH * 0.95, 0.3);
          const doorMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            metalness: 0.7,
            roughness: 0.4,
          });

          const doorLeft = new THREE.Mesh(doorGeo, doorMat);
          const doorRight = new THREE.Mesh(doorGeo, doorMat);

          const doorZ = -trailL / 2 - 0.15;
          const doorY = 4.2 + trailH / 2;

          if (doorsOpen) {
            // Swung open 110 degrees outward
            doorLeft.position.set(-trailW * 0.6, doorY, doorZ + 2.5);
            doorLeft.rotation.y = -Math.PI * 0.65;

            doorRight.position.set(trailW * 0.6, doorY, doorZ + 2.5);
            doorRight.rotation.y = Math.PI * 0.65;
          } else {
            // Closed flush
            doorLeft.position.set(-trailW * 0.24, doorY, doorZ);
            doorRight.position.set(trailW * 0.24, doorY, doorZ);
          }
          trailerGroup.add(doorLeft, doorRight);
        }
      }

      // Trailer tandem axle wheels
      const trailTandemZ = [-trailL * 0.35, -trailL * 0.43];
      for (const tz of trailTandemZ) {
        const tL = new THREE.Mesh(wheelGeo, tireMat);
        tL.position.set(-extW * 0.45, 1.6, tz);
        const tR = new THREE.Mesh(wheelGeo, tireMat);
        tR.position.set(extW * 0.45, 1.6, tz);
        trailerGroup.add(tL, tR);
      }

      // Trailer Landing Gear Legs
      const legGeo = new THREE.CylinderGeometry(0.25, 0.25, 3.5);
      const legL = new THREE.Mesh(legGeo, darkMetalMat);
      legL.position.set(-extW * 0.38, 2.0, trailL * 0.25);
      const legR = new THREE.Mesh(legGeo, darkMetalMat);
      legR.position.set(extW * 0.38, 2.0, trailL * 0.25);
      trailerGroup.add(legL, legR);

      vg.add(trailerGroup);
    } else if (isStraight) {
      // STRAIGHT TRUCK (Class 6/7)
      const straightGroup = new THREE.Group();

      // Front cab
      const cabGeo = new THREE.BoxGeometry(extW * 0.88, 7.5, 9);
      const cabMesh = new THREE.Mesh(cabGeo, cabMat);
      cabMesh.position.set(0, 5.5, extL * 0.32);
      straightGroup.add(cabMesh);

      // Rear Cargo Box
      const boxGeo = new THREE.BoxGeometry(vehicle.interior.widthFt, vehicle.interior.heightFt, vehicle.interior.lengthFt);
      const boxMesh = new THREE.Mesh(boxGeo, bodyMat);
      boxMesh.position.set(0, 4.0 + vehicle.interior.heightFt / 2, -extL * 0.1);
      straightGroup.add(boxMesh);

      // Hydraulic Liftgate platform at rear
      const gateGeo = new THREE.BoxGeometry(extW * 0.9, 0.4, 4.5);
      const gateMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
      const gateMesh = new THREE.Mesh(gateGeo, gateMat);
      gateMesh.position.set(0, doorsOpen ? 0.4 : 4.0, -extL * 0.1 - vehicle.interior.lengthFt / 2 - 2.2);
      if (!doorsOpen) gateMesh.rotation.x = Math.PI / 2;
      straightGroup.add(gateMesh);

      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.9, 20);
      wheelGeo.rotateZ(Math.PI / 2);

      const fL = new THREE.Mesh(wheelGeo, tireMat);
      fL.position.set(-extW * 0.45, 1.6, extL * 0.32 + 2);
      const fR = new THREE.Mesh(wheelGeo, tireMat);
      fR.position.set(extW * 0.45, 1.6, extL * 0.32 + 2);

      const rL = new THREE.Mesh(wheelGeo, tireMat);
      rL.position.set(-extW * 0.45, 1.6, -extL * 0.2);
      const rR = new THREE.Mesh(wheelGeo, tireMat);
      rR.position.set(extW * 0.45, 1.6, -extL * 0.2);

      straightGroup.add(fL, fR, rL, rR);
      vg.add(straightGroup);
    } else if (isVan) {
      // SPRINTER / HIGH-ROOF VAN
      const vanGroup = new THREE.Group();

      const vanBodyGeo = new THREE.BoxGeometry(extW, extH * 0.8, extL * 0.9);
      const vanMesh = new THREE.Mesh(vanBodyGeo, bodyMat);
      vanMesh.position.set(0, extH * 0.45, 0);
      vanGroup.add(vanMesh);

      // Sloped front hood
      const hoodGeo = new THREE.BoxGeometry(extW * 0.92, 3.2, 5.0);
      const hoodMesh = new THREE.Mesh(hoodGeo, cabMat);
      hoodMesh.position.set(0, 3.2, extL * 0.38);
      vanGroup.add(hoodMesh);

      // Van Wheels
      const vWheelGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.7, 18);
      vWheelGeo.rotateZ(Math.PI / 2);

      const vfL = new THREE.Mesh(vWheelGeo, tireMat);
      vfL.position.set(-extW * 0.48, 1.3, extL * 0.3);
      const vfR = new THREE.Mesh(vWheelGeo, tireMat);
      vfR.position.set(extW * 0.48, 1.3, extL * 0.3);

      const vrL = new THREE.Mesh(vWheelGeo, tireMat);
      vrL.position.set(-extW * 0.48, 1.3, -extL * 0.25);
      const vrR = new THREE.Mesh(vWheelGeo, tireMat);
      vrR.position.set(extW * 0.48, 1.3, -extL * 0.25);

      vanGroup.add(vfL, vfR, vrL, vrR);
      vg.add(vanGroup);
    }
  }, [vehicle, renderStyle, doorsOpen]);

  // Update 3D Cargo Packages nested inside vehicle cavity
  useEffect(() => {
    const cg = cargoGroupRef.current;
    if (!cg) return;

    // Clear old cargo units
    while (cg.children.length > 0) {
      const obj = cg.children[0];
      cg.remove(obj);
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
    }

    if (placements.length === 0) return;

    // Package dimensions in feet (Three.js units)
    const pL = selectedPackage.dims.lengthIn / 12;
    const pW = selectedPackage.dims.widthIn / 12;
    const pH = selectedPackage.dims.heightIn / 12;

    const pkgColor = new THREE.Color(selectedPackage.color || '#d97706');
    const pkgMat = new THREE.MeshStandardMaterial({
      color: pkgColor,
      roughness: 0.6,
      metalness: 0.2,
    });

    const isClass8 = vehicle.category === 'class_8_combination' || vehicle.category === 'alternative_powertrain';
    const isStraight = vehicle.category === 'straight_truck_class_6_7';
    const isVan = vehicle.category === 'light_commercial_van';

    // Base floor height from ground
    const floorY = (vehicle.interior.floorHeightIn || 48) / 12;
    // Trailer / body center Z offset
    const centerZ = isClass8
      ? -vehicle.exterior.lengthFt * 0.12
      : isStraight
      ? -vehicle.exterior.lengthFt * 0.1
      : isVan
      ? -vehicle.exterior.lengthFt * 0.05
      : 0;

    // Create instanced or individual meshes
    for (const p of placements) {
      const posX = p.xIn / 12;
      const posY = floorY + (p.yIn + selectedPackage.dims.heightIn / 2) / 12;
      const posZ = centerZ + p.zIn / 12;

      let mesh: THREE.Mesh;

      if (selectedPackage.shape === 'cylinder') {
        const radius = (selectedPackage.dims.diameterIn ? selectedPackage.dims.diameterIn / 2 : selectedPackage.dims.widthIn / 2) / 12;
        const drumGeo = new THREE.CylinderGeometry(radius, radius, pH, 16);
        mesh = new THREE.Mesh(drumGeo, pkgMat);
      } else if (selectedPackage.shape === 'cage_tote') {
        // IBC Tote: plastic bottle + cage frame
        const boxGeo = new THREE.BoxGeometry(pW * 0.92, pH * 0.92, pL * 0.92);
        mesh = new THREE.Mesh(boxGeo, pkgMat);
      } else {
        // Standard Cuboid / Pallet / Carton
        const boxGeo = new THREE.BoxGeometry(pW * 0.95, pH * 0.95, pL * 0.95);
        mesh = new THREE.Mesh(boxGeo, pkgMat);
      }

      mesh.position.set(posX, posY, posZ);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      cg.add(mesh);
    }
  }, [placements, selectedPackage, vehicle]);

  return (
    <div className="canvas-3d-wrapper">
      <div className="canvas-header-controls">
        <div className="view-mode-pills">
          <button
            className={`pill-btn ${renderStyle === 'solid' ? 'active' : ''}`}
            onClick={() => onSetRenderStyle('solid')}
          >
            Solid Body
          </button>
          <button
            className={`pill-btn ${renderStyle === 'cutaway' ? 'active' : ''}`}
            onClick={() => onSetRenderStyle('cutaway')}
          >
            Cutaway / X-Ray
          </button>
          <button
            className={`pill-btn ${renderStyle === 'wireframe' ? 'active' : ''}`}
            onClick={() => onSetRenderStyle('wireframe')}
          >
            CAD Wireframe
          </button>
        </div>

        <div className="camera-presets">
          <span className="preset-label">Camera:</span>
          <button className="preset-btn" onClick={() => setCameraPreset('iso')}>
            Isometric
          </button>
          <button className="preset-btn" onClick={() => setCameraPreset('front')}>
            Front 3/4
          </button>
          <button className="preset-btn" onClick={() => setCameraPreset('rear')}>
            Loading Dock
          </button>
          <button className="preset-btn" onClick={() => setCameraPreset('side')}>
            Side Profile
          </button>
          <button className="preset-btn" onClick={() => setCameraPreset('top')}>
            Top Plan
          </button>
        </div>

        <div className="action-toggles">
          <button
            className={`action-btn ${doorsOpen ? 'active' : ''}`}
            onClick={onToggleDoors}
            title="Open or close rear loading aperture doors"
          >
            {doorsOpen ? 'Doors: Open' : 'Doors: Closed'}
          </button>
          <button
            className={`action-btn ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle turntable auto-rotation"
          >
            {autoRotate ? 'Pause Rotate' : 'Auto Rotate'}
          </button>
        </div>
      </div>

      <div ref={mountRef} className="three-mount-container" />

      <div className="canvas-dock-hint">
        <span>Left Click + Drag to Orbit</span>
        <span>• Scroll to Zoom</span>
        <span>• Loaded Units: <b>{placements.length}</b> inside cavity</span>
      </div>
    </div>
  );
};
