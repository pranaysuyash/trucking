import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import type { VehicleSpec, CargoPackageSpec, GridPlacement } from '../engine/types';

interface ComponentDossier {
  id: string;
  name: string;
  category: string;
  oemSpec: string;
  description: string;
  specs: { label: string; value: string }[];
  telemetry: { label: string; value: string; status: 'nominal' | 'warning' | 'alert' }[];
  positionOffset: [number, number, number];
}

const COMPONENT_DOSSIERS: Record<string, ComponentDossier> = {
  engine: {
    id: 'engine',
    name: 'Detroit DD15 14.8L Turbo-Compound Diesel',
    category: 'Powertrain Propulsion',
    oemSpec: 'Inline-6 · 505 HP @ 1,625 RPM · 1,850 lb-ft Torque @ 975 RPM',
    description: 'High-efficiency heavy-duty commercial diesel engine with asymmetrical turbocharging and amplified common rail system (ACRS).',
    specs: [
      { label: 'Displacement', value: '14.8 Liters (906 cu in)' },
      { label: 'Compression Ratio', value: '18.5 : 1' },
      { label: 'Dry Weight', value: '2,880 lbs (1,306 kg)' },
      { label: 'Oil Sump Capacity', value: '47 Quarts (44.5 Liters)' },
      { label: 'Governor Speed', value: '1,900 RPM' },
    ],
    telemetry: [
      { label: 'Coolant Temp', value: '194°F (90°C)', status: 'nominal' },
      { label: 'Oil Pressure', value: '42.5 PSI', status: 'nominal' },
      { label: 'Turbo Boost', value: '28.4 PSI', status: 'nominal' },
      { label: 'DEF Dosing Rate', value: '2.8% of Fuel', status: 'nominal' },
    ],
    positionOffset: [-18, 5, 0],
  },
  transmission: {
    id: 'transmission',
    name: 'Detroit DT12 Automated Manual Transmission',
    category: 'Drivetrain',
    oemSpec: '12-Speed Overdrive · Helical Gears · Pneumatic Clutch Actuator',
    description: 'Intelligent powertrain automated manual transmission with eCoast neutral freewheel and active predictive cruise integration.',
    specs: [
      { label: 'Forward Speeds', value: '12 Forward, 4 Reverse' },
      { label: 'Torque Rating', value: '2,050 lb-ft max' },
      { label: 'Lubricant Capacity', value: '15 Quarts (Synthetic)' },
      { label: 'Shift Actuation', value: 'Pneumatic Servo' },
    ],
    telemetry: [
      { label: 'Trans Oil Temp', value: '182°F (83°C)', status: 'nominal' },
      { label: 'Current Gear', value: '11th Direct', status: 'nominal' },
      { label: 'Clutch Wear', value: '88% Remaining', status: 'nominal' },
    ],
    positionOffset: [-12, 4, 0],
  },
  tandem_axle: {
    id: 'tandem_axle',
    name: 'Meritor MT-40-14X Tandem Drive Axle Set',
    category: 'Chassis & Running Gear',
    oemSpec: '40,000 lb Rating · Hypoid Gearing · Driver-Controlled Differential Lock',
    description: 'Dual hypoid tandem drive axles engineered for long-haul linehaul duty with dual inter-axle power dividers.',
    specs: [
      { label: 'GAWR Rating', value: '34,000 lbs (Interstate Legal Cap)' },
      { label: 'Axle Ratio', value: '2.64 : 1 (Overdrive Linehaul)' },
      { label: 'Track Width', value: '71.5 inches' },
      { label: 'Wheel End', value: 'Dual 295/75R22.5 Low Profile' },
    ],
    telemetry: [
      { label: 'Current Load', value: '30,690 lbs', status: 'nominal' },
      { label: 'Forward Diff Temp', value: '168°F (75°C)', status: 'nominal' },
      { label: 'Rear Diff Temp', value: '165°F (74°C)', status: 'nominal' },
    ],
    positionOffset: [-1, 2.5, 0],
  },
  fifth_wheel: {
    id: 'fifth_wheel',
    name: 'Fontaine No-Slack® Air-Slide Fifth Wheel',
    category: 'Coupling Mechanism',
    oemSpec: '24-Inch Air-Slide Travel · 55,000 lb Vertical Load Cap',
    description: 'Automatic self-adjusting locking jaw mechanism eliminates slack between kingpin and fifth wheel plate, reducing driver fatigue.',
    specs: [
      { label: 'Vertical Rating', value: '55,000 lbs' },
      { label: 'Drawbar Pull', value: '150,000 lbs' },
      { label: 'Slide Increments', value: '2-inch tooth spacing' },
      { label: 'Kingpin Size', value: '2.0-inch SAE Standard' },
    ],
    telemetry: [
      { label: 'Jaw Lock Sensor', value: 'SECURE (Engaged)', status: 'nominal' },
      { label: 'Slide Pin Air', value: '115 PSI (Locked)', status: 'nominal' },
      { label: 'Fifth Wheel Load', value: '18,500 lbs', status: 'nominal' },
    ],
    positionOffset: [2, 5.2, 0],
  },
  reefer_unit: {
    id: 'reefer_unit',
    name: 'Thermo King Precedent® S-700 Cryogenic Reefer',
    category: 'Thermal Cold-Chain',
    oemSpec: 'Tier 4 Final Diesel · R-452A Refrigerant · Microchannel Condenser',
    description: 'Ultra-high-efficiency deep-frozen refrigeration unit engineered for continuous pharmaceutical and perishable cargo preservation.',
    specs: [
      { label: 'Cooling Capacity', value: '68,000 BTU/hr @ 35°F, 34,000 BTU/hr @ -20°F' },
      { label: 'Evaporator Airflow', value: '3,300 cu ft/min (CFM)' },
      { label: 'Reefer Engine', value: '4-Cylinder Yanmar Clean Diesel' },
      { label: 'Fuel Tank', value: '50-Gallon Dedicated Belly Tank' },
    ],
    telemetry: [
      { label: 'Zone 1 Return Air', value: '-9.8°F (Setpoint -10.0°F)', status: 'nominal' },
      { label: 'Discharge Air Temp', value: '-14.2°F', status: 'nominal' },
      { label: 'Compressor RPM', value: '2,200 High Speed', status: 'nominal' },
      { label: 'Defrost Cycle', value: 'Standby (Next in 3.4 hrs)', status: 'nominal' },
    ],
    positionOffset: [6, 12, 0],
  },
  fuel_tanks: {
    id: 'fuel_tanks',
    name: 'Dual 150-Gallon Cylindrical Aluminum Fuel Tanks',
    category: 'Energy Storage',
    oemSpec: '300-Gallon Total Diesel · 25-inch Diameter · Clean-Side Polished',
    description: 'Twin aircraft-grade cylindrical aluminum diesel reservoirs with internal anti-slosh baffles and integrated fuel pickup heaters.',
    specs: [
      { label: 'Total Capacity', value: '300 US Gallons (1,135 Liters)' },
      { label: 'Usable Fuel', value: '285 Gallons' },
      { label: 'Range @ 6.8 MPG', value: '1,938 Miles Non-Stop' },
      { label: 'Weight (Full)', value: '2,130 lbs (Diesel @ 7.1 lbs/gal)' },
    ],
    telemetry: [
      { label: 'Left Tank Level', value: '78% (117 Gal)', status: 'nominal' },
      { label: 'Right Tank Level', value: '76% (114 Gal)', status: 'nominal' },
      { label: 'Fuel Temp', value: '62°F (Normal)', status: 'nominal' },
    ],
    positionOffset: [-7, 3, 4.2],
  },
  trailer_bogie: {
    id: 'trailer_bogie',
    name: 'Sliding 41-Foot Trailer Tandem Bogie Assembly',
    category: 'Trailer Running Gear',
    oemSpec: 'Hendrickson VANTRAAX® HKANT 40K · 49 CFR § 658 Kingpin Setting',
    description: 'Air-actuated sliding tandem assembly allows driver to position axle bogie forward or rearward to achieve statutory 34,000 lb balance.',
    specs: [
      { label: 'Axle Spacing', value: '49 inches (Standard Tandem)' },
      { label: 'Bogie Slide Range', value: '41 ft setting (California / STAA compliant)' },
      { label: 'Brakes', value: '16.5" x 7" Q-Plus Drum with Haldex ABS' },
      { label: 'Tire Size', value: '8x 295/75R22.5 SmartWay Verified' },
    ],
    telemetry: [
      { label: 'Tandem Weight', value: '33,530 lbs', status: 'nominal' },
      { label: 'Brake Chamber PSI', value: '105 PSI (Supply)', status: 'nominal' },
      { label: 'Slide Pin Lock', value: '4 Pins Locked', status: 'nominal' },
    ],
    positionOffset: [36, 2.5, 0],
  },
};

