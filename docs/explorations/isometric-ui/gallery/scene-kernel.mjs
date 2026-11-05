/**
 * Isolated synthetic visual studies. No product engine, store, or operational rule
 * is imported. Physical fixtures use metres, X length, Y up, Z width. Semantic
 * diagrams declare their own scale through anchors and summary.fixtureMetrics.
 */
export const palette = Object.freeze({
  paper: '#ffffff', ground: '#edf1f5', edge: '#d3dce6', ink: '#203248',
  slate: '#8093a8', pale: '#b9c7d7', blue: '#2466dc', blueLight: '#77a2e5',
  orange: '#f27a35', orangeLight: '#ffd4b6', green: '#348b78', wood: '#c4a47e',
  rubber: '#26313d', silver: '#cbd4dd', red: '#c95048', cyan: '#5aadc6',
});

const C=palette;

export function createSceneKernel(THREE, c, { mode = 'dimensions', phase = 1, explode = 0, fixture = {} } = {}) {
  const root = new THREE.Group();
  root.name = `${c.id} ${c.title}`;
  root.userData = { entityId: c.id, caseId: c.id, synthetic: true, family: c.family, focus: c.focus, inspectable: false };
  const anchors = [], objects = [], fixtureMetrics = [];
  const materials = new Map();
  const t = Math.max(0, Math.min(1, Number(phase) || 0));
  const ex = Math.max(0, Math.min(1, Number(explode) || 0));
  let serial = 0;
  const subjectNames=new Map();
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
    const base=parent===root?`${c.id}:${name}`:`${parent.userData.entityId}/${name}`;
    const occurrence=(subjectNames.get(base)||0)+1;subjectNames.set(base,occurrence);
    obj.userData = {
      entityId: occurrence===1?base:`${base}~${occurrence}`, instanceId: `${c.id}:${name}:${serial++}`, caseId: c.id,
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
  function editHandle(field, p, axis, multiplier = 1, radius = .065) {
    const handle=sphere(`editable-handle-${field}`,radius,p,C.orange);
    handle.userData.editHandle={field,axis,multiplier};return handle;
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
    } else {const loadH=Math.max(.025,cargoH-.012);rounded(`${name}:load`, [l - .03, loadH, w - .03], [0, .15 + loadH / 2, 0], color, { opacity }, g);}
    for (const x of [-l * .3, l * .3]) {
      box(`${name}:band-top${x}`, [.035, .016, w - .015], [x, h - .008, 0], C.paper, { opacity }, g);
      box(`${name}:band-side${x}`, [.035, cargoH, .013], [x, .15 + cargoH / 2, w / 2 - .007], C.paper, { opacity }, g);
    }
    box(`${name}:identity`, [.27, .14, .018], [l * .18, .55, w / 2 + .004], C.paper, { opacity }, g);
    for (let i = 0; i < 8; i++) box(`${name}:barcode${i}`, [.009 + (i % 3) * .003, .08, .009], [l * .18 - .1 + i * .026, .55, w / 2 + .016], C.ink, { opacity }, g);
    if (o.selected) outline(`${name}:selection`, [l + .08, h + .06, w + .08], [0, h / 2, 0], C.blue, g);
    for (let y = .22; y < h-.02; y += .14) {
      box(`${name}:wrap-front${y}`, [l - .025, .006, .006], [0, y, w / 2 - .006], C.blueLight, { opacity: opacity * .24, shadow: false }, g);
      box(`${name}:wrap-end${y}`, [.006, .006, w - .025], [l / 2 - .006, y, 0], C.blueLight, { opacity: opacity * .18, shadow: false }, g);
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

  return {root,anchors,fixtureMetrics,t,ex,material,tag,group,mesh,box,rounded,cylinder,sphere,editHandle,segment,arrow,dashed,outline,anchor,note,measure,platform,ring,cone,pallet,crate,drum,container,cargoGrid,wheel,truck,smallTruck,forklift,rack,dock,curve,card,bar,addMetric,beacon};
}
