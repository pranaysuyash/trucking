# Product 04: Fleet & Cargo Asset Studio

Local dev URL: [http://localhost:5176/](http://localhost:5176/)

Fleet & Cargo Asset Studio is the shared vehicle and cargo catalog for the Trucking platform, built with React 19, TypeScript, Three.js WebGL, Axonometric SVG, Vite 7, and Vitest.

## 1. Overview & Purpose

Product 04 models commercial freight vehicles and packaging units with physical dimensions, weight ratings, and multi-view engineering diagrams:

- Vehicle specifications cover exterior and interior dimensions, door apertures, curb weight, GVWR, maximum payload, cubic volume, powertrain (horsepower, torque, axle configuration), tank or battery capacity, loaded and empty fuel economy, driving range, and Federal Bridge Law axle allowances.
- Cargo and packaging units include standard ISO containers (20', 40', 40' High Cube, ISO Tanks, Flat Racks), unit load pallets (GMA 48x40, Euro EUR-1, EUR-2, chemical spill containment, half-pallets), 55-gallon steel and poly drums, 275-gallon caged IBC totes, master cartons, Gaylords, machinery crates, steel coils, and flexible bulk bags (FIBC).
- Geometric shapes support cuboids, cylinders, stepped skids, and caged totes.
- Asset Forge lets operators author custom vehicles and cargo units with `localStorage` persistence.
- The multi-view renderer provides three views:
  1. Real-time 3D WebGL (Three.js) with 360-degree orbit, solid exterior, cutaway/X-ray hold, CAD wireframe, cargo door animation, camera presets, and nested cargo placement.
  2. 2.5D isometric technical projection at 30 degrees with leader lines, dimension arrows, steer/drive/tandem axle load indicators, and stacked packages.
  3. 2D orthographic CAD blueprints (Side Elevation, Top Plan, and Rear Door Aperture) with CAD grid, dimension callouts, and center-of-gravity crosshairs.
- Spatial controls check door entry clearance, ceiling headroom, floor load pressure (lbs/sq ft), cubic fill percentage, payload weight fill percentage, and 3D grid coordinates.
- The temporal simulator tracks corridor fuel burn from payload weight, aerodynamic drag above 60 MPH, tank or battery depletion, refuel intervals, reefer burn, and dock turnaround duration.
- Cross-product bridges connect to Product 01 (Cargo Fit) for 3D packing, Product 02 (Freight Pricing) for category/weight/mileage/MPG feeds, Product 03 (HOS Planner) for corridor mileage/speed/refuel intervals, and JSON/CSV export.

## 2. Vehicle Catalog Taxonomy (20 Models)

| Model Name | Code | Category | Ext Dims (L x W x H) | Interior Cavity | GVWR | Max Payload | Fuel / Energy | Range |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 53' Standard Dry Van | `DV53` | Class 8 Combo | 72' x 8.5' x 13.5' | 52.5' x 8.33' x 9.17' | 80,000 lbs | 45,000 lbs | 200 gal Diesel (6.8 MPG) | 1,360 mi |
| 53' Refrigerated Trailer | `RF53` | Class 8 Combo | 73' x 8.5' x 13.5' | 52.0' x 8.12' x 8.75' | 80,000 lbs | 43,500 lbs | 250 gal Diesel (6.2 MPG) | 1,550 mi |
| 48' Standard Flatbed | `FB48` | Class 8 Combo | 68' x 8.5' x 13.0' | 48.0' x 8.5' x 8.5' | 80,000 lbs | 48,000 lbs | 200 gal Diesel (6.9 MPG) | 1,380 mi |
| 48' Step Deck / Single-Drop | `SD48` | Class 8 Combo | 68' x 8.5' x 13.5' | 48.0' x 8.5' x 10.0' | 80,000 lbs | 47,000 lbs | 220 gal Diesel (6.6 MPG) | 1,452 mi |
| Removable Gooseneck Lowboy | `RGN48` | Class 8 Combo | 71' x 8.5' x 13.5' | 29.0' x 8.5' x 11.5' | 105,000 lbs | 65,000 lbs | 250 gal Diesel (4.9 MPG) | 1,225 mi |
| 43' Sanitary Liquid Tanker | `TK43` | Specialized Bulk | 63' x 8.0' x 11.8' | 42.0' x 6.5' x 6.5' | 80,000 lbs | 48,000 lbs | 180 gal Diesel (6.7 MPG) | 1,206 mi |
| 42' Pneumatic Dry Hopper | `HP42` | Specialized Bulk | 62' x 8.0' x 12.5' | 41.0' x 7.2' x 8.0' | 80,000 lbs | 50,000 lbs | 180 gal Diesel (6.9 MPG) | 1,242 mi |
| 75' Multi-Level Auto Hauler | `AH75` | Specialized Bulk | 75' x 8.5' x 14.0' | 73.0' x 8.3' x 13.0' | 80,000 lbs | 40,500 lbs | 220 gal Diesel (5.8 MPG) | 1,276 mi |
| 48' Conestoga / Curtainside | `CN48` | Class 8 Combo | 68' x 8.5' x 13.5' | 47.5' x 8.3' x 8.8' | 80,000 lbs | 46,000 lbs | 200 gal Diesel (6.6 MPG) | 1,320 mi |
| 40' Intermodal Chassis | `IC40` | Class 8 Combo | 62' x 8.0' x 13.5' | 39.5' x 7.7' x 7.8' | 80,000 lbs | 52,000 lbs | 150 gal Diesel (7.1 MPG) | 1,065 mi |
| 28' Twin Pups / Doubles | `TP28` | Class 8 Combo | 75' x 8.5' x 13.5' | 55.0' x 8.3' x 9.0' | 80,000 lbs | 44,000 lbs | 180 gal Diesel (6.5 MPG) | 1,170 mi |
| 45' Timber Pole Trailer | `LG45` | Specialized Bulk | 65' x 8.5' x 13.0' | 45.0' x 8.2' x 8.5' | 80,000 lbs | 48,000 lbs | 200 gal Diesel (5.5 MPG) | 1,100 mi |
| 26' Box Truck w/ Liftgate | `BX26` | Class 6/7 Straight | 35.5' x 8.5' x 12.8' | 25.5' x 8.1' x 8.5' | 26,000 lbs | 10,200 lbs | 70 gal Diesel (9.8 MPG) | 686 mi |
| 24' Refrigerated Straight | `RS24` | Class 6/7 Straight | 33.5' x 8.5' x 12.8' | 23.5' x 7.9' x 8.0' | 26,000 lbs | 8,800 lbs | 70 gal Diesel (9.1 MPG) | 637 mi |
| 20' Stake Bed Truck | `SB20` | Class 6 Straight | 29.5' x 8.5' x 10.5' | 20.0' x 8.0' x 6.0' | 26,000 lbs | 12,500 lbs | 65 gal Diesel (10.2 MPG) | 663 mi |
| Sprinter High-Roof Van | `VN170` | Class 2b Van | 24.2' x 6.7' x 9.3' | 14.1' x 5.8' x 6.4' | 9,990 lbs | 4,140 lbs | 24.5 gal Diesel (17.5 MPG) | 428 mi |
| 16' Cutaway Step Van | `SV16` | Class 3 Van | 25.0' x 7.8' x 10.8' | 15.5' x 7.2' x 7.0' | 14,500 lbs | 5,300 lbs | 40 gal Diesel (10.5 MPG) | 420 mi |
| Dually + 30' Gooseneck | `HS30` | Class 3 Hotshot | 52.0' x 8.5' x 9.5' | 30.0' x 8.5' x 8.0' | 33,000 lbs | 16,500 lbs | 50 gal Diesel (9.2 MPG) | 460 mi |
| Class 8 Electric Semi | `EV850` | EV Zero-Emission | 72' x 8.5' x 13.5' | 52.5' x 8.33' x 9.17' | 82,000 lbs | 45,000 lbs | 850 kWh Battery (0.59 mi/kWh) | 500 mi |
| Class 8 Hydrogen FCEV | `FC700` | Zero-Emission H2 | 72' x 8.5' x 13.5' | 52.5' x 8.33' x 9.17' | 82,000 lbs | 47,500 lbs | 68 kg H2 (7.3 mi/kg) | 500 mi |

## 3. Packaging & Container Taxonomy (23 Assets)

The packaging catalog covers intermodal containers (20ft ISO Dry, 40ft ISO Dry, 40ft High Cube, 20ft ISO Tank, 40ft Flat Rack), logistics pallets (Standard GMA 48"x40", Euro EUR-1 1200x800mm, Industrial EUR-2 1200x1000mm, Chemical Drum Spill Pallet 48x48, Half-Pallet Retail Display 24x40), corrugated cartons (Small Parcel 12x10x8, Medium Shipping 18x14x12, Large Master Carton 24x18x18, Heavy-Duty Double Wall 30x24x20, Gaylord Bulk Bin 48x40x36), and bulk industrial units (55-Gallon Steel Drum, 55-Gallon Polyethylene Drum, 275-Gallon Caged IBC Tote, Heavy Machinery Skid Crate, Cold-Rolled Steel Master Coil, Industrial Gas Cylinder 12-Pack Manifold, Super Sack FIBC Bulk Bag).

## 4. Architecture & Engineering Formulas

### Spatial Fitting
$$\text{FloorUnits}_1 = \lfloor \frac{W_{\text{cavity}}}{W_{\text{unit}}} \rfloor \times \lfloor \frac{L_{\text{cavity}}}{L_{\text{unit}}} \rfloor$$
$$\text{FloorUnits}_2 = \lfloor \frac{W_{\text{cavity}}}{L_{\text{unit}}} \rfloor \times \lfloor \frac{L_{\text{cavity}}}{W_{\text{unit}}} \rfloor$$
$$\text{Tiers} = \max\left(1, \min\left(\text{StackLimit}_{\text{pkg}}, \lfloor \frac{H_{\text{cavity}}}{H_{\text{unit}}} \rfloor\right)\right)$$
$$\text{MaxUnitsByWeight} = \lfloor \frac{\text{Payload}_{\max}}{\text{Weight}_{\text{unit}}} \rfloor$$

### Temporal Fuel Burn & Aerodynamic Drag
$$\text{PayloadRatio} = \min\left(1.0, \frac{\text{LoadedWeight}}{\text{Payload}_{\max}}\right)$$
$$\text{BaseMPG} = \text{MPG}_{\text{empty}} - (\text{MPG}_{\text{empty}} - \text{MPG}_{\text{loaded}}) \times \text{PayloadRatio}$$
$$\text{DragFactor} = 1.0 + \max(0, \text{Speed}_{\text{mph}} - 60) \times 0.012$$
$$\text{EffectiveMPG} = \frac{\text{BaseMPG}}{\text{DragFactor}}$$
$$\text{FuelBurned} = \frac{\text{Distance}_{\text{miles}}}{\text{EffectiveMPG}}$$

### Dynamic CG & Multi-Stop Sequential Unload
$$\text{CG}_{\text{kingpin}} = \frac{\sum (W_i \times \text{Dist}_i)}{\sum W_i}$$
$$\text{Weight}_{\text{trailer\_tandem}} = \text{Tare}_{\text{trailer}} + W_{\text{cargo}} \times \frac{\text{CG}_{\text{kingpin}}}{\text{Bogie}_{\text{span}}}$$
$$\text{Weight}_{\text{drive\_tandem}} = \text{Tare}_{\text{drive}} + (W_{\text{cargo}} - \text{Weight}_{\text{trailer\_tandem\_cargo}}) \times 0.95$$
$$\text{Weight}_{\text{steer}} = \text{Tare}_{\text{steer}} + (W_{\text{cargo}} - \text{Weight}_{\text{trailer\_tandem\_cargo}}) \times 0.05$$

### Multi-Vehicle Fleet Splitter Heuristic
Partitions manifests exceeding 45,000 lbs or 26 GMA pallets into combinations from the vehicle catalog using First-Fit Decreasing and greedy right-sizing, generating deep links into Product 01.

## 5. Testing & Verification

```bash
npm test
```

Vitest executes 9 test files (66 tests) covering vehicle catalog completeness, package shapes, spatial clearance, temporal dynamics, cross-project bridges, multi-stop CG shifts, GLEC emissions, aero modeling, trailer IoT sensors, and fleet partitioning.
