/**
 * Isolated synthetic visual studies. No product engine, store, or operational rule
 * is imported. Physical fixtures use metres, X length, Y up, Z width. Semantic
 * diagrams declare their own scale through anchors and summary.fixtureMetrics.
 */
const C = Object.freeze({
  paper: '#ffffff', ground: '#edf1f5', edge: '#d3dce6', ink: '#203248',
  slate: '#8093a8', pale: '#b9c7d7', blue: '#2466dc', blueLight: '#77a2e5',
  orange: '#f27a35', orangeLight: '#ffd4b6', green: '#348b78', wood: '#c4a47e',
  rubber: '#26313d', silver: '#cbd4dd', red: '#c95048', cyan: '#5aadc6',
});

export function buildStudy(THREE, c, { mode = 'dimensions', phase = 1, explode = 0, fixture = {} } = {}) {
  const root = new THREE.Group();
  root.name = `${c.id} ${c.title}`;
  root.userData = { entityId: c.id, caseId: c.id, synthetic: true, family: c.family, focus: c.focus, inspectable: false };
  const anchors = [], objects = [], fixtureMetrics = [];
  const materials = new Map();
  const t = Math.max(0, Math.min(1, Number(phase) || 0));
  const ex = Math.max(0, Math.min(1, Number(explode) || 0));
  let serial = 0;
  function material(color, o = {}) {
    const opacity = o.opacity ?? 1;
    const key = [color, opacity, o.metalness ?? .06, o.roughness ?? .66, o.wireframe ?? false].join(':');
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({
      color, roughness: o.roughness ?? .66, metalness: o.metalness ?? .06,
      transparent: opacity < 1, opacity, depthWrite: opacity >= .5,
      wireframe: o.wireframe ?? false, side: THREE.DoubleSide,
    }));
    return materials.get(key);
  }
  function tag(obj, name, parent = root) {
    obj.name = name;
    const label = name.replace(/[-_:]+/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
    obj.userData = {
      entityId: `${c.id}:${name}`, instanceId: `${c.id}:${name}:${serial++}`, caseId: c.id,
      synthetic: true, inspectable: obj.isGroup === true, label,
      description: `${label}. Synthetic visual fixture for ${c.title}. ${c.intent}`,
    };
    parent.add(obj); objects.push(obj); return obj;
  }
  function group(name, p = [0, 0, 0], parent = root) {
    const g = tag(new THREE.Group(), name, parent); g.position.set(...p); return g;
  }
  function mesh(geo, name, p, color = C.blue, o = {}, parent = root) {
    const m = tag(new THREE.Mesh(geo, material(color, o)), name, parent);
    m.position.set(...p); m.castShadow = o.shadow !== false; m.receiveShadow = true;
    m.userData.cameraRelevant = !/^study-plinth:|^grid:|:line$|:tick[0-9]+$|:shaft$|:tip$/.test(name);
    m.userData.ownerEntityId = parent.userData.inspectable ? parent.userData.entityId : null;
    if (o.rotation) m.rotation.set(...o.rotation);
    return m;
  }
  function box(name, dims, p, color = C.blue, o = {}, parent = root) {
    return mesh(new THREE.BoxGeometry(...dims), name, p, color, o, parent);
  }
  function rounded(name, dims, p, color = C.blue, o = {}, parent = root) {
    const [w, h, d] = dims, r = Math.min(.06, w / 8, h / 8, d / 8);
    const a = w / 2 - r, b = h / 2 - r;
    const s = new THREE.Shape();
    s.moveTo(-a + r, -b); s.lineTo(a - r, -b); s.quadraticCurveTo(a, -b, a, -b + r);
    s.lineTo(a, b - r); s.quadraticCurveTo(a, b, a - r, b); s.lineTo(-a + r, b);
    s.quadraticCurveTo(-a, b, -a, b - r); s.lineTo(-a, -b + r); s.quadraticCurveTo(-a, -b, -a + r, -b);
    const geo = new THREE.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 2, steps: 1, curveSegments: 3 });
    geo.center(); return mesh(geo, name, p, color, o, parent);
  }
  function cylinder(name, radius, height, p, color = C.slate, o = {}, parent = root) {
    return mesh(new THREE.CylinderGeometry(radius, radius, height, o.segments ?? 24), name, p, color, o, parent);
  }
  function sphere(name, radius, p, color = C.blue, o = {}, parent = root) {
    return mesh(new THREE.SphereGeometry(radius, 18, 12), name, p, color, o, parent);
  }
  function segment(name, a, b, color = C.slate, radius = .018, parent = root) {
    const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), v = bv.clone().sub(av);
    const m = cylinder(name, radius, Math.max(v.length(), .001), av.add(bv).multiplyScalar(.5).toArray(), color, { segments: 8 }, parent);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); return m;
  }
  function arrow(name, a, b, color = C.orange, parent = root, size = .2) {
    const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), v = bv.clone().sub(av), len = v.length();
    if (len < .01) return;
    v.normalize(); const tipBase = bv.clone().addScaledVector(v, -size * .6);
    segment(`${name}:shaft`, a, tipBase.toArray(), color, size * .13, parent);
    const tip = mesh(new THREE.ConeGeometry(size * .5, size, 12), `${name}:tip`, tipBase.toArray(), color, {}, parent);
    tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
  }
  function dashed(name, a, b, color = C.orange, parent = root) {
    const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b);
    const n = Math.max(3, Math.ceil(av.distanceTo(bv) / .28));
    for (let i = 0; i < n; i += 2) segment(`${name}:${i}`, av.clone().lerp(bv, i / n).toArray(), av.clone().lerp(bv, Math.min(1, (i + 1) / n)).toArray(), color, .012, parent);
  }
  function outline(name, dims, p, color = C.blue, parent = root) {
    const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(...dims));
    const line = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: .65 }));
    tag(line, name, parent); line.position.set(...p); line.userData.cameraRelevant = false; return line;
  }
  function anchor(text, p, kind = 'info') {
    anchors.push({ position: [...p], text, kind, entityId: `${c.id}:annotation:${anchors.length}` });
  }
  function note(index, p, detail = '', kind = 'info') {
    anchor(`${c.labels?.[index] ?? c.title}${detail ? `\n${detail}` : ''}`, p, kind);
  }
  function measure(name, a, b, label, parent = root) {
    segment(`${name}:line`, a, b, C.slate, .009, parent);
    const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), v = bv.clone().sub(av).normalize();
    let tick = new THREE.Vector3(0, 1, 0);
    if (Math.abs(v.y) > .8) tick.set(1, 0, 0);
    tick.multiplyScalar(.1);
    for (const [i, p] of [av, bv].entries()) segment(`${name}:tick${i}`, p.clone().sub(tick).toArray(), p.clone().add(tick).toArray(), C.slate, .009, parent);
    anchor(label, av.add(bv).multiplyScalar(.5).toArray(), 'dimension');
  }
  function platform(w = 18, d = 10, p = [0, -.16, 0], grid = true, parent = root) {
    rounded(`study-plinth:${serial++}`, [w, .3, d], p, C.paper, {}, parent);
    if (grid) {
      const step = w > 20 ? 2 : 1;
      for (let x = -w / 2 + step; x < w / 2; x += step) segment(`grid:x${serial++}`, [p[0] + x, p[1] + .153, p[2] - d / 2 + .18], [p[0] + x, p[1] + .153, p[2] + d / 2 - .18], C.edge, .004, parent);
      for (let z = -d / 2 + step; z < d / 2; z += step) segment(`grid:z${serial++}`, [p[0] - w / 2 + .18, p[1] + .153, p[2] + z], [p[0] + w / 2 - .18, p[1] + .153, p[2] + z], C.edge, .004, parent);
    }
  }
  function ring(name, radius, p, color = C.blue, parent = root, thickness = .025) {
    const m = mesh(new THREE.TorusGeometry(radius, thickness, 6, 64), name, p, color, {}, parent); m.rotation.x = Math.PI / 2; return m;
  }
  function cone(name, p, parent = root) {
    box(`${name}:foot`, [.35, .05, .35], [p[0], p[1] + .025, p[2]], C.ink, {}, parent);
    mesh(new THREE.ConeGeometry(.14, .45, 12), name, [p[0], p[1] + .25, p[2]], C.orange, {}, parent);
    cylinder(`${name}:stripe`, .075, .06, [p[0], p[1] + .3, p[2]], C.paper, {}, parent);
  }
  function pallet(name, p, o = {}, parent = root) {
    const g = group(name, p, parent), [l, h, w] = o.dims ?? [1.2, 1.3, .8];
    const color = o.color ?? (/^(mass|weight)$/.test(mode) ? C.orange : o.selected ? C.blue : C.blueLight), opacity = o.opacity ?? 1;
    for (const z of [-w * .36, 0, w * .36]) box(`${name}:runner${z}`, [l, .09, .08], [0, .045, z], C.wood, { opacity }, g);
    for (let i = 0; i < 5; i++) box(`${name}:deck${i}`, [.15, .055, w], [-l / 2 + .09 + i * (l - .18) / 4, .12, 0], C.wood, { opacity }, g);
    const cargoH = Math.max(.05, h - .15);
    if (o.cartons) {
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) {
        box(`${name}:carton${i}${j}${k}`, [l / 2 - .035, cargoH / 2 - .018, w / 2 - .035], [(i - .5) * l / 2, .15 + (j + .5) * cargoH / 2, (k - .5) * w / 2], color, { opacity }, g);
      }
    } else rounded(`${name}:load`, [l - .03, cargoH, w - .03], [0, .15 + cargoH / 2, 0], color, { opacity }, g);
    for (const x of [-l * .3, l * .3]) {
      box(`${name}:band-top${x}`, [.035, .016, w - .015], [x, h - .008, 0], C.paper, { opacity }, g);
      box(`${name}:band-side${x}`, [.035, cargoH, .013], [x, .15 + cargoH / 2, w / 2 - .007], C.paper, { opacity }, g);
    }
    box(`${name}:identity`, [.27, .14, .018], [l * .18, .55, w / 2 + .004], C.paper, { opacity }, g);
    for (let i = 0; i < 8; i++) box(`${name}:barcode${i}`, [.009 + (i % 3) * .003, .08, .009], [l * .18 - .1 + i * .026, .55, w / 2 + .016], C.ink, { opacity }, g);
    if (o.selected) outline(`${name}:selection`, [l + .08, h + .06, w + .08], [0, h / 2, 0], C.blue, g);
    for (let y = .22; y < h; y += .105) {
      box(`${name}:wrap-front${y}`, [l - .025, .006, .006], [0, y, w / 2 - .006], C.blueLight, { opacity: opacity * .5, shadow: false }, g);
      box(`${name}:wrap-end${y}`, [.006, .006, w - .025], [l / 2 - .006, y, 0], C.paper, { opacity: opacity * .35, shadow: false }, g);
    }
    g.userData.label = name.replace(/[-_:]+/g, ' ');
    g.userData.description = `Synthetic handling unit. ${l.toFixed(4)} m length × ${w.toFixed(4)} m width × ${h.toFixed(4)} m height; ${(l * w * h).toFixed(3)} m³ bounds. Packing orientation is explicit.`;
    return g;
  }
  function crate(name, p, dims = [1.4, 1.2, 1.1], color = C.wood, parent = root) {
    const [l, h, w] = dims, g = group(name, p, parent);
    box(`${name}:body`, [l, h, w], [0, h / 2, 0], color, {}, g);
    for (const x of [-l / 2 + .05, 0, l / 2 - .05]) box(`${name}:brace${x}`, [.08, h, .04], [x, h / 2, w / 2 + .025], C.silver, {}, g);
    segment(`${name}:diagonal`, [-l / 2, .08, w / 2 + .05], [l / 2, h - .08, w / 2 + .05], C.silver, .025, g);
    return g;
  }
  function drum(name, p, color = C.blue, parent = root) {
    const g = group(name, p, parent);
    cylinder(`${name}:body`, .29, .9, [0, .45, 0], color, {}, g);
    for (const y of [.05, .28, .62, .86]) mesh(new THREE.TorusGeometry(.294, .018, 6, 24), `${name}:hoop${y}`, [0, y, 0], C.silver, { rotation: [Math.PI / 2, 0, 0] }, g);
    cylinder(`${name}:lid`, .27, .025, [0, .91, 0], C.silver, {}, g);
    box(`${name}:hazard`, [.2, .2, .01], [0, .48, .293], C.paper, { rotation: [0, 0, Math.PI / 4] }, g); return g;
  }
  function container(name, p = [0, 0, 0], o = {}, parent = root) {
    const g = group(name, p, parent), [l, h, w] = o.dims ?? [16, 2.7, 2.45];
    const color = o.color ?? C.pale, cut = o.cutaway !== false;
    if (o.trailer) g.position.y += 1.1;
    box(`${name}:floor`, [l + .08, .105, w + .08], [0, .0525, 0], C.slate, {}, g);
    for (let z = -w / 2 + .065; z < w / 2; z += .13) box(`${name}:floorboard${z.toFixed(2)}`, [l - .03, .015, .119], [0, .1125, z], '#b5ad9f', {}, g);
    box(`${name}:far-wall`, [l + .08, h, .065], [0, h / 2 + .12, -w / 2 - .033], color, { opacity: o.ghost ? .12 : .95 }, g);
    box(`${name}:nose`, [.065, h, w], [-l / 2 - .033, h / 2 + .12, 0], color, { opacity: .65 }, g);
    if (!cut) {
      box(`${name}:near-wall`, [l + .08, h, .065], [0, h / 2 + .12, w / 2 + .033], color, { opacity: .2 }, g);
      box(`${name}:roof`, [l + .08, .065, w], [0, h + .152, 0], color, { opacity: .18 }, g);
    }
    for (const z of [-w / 2, w / 2]) {
      segment(`${name}:roof-edge${z}`, [-l / 2, h + .12, z], [l / 2, h + .12, z], C.slate, .035, g);
      segment(`${name}:door-post${z}`, [l / 2, .12, z], [l / 2, h + .12, z], C.blue, .045, g);
    }
    for (let x = -l / 2 + .35; x < l / 2; x += .65) segment(`${name}:corrugation${x}`, [x, .22, -w / 2 - .068], [x, h + .03, -w / 2 - .068], C.silver, .018, g);
    for (let x = -l / 2 + .06; x < l / 2; x += .24) {
      for (const y of [.22, h + .03]) sphere(`${name}:wall-rivet${x}:${y}`, .014, [x, y, -w / 2 + .008], C.slate, { shadow: false }, g);
    }
    for (const y of [.34, 1.15, 1.98]) segment(`${name}:logistics-rail${y}`, [-l / 2 + .1, y, -w / 2 + .022], [l / 2 - .1, y, -w / 2 + .022], C.slate, .016, g);
    segment(`${name}:door-lintel`, [l / 2, h + .12, -w / 2], [l / 2, h + .12, w / 2], C.blue, .045, g);
    if (o.trailer) {
      for (const z of [-.78, .78]) box(`${name}:chassis${z}`, [l - .3, .22, .13], [0, -.2, z], C.ink, {}, g);
      for (let x = -l / 2; x <= l / 2; x += .6) box(`${name}:crossmember${x}`, [.065, .12, w], [x, -.08, 0], C.slate, {}, g);
      for (const x of [l / 2 - 2.4, l / 2 - 1.1]) for (const z of [-1.15, 1.15]) wheel(`${name}:wheel${x}:${z}`, x, -.59, z, g, .5);
      for (const z of [-.82, .82]) { box(`${name}:landing-leg${z}`, [.15, .85, .15], [-l / 2 + 2.2, -.6, z], C.slate, {}, g); box(`${name}:landing-foot${z}`, [.4, .06, .32], [-l / 2 + 2.2, -1.02, z], C.ink, {}, g); }
      box(`${name}:rear-bumper`, [.22, .18, w], [l / 2 + .15, -.78, 0], C.silver, {}, g);
      for (const z of [-1.0, -.72, .72, 1]) cylinder(`${name}:rear-lamp${z}`, .075, .05, [l / 2 + .29, -.28, z], Math.abs(z) > .9 ? C.red : C.orange, { rotation: [0, 0, Math.PI / 2] }, g);
      for (let x = -l / 2; x < l / 2; x += .65) box(`${name}:reflector${x}`, [.3, .065, .018], [x, -.04, w / 2 + .05], Math.round((x + l / 2) / .65) % 2 ? C.paper : C.red, {}, g);
    }
    g.userData.dimensions = { lengthM: l, heightM: h, widthM: w, interiorM3: l * h * w };
    g.userData.label = 'Measured trailer interior';
    g.userData.description = `Synthetic interior: ${l.toFixed(2)} × ${w.toFixed(2)} × ${h.toFixed(2)} m; ${(l * h * w).toFixed(2)} m³. Shell and floor sit outside the usable bounds.`;
    return g;
  }
  function cargoGrid(parent, rows = 9, cols = 2, tiers = 1, o = {}) {
    const l = 1.2, w = .8, h = 1.3, start = o.start ?? [-6.8, .12, -.45];
    let count = 0;
    for (let level = 0; level < tiers; level++) for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
      const i = count++, visible = !o.sequence || i / Math.max(1, rows * cols * tiers - 1) <= t;
      if (!visible) continue;
      pallet(`HU-${String(i + 1).padStart(2, '0')}`, [start[0] + row * 1.28, start[1] + level * h + ex * level * .8, start[2] + col * .86], { color: o.colors ? o.colors[i % o.colors.length] : undefined, cartons: i % 4 === 1, selected: i === 0 }, parent);
    }
    return { count, volumeM3: count * l * w * h };
  }
  function wheel(name, x, y, z, parent, radius = .48) {
    cylinder(`${name}:tire`, radius, .28, [x, y, z], C.rubber, { rotation: [Math.PI / 2, 0, 0] }, parent);
    cylinder(`${name}:hub`, radius * .57, .292, [x, y, z], C.silver, { rotation: [Math.PI / 2, 0, 0], metalness: .7, roughness: .3 }, parent);
    cylinder(`${name}:center`, radius * .18, .31, [x, y, z], C.slate, { rotation: [Math.PI / 2, 0, 0] }, parent);
  }
  function truck(name, p = [0, 0, 0], o = {}, parent = root) {
    const g = group(name, p, parent), s = o.scale ?? 1; g.scale.setScalar(s);
    const length = o.length ?? 16, boxCenter = 2.5, front = boxCenter - length / 2, rear = boxCenter + length / 2;
    if (o.tractor !== false) {
      rounded(`${name}:cab`, [2.7, 2.45, 2.42], [front - 2.7, 2.05, 0], o.color ?? C.blue, {}, g);
      rounded(`${name}:hood`, [1.5, 1.15, 2.18], [front - 4.4, 1.65, 0], o.color ?? C.blue, {}, g);
      box(`${name}:windshield`, [.025, .85, 2.05], [front - 4.06, 2.75, 0], C.ink, {}, g);
      for (const z of [-1.221, 1.221]) box(`${name}:window${z}`, [1.15, .84, .025], [front - 2.7, 2.65, z], C.ink, {}, g);
      box(`${name}:grille`, [.04, .6, 1.7], [front - 5.17, 1.5, 0], C.silver, {}, g);
      for (let i = 0; i < 8; i++) box(`${name}:grille-slot${i}`, [.05, .5, .07], [front - 5.2, 1.5, -.72 + i * .205], C.slate, {}, g);
      box(`${name}:bumper`, [.25, .3, 2.5], [front - 5.2, .91, 0], C.silver, { metalness: .6 }, g);
      for (const z of [-.86, .86]) box(`${name}:headlamp${z}`, [.055, .2, .42], [front - 5.18, 1.45, z], C.paper, {}, g);
      for (const z of [-1.34, 1.34]) {
        segment(`${name}:mirror-arm${z}`, [front - 3.6, 2.5, Math.sign(z) * 1.2], [front - 3.75, 2.5, z + Math.sign(z) * .12], C.silver, .025, g);
        rounded(`${name}:mirror${z}`, [.18, .4, .14], [front - 3.75, 2.5, z + Math.sign(z) * .12], C.ink, {}, g);
        cylinder(`${name}:fuel-tank${z}`, .38, 1.6, [front - 1.5, 1, z * .72], C.silver, { rotation: [0, 0, Math.PI / 2], metalness: .65 }, g);
      }
      box(`${name}:tractor-frame`, [5.7, .24, 1.35], [front - 2.2, .67, 0], C.ink, {}, g);
      for (const ax of [front - 4.2, front - .9, front + .25]) for (const z of [-1.11, 1.11]) wheel(`${name}:tractor-wheel${ax}${z}`, ax, .5, z, g);
    }
    const body = group(`${name}:trailer`, [boxCenter, 1.12, 0], g);
    container(`${name}:cavity`, [0, 0, 0], { dims: [length, o.height ?? 2.7, 2.45], cutaway: o.cutaway ?? true, color: o.bodyColor ?? C.pale }, body);
    if (o.flatbed) {
      for (const child of [...body.children]) {
        if (child.name.endsWith(':cavity')) for (const part of child.children) if (!part.name.includes('floor')) part.visible = false;
      }
    }
    for (const ax of [rear - 2.1 + (o.slider ?? 0), rear - .85 + (o.slider ?? 0)]) for (const z of [-1.15, 1.15]) wheel(`${name}:trailer-wheel${ax}${z}`, ax, .5, z, g);
    for (const z of [-.85, .85]) box(`${name}:landing-leg${z}`, [.16, .75, .16], [front + 1.3, .68, z], C.slate, {}, g);
    if (o.reefer) {
      rounded(`${name}:reefer`, [.6, 1.7, 1.8], [front - .34, 2.7, 0], C.paper, {}, g);
      for (const z of [-.43, .43]) cylinder(`${name}:fan${z}`, .3, .04, [front - .66, 2.85, z], C.slate, { rotation: [0, 0, Math.PI / 2] }, g);
    }
    g.userData.dimensions = { interiorLengthM: length, interiorWidthM: 2.45, interiorHeightM: o.height ?? 2.7 };
    return { group: g, body, front, rear, scale: s, p };
  }
  function smallTruck(name, p, yaw = 0, color = C.blue, parent = root) {
    const g = group(name, p, parent); g.rotation.y = yaw;
    rounded(`${name}:box`, [1.5, .65, .65], [.2, .65, 0], C.pale, {}, g);
    rounded(`${name}:cab`, [.55, .62, .65], [-.9, .55, 0], color, {}, g);
    box(`${name}:glass`, [.025, .25, .52], [-1.19, .7, 0], C.ink, {}, g);
    for (const x of [-.88, .62]) for (const z of [-.33, .33]) wheel(`${name}:${x}${z}`, x, .18, z, g, .18);
    return g;
  }
  function forklift(name, p, parent = root) {
    const g = group(name, p, parent);
    rounded(`${name}:chassis`, [1.6, .65, .95], [0, .52, 0], C.orange, {}, g);
    rounded(`${name}:rear`, [.5, .9, 1], [-.65, .85, 0], C.orange, {}, g);
    for (const z of [-.38, .38]) {
      box(`${name}:guard${z}`, [.07, 1.6, .07], [0, 1.5, z], C.ink, {}, g);
      box(`${name}:mast${z}`, [.12, 2.5, .12], [.87, 1.35, z], C.ink, {}, g);
      box(`${name}:tine${z}`, [1.25, .06, .12], [1.4, .22, z], C.silver, {}, g);
      for (const x of [-.6, .55]) wheel(`${name}:wheel${z}${x}`, x, .25, z * 1.25, g, .25);
    }
    box(`${name}:roof`, [1.15, .08, .98], [0, 2.35, 0], C.ink, {}, g);
    rounded(`${name}:seat`, [.48, .18, .52], [-.1, 1.03, 0], C.ink, {}, g); return g;
  }
  function rack(name, p, o = {}, parent = root) {
    const g = group(name, p, parent), bays = o.bays ?? 4, levels = o.levels ?? 3, bayW = 2.6, depth = 1.2;
    const left = -bays * bayW / 2, height = levels * 1.6 + .25;
    for (let i = 0; i <= bays; i++) for (const z of [-depth / 2, depth / 2]) box(`${name}:upright${i}${z}`, [.1, height, .1], [left + i * bayW, height / 2, z], C.blue, {}, g);
    for (let level = 0; level < levels; level++) {
      const y = .22 + level * 1.6;
      for (let b = 0; b < bays; b++) {
        for (const z of [-depth / 2, depth / 2]) box(`${name}:beam${b}${level}${z}`, [bayW - .08, .13, .09], [left + (b + .5) * bayW, y, z], C.orange, {}, g);
        box(`${name}:shelf${b}${level}`, [bayW - .12, .04, depth], [left + (b + .5) * bayW, y + .08, 0], C.silver, {}, g);
        for (let slot = 0; slot < 2; slot++) {
          const index = level * bays * 2 + b * 2 + slot;
          if (o.empty || (o.occupancy !== 1 && index % 5 === 3)) continue;
          pallet(`${name}:B${b + 1}-L${level + 1}-${slot ? 'B' : 'A'}`, [left + b * bayW + .65 + slot * 1.3, y + .1, 0], { color: index === (o.selected ?? 4) ? C.blue : (level === 2 ? C.pale : C.blueLight), selected: index === (o.selected ?? 4) }, g);
        }
      }
    }
    return g;
  }
  function dock(name, p, o = {}, parent = root) {
    const g = group(name, p, parent), w = 3.2, h = 3.8;
    for (const x of [-w / 2, w / 2]) box(`${name}:post${x}`, [.18, h, .25], [x, h / 2, 0], C.slate, {}, g);
    box(`${name}:lintel`, [w + .18, .2, .25], [0, h, 0], C.slate, {}, g);
    if (!o.open) for (let i = 0; i < 12; i++) box(`${name}:door${i}`, [w - .2, .27, .09], [0, .2 + i * .29, -.02], C.pale, {}, g);
    box(`${name}:leveler`, [2.5, .08, 1.8], [0, .04, .9], C.ink, {}, g);
    for (const x of [-1.4, 1.4]) cylinder(`${name}:bollard${x}`, .095, .9, [x, .45, 1.05], C.orange, {}, g);
    if (o.selected) outline(`${name}:selected`, [3.6, 4.2, .4], [0, 2.05, 0], C.blue, g);
    return g;
  }
  function curve(name, pts, color = C.blue, radius = .085, parent = root) {
    const q = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
    mesh(new THREE.TubeGeometry(q, 80, radius, 7, false), name, [0, 0, 0], color, {}, parent); return q;
  }
  function card(name, p, color = C.paper, parent = root, o = {}) {
    const g = group(name, p, parent); g.rotation.y = o.yaw ?? -.12;
    rounded(`${name}:paper`, [2.5, .09, 3.2], [0, 0, 0], color, {}, g);
    box(`${name}:header`, [1.9, .018, .17], [-.04, .058, -1.13], o.accent ?? C.blue, {}, g);
    for (let j = 0; j < 5; j++) box(`${name}:text${j}`, [j % 2 ? 1.48 : 1.86, .012, .04], [-.05, .058, -.65 + j * .3], C.slate, {}, g);
    for (let j = 0; j < 11; j++) box(`${name}:code${j}`, [.035 + (j % 3) * .012, .014, .32], [-.74 + j * .127, .061, 1.05], C.ink, {}, g);
    return g;
  }
  function bar(name, value, unit, p, scale, color = C.blue, o = {}) {
    const h = Math.abs(value) / scale, g = group(name, p);
    if (h > 0) rounded(`${name}:column`, [o.width ?? 1.25, h, o.depth ?? 1.25], [0, h / 2, 0], color, {}, g);
    else outline(`${name}:zero-marker`, [o.width ?? 1.25, .012, o.depth ?? 1.25], [0, .006, 0], color, g);
    for (let y = 1; y < h; y++) box(`${name}:tick${y}`, [(o.width ?? 1.25) + .01, .018, (o.depth ?? 1.25) + .01], [0, y, 0], C.paper, {}, g);
    anchor(`${name}\n${value.toLocaleString('en-US')} ${unit}`, [p[0], p[1] + h + .28, p[2]], o.kind ?? 'metric');
    return { group: g, height: h };
  }
  function addMetric(label, value, unit) { fixtureMetrics.push({ label, value, unit }); }
  function beacon(name, p, color = C.blue, height = 1.4, parent = root) {
    cylinder(`${name}:stem`, .025, height, [p[0], p[1] + height / 2, p[2]], color, {}, parent);
    sphere(`${name}:head`, .15, [p[0], p[1] + height, p[2]], color, {}, parent);
    ring(`${name}:foot`, .35, [p[0], p[1] + .025, p[2]], color, parent);
  }

  function buildCargo() {
    const f = c.focus;
    if (f === 'mixed_manifest_fit' || f === 'master_manifest_dimensional_view') {
      platform(20, 8); const g = container('trailer-interior', [0, 0, 0], { trailer: true });
      for (let i = 0; i < 12; i++) pallet(`HU-${String(i + 1).padStart(2, '0')}`, [-6.8 + Math.floor(i / 2) * 1.32, .12, (i % 2 ? .44 : -.44)], { cartons: i % 3 === 1, selected: i === 0 }, g);
      for (let i = 0; i < 6; i++) crate(`HU-${13 + i}`, [1.4 + Math.floor(i / 2) * 1.55, .12, (i % 2 ? .61 : -.61)], [1.4, 1.2, 1.1], i === 2 ? C.orangeLight : C.wood, g);
      measure('interior-length', [-8, .05, 2.25], [8, .05, 2.25], '16.00 m usable length');
      note(0, [-6, 4.2, -1.2], '16.00 × 2.45 × 2.70 m'); note(1, [-6.8, 2.7, .44], '1.20 × 0.80 × 1.30 m', 'selected');
      anchor('Crate HU-14\n1.40 × 1.10 × 1.20 m', [2.95, 2.65, .61]);
      note(3, [6.5, 1.4, .3], '79.78 m³ free / 75.4%\n26.06 m³ occupied / 24.6%');
      addMetric('Handling units', 18, 'count'); addMetric('Occupied cube', 26.064, 'm³'); addMetric('Usable cavity', 105.84, 'm³'); addMetric('Cube utilization', 26.064 / 105.84 * 100, '%');
    } else if (f === 'cargo_dimensions_and_weight_editor') {
      const positive = (v, fallback) => Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : fallback;
      const l = positive(fixture.lengthM, 1.2192), w = positive(fixture.widthM, 1.016), h = positive(fixture.heightM, 1.3);
      const mass = Number.isFinite(Number(fixture.massLb)) && Number(fixture.massLb) >= 0 ? Number(fixture.massLb) : 1200;
      platform(Math.max(5.5, l + 2.8), Math.max(4.8, w + 2.6));
      const hu = pallet('HU-01', [0, 0, 0], { dims: [l, h, w], selected: true }); hu.userData.massLb = mass;
      for (const p of [[-l / 2, h / 2, w / 2], [l / 2, h / 2, w / 2], [0, h, 0]]) sphere('dimension-handle', .065, p, C.orange);
      measure('length', [-l / 2, .02, w / 2 + .5], [l / 2, .02, w / 2 + .5], `LENGTH ${(l / .0254).toFixed(2)} in / ${l.toFixed(4)} m`);
      measure('width', [l / 2 + .5, .02, -w / 2], [l / 2 + .5, .02, w / 2], `WIDTH ${(w / .0254).toFixed(2)} in / ${w.toFixed(4)} m`);
      measure('height', [-l / 2 - .5, 0, 0], [-l / 2 - .5, h, 0], `HEIGHT ${h.toFixed(4)} m`);
      note(3, [0, h + .3, 0], `${mass.toLocaleString('en-US')} lb synthetic mass\n${(l * w * h).toFixed(4)} m³ exact bounds`, 'selected');
      addMetric('Length', l, 'm'); addMetric('Width', w, 'm'); addMetric('Height', h, 'm'); addMetric('Fixture mass', mass, 'lb'); addMetric('Envelope volume', l * w * h, 'm³');
    } else if (f === 'irregular_cargo_envelope') {
      platform(6, 5); const g = group('industrial-pump');
      box('machine-base', [2.4, .2, 1.6], [0, .1, 0], C.ink, {}, g);
      cylinder('motor', .52, 1.2, [-.4, .85, 0], C.blue, { rotation: [0, 0, Math.PI / 2] }, g);
      cylinder('pump', .72, .45, [.6, .84, 0], C.silver, { rotation: [0, 0, Math.PI / 2] }, g);
      cylinder('pipe', .16, 1.15, [.65, 1.55, 0], C.silver, {}, g);
      outline('conservative-envelope', [2.4, 2.2, 1.6], [0, 1.1, 0], C.orange);
      note(0, [.65, 2.35, 0], 'Conservative 2.40 × 1.60 × 2.20 m', 'selected'); note(1, [-.5, 1.4, .5], 'True mechanical silhouette');
      measure('envelope-depth', [-1.2, .02, 1.3], [1.2, .02, 1.3], 'Packing envelope ≠ solid volume'); addMetric('Bounding volume', 8.448, 'm³');
    } else if (f === 'stacking_and_support') {
      platform(7, 5); pallet('base-A', [-1.5, 0, 0]); pallet('upper-A', [-1.5, 1.3 + ex * .7, 0], { color: C.blue });
      pallet('base-B', [1.1, 0, 0]); pallet('upper-B', [1.6, 1.3 + ex * .7, 0], { color: C.orangeLight });
      box('unsupported-footprint', [.5, .025, .8], [2.45, 1.31, 0], C.orange, { opacity: .5 });
      arrow('gravity', [1.7, 3.3, 0], [1.7, 2.75, 0], C.orange);
      note(0, [-1.5, 3.1 + ex * .7, 0], 'Full footprint support'); note(1, [2.2, 1.6, .5], '0.50 m overhang', 'warning');
      measure('support', [1.7, 1.32, .8], [2.2, 1.32, .8], 'Unsupported edge');
      segment('no-stack-cross-A', [.65, 1.31, -.35], [1.55, 1.31, .35], C.orange, .026);
      segment('no-stack-cross-B', [.65, 1.31, .35], [1.55, 1.31, -.35], C.orange, .026);
      note(2, [1.1, .7, .8], 'No-stack fixture / conflicting upper unit', 'warning');
    } else if (f === 'door_passage_and_maneuver') {
      platform(10, 6); dock('door-aperture', [2.5, 0, 0], { open: true, selected: true }).rotation.y = Math.PI / 2;
      const load = crate('approaching-crate', [-1.8 + t, 0, 0], [2, 2.2, 3.35], C.orangeLight);
      load.rotation.y = t * Math.PI / 2;
      dashed('turn-envelope', [-2, .04, -2.4], [2.5, .04, -2.4]);
      curve('maneuver-path', [[-3, .06, 0], [-1.4, .06, 0], [.5, .06, .4], [2.6, .06, 0]], C.blue, .035);
      note(0, [2.5, 4.2, 0], '3.20 m aperture'); note(1, [-1.5, 2.7, 0], '3.35 m wide face', 'warning'); note(2, [-.4, .1, 2.3], 'Rotating envelope shown');
    } else if (f === 'manual_repack_preview' || f === 'spatial_command_preview') {
      platform(8, 5); pallet('fixed-HU-01', [-2, 0, -.6], { cartons: true }); pallet('fixed-HU-02', [0, 0, -.6]);
      pallet('previous-pose', [1.3, 0, -.6], { opacity: .2, color: C.slate });
      const g = pallet('proposed-pose', [1.3 - t * 1.3, ex * .35, 1.05], { color: C.orangeLight, selected: true }); g.rotation.y = t * Math.PI / 2;
      arrow('move-command', [1.3, .12, -.2], [0, .12, 1.1]);
      note(0, [0, 1.8, 1.05], 'Synthetic proposal only', 'selected'); note(1, [1.3, 1.6, -.6], 'Previous pose retained'); note(2, [-2, 1.6, -.6], 'Revalidation prerequisite');
    } else if (f === 'stop_sequence_accessibility') {
      platform(20, 7); const g = container('stops-cavity', [0, 0, 0], { trailer: true });
      for (let i = 0; i < 12; i++) {
        const stop = i < 4 ? 3 : i < 8 ? 2 : 1;
        if (t < .34 && stop === 1 || t < .67 && t >= .34 && stop <= 2) continue;
        pallet(`stop-${stop}:HU-${i + 1}`, [-6.7 + Math.floor(i / 2) * 1.7, .12, i % 2 ? .46 : -.46], { color: [C.orangeLight, C.blueLight, C.slate][stop - 1] }, g);
      }
      for (let i = 0; i < 3; i++) anchor(`STOP ${3 - i}\n${i === 0 ? 'Nose / last drop' : i === 1 ? 'Intermediate drop' : 'Door / first drop'}`, [-5.8 + i * 3.4, 3.5, -.2], i === 2 ? 'selected' : 'info');
      arrow('unload', [7, 1.3, 0], [9.2, 1.3, 0], C.orange); note(3, [8.4, 4.1, 0], 'Door / first drop');
    } else if (f === 'securement_arrangement') {
      platform(10, 5); box('flatbed-deck', [8, .25, 2.45], [0, .3, 0], C.slate); crate('machine-crate', [0, .43, 0], [3.2, 1.8, 1.9]);
      for (const x of [-1, 1]) for (const z of [-1.15, 1.15]) {
        segment(`tie-down${x}${z}`, [x, .45, z], [x, 2.25, Math.sign(z) * .95], C.orange, .025);
        segment(`strap-top${x}${z}`, [x, 2.25, Math.sign(z) * .95], [x, 2.25, 0], C.orange, .025);
        ring(`anchor${x}${z}`, .1, [x, .45, z], C.ink);
      }
      note(0, [0, 2.6, 0], 'Two synthetic transverse restraints'); note(1, [1, .6, 1.2], 'Anchor point geometry', 'selected'); note(2, [-2.8, .5, 0], 'No rated securement claim');
    } else if (f === 'hazardous_cargo_separation') {
      platform(10, 6); for (const x of [-2.8, 2.8]) {
        box(`segregated-zone${x}`, [2.5, .03, 2.3], [x, .02, 0], x < 0 ? C.blueLight : C.orangeLight);
        for (let i = 0; i < 4; i++) drum(`zone${x}:drum${i}`, [x + (i % 2 ? .36 : -.36), .05, i > 1 ? .36 : -.36], x < 0 ? C.blue : C.orange);
      }
      box('separation-witness', [2.9, .02, 2.7], [0, .025, 0], C.paper); dashed('separation', [-1.5, .06, 1.65], [1.5, .06, 1.65], C.orange);
      note(0, [-2.8, 1.4, 0], 'Synthetic class A'); note(1, [2.8, 1.4, 0], 'Synthetic class B'); note(2, [0, .15, 1.5], '3.00 m illustrated buffer', 'warning');
    } else if (f === 'amendment_before_and_after') {
      platform(22, 14);
      const oldMass = Number(c.metrics?.find(m => m.label === 'Old payload')?.value) || 12000;
      const newMass = Number(c.metrics?.find(m => m.label === 'New payload')?.value) || 13200;
      const previousRevision = 7, inputRevision = 8;
      for (const [i, total] of [oldMass, newMass].entries()) {
        const x = i ? 4.2 : -4.2, rev = i ? inputRevision : previousRevision, g = group(`payload-revision-${rev}`, [x, 0, -2.3]);
        g.userData = { ...g.userData, label: `Payload input revision ${rev}`, massLb: total, inputRevision: rev,
          description: `Synthetic payload ${total.toLocaleString('en-US')} lb in revision ${rev}. Four equal fixture units of ${total / 4} lb each; geometry and unit identity remain unchanged.` };
        for (let j = 0; j < 4; j++) {
          const hu = pallet(`HU-0${j + 1}`, [(j % 2 ? .75 : -.75), 0, j < 2 ? -.46 : .46], { color: i ? C.blue : C.pale, selected: i && j === 0 }, g);
          hu.userData.massLb = total / 4; hu.userData.inputRevision = rev;
        }
        anchor(`${i ? 'REVISED' : 'EARLIER'} INPUT r${rev}\n${total.toLocaleString('en-US')} lb payload\nSame four unit IDs / ${total / 4} lb each`, [x, 2.1, -2.3], i ? 'selected' : 'info');
      }
      arrow('mass-amendment', [-1.9, .5, -2.3], [1.9, .5, -2.3], C.orange, root, .3);
      const names = ['Fit result', 'Axle estimate', 'Quote', 'Receiving allocation'];
      for (let i = 0; i < 4; i++) {
        const x = -6.3 + i * 4.2, g = card(`stale-${names[i]}`, [x, .25, 3.8], C.paper, root, { accent: C.orange, yaw: 0 });
        g.userData = { ...g.userData, label: `${names[i]} is stale`, status: 'stale', resultRevision: previousRevision, inputRevision,
          description: `${names[i]} was computed from input r${previousRevision}. Current input is r${inputRevision}; the ${newMass - oldMass} lb mass amendment requires recomputation. Earlier evidence is retained.` };
        segment('stale-cross-A', [x - .95, .32, 2.5], [x + .95, .32, 5.1], C.orange, .022);
        segment('stale-cross-B', [x + .95, .32, 2.5], [x - .95, .32, 5.1], C.orange, .022);
        anchor(`${names[i]} / STALE\nResult input r${previousRevision} ≠ current r${inputRevision}`, [x, 1, 3.8], 'warning');
        dashed('amendment-dependency', [4.2, .12, -.5], [x, .12, 2.2], C.orange);
      }
      anchor(`MASS CHANGE +${(newMass - oldMass).toLocaleString('en-US')} lb\n4 dependent results need recomputation\nNo executing shipment is amended by this study`, [0, .3, 6.2], 'dimension');
      addMetric('Earlier payload', oldMass, 'lb'); addMetric('Revised payload', newMass, 'lb'); addMetric('Mass amendment', newMass - oldMass, 'lb'); addMetric('Stale downstream results', 4, 'count');
    } else if (f === 'plan_version_comparison') {
      for (const [side, z] of [['A', -2.3], ['B', 2.3]]) {
        platform(8, 3.4, [0, -.16, z]);
        for (let i = 0; i < 4; i++) {
          const x = side === 'A' ? -2.4 + i * 1.5 : -2.4 + Math.floor(i / 2) * 1.5;
          const gz = side === 'A' ? z : z + (i % 2 ? .5 : -.5);
          const a = pallet(`${side}:HU-${i + 1}`, [x, 0, gz], { color: i === 3 ? C.orangeLight : C.blueLight, selected: side === 'B' && i === 3 });
          if (side === 'B') a.rotation.y = Math.PI / 2;
        }
        anchor(`${side === 'A' ? 'BEFORE' : 'PROPOSED'}\nSame four handling units`, [2.6, .25, z], side === 'B' ? 'selected' : 'info');
      }
      note(2, [-2.3, 2.1, 2.3], 'Identity retained across revisions'); addMetric('Units per revision', 4, 'count');
    } else if (f === 'packaging_asset_twin') {
      platform(9, 5); pallet('GMA-pallet', [-2.8, 0, 0], { color: C.blueLight }); drum('steel-drum', [-.6, 0, 0]);
      const tote = group('IBC-tote', [1.4, 0, 0]); box('bottle', [1.1, 1.05, .9], [0, .65, 0], C.paper, {}, tote);
      for (let x = -.55; x <= .56; x += .275) for (const z of [-.46, .46]) segment('cage-vertical', [x, .13, z], [x, 1.23, z], C.slate, .012, tote);
      for (const y of [.15, .5, .85, 1.2]) for (const z of [-.46, .46]) segment('cage-horizontal', [-.57, y, z], [.57, y, z], C.slate, .012, tote);
      crate('wood-crate', [3.3, 0, 0], [1.4, 1.2, 1.1]);
      for (const [i, x] of [-2.8, -.6, 1.4, 3.3].entries()) note(i, [x, 1.65, 0], ['1.20 × 0.80 × 1.30 m', 'Ø0.58 × 0.90 m', '1.10 × 0.90 × 1.23 m', '1.40 × 1.10 × 1.20 m'][i]);
    } else if (f === 'nested_moveable_containers') {
      platform(11, 6); const outer = container('container-MSKU-01', [0, 0, 0], { dims: [6.058, 2.59, 2.438] });
      for (let i = 0; i < 3; i++) pallet(`contained-HU-${i + 1}`, [-1.9 + i * 1.45, .12 + ex * .8 * (i + 1), 0], { selected: i === 1 }, outer);
      outline('yard-slot-Y02', [7, .06, 3.5], [0, .02, 0]);
      note(0, [-2.7, 3, -1], 'Container is asset and storage space'); note(1, [0, 1.8 + ex * 1.6, 0], 'HU-02 → MSKU-01 → Y02', 'selected'); note(2, [2.7, .25, 1.7], 'Parent identities retained');
      addMetric('Container interior fixture', 6.058 * 2.59 * 2.438, 'm³');
    } else if (f === 'container_volume_and_mass_budget' || f === 'spatial_capacity_study') {
      platform(20, 7); const g = container('capacity-cavity', [0, 0, 0], { trailer: true }); const n = cargoGrid(g, 9, 3, 2, { start: [-6.9, .12, -.8], colors: /^(mass|weight)$/.test(mode) ? [C.orangeLight, C.orange, C.wood] : [C.blueLight, C.blue, C.pale] });
      note(0, [-4, 4.5 + ex * .8, -.5], '54 × 1.20 × 0.80 × 1.30 m'); note(1, [6.5, 2.6, 0], `${/^(mass|weight)$/.test(mode) ? 'Weight' : 'Volume'} overlay / synthetic fixture`, 'selected');
      measure('cavity-width', [8.6, .1, -1.225], [8.6, .1, 1.225], '2.45 m'); addMetric('Units', n.count, 'count'); addMetric('Occupied cube', n.volumeM3, 'm³'); addMetric('Cube utilization', n.volumeM3 / 105.84 * 100, '%');
    } else if (f === 'thermal_mass_volume_layer_composition') {
      platform(9, 6); for (const [i, x] of [-2.5, 0, 2.5].entries()) {
        pallet(['thermal', 'mass', 'volume'][i], [x, 0, 0], { color: [C.cyan, C.orangeLight, C.blueLight][i], selected: i === 1 });
        if (i === 0) for (const y of [.2, .6, 1]) ring('thermal-isoline', .85, [x, y, 0], C.cyan);
        if (i === 1) arrow('mass-force', [x, 2.3, 0], [x, 1.5, 0], C.orange);
        if (i === 2) outline('volume-envelope', [1.3, 1.4, .9], [x, .7, 0]);
        note(i, [x, 2.6, 0], ['4 °C fixture', '700 lb fixture', '1.248 m³ exact bounds'][i], i === 1 ? 'selected' : 'info');
      }
    } else if (f === 'selection_focus_and_linked_details') {
      platform(8, 5); for (let i = 0; i < 5; i++) pallet(`HU-0${i + 1}`, [-2.8 + i * 1.4, 0, i % 2 ? .7 : -.5], { color: i === 2 ? C.blue : C.pale, selected: i === 2 });
      note(0, [0, 1.9, -.5], 'HU-03 / selected identity', 'selected');
      segment('linked-detail-leader', [.1, 1.5, -.2], [2.5, 2.6, 1.7], C.blue, .012); note(1, [2.5, 2.6, 1.7], '1.20 × 0.80 × 1.30 m');
    } else {
      platform(8, 5); pallet('primary-cargo', [-1, 0, 0], { selected: true, cartons: true }); crate('secondary-cargo', [1.4, 0, 0]);
      note(0, [-1, 1.8, 0], c.intent, 'selected'); note(1, [1.4, 1.6, 0], 'Synthetic fixture');
    }
  }

  function buildVehicle() {
    const f = c.focus;
    if (f === 'dimension_tuner') {
      const positive = (v, fallback) => Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : fallback;
      const l = positive(fixture.lengthM, 16), w = positive(fixture.widthM, 2.45), h = positive(fixture.heightM, 2.7), wb = positive(fixture.wheelbaseM, 6.1);
      const mass = Number.isFinite(Number(fixture.massLb)) && Number(fixture.massLb) >= 0 ? Number(fixture.massLb) : 18000;
      platform(l + 10, Math.max(9, w + 5));
      const g = group('dimension-tuner-asset');
      g.userData = { ...g.userData, label: 'Parameterized equipment fixture', lengthM: l, widthM: w, bodyHeightM: h, wheelbaseM: wb, massLb: mass,
        description: `Editable synthetic body ${l} × ${w} × ${h} m, tractor steer-to-drive wheelbase ${wb} m, declared fixture mass ${mass} lb. Body height excludes the 1.20 m deck elevation. No handling units or fit result are implied.` };
      container('parameterized-body', [0, 1.08, 0], { dims: [l, h, w] }, g);
      for (const z of [-w * .32, w * .32]) box('parameterized-deck-frame', [l, .2, .13], [0, .9, z], C.ink, {}, g);
      const steer = -l / 2 - 3.7, drive = steer + wb;
      rounded('parameterized-cab', [2.7, 2.3, Math.min(w, 2.45)], [steer + .6, 2, 0], C.blue, {}, g);
      box('parameterized-cab-window', [2.1, .7, .025], [steer + .6, 2.6, Math.min(w, 2.45) / 2 + .02], C.ink, {}, g);
      box('tractor-wheelbase-frame', [wb + 1.3, .24, 1.35], [(steer + drive) / 2, .75, 0], C.ink, {}, g);
      for (const x of [steer, drive, l / 2 - 1.6, l / 2 - .5]) for (const z of [-w / 2 + .12, w / 2 - .12]) wheel(`tuner-axle-${x}-${z}`, x, .5, z, g);
      for (const p of [[steer, .5, w / 2 + .25], [drive, .5, w / 2 + .25], [l / 2, 1.2, w / 2], [l / 2, 1.2 + h, w / 2]]) sphere('live-geometric-handle', .11, p, C.orange);
      measure('live-wheelbase', [steer, .12, w / 2 + 1.35], [drive, .12, w / 2 + 1.35], `WHEELBASE ${wb.toFixed(3)} m / ${(wb / .3048).toFixed(2)} ft`);
      measure('live-deck-length', [-l / 2, .12, -w / 2 - 1.1], [l / 2, .12, -w / 2 - 1.1], `DECK LENGTH ${l.toFixed(3)} m`);
      measure('live-body-height', [l / 2 + .8, 1.2, 0], [l / 2 + .8, 1.2 + h, 0], `BODY HEIGHT ${h.toFixed(3)} m`);
      anchor(`BODY WIDTH ${w.toFixed(3)} m\nOverall ground-to-top ${(h + 1.2).toFixed(3)} m\nDeclared fixture mass ${mass.toLocaleString('en-US')} lb`, [0, h + 1.8, 0], 'selected');
      addMetric('Deck length', l, 'm'); addMetric('Body width', w, 'm'); addMetric('Body height', h, 'm'); addMetric('Tractor wheelbase', wb, 'm'); addMetric('Declared fixture mass', mass, 'lb'); return;
    }
    if (f === 'custom_asset_forge') {
      const l = 28 * .3048, w = 2.45, h = 2.7, door = 92 * .0254, tare = 7200;
      platform(14, 9); const candidate = group('custom-template-candidate');
      candidate.userData = { ...candidate.userData, label: 'Unsaved custom equipment template', status: 'candidate', lengthM: l, widthM: w, heightM: h, doorWidthM: door, tareLb: tare, payloadRatingLb: null,
        description: 'Isolated unsaved candidate: 28 ft body, 92 in door width, 7,200 lb tare. Width 2.45 m and body height 2.70 m are explicitly proposed fixture dimensions. Payload rating is undeclared. No canonical catalog asset is created.' };
      container('custom-28-foot-body', [0, .2, 0], { dims: [l, h, w] }, candidate);
      outline('candidate-boundary', [l + .65, h + .7, w + .65], [0, .32 + h / 2, 0], C.orange, candidate);
      for (const z of [-door / 2, door / 2]) segment('custom-door-width-post', [l / 2 + .08, .32, z], [l / 2 + .08, h + .25, z], C.orange, .045, candidate);
      for (const p of [[-l / 2, .32, w / 2], [l / 2, .32, w / 2], [l / 2 + .08, 1.3, door / 2]]) sphere('candidate-dimension-handle', .1, p, C.orange, {}, candidate);
      measure('candidate-body-length', [-l / 2, .08, 2.2], [l / 2, .08, 2.2], `BODY 28 ft / ${l.toFixed(4)} m`);
      measure('candidate-door-width', [l / 2 + .8, .35, -door / 2], [l / 2 + .8, .35, door / 2], `DOOR 92 in / ${door.toFixed(4)} m`);
      anchor(`UNSAVED TEMPLATE CANDIDATE\n${l.toFixed(3)} × ${w.toFixed(2)} × ${h.toFixed(2)} m proposed body`, [0, 3.65, 0], 'selected');
      anchor(`TARE ${tare.toLocaleString('en-US')} lb\nPayload rating UNDECLARED\nCube ${(l * w * h).toFixed(2)} m³ is geometric capacity only`, [-3.6, 1.2, 1.7], 'warning');
      addMetric('Body length', 28, 'ft'); addMetric('Door width', 92, 'in'); addMetric('Tare', tare, 'lb'); addMetric('Geometric cavity', l * w * h, 'm³'); addMetric('Payload rating', 'undeclared', ''); return;
    }
    if (f === 'tandem_slider_comparison') {
      platform(23, 10); container('shared-slider-body', [0, 1.08, 0]);
      for (const z of [-.8, .8]) box('shared-slider-chassis', [16, .2, .14], [0, .95, z], C.ink);
      const kingpin = -6.5, settings = [{ id: 'slider-setting-a', ft: 36, rearLb: 31200, color: C.blue, opacity: .32 }, { id: 'slider-setting-b', ft: 38, rearLb: 30300, color: C.orange, opacity: .8 }];
      beacon('shared-kingpin', [kingpin, .1, 0], C.slate, 1.1);
      for (const [i, s] of settings.entries()) {
        const distance = s.ft * .3048, x = kingpin + distance, g = group(s.id, [x, 0, 0]);
        g.userData = { ...g.userData, label: `Slider setting ${i ? 'B' : 'A'}`, distanceFt: s.ft, distanceM: distance, rearLoadLb: s.rearLb,
          description: `Synthetic comparison ${s.ft} ft kingpin-to-tandem distance, rear axle group ${s.rearLb.toLocaleString('en-US')} lb. The 900 lb transfer is a declared illustrative prediction, not a solver or certified-scale result.` };
        box(`${s.id}:bogie`, [2.1, .18, 1.9], [0, .8, 0], s.color, { opacity: s.opacity }, g);
        for (const ax of [-.55, .55]) for (const z of [-1.15, 1.15]) wheel(`${s.id}:wheel${ax}${z}`, ax, .5, z, g);
        g.traverse(o => { if (o.isMesh) o.material = material(o.name.includes('bogie') ? s.color : o.name.includes('tire') ? C.rubber : s.color, { opacity: s.opacity }); });
        outline(`${s.id}:axle-envelope`, [2.3, 1.15, 2.65], [0, .58, 0], s.color, g);
        measure(`${s.id}:distance`, [kingpin, .12, 2.1 + i * 1.1], [x, .12, 2.1 + i * 1.1], `${i ? 'B' : 'A'}: ${s.ft} ft / ${distance.toFixed(4)} m`);
        anchor(`SETTING ${i ? 'B' : 'A'} / ${s.ft} ft\nRear group ${s.rearLb.toLocaleString('en-US')} lb fixture`, [x + (i ? 1.7 : -1.7), 2.4 + i * .9, 1.3], i ? 'selected' : 'info');
      }
      const a = kingpin + 36 * .3048, b = kingpin + 38 * .3048;
      arrow('exact-slider-shift', [a, 1.5, 1.8], [b, 1.5, 1.8], C.orange, root, .15);
      anchor('2 ft / 0.6096 m slider change\nRear group −900 lb · kingpin reaction +900 lb\nSame cargo; illustrative load prediction', [0, 4.25, 0], 'dimension');
      addMetric('Setting A distance', 36, 'ft'); addMetric('Setting B distance', 38, 'ft'); addMetric('Rear group load change', -900, 'lb'); addMetric('Kingpin reaction change', 900, 'lb'); return;
    }
    if (f === 'sensor_freshness_and_dropout') {
      platform(28, 11); truck('sensor-state-equipment', [0, 0, 0], { reefer: true });
      const samples = [
        ['engine', [-8.7, 2.7, 0]], ['coolant', [-7.7, 2.2, .85]], ['fuel', [-6.9, 1.15, 1]],
        ['steer-axle', [-9.7, .65, 1.2]], ['drive-axle', [-5.4, .65, 1.2]], ['reefer-supply', [-5.9, 3.2, 0]],
      ];
      for (const [id, p] of samples) {
        const g = group(`sensor-${id}`, p); g.userData = { ...g.userData, label: `Fresh ${id} sensor`, state: 'fresh', asOf: '12:00:00 UTC', lastSample: '11:59:55 UTC', ageSeconds: 5,
          description: 'Synthetic sample is 5 seconds old at 12:00:00 UTC. Freshness does not establish calibration or physical accuracy.' };
        sphere('fresh-sensor-head', .12, [0, 0, 0], C.blue, {}, g); ring('fresh-sensor-halo', .24, [0, -.02, 0], C.blue, g);
      }
      const stale = group('sensor-door', [10.5, 3.1, 1]); stale.userData = { ...stale.userData, label: 'Stale door sensor', state: 'stale', lastSample: '11:42:00 UTC', ageSeconds: 1080, description: 'Door component sensor last sampled at 11:42:00 UTC, 18 minutes before the fixed 12:00:00 UTC as-of time. No current door state is inferred.' };
      beacon('stale-door-signal', [0, 0, 0], C.orange, .55, stale);
      const missing = group('sensor-cargo-zone', [6.1, 2.7, 0]); missing.userData = { ...missing.userData, label: 'Missing cargo-zone sensor', state: 'missing', lastSample: null, description: 'No cargo-zone measurement was received. Hollow marker identifies missing evidence; temperature is unknown.' };
      outline('missing-zone-marker', [.45, .45, .45], [0, 0, 0], C.slate, missing);
      const gateway = group('transport-gateway', [1, 4.7, -1.7]); gateway.userData = { ...gateway.userData, label: 'Gateway reconnect pending', state: 'reconnecting', description: 'Synthetic transport connection is reconnecting. This is a transport state, not a ninth sensor and not a fresh replacement for stale or missing samples.' };
      rounded('gateway-body', [1.25, .55, .8], [0, 0, 0], C.ink, {}, gateway); sphere('gateway-reconnect-led', .06, [.45, .3, .2], C.orange, {}, gateway);
      for (const [, p] of samples) segment('fresh-sample-link', p, [1, 4.7, -1.7], C.blue, .016);
      dashed('stale-sample-link', [10.5, 3.1, 1], [1, 4.7, -1.7], C.orange); dashed('missing-sample-link', [6.1, 2.7, 0], [1, 4.7, -1.7], C.slate);
      anchor('FRESH ENGINE + 5 COMPONENT SENSORS\nLast 11:59:55 UTC · age 5 s', [-8.7, 3.8, 0], 'selected');
      anchor('STALE DOOR SENSOR\nLast 11:42:00 UTC · age 18 min', [10.5, 4.2, 1], 'warning');
      anchor('MISSING CARGO-ZONE SENSOR\nNo sample / temperature unknown', [6.1, 3.6, 0], 'warning');
      anchor('RECONNECTING GATEWAY\nFixed as-of 12:00:00 UTC\nDoes not refresh old samples', [1, 5.6, -1.7], 'dimension');
      addMetric('Fresh sensors', 6, 'count'); addMetric('Stale sensors', 1, 'count'); addMetric('Missing sensors', 1, 'count'); addMetric('Transport', 'reconnecting', ''); return;
    }
    if (f === 'projection_and_unit_calibration') {
      platform(7, 6); box('one-metre-cube', [1, 1, 1], [0, .5, 0], C.blueLight); outline('one-metre-envelope', [1, 1, 1], [0, .5, 0]);
      arrow('x-axis', [0, .02, 0], [2.4, .02, 0], C.orange); arrow('z-axis', [0, .02, 0], [0, .02, 2.3], C.blue); arrow('y-axis', [0, 0, 0], [0, 2.4, 0], C.slate);
      measure('metric', [-.5, .02, 1], [.5, .02, 1], '1.000 m = 1,000 mm = 39.370 in');
      note(0, [0, 2.7, 0], 'Y up · X length · Z width', 'selected'); note(1, [2.2, .25, 0], 'Minimum / center pivots explicit'); addMetric('Calibration volume', 1, 'm³'); return;
    }
    if (f === 'equipment_catalog_comparison' || f === 'fleet_split_alternatives' || f === 'assigned_fleet_eligibility_scene') {
      platform(29, 20);
      const split = f === 'fleet_split_alternatives', trust = f === 'assigned_fleet_eligibility_scene';
      for (let i = 0; i < 3; i++) {
        const z = -6 + i * 6, len = split || trust ? 16 : [16, 10, 7][i];
        truck(`equipment-${i + 1}`, [0, 0, z], { length: len, scale: .82, flatbed: !split && !trust && i === 1, reefer: !split && !trust && i === 2, color: i === 1 ? C.orange : C.blue });
        if (split) for (let j = 0; j < [6, 4, 2][i]; j++) pallet(`allocated-${i}-${j}`, [(-4 + j * 1.5) * .82, 1.22 * .82, z], { color: i === 1 ? C.orangeLight : C.blueLight });
        anchor(`${c.labels?.[i] ?? `Equipment ${i + 1}`}\n${split ? [6, 4, 2][i] + ' allocated units' : trust ? ['Screening record present', 'Evidence review pending', 'Source stale'][i] : len.toFixed(2) + ' m body fixture'}`, [8, 3.8, z], i === 1 ? 'selected' : 'info');
      }
      return;
    }
    if (f === 'drop_lot_trailer_locator' || f === 'reefer_parking_and_condition') {
      platform(27, 15);
      for (let i = 0; i < 4; i++) {
        const z = -5 + i * 3.4; outline(`parking-Y${i + 1}`, [18, .04, 3.1], [0, .03, z], C.slate);
        if (i !== 2) truck(`trailer-Y${i + 1}`, [-1, 0, z], { tractor: false, length: 16, scale: .9, reefer: f.includes('reefer'), bodyColor: i === 1 ? C.blueLight : C.pale });
      }
      beacon('selected-location', [5.7, .05, -1.6], C.orange, 4.2); note(0, [5.7, 4.6, -1.6], f.includes('reefer') ? 'Trailer R-02 · 4 °C fixture' : 'Trailer Y02 · selected location', 'selected'); note(1, [0, .25, 1.8], 'Available slot / no asset'); return;
    }
    if (f === 'hostler_move_preview' || f === 'hostler_move_execution_replay') {
      platform(25, 17); for (const z of [-5, 5]) outline('yard-origin-destination', [17, .04, 3.1], [2, .03, z], C.slate);
      const q = curve('hostler-path', [[-8, .05, -5], [-6, .05, -1], [-1, .05, 2], [5, .05, 5]], C.blue, .07);
      const p = q.getPoint(t), tangent = q.getTangent(t), unit = truck('hostler-and-trailer', p.toArray(), { scale: .48, length: 12, color: C.orange });
      unit.group.rotation.y = Math.PI - Math.atan2(tangent.z, tangent.x);
      dashed('previous-trace', [-8, .1, -5], [-6, .1, -1], C.orange); note(0, [p.x, 3.5, p.z], f.includes('replay') ? 'Recorded fixture pose' : 'Proposed move pose', 'selected'); note(1, [5, .3, 5], 'Destination Y08'); return;
    }
    if (f === 'engine_and_fuel_circuit' || f === 'diagnostic_fault_localization') {
      platform(13, 8); const rig = group('powertrain-assembly');
      for (const z of [-.8, .8]) box('frame-rail', [10, .2, .13], [0, 1.1, z], C.ink, {}, rig);
      rounded('engine-block', [1.7, 1.35, 1.25], [-3.2, 1.9 + ex * .6, 0], C.blue, {}, rig);
      for (let i = 0; i < 6; i++) cylinder('cylinder-head', .13, .2, [-3.75 + i * .22, 2.65 + ex * .6, 0], C.silver, {}, rig);
      rounded('transmission', [1.1, .75, .7], [-1.4, 1.55 + ex * .35, 0], C.silver, {}, rig);
      cylinder('driveshaft', .1, 3.7, [1.1, 1.25, 0], C.silver, { rotation: [0, 0, Math.PI / 2] }, rig);
      for (const x of [2.6, 3.8]) for (const z of [-1.05, 1.05]) wheel('drive-wheel', x, .55, z, rig, .55);
      for (const z of [-1.25, 1.25]) cylinder('fuel-reservoir', .4, 1.8, [-1.8, 1.15, z], C.pale, { rotation: [0, 0, Math.PI / 2] }, rig);
      curve('fuel-circuit', [[-1.8, 1.5, 1.25], [-2.6, 1.7, 1.1], [-3.2, 2.1, .4]], C.orange, .035);
      beacon('fault-location', [-3.2, 2.7 + ex * .6, 0], f.includes('fault') ? C.orange : C.blue, .8);
      note(0, [-3.2, 3.9 + ex * .6, 0], f.includes('fault') ? 'Illustrative DTC anchor / not diagnosis' : 'Engine and fuel supply', 'selected'); note(1, [1, 1.7, 0], 'Torque path / synthetic assembly'); return;
    }
    if (f === 'sleeper_and_driver_handoff') {
      platform(8, 7); rounded('sleeper-shell', [3.4, 2.5, 2.45], [0, 1.5, -.08], C.pale, { opacity: .16 });
      box('cab-floor', [3.4, .2, 2.45], [0, .3, 0], C.ink);
      for (const z of [-.68, .68]) {
        rounded('driver-seat', [.65, .25, .65], [-.8, .9, z], z < 0 ? C.orange : C.blue);
        rounded('seat-back', [.15, .8, .65], [-.54, 1.32, z], z < 0 ? C.orange : C.blue);
      }
      rounded('sleeper-bunk', [1, .25, 2.1], [1, 1.2 + ex * .4, 0], C.blueLight);
      box('pillow', [.35, .16, .55], [1, 1.4 + ex * .4, -.6], C.paper);
      arrow('handoff', [-.9, 2.2, -.6], [-.9, 2.2, .6], C.orange); note(0, [-.8, 2.6, -.7], 'Driver A → Driver B', 'selected'); note(1, [1, 2.1 + ex * .4, 0], 'Rest interval fixture'); return;
    }
    platform(28, 10);
    const thermal = /reefer|thermal/.test(f), split = /planned_versus/.test(f);
    const rig = truck('selected-equipment', [0, 0, 0], { reefer: thermal || /sensor/.test(f), cutaway: true });
    const body = rig.body;
    const loadN = /multi_stop/.test(f) ? Math.max(1, Math.ceil(t * 12)) : /payload_fuel/.test(f) ? Math.ceil(t * 16) : 10;
    if (!/custom_asset|dimension_tuner|reference_driven|cross_product_model/.test(f)) for (let i = 0; i < loadN; i++) pallet(`vehicle-HU-${i + 1}`, [-6.8 + Math.floor(i / 2) * 1.5, .12, i % 2 ? .45 : -.45], { color: thermal ? C.cyan : i % 4 === 0 ? C.orangeLight : C.blueLight }, body);
    if (/axle|tandem|fuel_mass/.test(f)) {
      for (const [i, x] of [-9.7, -4.8, 8.4].entries()) {
        arrow(`axle-force-${i}`, [x, 2.8, 1.8], [x, .4, 1.8], i === 2 ? C.orange : C.blue);
        anchor(`${['STEER', 'DRIVE', 'TRAILER'][i]}\n${[10800, 28600, 31200][i].toLocaleString()} lb fixture`, [x, 3.35, 1.8], i === 2 ? 'selected' : 'info');
      }
      const cgX = /multi_stop/.test(f) ? 5 - t * 5 : 1.8;
      sphere('mass-centroid', .18, [cgX, 2.5, 0], C.orange); dashed('centroid-plumb', [cgX, .15, 0], [cgX, 2.5, 0], C.orange); ring('cg-target', .5, [cgX, .15, 0], C.orange);
      if (f === 'tandem_slider_comparison') { outline('bogie-previous', [2.6, 1, 2.65], [9.1, .6, 0], C.blue); arrow('slider-motion', [9.3, .2, 2.4], [7.3, .2, 2.4], C.orange); note(3, [8.2, .5, 2.5], '2.00 m visual comparison'); }
      if (f === 'fuel_mass_and_axle_evolution') { cylinder('fuel-fill', .34, 1.8 * (.2 + .8 * t), [-6.8, 1.13, 1], C.orange, { rotation: [0, 0, Math.PI / 2] }); note(3, [-6.8, 2.3, 1.3], `${Math.round(t * 100)}% fuel fixture`); }
    } else if (thermal) {
      for (let i = 0; i < 3; i++) {
        box(`thermal-zone-${i}`, [4.8, 2.4, 2.2], [-2.6 + i * 4.9, 2.52, 0], i === 2 && /door/.test(f) ? C.orange : [C.blue, C.cyan, C.blueLight][i], { opacity: .14 });
        anchor(`${c.labels?.[i] ?? `Compartment ${i + 1}`}\n${i === 2 && /door/.test(f) ? (4 + t * 7).toFixed(1) : [3.8, 4.2, 4.4][i]} °C synthetic`, [-2.6 + i * 4.9, 4.25, 0], i === 2 ? 'selected' : 'info');
      }
      if (/door/.test(f)) {
        const door = box('open-door', [.08, 2.7, 1.2], [10.55, 2.6, 1.85], C.pale); door.rotation.y = -.8;
        arrow('warm-air', [12, 2.4, .3], [8, 2.4, .3], C.orange);
      }
    } else if (/sensor|telemetry/.test(f)) {
      const sensorPoints = [[-8, 3.6, 0], [-5.9, 3.6, 0], [1.7, 3.6, 0], [10.5, 3.7, 0]];
      sensorPoints.forEach((p, i) => {
        const stale = f.includes('dropout') && i > 1;
        beacon(`sensor-${i + 1}`, p, stale ? C.slate : C.blue, .75);
        if (f === 'sensor_topology_study') segment(`sensor-controller-link-${i}`, p, [1, 6, -2], C.blue, .025);
        else if (i) (stale ? dashed : segment)(`sensor-link-${i}`, sensorPoints[i - 1], p, stale ? C.orange : C.blue);
        anchor(`${c.labels?.[i] ?? `Sensor ${i + 1}`}\n${stale ? 'Last sample 18 min ago' : 'Synthetic sample / 10:24'}`, [p[0], p[1] + 1, p[2]], stale ? 'warning' : 'info');
      });
      if (f === 'sensor_topology_study') {
        rounded('sensor-controller', [1.4, .7, 1], [1, 6, -2], C.ink);
        for (let i = 0; i < 4; i++) sphere('controller-port', .055, [.55 + i * .3, 6.4, -2], C.blueLight);
        anchor('Sensor controller\nTopology / separate from physical harness routing', [1, 7, -2], 'selected');
      }
    } else if (f === 'driver_safety_event_replay') {
      arrow('braking-vector', [-7, .08, 2.1], [-11, .08, 2.1], C.orange); for (const z of [-1.15, 1.15]) dashed('braking-trace', [-8, .02, z], [8, .02, z], C.slate);
      note(0, [-8, 4.1, 0], 'Synthetic braking event', 'warning'); note(1, [4, .3, 2.4], '18 m illustrated trace');
    } else if (split) {
      const g = truck('reported-equipment', [0, .15, .65], { tractor: false, bodyColor: C.orange, length: 14 });
      g.group.traverse(o => { if (o.isMesh) o.material = material(C.orange, { opacity: .16 }); });
      note(0, [-4, 4.2, 0], 'Planned: 16.00 m cavity'); note(1, [7, 4.2, .8], 'Reported fixture: 14.00 m', 'warning');
    } else if (f === 'custom_asset_forge' || f === 'dimension_tuner') {
      const points = [[-5.5, 1.25, 1.225], [10.5, 1.25, 1.225], [10.5, 3.95, 1.225]];
      points.forEach((p, i) => sphere(`asset-handle${i}`, .12, p, C.orange));
      measure('length', [-5.5, .1, 2.4], [10.5, .1, 2.4], '16.00 m usable length');
      measure('height', [11.6, 1.24, 0], [11.6, 3.94, 0], '2.70 m');
      note(0, [2, 4.6, 0], 'Catalog-derived dimensions / synthetic asset', 'selected');
    } else if (f === 'payload_fuel_sensitivity') {
      for (let i = 0; i < 3; i++) bar(`${[25, 50, 100][i]}% payload`, [10, 12, 16][i], 'L / 100 km fixture', [-5 + i * 3.8, 0, 3.2], 6, [C.blueLight, C.blue, C.orange][i], { width: .75, depth: .75 });
      note(0, [1.5, 4.3, 0], `${loadN} units shown / scenario sensitivity`);
    } else if (f === 'cross_product_model_reuse_study') {
      const shell = rig.body.children.find(x => x.name.includes('cavity'));
      if (shell) { shell.position.y = ex * 3; shell.position.z = ex * 2; }
      for (let i = 0; i < 3; i++) pallet(`shared-HU-${i}`, [-1 + i * 2, 1.3 + ex * 2, .2], { color: C.blueLight });
      note(0, [-7.5, 4.2, 0], 'One asset identity'); note(1, [2.5, 4.5 + ex * 2, ex * 2], 'Shared cavity adapter', 'selected'); note(2, [0, 2.9 + ex * 2, .2], 'Canonical handling units');
    } else if (f === 'reference_driven_visual_language') {
      for (let i = 0; i < 3; i++) rounded(`surface-study-${i}`, [2.4, .25, 1.6], [-4 + i * 3, .3, 3], [C.paper, C.blue, C.orange][i], { roughness: [.75, .55, .7][i], metalness: [0, .2, .05][i] });
      note(0, [-7, 4.3, 0], 'Composed geometry / measured cavity', 'selected'); note(1, [1, .8, 3], 'Cool slate · cobalt · signal orange');
    } else if (f === 'vehicle_interior_cutaway') {
      outline('usable-cavity-envelope', [16, 2.7, 2.45], [2.5, 2.59, 0], C.blue);
      const cutRoof = box('displaced-roof-study', [16, .07, 2.45], [2.5, 4.7 + ex * 1.5, -1.5 - ex * 1.5], C.pale, { opacity: .22 });
      cutRoof.userData.cameraRelevant = ex > 0;
      measure('interior-clear-height', [11.2, 1.24, 0], [11.2, 3.94, 0], '2.70 m clear interior');
      note(0, [2.5, 4.25, .2], 'Interior envelope / roof removed for inspection', 'selected');
      note(1, [-4.3, 2.9, .45], 'Handling unit 1.20 × 0.80 × 1.30 m');
      note(2, [9.5, 1.65, .8], 'Deck / door / wall dimensions distinct');
    } else {
      note(0, [-6.5, 4.5, -.2], 'Synthetic equipment twin', 'selected'); note(1, [3, 4.5, -.2], '16.00 × 2.45 × 2.70 m cavity'); note(2, [9, 1.6, 1.5], 'Canonical placements prerequisite');
    }
    addMetric('Cavity volume', 105.84, 'm³'); addMetric('Shown handling units', loadN, 'count');
  }

  function buildFacility() {
    const f = c.focus, yard = c.product === 'yard';
    if (f === 'full_yard_recovery') {
      platform(34, 20, [2, -.16, 0]);
      box('full-yard-warehouse', [21, 1.8, 2.2], [-3.5, .9, -8.2], C.paper);
      for (let i = 0; i < 4; i++) {
        const x = -11 + i * 5, state = i % 2 ? 'reserved' : 'occupied';
        const d = dock(`unavailable-door-D0${i + 1}`, [x, 0, -7], { open: false });
        d.userData = { ...d.userData, label: `D0${i + 1} / ${state}`, status: state, allocatable: false, description: `Synthetic door D0${i + 1} is ${state}. It cannot accept this held arrival; no second allocation is proposed.` };
        if (state === 'occupied') smallTruck(`occupying-door-asset-${i}`, [x, .04, -4.8], Math.PI / 2, C.blue);
        else {
          box(`reservation-door-marker-${i}`, [2.4, .08, 1.3], [x, .12, -5.5], C.orangeLight);
          segment('reserved-door-cross-A', [x - .9, .19, -6], [x + .9, .19, -5], C.orange, .035);
          segment('reserved-door-cross-B', [x - .9, .19, -5], [x + .9, .19, -6], C.orange, .035);
        }
      }
      for (let i = 0; i < 6; i++) {
        const x = -9 + i % 3 * 6, z = i < 3 ? -.8 : 4.7, g = group(`occupied-yard-Y0${i + 1}`, [x, 0, z]);
        g.userData = { ...g.userData, label: `Y0${i + 1} / occupied`, status: 'occupied', allocatable: false, description: 'Existing synthetic trailer occupies this location. No vacant yard spot is available for the arriving units.' };
        outline('occupied-space', [5.3, .035, 3.3], [0, .04, 0], C.slate, g); smallTruck('existing-yard-trailer', [0, .04, 0], 0, C.blue, g);
      }
      for (const [a, b] of [[-9, 2.7], [6.3, 9]]) segment('yard-boundary-fence', [7.5, 1.1, a], [7.5, 1.1, b], C.slate, .045);
      box('gate-closed-barrier', [.12, .15, 3.6], [7.5, 1.2, 4.5], C.orange);
      box('arrival-approach-road', [10, .025, 3.5], [13, .02, 4.5], C.pale);
      for (let i = 0; i < 2; i++) {
        const g = smallTruck(`held-arrival-${i + 1}`, [11.5 + i * 4.2, .04, 4.5], 0, C.orange);
        g.userData = { ...g.userData, label: `Held arrival ${i + 1}`, status: 'unassigned-held-arrival', assignedSpotId: null,
          description: 'Arriving synthetic unit is held outside the full yard. No door, yard spot, offsite capacity, or authorized fallback location has been invented.' };
      }
      const decision = card('holding-authorization-needed', [12.7, .25, -2.8], C.paper, root, { accent: C.orange, yaw: 0 });
      decision.userData = { ...decision.userData, label: 'Alternative holding authorization required', capacity: null, locationId: null, status: 'unknown', description: 'An alternative holding area has no declared location or authorized capacity in this fixture. Request an explicit operator decision before allocation.' };
      anchor('ALL 4 DOORS UNAVAILABLE\n2 occupied + 2 reserved / 0 available', [-3.5, 4.5, -7], 'warning');
      anchor('ALL 6 YARD SPOTS OCCUPIED\n0 empty allocatable spots', [-3, 1.8, 4.7]);
      anchor('2 HELD ARRIVALS / UNASSIGNED\nGate remains closed / no double allocation', [13.4, 2.2, 4.5], 'selected');
      anchor('ALTERNATIVE HOLDING UNDECLARED\nLocation + authorized capacity require an owner decision', [12.7, 1.1, -2.8], 'warning');
      addMetric('Available doors', 0, 'count'); addMetric('Empty yard spots', 0, 'count'); addMetric('Held arrivals', 2, 'count'); addMetric('Alternative holding capacity', 'undeclared', ''); return;
    }
    if (f === 'rack_cell_dimensional_fit') {
      platform(9, 6); rack('rack-R01', [0, 0, 0], { bays: 2, levels: 2, empty: true });
      pallet('HU-01', [.65, 1.92 + ex * .6, t * 2.4 - 2.4], { selected: true });
      outline('target-cell', [1.3, 1.5, 1.2], [.65, 2.57, 0], C.orange);
      measure('clear-height', [3.2, 1.92, 0], [3.2, 3.32, 0], '1.40 m clear · 1.30 m load'); note(0, [.65, 3.7, 0], 'R01-B02-L02-A', 'selected'); note(1, [.65, 2.4, -2.4], 'Insertion preview'); return;
    }
    if (f === 'receiving_scan_verification') {
      platform(10, 7); pallet('scanned-HU-01', [-2, 0, 0], { selected: true }); rack('target-rack', [2, 0, 0], { bays: 1, levels: 2, empty: true });
      rounded('scanner', [.22, .55, .18], [-1.2, 1.3, 1.2], C.ink); curve('scan-ray', [[-1.2, 1.5, 1.2], [-1.9, .55, .43]], C.orange, .018);
      outline('barcode-focus', [.35, .25, .04], [-1.8, .55, .43], C.orange); note(0, [-2, 1.9, 0], 'HU-01 / barcode 000001', 'selected'); note(1, [2, 3.9, 0], 'R01-B01-L01-A'); note(2, [-.5, 1.9, 1.3], 'Synthetic scan match / preview'); return;
    }
    if (f === 'rest_site_parking_study') {
      platform(23, 16); for (let i = 0; i < 5; i++) {
        const z = -5.7 + i * 2.8; outline(`rest-space-${i + 1}`, [17, .035, 2.6], [0, .03, z], i === 2 ? C.blue : C.slate);
        if (i !== 2) truck(`resting-rig-${i}`, [-.9, 0, z], { scale: .6, length: 12, bodyColor: C.pale });
      }
      box('rest-building', [3, 1.7, 2], [9.3, .85, -5.5], C.paper); beacon('available-rest', [3, .03, -.1], C.blue, 2.2); note(0, [3, 2.7, -.1], 'Available synthetic rest space', 'selected'); note(1, [9.3, 2.3, -5.5], 'Rest-site amenity'); return;
    }
    if (f === 'gate_check_in_destination') {
      platform(19, 13); box('gate-road', [15, .04, 3.5], [0, .03, -1], C.slate);
      rounded('gate-booth', [2, 2.3, 1.8], [-1, 1.15, 2.4], C.paper); box('booth-glass', [1.7, .85, .03], [-1, 1.5, 3.31], C.blueLight);
      const arm = box('gate-barrier', [.1, .1, 3.6], [1.5, 1.25 + t, -.9], C.orange); arm.rotation.x = t * 1.05;
      smallTruck('arriving-trailer', [-6 + t * 4, .03, -1], Math.PI, C.blue); dock('assigned-D02', [6.6, 0, -3.4], { open: true, selected: true });
      curve('check-in-to-door', [[0, .07, -1], [4, .07, -1], [6.6, .07, -2.5]], C.blue, .04); note(0, [-1, 3.2, 2.4], 'Gate ID / appointment fixture'); note(1, [6.6, 4.3, -3.4], 'Assigned D02', 'selected'); return;
    }
    if (f === 'inspection_and_hold_bay' || f === 'inventory_hold_and_quarantine') {
      platform(11, 8); box('hold-zone', [6, .035, 4], [0, .03, 0], C.orangeLight);
      for (const z of [-2, 2]) for (let x = -3; x <= 3; x += .5) segment('hold-fence', [x, .05, z], [x, 1.7, z], C.slate, .014);
      for (const x of [-3, 3]) for (const z of [-2, 2]) cone('hold-marker', [x, .04, z]);
      if (yard) smallTruck('held-trailer', [0, .07, 0], 0, C.orange); else for (let i = 0; i < 3; i++) pallet(`held-HU-${i}`, [-1.6 + i * 1.6, .05, 0], { color: C.orangeLight, selected: i === 1 });
      note(0, [0, 2.3, 0], 'Hold area / synthetic status', 'warning'); note(1, [2.4, .3, 2.4], 'Release requires canonical decision'); return;
    }
    if (f === 'door_compatibility_and_occupancy' || f === 'appointment_capacity_over_time' || f === 'detention_schedule_impact') {
      platform(19, 11);
      for (let i = 0; i < 4; i++) {
        const x = -6 + i * 4; dock(`D0${i + 1}`, [x, 0, -2.8], { open: i === 1, selected: i === 1 });
        if (i !== 1) smallTruck(`dock-trailer${i}`, [x, .02, -.4], Math.PI / 2, i === 2 ? C.orange : C.blue);
        if (/time|schedule/.test(f)) {
          for (let slot = 0; slot < 3; slot++) box(`appointment-${i}-${slot}`, [2.7, .25 + slot * .1, .8], [x, .15 + slot * .45, 3 + slot * 1.1], slot === 2 && i === 2 ? C.orange : C.blueLight);
        }
      }
      note(0, [-2, 4.4, -2.8], 'D02 / available compatible door', 'selected'); note(1, [2, 2.6, -.4], /schedule/.test(f) ? '+45 min detention fixture' : 'Occupied / assigned trailer');
      if (/time|schedule/.test(f)) note(2, [6, 1.8, 4.9], 'Time layers: 09:00 · 10:00 · 11:00'); return;
    }
    if (f === 'yard_and_dock_overview' || f === 'full_yard_recovery' || f === 'yard_to_warehouse_handoff' || f === 'telemetry_to_yard_arrival') {
      platform(26, 20); box('warehouse-mass', [23, 1.8, 3], [0, .9, -8.2], C.paper);
      for (let i = 0; i < 4; i++) dock(`D0${i + 1}`, [-8 + i * 5.3, 0, -6.6], { open: i === 1, selected: i === 1 });
      for (let i = 0; i < 6; i++) {
        const x = -9.5 + (i % 3) * 7.5, z = i < 3 ? -.8 : 5.6;
        outline(`yard-slot-${i + 1}`, [6.2, .025, 3.7], [x, .03, z], C.slate);
        if (f === 'full_yard_recovery' || i !== 4) smallTruck(`yard-asset-${i}`, [x, .04, z], 0, i === 2 ? C.orange : C.blue);
      }
      const q = curve('yard-movement', [[11, .08, 7], [10, .08, 1], [3, .08, -3], [-2.7, .08, -5.5]], C.blue, .06);
      if (f === 'telemetry_to_yard_arrival') { const p = q.getPoint(t); beacon('arrival-vehicle', p.toArray(), C.orange, 2.2); }
      if (f === 'full_yard_recovery') { outline('overflow-proposal', [6, .04, 3.5], [9.1, .04, 4.6], C.orange); note(2, [9.1, 1.2, 4.6], 'Overflow proposal / approval required', 'warning'); }
      if (f === 'yard_to_warehouse_handoff') { for (let i = 0; i < 4; i++) pallet(`handoff-HU-${i}`, [-2.7 + i * 1.4, .05, -4.5]); note(2, [-1.3, 1.8, -4.5], 'Unit IDs retained across receiving'); }
      note(0, [-2.7, 4.3, -6.6], 'D02 / active handoff', 'selected'); note(1, [-9.5, 1.8, -.8], 'Y01 / synthetic yard fixture'); return;
    }
    if (f === 'environmental_zone_allocation') {
      platform(22, 14);
      for (let i = 0; i < 3; i++) {
        const x = -6.5 + i * 6.5; box(`environment-zone-${i}`, [5.8, .035, 10], [x, .03, 0], [C.blueLight, '#b7dce7', C.orangeLight][i]);
        rack(`environment-rack-${i}`, [x, 0, -1.5], { bays: 1, levels: 2 });
        pallet(`zone-unit-${i}`, [x, .06, 3], { color: [C.blue, C.cyan, C.orange][i] });
        note(i, [x, 4.5, 0], ['Chilled · 4 °C', 'Frozen · −20 °C', 'Ambient · 18 °C'][i], i === 1 ? 'selected' : 'info');
      }
      pallet('environment-mismatch-HU', [-6.5, .06, 2.8], { color: C.orangeLight, selected: true });
      beacon('environment-mismatch', [-6.5, 1.4, 2.8], C.orange, .7); note(3, [-6.5, 2.6, 2.8], 'Ambient unit in chilled allocation / synthetic conflict', 'warning');
      return;
    }
    if (f === 'cross_dock_staging_experiment') {
      platform(25, 15);
      dock('inbound-door', [-9, 0, 0], { open: true }).rotation.y = Math.PI / 2;
      dock('outbound-door', [9, 0, 0], { open: true }).rotation.y = Math.PI / 2;
      for (let i = 0; i < 3; i++) {
        const z = -3.6 + i * 3.6; box(`staging-lane-${i}`, [10, .03, 2.4], [0, .03, z], i === 1 ? C.orangeLight : C.blueLight);
        for (let j = 0; j < 4; j++) pallet(`crossdock-${i}-${j}`, [-3.5 + j * 2.2, .06, z], { color: i === 1 ? C.orangeLight : C.blueLight });
        arrow(`crossdock-flow-${i}`, [-7, .14, z], [7, .14, z], i === 1 ? C.orange : C.blue);
      }
      note(0, [-9, 4.3, 0], 'Inbound'); note(1, [0, 1.8, 0], 'Lane B / destination grouping', 'selected'); note(2, [9, 4.3, 0], 'Outbound'); return;
    }
    if (f === 'inbound_putaway_recommendation') {
      platform(15, 12);
      const r = rack('candidate-rack-R01', [2.4, 0, -2], { bays: 2, levels: 3, empty: true });
      for (const [i, p] of [[-1.95, .32, 0], [-.65, .32, 0], [1.95, .32, 0], [-1.95, 1.92, 0], [1.95, 1.92, 0], [-.65, 3.52, 0]].entries()) pallet(`existing-stock-${i}`, p, { color: C.pale }, r);
      const target = [3.05, 1.92, -2];
      pallet('HU-01-proposed-slot', [target[0], target[1] + ex * .5, target[2]], { color: C.blue, opacity: .85, selected: true });
      const targetFrame = group('preferred-R01-B02-L02-A', [target[0], 2.67, -2]);
      for (const x of [-.65, .65]) for (const z of [-.6, .6]) segment('preferred-cell-upright', [x, -.75, z], [x, .75, z], C.orange, .035, targetFrame);
      for (const y of [-.75, .75]) {
        for (const x of [-.65, .65]) segment('preferred-cell-depth', [x, y, -.6], [x, y, .6], C.orange, .035, targetFrame);
        for (const z of [-.6, .6]) segment('preferred-cell-width', [-.65, y, z], [.65, y, z], C.orange, .035, targetFrame);
      }
      targetFrame.userData.description = 'Preferred synthetic rack cell R01-B02-L02-A. 1.40 m clear height versus 1.30 m fixture load; orange frame identifies this proposal, not a committed reservation.';
      for (const [i, p] of [[.45, .32, -2], [4.35, 3.52, -2]].entries()) outline(`alternative-${i + 1}`, [1.3, 1.5, 1.2], [p[0], p[1] + .75, p[2]], C.blue);
      box('receiving-staging-lane', [3.7, .025, 2.6], [-4, .03, 2.7], C.blueLight);
      pallet('HU-01-at-receiving', [-4.2, .06, 2.7], { color: C.orangeLight });
      const q = curve('putaway-proposal-path', [[-4.2, .08, 2.7], [-1.7, .08, 2.3], [1.3, .08, 1], [3.05, .08, -.8]], C.blue, .055);
      const p = q.getPoint(t * .78), tg = q.getTangent(t * .78), fork = forklift('putaway-forklift', p.toArray()); fork.rotation.y = -Math.atan2(tg.z, tg.x);
      anchor('PREFERRED / R01-B02-L02-A\nHU-01 fits 1.40 m clear height', [3.05, 3.9 + ex * .5, -2], 'selected');
      anchor('HU-01 / inbound staging\nSame identity throughout the proposal', [-4.2, 1.9, 2.7]);
      anchor('Alternative slots\nThin blue outlines / no reservation committed', [4.35, 5.6, -2], 'dimension');
      addMetric('Handling unit', 'HU-01', ''); addMetric('Load height', 1.3, 'm'); addMetric('Target clear height', 1.4, 'm'); return;
    }
    if (f === 'forklift_travel_preview') {
      platform(16, 12); rack('travel-aisle-rack', [1.7, 0, -3.5], { bays: 3, levels: 2 });
      const q = curve('forklift-route-preview', [[-5.5, .06, 3.1], [-2.8, .06, 3.1], [-1.4, .06, .8], [2.6, .06, -.8]], C.blue, .07);
      const p = q.getPoint(t), tg = q.getTangent(t), fork = forklift('travelling-forklift', p.toArray()); fork.rotation.y = -Math.atan2(tg.z, tg.x);
      pallet('carried-HU-01', [1.5, .27, 0], { color: C.orangeLight, selected: true }, fork);
      for (let i = 0; i <= 18; i++) { const p = q.getPoint(i / 18), tangent = q.getTangent(i / 18), side = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(.85); for (const s of [-1, 1]) sphere(`travel-envelope-${i}-${s}`, .04, [p.x + side.x * s, .05, p.z + side.z * s], C.orange); }
      ring('illustrated-turn-radius', 1.8, [-1.6, .04, 1.4], C.orange, root, .035);
      anchor('Loaded forklift / HU-01\nTravel preview / synthetic path', [p.x, 3, p.z], 'selected'); anchor('1.80 m turning radius\nDotted swept-envelope hypothesis', [-1.6, .3, 3.6], 'dimension'); anchor('Rack approach\nPhysical clearance requires independent checking', [3.7, 4.2, -3.5]); return;
    }
    if (f === 'dock_to_rack_receiving_sequence') {
      platform(19, 11); dock('receiving-D02', [-6.5, 0, -.6], { open: true, selected: t < .34 });
      pallet('received-HU-01', [-6.5, .05, 1.5], { color: C.blueLight });
      const fork = forklift('sequence-forklift', [-.6, 0, 1]); pallet('travelling-HU-01', [1.5, .27, 0], { color: C.orangeLight }, fork);
      rack('destination-R02', [5.8, 0, -.6], { bays: 1, levels: 2, empty: true }); pallet('stored-HU-01', [5.15, 1.92, -.6], { color: C.blue, opacity: t > .66 ? 1 : .23, selected: t > .66 });
      arrow('receive-to-travel', [-4.7, .16, 1], [-2.5, .16, 1], C.blue); arrow('travel-to-rack', [2.2, .16, 1], [4.2, .16, 1], C.blue);
      const active = Math.min(2, Math.floor(t * 3));
      for (const [i, x] of [-6.5, 0, 5.8].entries()) { box(`handoff-stage-${i}`, [3.2, .13, .8], [x, .12, 4.1], i === active ? C.orange : C.blueLight); anchor(`${i + 1}. ${['RECEIVE D02', 'TRAVEL HU-01', 'PUTAWAY R02'][i]}\n${i === active ? 'Active synthetic stage' : 'Same unit / separate sequence snapshot'}`, [x, i === 1 ? 3.1 : 4.4, -.6], i === active ? 'selected' : 'info'); }
      anchor('SEQUENCE DIAGRAM\nThree snapshots of one identity / not three physical units', [0, .25, 5.1], 'dimension'); addMetric('Canonical handling unit', 'HU-01', ''); addMetric('Sequence stages', 3, 'count'); return;
    }
    platform(24, 18);
    for (let i = 0; i < 3; i++) rack(`R0${i + 1}`, [1.2, 0, -5.1 + i * 4.7], { bays: f === 'annotation_density_and_occlusion' ? 3 : 4, occupancy: f.includes('capacity') ? 1 : undefined });
    for (let i = 0; i < 3; i++) dock(`D0${i + 1}`, [-8.5 + i * 3.8, 0, 7.8], { open: true, selected: i === 1 });
    const q = curve('receiving-path', [[-4.7, .05, 6.5], [-6.7, .05, 2], [-5.6, .05, -2.6], [1.2, .05, -2.6]], C.blue, .055);
    if (/forklift|sequence|putaway/.test(f)) {
      const p = q.getPoint(t), tg = q.getTangent(t), fork = forklift('active-forklift', p.toArray()); fork.rotation.y = -Math.atan2(tg.z, tg.x);
      pallet('carried-HU', [1.5, .28, 0], { color: C.orangeLight, selected: true }, fork);
      note(1, [p.x, 3.1, p.z], 'HU-01 / planned path', 'selected');
    }
    if (f === 'inbound_putaway_recommendation') {
      const candidates = [[1.2, 1.82, -.4], [3.8, .22, 4.3], [-1.4, 3.42, -5.1]];
      candidates.forEach((p, i) => {
        outline(`putaway-candidate-${i}`, [1.3, 1.5, 1.2], [p[0], p[1] + .85, p[2]], i ? C.orange : C.blue);
        beacon(`candidate-pin-${i}`, [p[0], p[1] + 1.6, p[2]], i ? C.orange : C.blue, .35);
        anchor(`${i ? 'Alternative ' + i : 'Proposed slot'}\n${['R02-B03-L02-A', 'R03-B04-L01-A', 'R01-B02-L03-A'][i]} / synthetic`, [p[0], p[1] + 2.3, p[2]], i ? 'info' : 'selected');
      });
    }
    if (f === 'forklift_travel_preview') {
      const p = q.getPoint(.47); ring('forklift-turn-radius', 1.8, [p.x, .035, p.z], C.orange, root, .035);
      for (let i = 1; i < 9; i++) {
        const p = q.getPoint(i / 10), tangent = q.getTangent(i / 10), lateral = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(.9);
        for (const side of [-1, 1]) sphere(`swept-envelope-${i}-${side}`, .055, [p.x + side * lateral.x, .08, p.z + side * lateral.z], C.orange);
      }
      anchor('1.80 m illustrated turning radius\nSwept envelope is a visual hypothesis', [p.x, .3, p.z + 2.3], 'dimension');
    }
    if (f === 'dock_to_rack_receiving_sequence') {
      const stations = [[-4.7, .1, 6.5], [-6.7, .1, 2], [1.2, 1.8, -.4]], active = Math.min(2, Math.floor(t * 3));
      stations.forEach((p, i) => {
        ring(`receiving-stage-${i}`, .8, p, i === active ? C.orange : C.blue, root, .05);
        anchor(`${i + 1}. ${['Receive at D02', 'Travel / identified HU', 'Place at R02'][i]}\n${i === active ? 'Active fixture stage' : 'Sequence context'}`, [p[0], p[1] + 1.8, p[2]], i === active ? 'selected' : 'info');
      });
      for (let i = 0; i < 3; i++) box(`receiving-time-step-${i}`, [2.5, .12, .8], [-7 + i * 3, .15, 9], i === active ? C.orange : C.blueLight);
    }
    if (f === 'capacity_and_occupancy_layers') {
      for (const p of [[-6, 0, -5.1], [1.2, 0, -.4], [5.1, 0, 4.3]]) outline('capacity-witness', [2.6, 5, 1.2], [p[0], 2.5, p[2]], C.orange);
      note(2, [5, 5.7, 4.3], 'Geometry / occupancy / reserved layers');
    }
    if (f === 'annotation_density_and_occlusion') {
      for (let i = 0; i < 3; i++) { const x = -1.4 + i * 2.6; beacon(`label-anchor-${i}`, [x, 4.9, -.4], C.blue, .45); anchor(`R02-B0${i + 1}\nObject-attached selected labels`, [x, 5.7, -.4]); }
    }
    note(0, [1.2, 5.7, -5.1], '24 × 18 m synthetic facility', 'selected'); note(3, [-4.7, 4.3, 7.8], 'D02 receiving');
    addMetric('Fixture rack bays', f === 'annotation_density_and_occlusion' ? 9 : 12, 'count'); addMetric('Floor area', 432, 'm²');
  }

  function buildRoute() {
    const f = c.focus, elevated = f === 'elevation_load_and_range';
    if (f === 'departure_speed_sensitivity') {
      platform(22, 16); root.userData.coordinateFrame = 'Semantic elapsed-time timeline; 0.50 world metres per hour; lane depth is categorical';
      const distance = Number(c.metrics?.find(m => m.label === 'Distance')?.value) || 600, speeds = [50, 60, 65], x0 = -7, metresPerH = .5;
      const arrival = hours => { const mins = Math.round((8 + hours) * 60), day = Math.floor(mins / 1440), h = Math.floor(mins / 60) % 24, m = mins % 60; return `${day ? `day +${day} ` : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} UTC`; };
      speeds.forEach((speed, i) => {
        const driving = distance / speed, rest = driving > 11 ? 10 : 0, elapsed = driving + rest, z = -4.5 + i * 4.5, g = group(`speed-scenario-${speed}`, [0, 0, z]);
        g.userData = { ...g.userData, label: `${speed} mph / ${distance} mi scenario`, speedMph: speed, distanceMi: distance, drivingHours: driving, restHours: rest, elapsedHours: elapsed, arrivalUTC: arrival(elapsed),
          description: `Synthetic arithmetic: ${distance} mi / ${speed} mph = ${driving.toFixed(4)} h driving. Illustrative rest assumption is 10 h after 11 h of driving, so elapsed is ${elapsed.toFixed(4)} h. Departure 08:00 UTC, arrival ${arrival(elapsed)}. This is not HOS or achievable-speed verification.` };
        const segments = rest ? [{ type: 'drive', h: 11 }, { type: 'rest', h: 10 }, { type: 'drive', h: driving - 11 }] : [{ type: 'drive', h: driving }];
        let at = 0;
        for (const [j, s] of segments.entries()) {
          const width = s.h * metresPerH; box(`${speed}:${s.type}:${j}`, [width, .3, .9], [x0 + (at + s.h / 2) * metresPerH, .3, 0], s.type === 'rest' ? C.orange : i === 1 ? C.blue : C.blueLight, {}, g);
          at += s.h;
        }
        const currentX = x0 + t * elapsed * metresPerH; smallTruck(`speed-${speed}:progress`, [currentX, .49, 0], Math.PI, i === 0 ? C.orange : C.blue, g);
        beacon(`arrival-${speed}`, [x0 + elapsed * metresPerH, .03, z + .9], i === 0 ? C.orange : C.blue, .8);
        anchor(`${speed} MPH / ${distance} MI\nDrive ${driving.toFixed(2)} h + rest ${rest.toFixed(0)} h\nARRIVE ${arrival(elapsed)}`, [x0 + elapsed * metresPerH + .3, 1.95, z], i === 1 ? 'selected' : 'info');
        if (rest) anchor('ILLUSTRATED REST\n10 h after 550 mi / 11 h driving', [x0 + 16 * metresPerH, 1.3, z - 1.1], 'warning');
        addMetric(`${speed} mph elapsed time`, elapsed, 'h');
      });
      for (let h = 0; h <= 24; h += 2) {
        const x = x0 + h * metresPerH; segment('elapsed-hour-grid', [x, .04, -6], [x, .04, 6], C.edge, .008);
        if (h % 4 === 0) anchor(`+${h} h`, [x, .1, 6.8], 'dimension');
      }
      anchor('DEPART 08:00 UTC / SAME 600 MI\nTime scale 0.50 m per hour\n10 h rest after 11 h is a declared illustration, not a compliance ruling', [-7.7, 2.5, -.1], 'dimension');
      addMetric('Lane distance', distance, 'mi'); return;
    }
    platform(26, 17);
    for (let i = 0; i < 8; i++) rounded(`terrain-tile-${i}`, [2.3, .12 + (i % 3) * .12, 2.1], [-10 + (i % 4) * 6, -.01, -5.8 + Math.floor(i / 4) * 11], i % 2 ? '#e7edf0' : '#dfe8e7');
    if (elevated) for (let i = 0; i < 5; i++) mesh(new THREE.ConeGeometry(1.4 + i * .15, 1.5 + i * .5, 4), `elevation-mass-${i}`, [-5 + i * 3, .7 + i * .25, -4.5], C.pale, { rotation: [0, .4, 0] });
    const pts = elevated ? [[-11, .15, 1], [-6, .45, -1], [-1, 2.2, 1], [5, 1.25, 3], [11, .2, 0]] : [[-11, .15, -2.8], [-6, .15, 1.5], [-1, .15, -.9], [5, .15, 3], [11, .15, -.8]];
    const road = curve('schematic-road', pts, C.slate, .24);
    const path = curve('active-corridor', pts.map(p => [p[0], p[1] + .23, p[2]]), C.blue, .045);
    const times = [.02, .29, .59, .97];
    times.forEach((u, i) => {
      const p = path.getPoint(u); beacon(`route-stop-${i}`, p.toArray(), i === 2 ? C.orange : C.blue, .75);
      if (i === 0 || i === 3) { box(`depot-${i}`, [1.3, .85, 1.1], [p.x, p.y + .43, p.z - 1.2], C.paper); box(`depot-door-${i}`, [.55, .5, .025], [p.x, p.y + .25, p.z - .64], C.blue); }
    });
    const multiple = f === 'fleet_on_corridor';
    for (let i = 0; i < (multiple ? 3 : 1); i++) {
      const u = multiple ? [.18, .49, .79][i] : f === 'stop_reachability_envelope' ? .2 + .15 * t : .12 + t * .7;
      const p = f === 'stop_reachability_envelope' ? path.getPointAt(u) : path.getPoint(u), tangent = f === 'stop_reachability_envelope' ? path.getTangentAt(u) : path.getTangent(u);
      smallTruck(`route-truck-${i}`, [p.x, p.y + .08, p.z], Math.PI - Math.atan2(tangent.z, tangent.x), i === 1 ? C.orange : C.blue);
    }
    if (/geofence/.test(f)) {
      const p = path.getPoint(.8); ring('arrival-geofence', 2, [p.x, .055, p.z], C.orange, root, .045); box('geofence-volume', [4, 1.6, 4], [p.x, .8, p.z], C.blueLight, { opacity: .08 }); note(0, [p.x, 2.7, p.z], '2 km semantic arrival zone', 'selected');
    } else if (f === 'loaded_and_deadhead_economics') {
      curve('deadhead-leg', [[-11, .4, -2.8], [-9, .4, -5.2], [-4, .4, -5]], C.orange, .055); note(0, [-4, 1.5, -5], 'Deadhead leg / schematic'); note(1, [5, 1.4, 3], 'Loaded leg / exact values in record', 'selected');
    } else if (f === 'solo_and_team_comparison') {
      curve('team-alternative', pts.map(p => [p[0], p[1] + .3, p[2] - 4]), C.orange, .06);
      for (const u of [.25, .5, .75]) { const p = path.getPoint(u); cylinder('solo-rest', .35, .15, [p.x, .3, p.z + 1], C.blueLight); }
      note(0, [-3, 1.8, 0], 'SOLO / three rest markers'); note(1, [3, 1.8, -2], 'TEAM / separate duty records', 'selected');
    } else if (f === 'stop_reachability_envelope') {
      const currentU = .2 + .15 * t, totalMi = 240, speedMph = 50, budgetH = 1.5, reachMi = speedMph * budgetH, endU = currentU + reachMi / totalMi;
      const p = path.getPointAt(currentU), edge = path.getPointAt(endU);
      root.getObjectByName('active-corridor').visible = false;
      const portion = (name, from, to, color, radius) => curve(name, Array.from({ length: 17 }, (_, i) => path.getPointAt(from + (to - from) * i / 16).toArray()), color, radius);
      portion('past-route', 0, currentU, C.pale, .07); portion('reachable-route', currentU, endU, C.blue, .105); portion('beyond-duty-budget', endU, 1, C.orange, .085);
      ring('reach-envelope-centered-on-vehicle', 3.25, [p.x, .065, p.z], C.blue, root, .045);
      beacon('time-budget-boundary', edge.toArray(), C.orange, 1.8);
      const near = path.getPointAt(.6), far = path.getPointAt(.85);
      for (const [i, point] of [near, far].entries()) {
        box(`rest-site-${i}`, [1.1, .55, .8], [point.x, point.y + .28, point.z - 1.2], i ? C.orangeLight : C.blueLight);
        anchor(`REST ${i ? 'B' : 'A'} / mile ${i ? 204 : 144}\n${((i ? 204 : 144) - currentU * totalMi).toFixed(0)} mi ahead · ${(((i ? 204 : 144) - currentU * totalMi) / speedMph).toFixed(2)} h\n${i ? 'Beyond this budget' : 'Within this budget'} fixture`, [point.x, 1.9, point.z - 1.2], i ? 'warning' : 'info');
      }
      anchor(`CURRENT TRUCK / mile ${(currentU * totalMi).toFixed(0)}\n1.50 h remaining × 50 mph = 75 mi`, [p.x, 2.4, p.z], 'selected');
      anchor(`REACH BOUNDARY / mile ${(endU * totalMi).toFixed(0)}\nBlue = next 75 mi · orange = beyond`, [edge.x, 2.8, edge.z], 'warning');
      addMetric('Remaining synthetic budget', budgetH, 'h'); addMetric('Scenario speed', speedMph, 'mph'); addMetric('Reachable chainage', reachMi, 'mi');
    } else if (f === 'duty_violation_and_remedy_focus') {
      const p = path.getPoint(.6); box('duty-boundary', [.12, 1.9, 3], [p.x, 1, p.z], C.orange, { opacity: .5 });
      curve('remedy-detour', [[p.x - 1, .45, p.z], [p.x - .5, .45, p.z + 3.5], [p.x + 3, .45, p.z + 3]], C.blue, .055);
      note(0, [p.x, 2.5, p.z], 'Synthetic duty boundary', 'warning'); note(1, [p.x + 2, 1.6, p.z + 3], 'Proposed rest stop / review');
    } else if (f === 'departure_speed_sensitivity') {
      for (let i = 0; i < 3; i++) {
        const p = path.getPoint(.25 + i * .22); segment(`time-projection-${i}`, p.toArray(), [p.x, 1.4 + i * .8, p.z], C.slate, .018); sphere(`arrival-scenario-${i}`, .2, [p.x, 1.4 + i * .8, p.z], [C.blue, C.blueLight, C.orange][i]);
        anchor(`${[50, 60, 65][i]} mph fixture\nSeparate arrival estimate`, [p.x, 1.9 + i * .8, p.z]);
      }
    } else if (f === 'cold_chain_shock_and_seal_route') {
      const p = path.getPoint(.59); for (const r of [.45, .8, 1.15]) ring('shock-event-ring', r, [p.x, .1, p.z], C.orange); beacon('seal-evidence', [p.x, .5, p.z], C.orange, 1.4);
      note(0, [p.x, 2.7, p.z], 'Exception location / synthetic event', 'warning'); note(1, [-7, 1.8, 1], '4 °C telemetry fixture');
    } else if (f === 'trip_fuel_time_and_range') {
      const p = path.getPoint(.59); rounded('fuel-pump', [.5, 1.2, .5], [p.x, .75, p.z - 1], C.orange); box('pump-display', [.32, .25, .03], [p.x, 1.05, p.z - .73], C.ink); ring('range-edge', 2, [p.x + 2.3, .06, p.z], C.blue);
      note(0, [p.x, 2, p.z - 1], 'Refuel option fixture', 'selected'); note(1, [8, 1.7, 1], 'Range depends on payload / speed');
    } else if (elevated) {
      note(0, [-1, 4.2, 1], '500 ft elevation scenario', 'selected'); note(1, [6, 2.6, 3], 'Grade/load energy hypothesis');
    } else {
      note(0, [-10, 1.9, -3], c.labels?.[0] ? 'Origin fixture' : 'Origin'); note(1, [-1, 1.9, -.9], 'Planned stop / synthetic itinerary', 'selected'); note(2, [10, 1.9, -.8], 'Destination fixture');
    }
    anchor('SCHEMATIC CORRIDOR\nSpatial positions do not encode geographic distance', [0, .15, 6.6], 'dimension');
    addMetric('Route mode', 'schematic', ''); addMetric('Stops', 4, 'count');
  }

  function buildFinance() {
    const f = c.focus;
    platform(f === 'three_dimensional_cost_waterfall' ? 25 : 17, 10);
    const raw = (c.metrics ?? []).filter(m => Number.isFinite(Number(m.value))).slice(0, 4);
    if (f === 'remaining_duty_clock_volumes') {
      const total = [11, 14, 70], used = [7.5, 9, 54], scale = [2, 2, 10];
      total.forEach((v, i) => {
        const x = -4.5 + i * 4.5, h = v / scale[i], remain = v - used[i];
        outline(`clock-capacity-${i}`, [1.6, h, 1.6], [x, h / 2, 0], C.slate);
        rounded(`remaining-clock-${i}`, [1.5, remain / scale[i], 1.5], [x, remain / scale[i] / 2, 0], i === 1 ? C.orange : C.blue);
        anchor(`${['DRIVE', 'SHIFT', 'CYCLE'][i]}\n${remain} / ${v} h remaining\n${scale[i]} h per vertical metre`, [x, h + .5, 0], i === 1 ? 'selected' : 'metric');
      }); return;
    }
    if (f === 'invoice_reconciliation_landscape') {
      const accepted = Number(c.metrics?.find(m => m.label === 'Accepted quote')?.value) || 2770;
      const invoice = Number(c.metrics?.find(m => m.label === 'Invoice total')?.value) || 2770;
      const acceptedCents = Math.round(accepted * 100), invoiceCents = Math.round(invoice * 100), differenceCents = invoiceCents - acceptedCents, scale = 500;
      for (const [i, cents] of [acceptedCents, invoiceCents].entries()) {
        const id = i ? 'invoice-total' : 'accepted-quote', x = i ? 4.5 : -4.5, amount = cents / 100, h = amount / scale, g = group(id, [x, 0, 0]);
        g.userData = { ...g.userData, label: i ? 'Invoice total' : 'Accepted quote', amountCents: cents, currency: 'USD', value: amount,
          description: `Synthetic ${i ? 'invoice' : 'accepted quote'} amount is ${cents} cents / $${amount.toFixed(2)} USD. Monetary equality is separate from receipt verification, accessorial authorization, issuance, or payment.` };
        rounded(`${id}:amount`, [1.8, h, 1.5], [0, h / 2, 0], i ? C.blue : C.blueLight, {}, g);
        for (let y = 1; y < h; y++) box('reconciliation-money-tick', [1.81, .014, 1.51], [0, y, 0], C.paper, {}, g);
        anchor(`${i ? 'INVOICE TOTAL' : 'ACCEPTED QUOTE'}\n$${amount.toFixed(2)} USD`, [x, h + .5, 0], i ? 'selected' : 'info');
      }
      segment('equal-money-baseline', [-6, .04, 0], [6, .04, 0], C.ink, .03);
      dashed('quote-to-invoice-level', [-3.6, accepted / scale, 0], [3.6, accepted / scale, 0], C.blue);
      const equal = group('invoice-quote-difference', [0, 2.6, 0]);
      equal.userData = { ...equal.userData, label: 'Exact-cent reconciliation difference', amountCents: differenceCents, currency: 'USD', value: differenceCents / 100,
        description: `${invoiceCents} invoice cents minus ${acceptedCents} accepted quote cents equals ${differenceCents} cents. This arithmetic match does not establish paid, verified receipt, or authorized accessorials.` };
      for (const y of [-.17, .17]) rounded('arithmetic-equality-stroke', [1.35, .1, .28], [0, y, 0], C.blue, {}, equal);
      const receipt = card('receipt-source-evidence', [0, .25, -2.8], C.paper, root, { yaw: 0 });
      receipt.userData = { ...receipt.userData, label: 'Receipt evidence source', status: 'fixture-only', description: 'Source receipt evidence must retain unit IDs and be independently verified. No quantity or receipt verification is invented by this amount comparison.' };
      const accessorial = card('accessorial-source-evidence', [0, .25, 2.8], C.paper, root, { accent: C.orange, yaw: 0 });
      accessorial.userData = { ...accessorial.userData, label: 'Accessorial evidence detail', additionalAmountCents: null, status: 'not-itemized', description: 'The fixture declares no separate additional accessorial amount. Require its source detail and authorization rather than manufacturing a charge or changing the accepted total.' };
      anchor(`DIFFERENCE $${(differenceCents / 100).toFixed(2)}\nExact-cent arithmetic / no payment claim`, [0, 3.35, 0], differenceCents ? 'warning' : 'metric');
      anchor('RECEIPT + ACCESSORIAL EVIDENCE\nSource verification remains separate\n$500 per vertical metre / same money scale', [0, 1, 2.8], 'dimension');
      addMetric('Accepted quote', acceptedCents / 100, 'USD'); addMetric('Invoice total', invoiceCents / 100, 'USD'); addMetric('Difference', differenceCents / 100, 'USD'); return;
    }
    if (f === 'three_dimensional_cost_waterfall' || f === 'broker_buy_sell_margin_study' || f === 'invoice_reconciliation_landscape') {
      const vals = f === 'broker_buy_sell_margin_study' ? [1800, 1500, 300] : f === 'invoice_reconciliation_landscape' ? [1800, 150, -50, 1900] : [420, 280, 110, 65, 165];
      const names = f === 'broker_buy_sell_margin_study' ? ['Customer sell', 'Carrier buy', 'Gross margin'] : f === 'invoice_reconciliation_landscape' ? ['Accepted quote', 'Accessorial', 'Adjustment', 'Reconciled total'] : ['Driver', 'Fuel', 'Maintenance', 'Tolls', 'Margin'];
      const scale = f === 'three_dimensional_cost_waterfall' ? 250 : Math.max(...vals.map(Math.abs)) / 4.5;
      let previous = 0;
      segment('shared-money-zero-baseline', [-8, .04, 0], [f === 'three_dimensional_cost_waterfall' ? 11.5 : 7.8, .04, 0], C.ink, .035);
      vals.forEach((v, i) => {
        const x = -6 + i * 3, isTotal = f.includes('reconciliation') && i === vals.length - 1, cumulative = f.includes('waterfall');
        const h = Math.abs(v) / scale;
        const baseline = f.includes('reconciliation') ? .8 : 0;
        const bottom = cumulative ? previous / scale : v < 0 ? baseline - h : baseline;
        rounded(`money-${names[i]}`, [1.6, h, 1.4], [x, bottom + h / 2, 0], i === vals.length - 1 || v < 0 ? C.orange : C.blueLight);
        for (let y = .18; y < h; y += .18) box('money-note-line', [1.61, .008, 1.41], [x, bottom + y, 0], C.paper);
        anchor(`${names[i]}\n${v < 0 ? '−' : ''}$${Math.abs(v).toLocaleString()}`, [x, v < 0 ? bottom - .25 : bottom + h + .35, 0], i === vals.length - 1 ? 'selected' : 'metric');
        if (baseline) segment('zero-dollar-baseline', [x - 1.1, baseline, 0], [x + 1.1, baseline, 0], C.slate, .014);
        if (cumulative) {
          if (i < vals.length - 1) segment('cumulative-bridge', [x + .8, bottom + h, 0], [x + 2.2, bottom + h, 0], C.ink, .035);
          if (bottom > 0) dashed('cumulative-ground-guide', [x, .05, 0], [x, bottom, 0], C.slate);
        }
        previous += v;
      });
      if (f === 'three_dimensional_cost_waterfall') {
        const cost = vals.slice(0, -1).reduce((a, b) => a + b, 0), margin = vals.at(-1), total = cost + margin;
        rounded('total-rate-cost', [1.8, cost / scale, 1.5], [10, cost / scale / 2, 0], C.blue);
        rounded('total-rate-margin', [1.8, margin / scale, 1.5], [10, cost / scale + margin / scale / 2, 0], C.orange);
        segment('margin-to-total-bridge', [6.8, total / scale, 0], [9.1, total / scale, 0], C.ink, .035);
        segment('dollar-scale-post', [-8, .04, -1.4], [-8, total / scale + .2, -1.4], C.slate, .018);
        for (let amount = 0; amount <= total; amount += 250) {
          const y = amount / scale; segment('dollar-scale-tick', [-8.18, y, -1.4], [-7.82, y, -1.4], C.ink, .016);
          anchor(`$${amount.toLocaleString()}`, [-8.5, y + .08, -1.4], 'dimension');
        }
        anchor(`TOTAL RATE $${total.toLocaleString()}\nCost $${cost.toLocaleString()} + margin $${margin.toLocaleString()}`, [10, total / scale + .6, 0], 'selected');
        anchor(`CUMULATIVE COST $${cost.toLocaleString()}\nEach floating contribution starts at prior subtotal`, [1.5, .2, 2.2], 'dimension');
        addMetric('Cost subtotal', cost, 'USD'); addMetric('Margin', margin, 'USD');
      }
      anchor(`VERTICAL SCALE\n$${scale.toFixed(2)} per metre · fixed width/depth`, [0, .1, 3.4], 'dimension'); addMetric('Components total', f.includes('reconciliation') ? 1900 : vals.reduce((a, b) => a + b, 0), 'USD'); return;
    }
    if (f === 'insurance_coverage_volumes') {
      const value = (label, fallback) => { const n = Number(c.metrics?.find(m => m.label === label)?.value); return Number.isFinite(n) ? n : fallback; };
      const declared = value('Declared coverage', 1000000), required = value('Scenario requirement', 1250000), gap = Math.max(0, required - declared), scale = 250000;
      const scope = 'Auto liability / per-occurrence limit', top = required / scale, availableTop = declared / scale;
      const available = group('coverage-declared', [-3.6, 0, 0]);
      available.userData = { ...available.userData, label: 'Declared auto liability', value: declared, unit: 'USD', policyField: scope,
        description: `Synthetic declared ${scope}: $${declared.toLocaleString('en-US')}. Same coverage field as the scenario requirement; source is unverified.` };
      rounded('declared-coverage-column', [1.8, availableTop, 1.6], [0, availableTop / 2, 0], C.blue, {}, available);
      for (let y = 1; y < availableTop; y++) box('coverage-unit-tick', [1.81, .014, 1.61], [0, y, 0], C.paper, {}, available);
      const need = group('coverage-required', [3.6, 0, 0]);
      need.userData = { ...need.userData, label: 'Customer scenario requirement', value: required, unit: 'USD', policyField: scope,
        description: `Synthetic customer requirement: $${required.toLocaleString('en-US')} for ${scope}. This is a scenario policy, not a universal legal minimum or insurer confirmation.` };
      rounded('required-coverage-reference', [1.8, top, 1.6], [0, top / 2, 0], C.pale, { opacity: .28 }, need);
      outline('required-coverage-envelope', [1.8, top, 1.6], [0, top / 2, 0], C.slate, need);
      const shortfall = group('coverage-gap', [-3.6, availableTop, 0]);
      shortfall.userData = { ...shortfall.userData, label: 'Coverage shortfall', value: gap, unit: 'USD', policyField: scope,
        description: `$${required.toLocaleString('en-US')} required minus $${declared.toLocaleString('en-US')} declared equals $${gap.toLocaleString('en-US')} shortfall in the same synthetic coverage field. Orange wireframe marks unfilled capacity.` };
      const gapH = gap / scale;
      if (gapH > 0) {
        for (const x of [-.9, .9]) for (const z of [-.8, .8]) segment('gap-empty-upright', [x, 0, z], [x, gapH, z], C.orange, .035, shortfall);
        for (const y of [0, gapH]) {
          for (const x of [-.9, .9]) segment('gap-depth', [x, y, -.8], [x, y, .8], C.orange, .035, shortfall);
          for (const z of [-.8, .8]) segment('gap-width', [-.9, y, z], [.9, y, z], C.orange, .035, shortfall);
        }
      }
      segment('same-field-zero-baseline', [-5.4, .035, 0], [5.4, .035, 0], C.ink, .026);
      dashed('required-level', [-4.6, top, 0], [4.6, top, 0], C.slate);
      arrow('coverage-shortfall-bracket', [-1.9, availableTop, .9], [-1.9, top, .9], C.orange, root, .18);
      anchor(`DECLARED $${declared.toLocaleString('en-US')}\n${scope}`, [-3.6, availableTop + .35, -1.3], 'selected');
      anchor(`REQUIRED $${required.toLocaleString('en-US')}\nSame customer scenario coverage field`, [3.6, top + .45, 0]);
      anchor(`GAP $${gap.toLocaleString('en-US')}\nUnfilled orange envelope / ${(gap / required * 100).toFixed(0)}% of requirement`, [-1.9, availableTop + gapH / 2, 1.5], 'warning');
      anchor(`ONE MONEY SCALE\n$${scale.toLocaleString('en-US')} per vertical metre · fixed footprint\nSynthetic policy scope / insurer confirmation absent`, [0, .12, 3.1], 'dimension');
      addMetric('Declared auto liability', declared, 'USD'); addMetric('Scenario requirement', required, 'USD'); addMetric('Coverage gap', gap, 'USD'); return;
    }
    if (f === 'composite_score_explanation') {
      const value = (label, fallback) => { const n = Number(c.metrics?.find(m => m.label === label)?.value); return Number.isFinite(n) ? n : fallback; };
      const base = value('Base score', 100), deduction = value('Deductions', 18), score = base - deduction, scale = 20;
      const columns = [
        { id: 'score-base', label: 'Base score', value: base, x: -4.8, bottom: 0, color: C.pale },
        { id: 'score-combined-deduction', label: 'Combined policy + review deduction', value: deduction, x: 0, bottom: score / scale, color: C.orange },
        { id: 'score-result', label: 'Resulting scenario score', value: score, x: 4.8, bottom: 0, color: C.blue },
      ];
      for (const d of columns) {
        const h = d.value / scale, g = group(d.id, [d.x, d.bottom, 0]);
        g.userData = { ...g.userData, label: d.label, value: d.value, unit: 'points',
          description: `${d.label}: ${d.value} synthetic policy points. ${base} base minus ${deduction} combined deductions equals ${score}. No individual policy/review split is supplied; this is not an official rating.` };
        rounded(`${d.id}:value`, [1.7, h, 1.5], [0, h / 2, 0], d.color, {}, g);
        for (let y = 1; y < h; y++) box(`${d.id}:scale-step`, [1.71, .014, 1.51], [0, y, 0], C.paper, {}, g);
      }
      segment('score-zero-baseline', [-6.3, .035, 0], [6.3, .035, 0], C.ink, .028);
      segment('base-to-deduction-level', [-3.9, base / scale, 0], [-.9, base / scale, 0], C.slate, .025);
      segment('deduction-to-result-level', [.9, score / scale, 0], [3.9, score / scale, 0], C.slate, .025);
      dashed('deduction-ground-guide', [0, .05, 0], [0, score / scale, 0], C.slate);
      arrow('score-subtraction', [0, base / scale + .12, 1.3], [0, score / scale + .12, 1.3], C.orange, root, .2);
      for (let y = 0; y <= base / scale; y++) segment('score-axis-tick', [-6.4, y, -.8], [-6.05, y, -.8], C.slate, .014);
      anchor(`BASE ${base} POINTS`, [-4.8, base / scale + .5, 0]);
      anchor(`SUBTRACT ${deduction} POINTS\nCombined policy + review deduction`, [0, base / scale + .65, 0], 'warning');
      anchor(`RESULT ${score} POINTS\n${base} − ${deduction} = ${score}`, [4.8, score / scale + .55, 0], 'selected');
      anchor(`20 points per vertical metre\nIndividual deduction allocation is unspecified\nSynthetic scenario score / not an official safety rating`, [0, .12, 3.2], 'dimension');
      addMetric('Base score', base, 'points'); addMetric('Combined deductions', deduction, 'points'); addMetric('Scenario score', score, 'points'); return;
    }
    if (f === 'basic_percentile_comparison') {
      const vals = [24, 48, 72, 39];
      const names = ['Unsafe driving', 'HOS', 'Vehicle maintenance', 'Crash indicator'];
      vals.forEach((v, i) => bar(names[i], v, 'percentile fixture', [-5.4 + i * 3.6, 0, 0], 20, i === 2 ? C.orange : C.blueLight));
      for (let i = 0; i < 4; i++) outline('percentile-reference', [1.3, 5, 1.3], [-5.4 + i * 3.6, 2.5, 0], C.slate);
      anchor('0–100 percentile scale\nSynthetic comparison / no eligibility conclusion', [0, .1, 3.4], 'dimension'); return;
    }
    if (f === 'carbon_and_energy_study') {
      const vals = [185, 450, 320], units = ['kg CO₂e', 'kWh', 'mi'], scales = [50, 100, 100];
      vals.forEach((v, i) => bar(['Emissions', 'Energy', 'Distance'][i], v, units[i], [-4.5 + i * 4.5, 0, 0], scales[i], [C.slate, C.blue, C.orange][i]));
      for (let i = 0; i < 3; i++) anchor(`INDEPENDENT AXIS\n${scales[i]} ${units[i]} per metre`, [-4.5 + i * 4.5, .1, 2], 'dimension'); return;
    }
    if (f === 'detention_urgency_on_location') {
      for (let i = 0; i < 3; i++) {
        const x = -5 + i * 5; outline('parking-amount-slot', [3.7, .03, 2.4], [x, .04, -1.8], C.slate); smallTruck(`detention-trailer-${i}`, [x, .1, -1.8], 0, i === 2 ? C.orange : C.blue);
        bar(`Trailer Y0${i + 1}`, [0, 75, 225][i], 'USD accrued fixture', [x, 0, 1.6], 75, i === 2 ? C.orange : C.blueLight, { width: 1.3, depth: 1.3 });
      }
      anchor('$75 per vertical metre\nAmounts require accepted rate and event evidence', [0, .1, 3.8], 'dimension'); return;
    }
    if (f === 'quote_scenario_comparison') {
      const value = (label, fallback) => { const n = Number(c.metrics?.find(m => m.label === label)?.value); return Number.isFinite(n) ? n : fallback; };
      const a = value('Candidate A', 2650), b = value('Candidate B', 2820), deltaH = Math.abs(value('Duration difference', 4)), moneyScale = 500, timeScale = 1;
      for (const [i, cost] of [a, b].entries()) {
        const id = i ? 'candidate-b' : 'candidate-a', x = i ? 3.5 : -3.5, h = cost / moneyScale, g = group(id, [x, 0, -.7]);
        g.userData = { ...g.userData, label: `Candidate ${i ? 'B' : 'A'} all-in quote`, value: cost, unit: 'USD',
          description: `Synthetic equipment/lane candidate ${i ? 'B' : 'A'}: $${cost.toLocaleString('en-US')} all-in. Shared $${moneyScale} per vertical metre. Absolute service duration and faster-candidate identity are not supplied.` };
        rounded(`${id}:all-in-cost`, [1.8, h, 1.6], [0, h / 2, 0], i ? C.orange : C.blue, {}, g);
        for (let y = 1; y < h; y++) box(`${id}:money-tick`, [1.81, .014, 1.61], [0, y, 0], C.paper, {}, g);
        smallTruck(`${id}:equipment-symbol`, [0, .05, -2.4], 0, i ? C.orange : C.blue, g);
        anchor(`CANDIDATE ${i ? 'B' : 'A'}\n$${cost.toLocaleString('en-US')} ALL-IN`, [x, h + .5, -.7], i ? 'info' : 'selected');
      }
      segment('candidate-money-baseline', [-5.4, .035, -.7], [5.4, .035, -.7], C.ink, .03);
      dashed('candidate-a-cost-reference', [-4.5, a / moneyScale, -.7], [4.5, a / moneyScale, -.7], C.slate);
      const time = group('candidate-service-duration-difference', [0, .2, 2.5]);
      time.userData = { ...time.userData, label: 'Service duration difference', value: deltaH, unit: 'h',
        description: `Absolute duration difference is ${deltaH} h on an independent horizontal scale of ${timeScale} h per metre. Neither absolute duration nor which candidate is faster is supplied by the fixture.` };
      rounded('service-time-difference-bar', [deltaH / timeScale, .22, .8], [0, .11, 0], C.orangeLight, {}, time);
      for (let hour = 0; hour <= deltaH; hour++) segment('independent-hour-tick', [-deltaH / (2 * timeScale) + hour / timeScale, .04, .55], [-deltaH / (2 * timeScale) + hour / timeScale, .04, .85], C.orange, .015, time);
      anchor(`COST DIFFERENCE $${Math.abs(b - a).toLocaleString('en-US')}\nMoney: $500 per vertical metre`, [0, Math.max(a, b) / moneyScale + .8, -.7], 'metric');
      anchor(`SERVICE DIFFERENCE ${deltaH} h\nIndependent horizontal scale: 1 h per metre\nFaster option / absolute durations unspecified`, [0, .8, 3.5], 'dimension');
      addMetric('Candidate A all-in', a, 'USD'); addMetric('Candidate B all-in', b, 'USD'); addMetric('Cost difference', Math.abs(b - a), 'USD'); addMetric('Service duration difference', deltaH, 'h'); return;
    }
    if (f === 'margin_and_operating_ratio_landscape') {
      const revenues = [2200, 2400, 2500], costs = [2010, 2100, 2300];
      for (let i = 0; i < 3; i++) {
        const x = -5 + i * 5, scale = 500;
        bar(`Scenario ${String.fromCharCode(65 + i)} cost`, costs[i], 'USD', [x - .8, 0, 0], scale, C.blueLight, { width: 1.2, depth: 1.2 });
        bar(`Scenario ${String.fromCharCode(65 + i)} revenue`, revenues[i], 'USD', [x + .8, 0, 0], scale, i === 1 ? C.orange : C.blue, { width: 1.2, depth: 1.2 });
        anchor(`Margin $${revenues[i] - costs[i]}\nOR ${(costs[i] / revenues[i] * 100).toFixed(1)}%`, [x, .2, 2], i === 1 ? 'selected' : 'metric');
      }
      anchor('$500 per vertical metre\nFixed column footprint', [0, .1, 3.6], 'dimension'); return;
    }
    if (f === 'fuel_index_sensitivity') {
      const prices = [3.5, 4, 4.5, 5], gallons = 125;
      prices.forEach((v, i) => {
        const x = -5.5 + i * 3.6; bar(`$${v.toFixed(2)} / gal`, v * gallons, 'USD fuel fixture', [x, 0, 0], 150, i === 2 ? C.orange : C.blueLight);
        cylinder('diesel-drum', .27, .8, [x, .4, 2.1], C.slate); anchor('125 gal constant', [x, 1.1, 2.1]);
      }); anchor('$150 per vertical metre\nOnly price varies', [0, .1, 3.6], 'dimension'); return;
    }
    const names = raw.length ? raw.map(m => m.label) : (c.labels ?? ['Base cost', 'Fuel', 'Accessorial']);
    const vals = raw.length ? raw.map(m => Number(m.value)) : [1200, 380, 150];
    const unit = raw.map(m => m.unit).find(Boolean) ?? 'USD';
    const scale = Math.max(...vals.map(Math.abs), 1) / 4;
    for (let i = 0; i < Math.min(4, vals.length); i++) {
      const x = -(Math.min(4, vals.length) - 1) * 2 + i * 4;
      const thisUnit = raw[i]?.unit ?? unit;
      const sameUnit = raw.length === 0 || raw.every(m => m.unit === raw[0].unit);
      const thisScale = sameUnit ? scale : Math.max(Math.abs(vals[i]), 1) / (2.5 + i * .5);
      bar(names[i], vals[i], thisUnit, [x, 0, 0], thisScale, i === 1 ? C.orange : C.blueLight);
      if (!sameUnit) anchor(`Independent axis\n${thisScale.toFixed(2)} ${thisUnit} per metre`, [x, .1, 2.4], 'dimension');
      if (f === 'accessorial_action_anchors') { if (i === 0) pallet('accessorial-pallet', [x, 0, -2.6], { color: C.pale }); else if (i === 1) cylinder('accessorial-clock', .5, .12, [x, .2, -2.6], C.orange); else box('accessorial-liftgate', [1.5, .16, 1.5], [x, .4, -2.6], C.slate); }
    }
    if (f === 'equipment_linked_quote') smallTruck('quoted-equipment', [0, .03, -3.3], 0, C.blue);
    if (!raw.length || raw.every(m => m.unit === raw[0].unit)) anchor(`${scale.toFixed(2)} ${unit} per vertical metre\nFixed width and depth`, [0, .1, 3.6], 'dimension');
  }

  function buildEvidence() {
    const f = c.focus;
    if (f === 'three_dimensional_eld_logbook') {
      platform(16, 9); const levels = [0, 3, 1, 3, 0], spans = [6, 5, 1, 6, 6], colors = [C.pale, C.blue, C.orange, C.blue, C.pale];
      let hour = 0;
      for (let i = 0; i < spans.length; i++) {
        const w = spans[i] * .5, x = -6 + hour * .5 + w / 2, y = .25 + levels[i] * .65;
        box(`duty-interval-${i}`, [w, .18, 1], [x, y, 0], colors[i]);
        if (i) segment('duty-transition', [-6 + hour * .5, .25 + levels[i - 1] * .65, 0], [-6 + hour * .5, y, 0], C.slate, .025);
        anchor(`${['Off duty', 'Driving', 'On duty', 'Driving', 'Sleeper'][i]}\n${String(hour).padStart(2, '0')}:00–${String(hour + spans[i]).padStart(2, '0')}:00`, [x, y + .65, 0], i === 2 ? 'selected' : 'info'); hour += spans[i];
      }
      for (let i = 0; i <= 24; i += 3) { segment('hour-tick', [-6 + i * .5, .03, 1.1], [-6 + i * .5, .03, 1.4], C.slate, .01); if (i % 6 === 0) anchor(`${i} h`, [-6 + i * .5, .08, 1.8], 'dimension'); }
      anchor('24 h synthetic duty sequence\n0.50 m per hour · status height is categorical', [0, .1, 3.2], 'dimension'); return;
    }
    if (f === 'multi_day_recap_experiment') {
      platform(18, 11); for (let i = 0; i < 7; i++) {
        const x = -6 + i * 2; card(`recap-day-${i + 1}`, [x, .2, i % 2 ? .5 : 0], C.paper, root, { yaw: 0, accent: i === 6 ? C.orange : C.blue });
        bar(`Day ${i + 1}`, [8, 9.5, 7, 10, 8.5, 6, 9][i], 'duty hours', [x, .3, -2.4], 4, i === 6 ? C.orange : C.blueLight, { width: .75, depth: .75 });
      } anchor('4 duty hours per vertical metre\nSeven independent day records', [0, .1, 3.3], 'dimension'); return;
    }
    if (f === 'policy_expiry_timeline') {
      platform(17, 9); arrow('expiry-time-axis', [-6, .15, 0], [6.8, .15, 0], C.slate);
      const days = [0, 15, 30, 60]; days.forEach((d, i) => {
        const x = -6 + d * .2; card(`policy-${i}`, [x, .55 + ex * i * .3, -1], C.paper, root, { yaw: 0, accent: i === 2 ? C.orange : C.blue });
        beacon(`expiry-pin-${i}`, [x, .05, 1.5], i === 2 ? C.orange : C.blue, .7);
        anchor(`${c.labels?.[i] ?? `Policy ${i + 1}`}\n${d === 0 ? 'As-of date' : '+' + d + ' days'} / synthetic`, [x, 1.2 + ex * i * .3, -1], i === 2 ? 'warning' : 'info');
      }); anchor('Time axis: 0.20 m per day\nExpiry is source evidence, not coverage verification', [0, .1, 3], 'dimension'); return;
    }
    if (f === 'authority_and_policy_gate_structure') {
      platform(16, 9); for (let i = 0; i < 3; i++) {
        const x = -4.8 + i * 4.8; dock(`evidence-gate-${i}`, [x, 0, 0], { open: i !== 1, selected: i === 1 });
        card(`gate-source-${i}`, [x, .2, 2.4], C.paper, root, { accent: i === 1 ? C.orange : C.blue });
        note(i, [x, 4.3, 0], ['Authority source', 'Policy source missing', 'Review decision'][i], i === 1 ? 'warning' : 'info');
      } arrow('evidence-gate-flow', [-6, .1, -2], [6.5, .1, -2], C.blue); return;
    }
    if (f === 'receipt_discrepancy_and_evidence') {
      platform(13, 9); card('expected-manifest', [-3.3, .25, 0], C.paper); card('received-scan-log', [3.3, .25, 0], C.paper, root, { accent: C.orange });
      for (let i = 0; i < 18; i++) {
        const x = -2 + (i % 6) * .8, z = -2.2 + Math.floor(i / 6) * .8;
        if (i === 17) outline('missing-HU-18', [.55, .55, .55], [x, .28, z], C.orange); else box(`receipt-unit-${i + 1}`, [.55, .55, .55], [x, .28, z], C.blueLight);
      }
      note(0, [-3.3, 1, 0], 'Expected: 18 unit IDs'); note(1, [3.3, 1, 0], 'Received: 17 unit IDs', 'warning'); note(2, [2, 1.1, -.6], 'HU-18 missing / fixture'); addMetric('Expected units', 18, 'count'); addMetric('Scanned units', 17, 'count'); return;
    }
    if (f === 'state_and_provenance_grammar') {
      platform(18, 8); const names = ['Proposed', 'Reserved', 'Observed', 'Unknown', 'Needs review'];
      names.forEach((name, i) => { const x = -6.4 + i * 3.2; cylinder(`state-plinth-${i}`, 1.1, .2, [x, .1, 0], C.paper); rounded(`state-record-${i}`, [1.3, .8, 1.3], [x, .6, 0], [C.blueLight, C.blue, C.green, C.pale, C.orange][i]); if (i === 3) outline('unknown-envelope', [1.5, 1, 1.5], [x, .6, 0], C.slate); anchor(`${name}\nStatus + source label`, [x, 1.6, 0], i === 4 ? 'warning' : 'info'); }); return;
    }
    if (f === 'edi_transaction_evidence_flow') {
      platform(16, 9); const titles = ['204 / tender', '214 / status', '210 / invoice'];
      titles.forEach((name, i) => { const x = -5 + i * 5; card(name, [x, .3 + ex * i * .4, 0], C.paper, root, { yaw: 0, accent: i === 2 ? C.orange : C.blue }); anchor(`${name}\nSynthetic message / linked unit IDs`, [x, 1.1 + ex * i * .4, 0]); if (i < 2) arrow('transaction-link', [x + 1.4, .4, 0], [x + 3.5, .4, 0], C.blue); }); return;
    }
    if (f === 'deterministic_review_snapshot') {
      platform(11, 8); card('capture-manifest', [2.8, .4, 0], C.paper); pallet('captured-HU-01', [-2.1, 0, 0], { selected: true });
      rounded('review-camera', [.9, .65, .5], [-3.4, 2.1, 2.2], C.ink); cylinder('camera-lens', .25, .35, [-3.4, 2.1, 1.8], C.blue, { rotation: [Math.PI / 2, 0, 0] });
      dashed('capture-frustum-left', [-3.4, 2.1, 1.8], [-2.8, .3, -.5], C.slate); dashed('capture-frustum-right', [-3.4, 2.1, 1.8], [-1.4, 1.6, .5], C.slate);
      note(0, [2.8, 1.2, 0], `${c.id} / fixture revision 1`, 'selected'); note(1, [-2.1, 2, 0], 'Exact identity and camera retained'); return;
    }
    if (f === 'rate_confirmation_evidence_stack') {
      platform(14, 10); card('rate-confirmation', [0, .55, 0], C.paper, root, { yaw: -.05 });
      for (const [i, x] of [-4.2, 4.2].entries()) {
        card(['accepted-quote-source', 'carrier-assignment-source'][i], [x, .2, -1], C.paper, root, { yaw: i ? .08 : -.08, accent: i ? C.orange : C.blue });
        arrow('confirmation-source-link', [x * .7, .4, -.7], [Math.sign(x) * 1.6, .6, -.2], C.blue);
      }
      rounded('signature-field', [1.7, .04, .45], [0, .63, .8], C.blueLight);
      anchor('Rate confirmation / synthetic document\n$1,800 linehaul + $150 accessorial = $1,950', [0, 1.6, 0], 'selected');
      anchor('Acceptance evidence\nSeparate from document generation', [-4.2, 1, -1]); anchor('Assigned carrier identity\nSource fixture / not booked', [4.2, 1, -1]);
      addMetric('Linehaul', 1800, 'USD'); addMetric('Accessorial', 150, 'USD'); addMetric('Document total', 1950, 'USD'); return;
    }
    if (f === 'dispatch_packet_and_bol_scene') {
      platform(15, 10); pallet('packet-HU-01', [-4.5, 0, 0], { selected: true }); crate('packet-HU-02', [-2.5, 0, 0]);
      for (let i = 0; i < 4; i++) card(`dispatch-document-${i}`, [2.7 + i * .45, .2 + i * (.18 + ex * .2), -.6 + i * .45], C.paper, root, { yaw: -.14 + i * .04, accent: i === 3 ? C.orange : C.blue });
      arrow('unit-to-manifest-identity', [-1.5, .4, 0], [1.3, .4, 0], C.blue);
      anchor('HU-01 / HU-02\nIdentity retained into BOL manifest', [-3.5, 1.8, 0], 'selected');
      anchor('BOL + loading plan + source evidence\nSynthetic dispatch packet', [3.5, 2 + ex * .6, .3]);
      anchor('Signature field is empty\nNo issued-document or dispatch claim', [5.5, .5, 2.6], 'dimension'); return;
    }
    if (f === 'audit_evidence_and_exception_layers') {
      platform(15, 11); const layers = ['Source records', 'Observed events', 'Policy interpretation'];
      for (let i = 0; i < 3; i++) {
        const y = .25 + i * (1.35 + ex * .8);
        box(`audit-evidence-plane-${i}`, [10, .08, 6], [0, y, 0], i === 2 ? C.orangeLight : C.blueLight, { opacity: .13 });
        card(`audit-layer-record-${i}`, [-2.7 + i * 2.7, y + .11, 0], C.paper, root, { accent: i === 2 ? C.orange : C.blue, yaw: 0 });
        anchor(`${layers[i]}\nSeparate evidence tier / synthetic`, [4.8, y + .55, .4], i === 2 ? 'warning' : 'info');
      }
      dashed('audit-provenance', [-2.7, .45, 0], [2.7, 3.1 + ex * 1.6, 0], C.orange); return;
    }
    if (f === 'evidence_provenance_inspection') {
      platform(16, 12); card('derived-claim', [0, 1.1, 0], C.paper, root, { accent: C.orange, yaw: 0 });
      const sources = [[-4.7, .25, -3.5], [4.7, .25, -3.5], [0, .25, 4.2]];
      sources.forEach((p, i) => {
        card(`original-source-${i}`, p, C.paper, root, { yaw: 0 });
        arrow(`provenance-link-${i}`, [p[0] * .7, .6, p[2] * .7], [p[0] * .28, 1.15, p[2] * .28], C.blue);
        anchor(`Source ${i + 1}\nOrigin · timestamp · revision`, [p[0], 1.1, p[2]]);
      });
      anchor('Derived explanation\nTrace every assertion to its source', [0, 2.2, 0], 'selected'); return;
    }
    const provenance = /provenance|audit|revision/.test(f), packet = /packet|confirmation/.test(f), decision = /review_decision/.test(f);
    const n = provenance ? 4 : packet ? 5 : 3;
    for (let i = 0; i < n; i++) {
      const x = provenance ? -5.2 + i * 3.4 : packet ? (i - 2) * .72 : -4.2 + i * 4.2;
      const z = provenance ? (i % 2 ? 1.3 : -1.3) : packet ? (i - 2) * .5 : 0;
      const y = packet ? .2 + i * .32 + ex * i * .3 : .3 + (f.includes('revision') ? (i === Math.round(t * (n - 1)) ? .8 : 0) : 0);
      card(`evidence-record-${i + 1}`, [x, y, z], C.paper, root, { accent: decision && i === 1 || i === n - 1 ? C.orange : C.blue, yaw: packet ? -.15 + i * .06 : 0 });
      anchor(`${c.labels?.[i] ?? `Evidence record ${i + 1}`}\n${provenance ? `Source rev ${i + 1} / synthetic` : packet ? ['BOL', 'Manifest', 'Rate details', 'Receipt', 'Signature proposal'][i] : decision ? ['Source record', 'Reviewer choice', 'Recovery record'][i] : 'Linked evidence fixture'}`, [x, y + .7, z], i === n - 1 ? 'selected' : 'info');
      if (provenance && i < n - 1) arrow(`source-link-${i}`, [x + 1.4, y + .1, z], [x + 2, y + .1, -z], C.blue);
    }
    if (decision) {
      box('decision-choice-A', [1.2, .15, .8], [0, .2, 2.5], C.blue); box('decision-choice-B', [1.2, .15, .8], [2, .2, 2.5], C.orangeLight); note(3, [1, .6, 2.5], 'Explicit human review remains pending');
    }
    addMetric('Synthetic evidence records', n, 'count');
  }

  function buildNetwork() {
    const f = c.focus;
    if (f === 'spatial_lifecycle_status') {
      platform(31, 13); const inputRevision = 12;
      const stages = [
        { id: 'equipment', label: 'Equipment', state: 'recorded', resultRevision: 12, consequence: 'Current source dimensions retained' },
        { id: 'cargo', label: 'Cargo fit', state: 'recorded', resultRevision: 12, consequence: 'Current modeled result recorded' },
        { id: 'warehouse', label: 'Receiving space', state: 'recorded', resultRevision: 12, consequence: 'Scenario allocation record present' },
        { id: 'yard', label: 'Yard handoff', state: 'current', resultRevision: 12, consequence: 'Current focus / recorded input r12' },
        { id: 'carrier', label: 'Carrier evidence', state: 'recorded', resultRevision: 12, consequence: 'Source review record retained' },
        { id: 'quote', label: 'Quote', state: 'stale', resultRevision: 11, consequence: 'Requote against current input r12' },
        { id: 'duty', label: 'Duty plan', state: 'rejected', resultRevision: 12, consequence: 'Rejected proposal requires remedy / review' },
        { id: 'receipt', label: 'Receipt', state: 'missing', resultRevision: null, consequence: 'No receipt result; do not infer delivery' },
      ];
      const coordinates = [];
      stages.forEach((s, i) => {
        const x = -12.6 + i * 3.6, z = i % 2 ? .6 : -.6, g = group(`stage-${s.id}`, [x, 0, z]); coordinates.push([x, .22, z]);
        g.userData = { ...g.userData, label: `${s.label} / ${s.state}`, status: s.state, recorded: s.state === 'recorded' || s.state === 'current', inputRevision, resultRevision: s.resultRevision,
          description: `Synthetic ${s.label} state ${s.state}. Current input r${inputRevision}; result input ${s.resultRevision === null ? 'missing' : 'r' + s.resultRevision}. Consequence: ${s.consequence}. This drawing changes no shipment state.` };
        rounded('stage-foundation', [2.8, .18, 2.5], [0, .09, 0], C.paper, {}, g);
        const col = s.state === 'current' ? C.blue : s.state === 'stale' ? C.orange : s.state === 'rejected' ? C.red : C.pale;
        if (s.state === 'missing') outline('missing-result-volume', [1.6, 1.35, 1.35], [0, .9, 0], C.slate, g);
        else {
          rounded('stage-record', [1.6, s.state === 'current' ? 1.6 : 1.2, 1.35], [0, s.state === 'current' ? 1 : .8, 0], col, { opacity: s.state === 'stale' ? .3 : 1 }, g);
          if (s.state === 'stale') outline('old-result-ghost', [1.65, 1.25, 1.4], [0, .82, 0], C.orange, g);
          if (s.state === 'rejected') {
            segment('rejected-cross-A', [-.55, 1.47, -.4], [.55, 1.47, .4], C.paper, .055, g);
            segment('rejected-cross-B', [-.55, 1.47, .4], [.55, 1.47, -.4], C.paper, .055, g);
          }
        }
        if (s.state === 'current') ring('current-stage-halo', 1.35, [0, .22, 0], C.blue, g, .055);
      });
      for (let i = 0; i < coordinates.length - 1; i++) {
        const [a, b] = [coordinates[i], coordinates[i + 1]]; arrow(`stage-link-${i}`, [a[0] + 1.45, a[1], a[2]], [b[0] - 1.45, b[1], b[2]], i >= 4 ? C.orange : C.blue, root, .2);
      }
      for (const id of ['yard', 'quote', 'duty', 'receipt']) {
        const i = stages.findIndex(s => s.id === id), s = stages[i], p = coordinates[i];
        anchor(`${s.state.toUpperCase()} / ${s.label}\nResult ${s.resultRevision === null ? 'MISSING' : 'r' + s.resultRevision} · input r${inputRevision}\n${s.consequence}`, [p[0], id === 'yard' ? 2.65 : 2.3, p[2]], id === 'yard' ? 'selected' : 'warning');
      }
      anchor('5 CURRENT-REVISION RECORDED STAGES\nEquipment · fit · receiving · current yard · carrier evidence\nStale, rejected, and missing are distinct consequences', [-6.8, 2.8, -2.9], 'dimension');
      addMetric('Recorded stages at current revision', 5, 'count'); addMetric('Stale stages', 1, 'count'); addMetric('Rejected stages', 1, 'count'); addMetric('Missing stages', 1, 'count'); return;
    }
    const specs = {
      carrier_identity_spatial_dossier: { shape: 'star', names: ['Carrier identity', 'Authority', 'Insurance', 'Fleet', 'Ownership'], types: ['identity', 'document', 'document', 'truck', 'identity'] },
      fraud_relationship_evidence_graph: { shape: 'mesh', names: ['Carrier A', 'Carrier B', 'Address record', 'Phone record', 'Policy source', 'Reviewer'], types: ['identity', 'identity', 'document', 'document', 'document', 'identity'] },
      carrier_comparison_workspace: { shape: 'compare', names: ['Carrier A', 'Carrier B', 'Carrier C', 'Evidence A', 'Evidence B', 'Evidence C'], types: ['identity', 'identity', 'identity', 'document', 'document', 'document'] },
      carrier_event_propagation: { shape: 'star', names: ['Carrier event', 'Cargo plan', 'Quote', 'Duty plan', 'Dispatch'], types: ['document', 'truck', 'document', 'document', 'building'] },
      end_to_end_shipment_world: { shape: 'chain', names: ['Supplier', 'Cargo plan', 'Linehaul', 'Receiving', 'Receipt'], types: ['building', 'pallet', 'truck', 'building', 'document'] },
      spatial_lifecycle_status: { shape: 'chain', names: ['Planned', 'Reserved', 'Dispatched', 'Arrived', 'Received'], types: ['document', 'pallet', 'truck', 'building', 'document'] },
      dispatch_prerequisite_scene: { shape: 'gate', names: ['Dispatch proposal', 'Cargo fit', 'Carrier evidence', 'Duty plan', 'Quote accepted'], types: ['truck', 'pallet', 'identity', 'document', 'document'] },
      exception_focus_and_recovery: { shape: 'fork', names: ['Shipment', 'Exception', 'Evidence', 'Recovery A', 'Recovery B'], types: ['truck', 'document', 'document', 'building', 'building'] },
      fleet_and_shipment_portfolio: { shape: 'grid', names: ['Shipment 01', 'Shipment 02', 'Shipment 03', 'Shipment 04', 'Shipment 05', 'Shipment 06'], types: ['truck', 'truck', 'truck', 'truck', 'truck', 'truck'] },
      role_specific_spatial_workspace: { shape: 'roles', names: ['Shared shipment', 'Dispatcher', 'Driver', 'Receiver', 'Reviewer'], types: ['truck', 'identity', 'identity', 'identity', 'document'] },
      canonical_spatial_identity: { shape: 'chain', names: ['HU-01 / manifest', 'HU-01 / trailer', 'HU-01 / dock', 'HU-01 / rack'], types: ['document', 'pallet', 'pallet', 'pallet'] },
      multi_scale_semantic_zoom: { shape: 'zoom', names: ['Facility', 'Zone', 'Rack', 'HU-01'], types: ['building', 'building', 'pallet', 'pallet'] },
      responsive_spatial_workspace: { shape: 'compact', names: ['Focused shipment', 'Source', 'Next action', 'Exact details'], types: ['truck', 'document', 'document', 'document'] },
    };
    const spec = specs[f] ?? { shape: 'star', names: c.labels ?? ['Shipment', 'Evidence', 'Location', 'Decision'], types: ['truck', 'document', 'building', 'identity'] };
    const n = spec.names.length; platform(spec.shape === 'chain' ? 25 : 21, spec.shape === 'compact' ? 12 : 18);
    function position(i) {
      if (spec.shape === 'chain') return [-10 + i * 20 / (n - 1), i === 2 ? .5 : 0, i % 2 ? 1.2 : -1.2];
      if (spec.shape === 'compare') return [-6 + (i % 3) * 6, i < 3 ? .4 : 0, i < 3 ? -3 : 3];
      if (spec.shape === 'grid') return [-6 + (i % 3) * 6, 0, i < 3 ? -3.5 : 3.5];
      if (spec.shape === 'compact') return [[0, .6, -2], [-3.8, 0, 2.5], [0, 0, 3], [3.8, 0, 2.5]][i];
      if (spec.shape === 'zoom') return [-7.5 + i * 5, i * .5, -4.5 + i * 3];
      if (spec.shape === 'fork') return [[-7, 0, 0], [-2, .5, 0], [-2, 0, -5], [5.5, 0, -3.2], [5.5, 0, 3.2]][i];
      if (spec.shape === 'gate') return i === 0 ? [0, .9, 0] : [-6 + (i - 1) * 4, 0, i % 2 ? -5 : 5];
      if (spec.shape === 'roles') return i === 0 ? [0, .8, 0] : [Math.cos((i - 1) * Math.PI / 2) * 6.2, 0, Math.sin((i - 1) * Math.PI / 2) * 5.6];
      if (spec.shape === 'mesh') return [[-4, .6, 0], [4, .6, 0], [-6, 0, -5], [0, 0, -5], [6, 0, -5], [0, 0, 5]][i];
      return i === 0 ? [0, .6, 0] : [Math.cos((i - 1) * 2 * Math.PI / (n - 1)) * 6.7, 0, Math.sin((i - 1) * 2 * Math.PI / (n - 1)) * 5.6];
    }
    const positions = Array.from({ length: n }, (_, i) => position(i));
    for (let i = 0; i < n; i++) {
      const p = positions[i], g = group(`node-${spec.names[i]}`, p), selected = i === (f.includes('exception') ? 1 : 0), col = selected ? C.orange : C.blue;
      rounded('node-foundation', [3.3, .2, 2.6], [0, .1, 0], selected ? C.orangeLight : C.paper, {}, g);
      const type = spec.types[i] ?? 'document';
      if (type === 'truck') smallTruck('node-vehicle', [0, .2, 0], 0, col, g);
      else if (type === 'pallet') pallet('node-handling-unit', [0, .2, 0], { color: selected ? C.orangeLight : C.blueLight, selected }, g);
      else if (type === 'building') {
        box('node-building', [2.5, 1.2, 1.7], [0, .8, 0], C.pale, {}, g);
        box('node-roof', [2.65, .1, 1.85], [0, 1.45, 0], C.paper, {}, g);
        for (let k = 0; k < 3; k++) box('node-dock-door', [.5, .7, .03], [-.8 + k * .8, .65, .87], col, {}, g);
      } else if (type === 'identity') {
        cylinder('node-identity-base', .75, .4, [0, .4, 0], col, {}, g);
        cylinder('node-identity-torso', .45, .9, [0, 1.05, 0], col, {}, g);
        sphere('node-identity-head', .38, [0, 1.88, 0], C.pale, {}, g);
        outline('identity-boundary', [2.1, 2.4, 1.7], [0, 1.3, 0], selected ? C.orange : C.blue, g);
      } else card('node-evidence', [0, .3, 0], C.paper, g, { accent: col, yaw: 0 });
      const label = spec.names[i];
      anchor(`${label}\n${f.includes('fraud') ? 'Relationship fixture / unverified' : f.includes('identity') ? 'Stable source ID retained' : 'Synthetic linked record'}`, [p[0], p[1] + (type === 'identity' ? 3 : 2.2), p[2]], selected ? 'selected' : 'info');
      if (spec.shape === 'zoom') outline('semantic-zoom-envelope', [3.6, 2.1 - i * .2, 3.1], [p[0], p[1] + 1.05, p[2]], i === n - 1 ? C.orange : C.blue);
    }
    const edges = [];
    if (['chain', 'zoom'].includes(spec.shape)) for (let i = 0; i < n - 1; i++) edges.push([i, i + 1]);
    else if (spec.shape === 'compare') for (let i = 0; i < 3; i++) edges.push([i, i + 3]);
    else if (spec.shape === 'grid') edges.push([0, 1], [1, 2], [3, 4], [4, 5], [1, 4]);
    else if (spec.shape === 'fork') edges.push([0, 1], [1, 2], [1, 3], [1, 4]);
    else if (spec.shape === 'mesh') edges.push([0, 2], [0, 3], [1, 3], [1, 4], [0, 1], [0, 5], [1, 5]);
    else for (let i = 1; i < n; i++) edges.push([0, i]);
    edges.forEach(([a, b], i) => {
      const av = new THREE.Vector3(...positions[a]), bv = new THREE.Vector3(...positions[b]), dir = bv.clone().sub(av).normalize();
      const start = av.clone().addScaledVector(dir, 1.8), end = bv.clone().addScaledVector(dir, -1.8); start.y += .22; end.y += .22;
      arrow(`relationship-${a}-${b}`, start.toArray(), end.toArray(), spec.shape === 'mesh' && i === 4 || spec.shape === 'fork' && b === 4 ? C.orange : C.blue, root, .28);
      if (i === 0 || spec.shape === 'mesh' && i === 4) { const mid = start.clone().add(end).multiplyScalar(.5); anchor(spec.shape === 'mesh' ? 'Shared-source link\nHypothesis requiring evidence' : spec.shape === 'zoom' ? 'Contains / derived scale' : 'Linked by canonical identity', [mid.x, mid.y + .45, mid.z], spec.shape === 'mesh' ? 'warning' : 'dimension'); }
    });
    if (f === 'responsive_spatial_workspace') { outline('focused-viewport', [5, 3.7, 4], [0, 1.85, -2], C.orange); note(3, [4.5, .3, 6], 'Progressive disclosure / exact-value equivalent'); }
    addMetric('Semantic nodes', n, 'count'); addMetric('Relationship edges', edges.length, 'count');
  }

  const builders = { cargo: buildCargo, vehicle: buildVehicle, facility: buildFacility, route: buildRoute, finance: buildFinance, evidence: buildEvidence, network: buildNetwork };
  (builders[c.family] ?? buildCargo)();
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  const cameraBounds = new THREE.Box3();
  root.traverse(obj => {
    if (!obj.isMesh || obj.userData.cameraRelevant === false) return;
    if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
    cameraBounds.union(obj.geometry.boundingBox.clone().applyMatrix4(obj.matrixWorld));
  });
  if (cameraBounds.isEmpty()) cameraBounds.copy(bounds);
  return {
    root, anchors, bounds, cameraBounds,
    summary: {
      id: c.id, family: c.family, focus: c.focus, synthetic: true,
      coordinateFrame: root.userData.coordinateFrame ?? (c.family === 'finance' || c.family === 'evidence' || c.family === 'network' ? 'Declared semantic scale; Y up' : 'Metres; X length, Y up, Z width'),
      fixtureMetrics, reviewStatus: 'pending',
      description: `${c.title}: ${c.intent} Authored ${c.family} scene with synthetic fixtures, exact object identity, and declared physical or semantic scale.`,
      limitation: 'Isolated visual study. Source case metrics are illustrative scenario inputs unless matched to these geometry-derived fixture values. No operational evaluation or product integration.',
    },
  };
}