interface Interactive3DTeardownProps {
  vehicle: VehicleSpec;
  selectedPackage: CargoPackageSpec;
  placements: GridPlacement[];
}

export const Interactive3DTeardown: React.FC<Interactive3DTeardownProps> = ({
  vehicle,
  selectedPackage,
  placements,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Teardown & Cutaway controls
  const [explodePct, setExplodePct] = useState<number>(0);
  const [sliceAxis, setSliceAxis] = useState<'off' | 'x' | 'y' | 'z'>('off');
  const [sliceOffset, setSliceOffset] = useState<number>(0);
  const [flowMode, setFlowMode] = useState<'off' | 'reefer' | 'powertrain' | 'axle_forces'>('reefer');
  const [wireframeEdges, setWireframeEdges] = useState<boolean>(true);
  const [ghostGlass, setGhostGlass] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>('engine');

  // Three.js State References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Group references for animated explosion & transforms
  const groupsRef = useRef<{
    cab: THREE.Group | null;
    engine: THREE.Group | null;
    transmission: THREE.Group | null;
    chassis: THREE.Group | null;
    driveAxles: THREE.Group | null;
    fifthWheel: THREE.Group | null;
    fuelTanks: THREE.Group | null;
    trailerChassis: THREE.Group | null;
    trailerLeftWall: THREE.Group | null;
    trailerRightWall: THREE.Group | null;
    trailerRoof: THREE.Group | null;
    trailerDoors: THREE.Group | null;
    trailerBogie: THREE.Group | null;
    reeferUnit: THREE.Group | null;
    cargo: THREE.Group | null;
    flowParticles: THREE.Points | null;
    forceArrows: THREE.Group | null;
  }>({
    cab: null,
    engine: null,
    transmission: null,
    chassis: null,
    driveAxles: null,
    fifthWheel: null,
    fuelTanks: null,
    trailerChassis: null,
    trailerLeftWall: null,
    trailerRightWall: null,
    trailerRoof: null,
    trailerDoors: null,
    trailerBogie: null,
    reeferUnit: null,
    cargo: null,
    flowParticles: null,
    forceArrows: null,
  });

  // Orbit controls
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const rotRef = useRef({ theta: Math.PI / 4 + 0.3, phi: 0.45 });
  const radiusRef = useRef(80);
  const targetLookAtRef = useRef(new THREE.Vector3(10, 6, 0));

  // Clipping Plane reference
  const clipPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 0, 1), 50));

  const activeDossier = useMemo(() => {
    return selectedComponentId ? COMPONENT_DOSSIERS[selectedComponentId] : null;
  }, [selectedComponentId]);

  // Set Camera Presets
  const setCameraPreset = (preset: 'iso' | 'explode' | 'engine' | 'cargo' | 'chassis' | 'bogie') => {
    switch (preset) {
      case 'iso':
        rotRef.current = { theta: Math.PI / 4 + 0.3, phi: 0.45 };
        radiusRef.current = 80;
        targetLookAtRef.current.set(10, 6, 0);
        break;
      case 'explode':
        rotRef.current = { theta: 0.85, phi: 0.5 };
        radiusRef.current = 110;
        targetLookAtRef.current.set(12, 8, 0);
        setExplodePct(65);
        break;
      case 'engine':
        rotRef.current = { theta: 0.4, phi: 0.3 };
        radiusRef.current = 32;
        targetLookAtRef.current.set(-16, 5, 0);
        setSelectedComponentId('engine');
        break;
      case 'cargo':
        rotRef.current = { theta: Math.PI / 2, phi: 0.3 };
        radiusRef.current = 48;
        targetLookAtRef.current.set(24, 8, 0);
        break;
      case 'chassis':
        rotRef.current = { theta: 1.2, phi: 0.15 };
        radiusRef.current = 45;
        targetLookAtRef.current.set(-4, 3, 0);
        setSelectedComponentId('tandem_axle');
        break;
      case 'bogie':
        rotRef.current = { theta: Math.PI - 0.3, phi: 0.3 };
        radiusRef.current = 36;
        targetLookAtRef.current.set(38, 4, 0);
        setSelectedComponentId('trailer_bogie');
        break;
    }
  };

  // Initialize Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 920;
    const height = 520;

    // 1. Scene & Atmosphere
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x040812);
    scene.fog = new THREE.FogExp2(0x040812, 0.008);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 500);
    cameraRef.current = camera;

    // 3. Renderer with local clipping enabled
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.4);
    dirLight1.position.set(30, 45, 30);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x10b981, 0.8);
    dirLight2.position.set(-30, 20, -30);
    scene.add(dirLight2);

    const rimLight = new THREE.DirectionalLight(0xc084fc, 0.6);
    rimLight.position.set(0, -10, 0);
    scene.add(rimLight);

    // 5. Holographic Floor Grid with scale ticks
    const gridHelper = new THREE.GridHelper(140, 70, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    // Master Vehicle Assembly Groups
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    const g = groupsRef.current;
    g.cab = new THREE.Group();
    g.engine = new THREE.Group();
    g.transmission = new THREE.Group();
    g.chassis = new THREE.Group();
    g.driveAxles = new THREE.Group();
    g.fifthWheel = new THREE.Group();
    g.fuelTanks = new THREE.Group();
    g.trailerChassis = new THREE.Group();
    g.trailerLeftWall = new THREE.Group();
    g.trailerRightWall = new THREE.Group();
    g.trailerRoof = new THREE.Group();
    g.trailerDoors = new THREE.Group();
    g.trailerBogie = new THREE.Group();
    g.reeferUnit = new THREE.Group();
    g.cargo = new THREE.Group();
    g.forceArrows = new THREE.Group();

    masterGroup.add(
      g.cab,
      g.engine,
      g.transmission,
      g.chassis,
      g.driveAxles,
      g.fifthWheel,
      g.fuelTanks,
      g.trailerChassis,
      g.trailerLeftWall,
      g.trailerRightWall,
      g.trailerRoof,
      g.trailerDoors,
      g.trailerBogie,
      g.reeferUnit,
      g.cargo,
      g.forceArrows
    );

    // -------------------------------------------------------------
    // PROCEDURAL 3D SUB-ASSEMBLY MESH CREATION
    // -------------------------------------------------------------
    const createMat = (color: number, metalness = 0.5, roughness = 0.4, opacity = 1.0) => {
      return new THREE.MeshStandardMaterial({
        color,
        metalness,
        roughness,
        transparent: opacity < 1.0,
        opacity,
        clippingPlanes: [clipPlaneRef.current],
        clipShadows: true,
      });
    };

    const addWireframe = (mesh: THREE.Mesh, wireColor = 0x38bdf8) => {
      const edges = new THREE.EdgesGeometry(mesh.geometry);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: wireColor, transparent: true, opacity: 0.6 }));
      mesh.add(line);
    };

    // A. Engine Block (Detroit DD15)
    const engBlockGeo = new THREE.BoxGeometry(7, 4.5, 3.2);
    const engMat = createMat(0x0284c7, 0.8, 0.3);
    const engMesh = new THREE.Mesh(engBlockGeo, engMat);
    engMesh.position.set(-18, 5, 0);
    addWireframe(engMesh, 0x38bdf8);
    g.engine.add(engMesh);

    // Turbocharger housing on engine
    const turboGeo = new THREE.CylinderGeometry(1.2, 1.4, 2.2, 16);
    const turboMat = createMat(0xd97706, 0.9, 0.2); // Glowing bronze
    const turboMesh = new THREE.Mesh(turboGeo, turboMat);
    turboMesh.rotation.z = Math.PI / 2;
    turboMesh.position.set(-17, 7, 2);
    addWireframe(turboMesh, 0xf59e0b);
    g.engine.add(turboMesh);

    // Valve cover & intake manifold
    const valveCoverGeo = new THREE.BoxGeometry(6.5, 1.2, 2.8);
    const valveCoverMat = createMat(0x0f172a, 0.6, 0.2);
    const valveCoverMesh = new THREE.Mesh(valveCoverGeo, valveCoverMat);
    valveCoverMesh.position.set(-18, 7.6, 0);
    g.engine.add(valveCoverMesh);

    // B. Transmission & Driveshaft
    const transGeo = new THREE.BoxGeometry(5.5, 3.2, 2.8);
    const transMat = createMat(0x475569, 0.8, 0.4);
    const transMesh = new THREE.Mesh(transGeo, transMat);
    transMesh.position.set(-12, 4.2, 0);
    addWireframe(transMesh, 0x94a3b8);
    g.transmission.add(transMesh);

    const shaftGeo = new THREE.CylinderGeometry(0.35, 0.35, 12, 12);
    const shaftMat = createMat(0x94a3b8, 0.9, 0.2);
    const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
    shaftMesh.rotation.z = Math.PI / 2;
    shaftMesh.position.set(-5.5, 3.2, 0);
    g.transmission.add(shaftMesh);

    // C. Chassis Twin C-Channel Frame Rails
    const railMat = createMat(0x1e293b, 0.9, 0.3);
    const railGeo = new THREE.BoxGeometry(32, 1.4, 0.4);
    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-8, 3.8, 2.1);
    addWireframe(leftRail, 0x38bdf8);
    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(-8, 3.8, -2.1);
    addWireframe(rightRail, 0x38bdf8);
    g.chassis.add(leftRail, rightRail);

    // Front Bumper
    const bumperGeo = new THREE.BoxGeometry(1.6, 2.2, 9);
    const bumperMat = createMat(0x94a3b8, 0.9, 0.1);
    const bumper = new THREE.Mesh(bumperGeo, bumperMat);
    bumper.position.set(-24.5, 2.5, 0);
    g.chassis.add(bumper);

    // D. Cab Assembly (Semi-truck aerodynamic cab & sleeper)
    const cabMat = createMat(0x0369a1, 0.5, 0.3, ghostGlass ? 0.35 : 1.0);
    const cabLowerGeo = new THREE.BoxGeometry(16, 8, 8.4);
    const cabLower = new THREE.Mesh(cabLowerGeo, cabMat);
    cabLower.position.set(-16, 9, 0);
    addWireframe(cabLower, 0x38bdf8);

    const cabRoofGeo = new THREE.BoxGeometry(13, 3.5, 8.2);
    const cabRoof = new THREE.Mesh(cabRoofGeo, cabMat);
    cabRoof.position.set(-14.5, 14.5, 0);
    addWireframe(cabRoof, 0x38bdf8);

    const windshieldGeo = new THREE.BoxGeometry(0.3, 3.2, 7.6);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
      metalness: 0.1,
      roughness: 0.1,
    });
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(-23.8, 10.5, 0);
    windshield.rotation.z = -0.3;

    g.cab.add(cabLower, cabRoof, windshield);

    // E. Drive Axles & Wheels
    const tireGeo = new THREE.CylinderGeometry(2.1, 2.1, 1.4, 24);
    const tireMat = createMat(0x0f172a, 0.1, 0.8);
    const rimMat = createMat(0xe2e8f0, 0.9, 0.2);

    const createWheel = (x: number, y: number, z: number) => {
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.x = Math.PI / 2;
      tire.position.set(x, y, z);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 1.45, 16), rimMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(x, y, z);

      const wheelGroup = new THREE.Group();
      wheelGroup.add(tire, rim);
      return wheelGroup;
    };

    // Steer Wheels (Front)
    g.chassis.add(createWheel(-20, 2.1, 4.3), createWheel(-20, 2.1, -4.3));

    // Tractor Tandem Drive Axles (4 Dual sets)
    g.driveAxles.add(
      createWheel(-3, 2.1, 4.3),
      createWheel(-3, 2.1, -4.3),
      createWheel(1.5, 2.1, 4.3),
      createWheel(1.5, 2.1, -4.3)
    );

    // F. Fifth Wheel Assembly
    const fwGeo = new THREE.BoxGeometry(3, 0.6, 3.4);
    const fwMat = createMat(0x334155, 0.9, 0.2);
    const fwMesh = new THREE.Mesh(fwGeo, fwMat);
    fwMesh.position.set(0, 4.8, 0);
    addWireframe(fwMesh, 0x10b981);
    g.fifthWheel.add(fwMesh);

    // G. Fuel Tanks (Dual 150-Gal Cylindrical Aluminum)
    const tankGeo = new THREE.CylinderGeometry(1.6, 1.6, 8, 20);
    const tankMat = createMat(0xcbd5e1, 0.95, 0.15); // Chrome finish
    const leftTank = new THREE.Mesh(tankGeo, tankMat);
    leftTank.rotation.z = Math.PI / 2;
    leftTank.position.set(-10, 2.8, 4.2);
    addWireframe(leftTank, 0x38bdf8);

    const rightTank = new THREE.Mesh(tankGeo, tankMat);
    rightTank.rotation.z = Math.PI / 2;
    rightTank.position.set(-10, 2.8, -4.2);
    addWireframe(rightTank, 0x38bdf8);
    g.fuelTanks.add(leftTank, rightTank);

    // H. 53-Foot Trailer Sub-assemblies
    const trailerLength = 53;
    const trailerWidth = 8.4;
    const trailerHeight = 9.2;
    const trailerMat = createMat(0x082f49, 0.6, 0.3, ghostGlass ? 0.3 : 0.95);

    // 1. Trailer Floor & Main Frame
    const tFloorGeo = new THREE.BoxGeometry(trailerLength, 1.0, trailerWidth);
    const tFloorMesh = new THREE.Mesh(tFloorGeo, createMat(0x1e293b, 0.8, 0.5));
    tFloorMesh.position.set(28, 5.2, 0);
    addWireframe(tFloorMesh, 0x0284c7);
    g.trailerChassis.add(tFloorMesh);

    // Landing Gear Legs
    const lgGeo = new THREE.BoxGeometry(0.8, 4.5, 0.8);
    const lgMat = createMat(0x475569, 0.8, 0.4);
    const leftLg = new THREE.Mesh(lgGeo, lgMat);
    leftLg.position.set(7, 2.6, 3.6);
    const rightLg = new THREE.Mesh(lgGeo, lgMat);
    rightLg.position.set(7, 2.6, -3.6);
    g.trailerChassis.add(leftLg, rightLg);

    // 2. Left Wall
    const wallGeo = new THREE.BoxGeometry(trailerLength, trailerHeight, 0.3);
    const leftWall = new THREE.Mesh(wallGeo, trailerMat);
    leftWall.position.set(28, 10.3, trailerWidth / 2);
    addWireframe(leftWall, 0x38bdf8);
    g.trailerLeftWall.add(leftWall);

    // 3. Right Wall
    const rightWall = new THREE.Mesh(wallGeo, trailerMat);
    rightWall.position.set(28, 10.3, -trailerWidth / 2);
    addWireframe(rightWall, 0x38bdf8);
    g.trailerRightWall.add(rightWall);

    // 4. Roof
    const roofGeo = new THREE.BoxGeometry(trailerLength, 0.3, trailerWidth);
    const roof = new THREE.Mesh(roofGeo, trailerMat);
    roof.position.set(28, 15, 0);
    addWireframe(roof, 0x38bdf8);
    g.trailerRoof.add(roof);

    // 5. Rear Barn Doors
    const doorGeo = new THREE.BoxGeometry(0.3, trailerHeight, trailerWidth / 2);
    const doorMat = createMat(0x0f172a, 0.7, 0.3);
    const leftDoor = new THREE.Mesh(doorGeo, doorMat);
    leftDoor.position.set(trailerLength / 2 + 28, 10.3, trailerWidth / 4);
    const rightDoor = new THREE.Mesh(doorGeo, doorMat);
    rightDoor.position.set(trailerLength / 2 + 28, 10.3, -trailerWidth / 4);
    g.trailerDoors.add(leftDoor, rightDoor);

    // 6. Sliding Trailer Tandem Bogie
    g.trailerBogie.add(
      createWheel(46, 2.1, 4.3),
      createWheel(46, 2.1, -4.3),
      createWheel(50.5, 2.1, 4.3),
      createWheel(50.5, 2.1, -4.3)
    );

    // 7. Thermo King Nose Reefer Unit
    const reeferGeo = new THREE.BoxGeometry(2.4, 6.5, 7.5);
    const reeferMat = createMat(0xffffff, 0.3, 0.2); // Clean white refrigeration unit
    const reefer = new THREE.Mesh(reeferGeo, reeferMat);
    reefer.position.set(2.4, 11, 0);
    addWireframe(reefer, 0x38bdf8);

    // Glowing LED Status Indicator
    const ledGeo = new THREE.BoxGeometry(0.1, 0.6, 2.0);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(1.1, 12.5, 0);
    g.reeferUnit.add(reefer, led);

    // 8. 3D Palletized Cargo Units
    const cargoGroup = g.cargo;
    const palletColor = selectedPackage?.color ? parseInt(selectedPackage.color.replace('#', '0x'), 16) : 0xb45309;
    const palletMat = createMat(palletColor, 0.3, 0.7);

    if (placements && placements.length > 0) {
      const pLen = Math.max(2.0, selectedPackage.dims.lengthIn / 12);
      const pHt = Math.max(2.0, selectedPackage.dims.heightIn / 12);
      const pWd = Math.max(2.0, selectedPackage.dims.widthIn / 12);
      const palletGeo = new THREE.BoxGeometry(pLen, pHt, pWd);

      placements.slice(0, 48).forEach((p) => {
        const xPos = 4.5 + (p.xIn / 12);
        const yPos = 5.5 + (p.yIn / 12) + (pHt / 2);
        const zPos = -3.8 + (p.zIn / 12) + (pWd / 2);
        const pMesh = new THREE.Mesh(palletGeo, palletMat);
        pMesh.position.set(xPos, yPos, zPos);
        addWireframe(pMesh, 0xf59e0b);
        cargoGroup.add(pMesh);
      });
    } else {
      const palletGeo = new THREE.BoxGeometry(4.0, 4.5, 3.3);
      for (let i = 0; i < 22; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const xPos = 6 + row * 4.4;
        const zPos = col === 0 ? 1.9 : -1.9;

        const pMesh = new THREE.Mesh(palletGeo, palletMat);
        pMesh.position.set(xPos, 8.0, zPos);
        addWireframe(pMesh, 0xf59e0b);
        cargoGroup.add(pMesh);
      }
    }

    // 9. Particle Flow System (Reefer Airflow & Powertrain)
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = 4 + Math.random() * 46;
      particlePositions[i * 3 + 1] = 7 + Math.random() * 7;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.8,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(particleGeo, particleMat);
    g.flowParticles = points;
    scene.add(points);

    // 10. Axle Load Force Vector Arrows
    const createForceArrow = (x: number, labelText: string, weightLbs: number, limitLbs: number) => {
      const arrowGroup = new THREE.Group();
      arrowGroup.name = `force-arrow-${labelText}`;
      arrowGroup.position.set(x, 0, 0);

      const coneGeo = new THREE.ConeGeometry(0.8, 2.0, 16);
      const shaftGeo = new THREE.CylinderGeometry(0.25, 0.25, 4.0, 12);
      const isLegal = weightLbs <= limitLbs;
      const arrowMat = new THREE.MeshBasicMaterial({ color: isLegal ? 0x10b981 : 0xf43f5e });

      const shaft = new THREE.Mesh(shaftGeo, arrowMat);
      shaft.position.y = 2.0;
      const cone = new THREE.Mesh(coneGeo, arrowMat);
      cone.position.y = 0.5;
      cone.rotation.x = Math.PI;

      arrowGroup.add(shaft, cone);
      return arrowGroup;
    };

    g.forceArrows.add(
      createForceArrow(-20, 'Steer (11,280 lbs)', 11280, 12000),
      createForceArrow(-0.8, 'Drive (30,690 lbs)', 30690, 34000),
      createForceArrow(48, 'Trailer Tandem (33,530 lbs)', 33530, 34000)
    );

    // Mouse Interaction
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
      radiusRef.current = Math.max(25, Math.min(160, radiusRef.current + e.deltaY * 0.08));
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // Render & Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (autoRotate) {
        rotRef.current.theta += 0.25 * delta;
      }

      // Smooth camera position
      const { theta, phi } = rotRef.current;
      const r = radiusRef.current;
      const target = targetLookAtRef.current;

      camera.position.x = target.x + r * Math.sin(theta) * Math.cos(phi);
      camera.position.y = target.y + r * Math.sin(phi);
      camera.position.z = target.z + r * Math.cos(theta) * Math.cos(phi);
      camera.lookAt(target);

      // Animate flow particles with delta
      if (g.flowParticles && g.flowParticles.visible) {
        const positions = g.flowParticles.geometry.attributes.position.array as Float32Array;
        const step = 20 * delta;
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] += step; // Move forward along trailer
          if (positions[i * 3] > 54) {
            positions[i * 3] = 4;
          }
        }
        g.flowParticles.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    animate();

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
  }, []);

  // -------------------------------------------------------------
  // ANIMATE EXPLODED VIEW TEARDOWN TRANSFORMATIONS
  // -------------------------------------------------------------
  useEffect(() => {
    const g = groupsRef.current;
    const factor = explodePct / 100; // 0.0 to 1.0

    // 1. Cab Tilts Forward on Hinge Pin (Real Truck Maintenance!)
    if (g.cab) {
      g.cab.position.set(-factor * 6, factor * 4, 0);
      g.cab.rotation.z = -factor * 0.42; // Tilt 24 degrees forward
    }

    // 2. Engine Block Lifts & Turbo Displaces
    if (g.engine) {
      g.engine.position.set(0, factor * 3.5, factor * 1.5);
    }

    // 3. Transmission Drops and Slides Back
    if (g.transmission) {
      g.transmission.position.set(-factor * 3, -factor * 2, 0);
    }

    // 4. Drive Axles Drop Downward
    if (g.driveAxles) {
      g.driveAxles.position.set(0, -factor * 2.5, 0);
    }

    // 5. Fifth Wheel Plate Slides Up
    if (g.fifthWheel) {
      g.fifthWheel.position.set(0, factor * 3, 0);
    }

    // 6. Fuel Tanks Displace Laterally
    if (g.fuelTanks) {
      g.fuelTanks.position.set(0, 0, 0);
      // Children displacement
      if (g.fuelTanks.children[0]) g.fuelTanks.children[0].position.z = 4.2 + factor * 4;
      if (g.fuelTanks.children[1]) g.fuelTanks.children[1].position.z = -4.2 - factor * 4;
    }

    // 7. Trailer Enclosure Separates
    if (g.trailerLeftWall) {
      g.trailerLeftWall.position.set(0, factor * 1.5, factor * 8);
    }
    if (g.trailerRightWall) {
      g.trailerRightWall.position.set(0, factor * 1.5, -factor * 8);
    }
    if (g.trailerRoof) {
      g.trailerRoof.position.set(0, factor * 12, 0);
    }
    if (g.trailerDoors) {
      g.trailerDoors.position.set(factor * 10, 0, 0);
      if (g.trailerDoors.children[0]) g.trailerDoors.children[0].rotation.y = factor * Math.PI * 0.8;
      if (g.trailerDoors.children[1]) g.trailerDoors.children[1].rotation.y = -factor * Math.PI * 0.8;
    }
    if (g.trailerBogie) {
      g.trailerBogie.position.set(factor * 8, -factor * 2, 0);
    }
    if (g.reeferUnit) {
      g.reeferUnit.position.set(-factor * 5, factor * 2, 0);
    }

    // 8. Cargo Pallets Float in Tiered Array
    if (g.cargo) {
      g.cargo.position.set(0, factor * 4, 0);
    }
  }, [explodePct]);

  // -------------------------------------------------------------
  // UPDATE SLICING CLIPPING PLANE
  // -------------------------------------------------------------
  useEffect(() => {
    if (sliceAxis === 'off') {
      clipPlaneRef.current.set(new THREE.Vector3(0, 0, 1), 1000); // Out of view
    } else if (sliceAxis === 'x') {
      clipPlaneRef.current.set(new THREE.Vector3(1, 0, 0), sliceOffset);
    } else if (sliceAxis === 'y') {
      clipPlaneRef.current.set(new THREE.Vector3(0, 1, 0), sliceOffset + 8);
    } else if (sliceAxis === 'z') {
      clipPlaneRef.current.set(new THREE.Vector3(0, 0, 1), sliceOffset);
    }
  }, [sliceAxis, sliceOffset]);

  // -------------------------------------------------------------
  // UPDATE FLOW SIMULATION VISIBILITY
  // -------------------------------------------------------------
  useEffect(() => {
    const g = groupsRef.current;
    if (g.flowParticles) {
      g.flowParticles.visible = flowMode === 'reefer' || flowMode === 'powertrain';
      const pMat = g.flowParticles.material as THREE.PointsMaterial;
      if (flowMode === 'reefer') {
        pMat.color.setHex(0x38bdf8); // Icy blue
      } else if (flowMode === 'powertrain') {
        pMat.color.setHex(0xf59e0b); // Diesel amber
      }
    }
    if (g.forceArrows) {
      g.forceArrows.visible = flowMode === 'axle_forces';
    }
  }, [flowMode]);

  // -------------------------------------------------------------
  // UPDATE WIREFRAME & GHOST SHELL OPACITY
  // -------------------------------------------------------------
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.traverse((child) => {
      if (child instanceof THREE.LineSegments) {
        child.visible = wireframeEdges;
      }
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        const mat = child.material;
        // Make exterior walls, roof, and cab body translucent in ghost mode
        const isShell = child.geometry instanceof THREE.BoxGeometry && child.geometry.parameters.width > 20;
        if (isShell) {
          mat.transparent = ghostGlass;
          mat.opacity = ghostGlass ? 0.25 : 0.95;
          mat.needsUpdate = true;
        }
      }
    });
  }, [wireframeEdges, ghostGlass]);

  return (
    <div className="teardown-viewer-root">
      {/* 3D WebGL Canvas Container */}
      <div className="teardown-canvas-container" ref={mountRef}>
        {/* Floating Cyber HUD Dossier Card (Click-to-Inspect) */}
        {activeDossier && (
          <div className="teardown-dossier-overlay">
            <div className="dossier-header-bar">
              <div className="dossier-title-col">
                <span className="badge-category">{activeDossier.category}</span>
                <h4>{activeDossier.name}</h4>
                <span className="oem-subtitle">{activeDossier.oemSpec}</span>
              </div>
              <button
                className="btn-dossier-close"
                onClick={() => setSelectedComponentId(null)}
              >Close</button>
            </div>

            <p className="dossier-desc">{activeDossier.description}</p>

            {/* Engineering Specs */}
            <div className="dossier-specs-grid">
              {activeDossier.specs.map((s, idx) => (
                <div key={idx} className="spec-item">
                  <span className="spec-lbl">{s.label}:</span>
                  <span className="spec-val">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Live Telemetry Sensors */}
            <div className="dossier-telemetry-box">
              <span className="telemetry-hdr">LIVE CAN BUS TELEMETRY READINGS</span>
              <div className="telemetry-tags-row">
                {activeDossier.telemetry.map((t, idx) => (
                  <div key={idx} className={`telemetry-tag ${t.status}`}>
                    <span className="t-lbl">{t.label}:</span>
                    <span className="t-val">{t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Live HUD Floating Compass & Coordinates */}
        <div className="teardown-compass-overlay">
          <div className="compass-ring">
            <span>N</span>
          </div>
          <div className="coordinates-tag">
            <span>{vehicle.name}</span>
            <span>EXPLODE: {explodePct}%</span>
          </div>
        </div>
      </div>

      {/* Interactive Teardown Control Bar */}
      <div className="teardown-control-panel">
        {/* Row 1: Explode Slider & Slicing Plane */}
        <div className="control-row primary-controls">
          {/* Explode / Teardown Slider */}
          <div className="control-group explode-slider-group">
            <div className="label-with-val">
              <span className="ctrl-label">TEARDOWN / EXPLODE ASSEMBLY:</span>
              <span className="ctrl-val">{explodePct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={explodePct}
              onChange={(e) => setExplodePct(Number(e.target.value))}
              className="teardown-range-slider"
            />
            <div className="slider-ticks">
              <button type="button" onClick={() => setExplodePct(0)}>0% (Fitted)</button>
              <button type="button" onClick={() => setExplodePct(35)}>35% (Inspection)</button>
              <button type="button" onClick={() => setExplodePct(70)}>70% (Teardown)</button>
              <button type="button" onClick={() => setExplodePct(100)}>100% (Exploded)</button>
            </div>
          </div>

          {/* Slicing Cross-Section Plane */}
          <div className="control-group slicing-group">
            <div className="label-with-val">
              <span className="ctrl-label">X-RAY SLICING PLANE:</span>
              <span className="ctrl-val">{sliceAxis.toUpperCase()}</span>
            </div>
            <div className="slicing-axis-buttons">
              {(['off', 'x', 'y', 'z'] as const).map((axis) => (
                <button
                  key={axis}
                  className={`btn-axis ${sliceAxis === axis ? 'active' : ''}`}
                  onClick={() => setSliceAxis(axis)}
                >
                  {axis === 'off' ? 'OFF' : `${axis.toUpperCase()}-AXIS`}
                </button>
              ))}
            </div>
            {sliceAxis !== 'off' && (
              <input
                type="range"
                min="-25"
                max="50"
                value={sliceOffset}
                onChange={(e) => setSliceOffset(Number(e.target.value))}
                className="slice-offset-slider"
              />
            )}
          </div>
        </div>

        {/* Row 2: Flow Simulation & Component Selectors */}
        <div className="control-row secondary-controls">
          {/* Animated Flow Simulators */}
          <div className="control-group flow-select-group">
            <span className="ctrl-label">ACTIVE FLOW SIMULATION:</span>
            <div className="flow-pill-buttons">
              <button
                className={`flow-pill ${flowMode === 'reefer' ? 'active reefer' : ''}`}
                onClick={() => setFlowMode('reefer')}
              >
                Reefer Airflow Circuit
              </button>
              <button
                className={`flow-pill ${flowMode === 'powertrain' ? 'active powertrain' : ''}`}
                onClick={() => setFlowMode('powertrain')}
              >
                Powertrain Fuel Loop
              </button>
              <button
                className={`flow-pill ${flowMode === 'axle_forces' ? 'active forces' : ''}`}
                onClick={() => setFlowMode('axle_forces')}
              >
                3D Axle Force Vectors
              </button>
              <button
                className={`flow-pill ${flowMode === 'off' ? 'active' : ''}`}
                onClick={() => setFlowMode('off')}
              >
                Off
              </button>
            </div>
          </div>

          {/* Camera Presets & Inspect Links */}
          <div className="control-group camera-presets-group">
            <span className="ctrl-label">CAMERA PRESETS:</span>
            <div className="camera-btn-row">
              <button onClick={() => setCameraPreset('iso')} className="btn-cam">Isometric 3D</button>
              <button onClick={() => setCameraPreset('explode')} className="btn-cam">Exploded View</button>
              <button onClick={() => setCameraPreset('engine')} className="btn-cam">Engine Bay</button>
              <button onClick={() => setCameraPreset('cargo')} className="btn-cam">Cargo Cross-Section</button>
              <button onClick={() => setCameraPreset('bogie')} className="btn-cam">Rear Bogie</button>
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`btn-cam ${autoRotate ? 'active' : ''}`}
              >
                {autoRotate ? 'Stop Spin' : 'Turntable'}
              </button>
              <button
                onClick={() => setWireframeEdges(!wireframeEdges)}
                className={`btn-cam ${wireframeEdges ? 'active' : ''}`}
                title="Toggle engineering CAD wireframe edges"
              >
                {wireframeEdges ? 'Edges ON' : 'Edges OFF'}
              </button>
              <button
                onClick={() => setGhostGlass(!ghostGlass)}
                className={`btn-cam ${ghostGlass ? 'active' : ''}`}
                title="Toggle translucent ghost x-ray shell"
              >
                {ghostGlass ? 'Ghost Shell' : 'Solid Shell'}
              </button>
            </div>
          </div>
        </div>

        {/* Row 3: Component Teardown Fast-Selector */}
        <div className="control-row component-selector-row">
          <span className="ctrl-label">CLICK COMPONENT TO INSPECT:</span>
          <div className="component-badges-scroll">
            {Object.values(COMPONENT_DOSSIERS).map((comp) => (
              <button
                key={comp.id}
                className={`comp-chip ${selectedComponentId === comp.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedComponentId(comp.id);
                  targetLookAtRef.current.set(...comp.positionOffset);
                }}
              >
                <span>{comp.name.split(' ')[0]}</span>
                <span className="comp-chip-sub">{comp.category.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
