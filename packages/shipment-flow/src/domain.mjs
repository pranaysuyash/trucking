import { createHash, randomUUID } from 'node:crypto';
import { reviewedGeometryIssue } from './reviewedGeometry.mjs';
import { carrierFreshness } from './carrierFreshness.mjs';

export const STAGES = ['asset', 'fit', 'warehouse', 'yard', 'carrier', 'quote', 'hos'];
export const STAGE_PRODUCTS = {
  asset: 'product-04-asset-studio', fit: 'product-01-cargo-fit', warehouse: 'product-06-warehouse-space-flow',
  yard: 'product-07-yard-dock', carrier: 'product-08-carrier-trust', quote: 'product-02-freight-pricing', hos: 'product-03-hos-planner',
};
export class FlowError extends Error {
  constructor(message, status = 422) { super(message); this.status = status; }
}
const requireThat = (test, message, status) => { if (!test) throw new FlowError(message, status); };
const text = (s, max = 200) => typeof s === 'string' && s.trim().length > 0 && s.length <= max;
const positive = n => Number.isFinite(n) && n > 0;
const sameIds = (expected, actual) => Array.isArray(actual) && actual.length === expected.length &&
  new Set(actual).size === actual.length && expected.every(id => actual.includes(id));

export function validateInput(input) {
  requireThat(input && ['origin', 'destination', 'equipmentId', 'carrierDot', 'driverId', 'tractorId', 'trailerId'].every(k => text(input[k])), 'Shipment identity and route fields are required.');
  requireThat(positive(input.loadedMiles) && input.loadedMiles <= 5000 && Number.isFinite(input.deadheadMiles) && input.deadheadMiles >= 0 && input.deadheadMiles <= 5000, 'Route miles must be finite and within the supported scenario range.');
  requireThat(Number.isFinite(input.priorRestHours) && input.priorRestHours >= 10 && input.priorRestHours <= 48, 'This bounded scenario requires a declared full rest of at least ten hours. Split-sleeper planning is unsupported.');
  requireThat(Array.isArray(input.units) && input.units.length > 0 && input.units.length <= 100, 'Declare between one and 100 handling units.');
  requireThat(new Set(input.units.map(u => u.id)).size === input.units.length && new Set(input.units.map(u => u.barcode)).size === input.units.length, 'Handling unit IDs and barcodes must be unique.');
  for (const u of input.units) {
    requireThat(u && text(u.id, 80) && text(u.barcode, 80) && text(u.description) && ['lengthIn', 'widthIn', 'heightIn', 'weightLbs'].every(k => positive(u[k])) && typeof u.stackable === 'boolean' && ['ambient', 'chilled', 'frozen'].includes(u.temperatureClass), 'Every handling unit needs valid identity, dimensions, mass and handling constraints.');
    requireThat(u.temperatureClass === 'ambient', 'The connected local slice currently supports ambient general freight only. Cold-chain qualification requires additional evidence.');
  }
  return structuredClone(input);
}

export function createShipment(reference = 'Regional distribution scenario', now = new Date().toISOString()) {
  requireThat(text(reference), 'A shipment reference is required.');
  const id = randomUUID();
  const input = validateInput({
      origin: 'Chicago, IL', destination: 'Milwaukee, WI', loadedMiles: 95, deadheadMiles: 12,
      equipmentId: 'dry-van-53', carrierDot: '389211', driverId: 'SCENARIO-DRIVER-01', tractorId: 'SCENARIO-TRACTOR-01', trailerId: 'SCENARIO-TRAILER-01', priorRestHours: 10,
      units: [
        { id: `${id}-HU-01`, barcode: `${id}-01`, description: 'Machine components pallet', lengthIn: 48, widthIn: 40, heightIn: 48, weightLbs: 1200, stackable: false, temperatureClass: 'ambient' },
        { id: `${id}-HU-02`, barcode: `${id}-02`, description: 'Replacement parts pallet', lengthIn: 48, widthIn: 40, heightIn: 52, weightLbs: 1500, stackable: false, temperatureClass: 'ambient' },
      ],
    });
  return {
    id, reference, mode: 'local_scenario', revision: 1, inputRevision: 1, status: 'draft', results: {}, exceptions: [], operations: {}, input,
    events: [{ id: randomUUID(), type: 'created', productId: 'command-center-portal', at: now, inputRevision: 1, note: 'Explicit local scenario created. No live carrier, device or physical delivery evidence.', payload: { input: structuredClone(input) } }],
  };
}

export function dispatchBlockers(shipment, now = new Date().toISOString()) {
  const blockers = [];
  for (const stage of STAGES) {
    const result = shipment.results[stage];
    if (!result || result.inputRevision !== shipment.inputRevision) blockers.push(`${stage}: missing or stale`);
    else if (stage === 'hos' && result.details?.assessment === 'indeterminate') blockers.push('hos: duty assessment indeterminate');
    else if (!result.ok) blockers.push(`${stage}: rejected`);
    else if (stage === 'hos') blockers.push('hos: recorded duty status unverified; cycle-history validation is not supported');
  }
  const carrier = shipment.results.carrier;
  if (carrier?.ok && carrier.inputRevision === shipment.inputRevision) {
    const freshness = carrierFreshness(carrier.details?.expiresAt, now);
    if (freshness === 'missing') blockers.push('carrier: policy evidence expiry missing');
    else if (freshness === 'invalid') blockers.push('carrier: policy evidence expiry or current time invalid');
    else if (freshness === 'expired') blockers.push('carrier: policy evidence expired');
  }
  if (shipment.exceptions.some(e => !e.resolved)) blockers.push('Unresolved shipment exception');
  return blockers;
}

function validateResult(shipment, stage, result, now) {
  requireThat(result && typeof result.ok === 'boolean' && text(result.summary, 1000) && result.details && typeof result.details === 'object', 'A structured engine result is required.');
  if (stage === 'hos' && result.ok) throw new FlowError('Positive duty decisions are unavailable: validated cycle history is not supported.');
  if (stage === 'hos' && result.details.assessment === 'indeterminate') {
    requireThat(result.details.assessmentVersion === 1 && result.details.driverId === shipment.input.driverId && result.details.isLegal === false && result.details.priorRestHours === shipment.input.priorRestHours && Array.isArray(result.details.assessmentReasons) && result.details.assessmentReasons.some(reason => text(reason, 1000)), 'An indeterminate duty review must use the supported version and identify the current driver, declared rest and missing evidence.');
  }
  if (!result.ok) return;
  const d = result.details;
  const ids = shipment.input.units.map(u => u.id);
  if (stage === 'asset') requireThat(d.equipmentId === shipment.input.equipmentId && ['lengthIn', 'widthIn', 'heightIn', 'doorWidthIn', 'doorHeightIn', 'payloadLbs'].every(k => positive(d[k])), 'Equipment snapshot is incomplete or belongs to another selected asset.');
  if (stage === 'fit') {
    requireThat(shipment.results.asset?.inputRevision === shipment.inputRevision && shipment.results.asset.ok, 'Publish current equipment before solving cargo.');
    requireThat(sameIds(ids, d.unitIds) && Array.isArray(d.placements) && d.placements.length === ids.length && d.geometryFeasible === true && d.violations === 0, 'Every handling unit must be placed and independently validated.');
    if (d.provenance?.source === 'reviewed_native_arrangement' || d.nativeScenario) {
      const geometryIssue = reviewedGeometryIssue(shipment.input.units, d.placements, d.equipmentSnapshot);
      requireThat(!geometryIssue, geometryIssue ?? 'Invalid reviewed geometry.');
      const asset = shipment.results.asset.details;
      requireThat(['L', 'W', 'H'].every((key, i) => Math.abs(d.equipmentSnapshot[key] - [asset.lengthIn, asset.widthIn, asset.heightIn][i] * 25.4) <= 0.02), 'Reviewed geometry belongs to a different declared equipment envelope.');
    }
  }
  if (stage === 'warehouse') {
    requireThat(shipment.results.fit?.inputRevision === shipment.inputRevision && shipment.results.fit.ok, 'Publish a current loading plan before reserving receiving space.');
    if (d.fitRecordedAt !== undefined) requireThat(d.fitRecordedAt === shipment.results.fit.recordedAt, 'Receiving plan refers to a different loading plan. Refresh and review.', 409);
    requireThat(Array.isArray(d.assignments) && sameIds(ids, d.assignments.map(a => a.unitId)) && new Set(d.assignments.map(a => a.slotCode)).size === ids.length && d.assignments.every(a => text(a.slotCode) && text(a.slotId) && a.barcode === shipment.input.units.find(u => u.id === a.unitId)?.barcode), 'Receiving assignments must retain every handling unit and barcode exactly once.');
  }
  if (stage === 'yard') {
    requireThat(shipment.results.warehouse?.ok && shipment.results.warehouse.inputRevision === shipment.inputRevision, 'Publish current receiving space before allocating a dock.');
    if (d.warehouseRecordedAt !== undefined) requireThat(d.warehouseRecordedAt === shipment.results.warehouse.recordedAt, 'Dock allocation refers to a different receiving plan. Refresh and review.', 409);
    requireThat(text(d.doorId) && text(d.trailerId) && d.trailerId === shipment.input.trailerId && d.available === true, 'A compatible available door for the assigned trailer is required.');
  }
  if (stage === 'carrier') requireThat(d.dotNumber === shipment.input.carrierDot && d.eligibility === 'APPROVED' && carrierFreshness(d.expiresAt, now) === 'current' && d.evidenceSource === 'seeded_scenario', 'A current approved scenario carrier decision is required.');
  if (stage === 'quote') {
    requireThat(shipment.results.fit?.ok && shipment.results.fit.inputRevision === shipment.inputRevision, 'Publish a current loading plan before accepting a quote.');
    if (d.fitRecordedAt !== undefined) requireThat(d.fitRecordedAt === shipment.results.fit.recordedAt, 'Quote refers to a different loading plan. Refresh and review the current plan.', 409);
    requireThat(Array.isArray(d.lines) && d.lines.length > 0 && d.lines.every(l => text(l.label) && Number.isSafeInteger(l.cents) && l.cents >= 0) && d.currency === 'USD' && Number.isSafeInteger(d.totalCents) && d.totalCents > 0 && d.lines.reduce((s, l) => s + l.cents, 0) === d.totalCents && d.accepted === true, 'Accepted quote line items must reconcile exactly in USD cents.');
  }
}

export function applyCommand(current, command, now = new Date().toISOString()) {
  requireThat(command && text(command.operationId, 100) && text(command.productId, 100), 'Operation ID and source product are required.');
  const fingerprint = createHash('sha256').update(JSON.stringify(command)).digest('hex');
  const previous = current.operations[command.operationId];
  if (previous) {
    requireThat(previous.fingerprint === fingerprint, 'An operation ID cannot be reused for different content.', 409);
    return current;
  }
  requireThat(command.expectedRevision === current.revision, 'Shipment changed. Refresh before applying this action.', 409);
  requireThat(current.events.length < 1000, 'Scenario history limit reached. Preserve/export this record and create a separate scenario.');
  const s = structuredClone(current);
  const p = command.payload ?? {};
  let note = '';
  const own = product => requireThat(command.productId === product, 'This action belongs to another product.');
  function carryCurrent(stages, previousRevision) {
    for (const stage of stages) {
      const result = s.results[stage];
      if (result?.ok && result.inputRevision === previousRevision) {
        result.reusedFromInputRevision ??= previousRevision;
        result.reusedAt = now; result.inputRevision = s.inputRevision;
      }
    }
  }
  function amendCargo() {
    own('product-01-cargo-fit');
    requireThat(s.status === 'draft', 'An executing shipment cannot be amended by the planning editor.', 409);
    requireThat(Object.keys(p).every(key => ['units', 'result'].includes(key)), 'Cargo may amend only handling units.');
    requireThat(Array.isArray(p.units) && p.units.every(u => u && typeof u === 'object') && sameIds(s.input.units.map(u => u.id), p.units.map(u => u.id)), 'Preserve the existing identified handling units. New unit registration belongs to the manifest workflow.');
    requireThat(p.units.every(u => u.barcode === s.input.units.find(old => old.id === u.id)?.barcode), 'Original handling-unit barcodes must be preserved.');
    const input = validateInput({ ...s.input, units: p.units });
    if (JSON.stringify(input) === JSON.stringify(s.input)) return;
    const previousInputRevision = s.inputRevision;
    s.input = input; s.inputRevision++;
    // An equipment snapshot depends on the selected equipment, never on cargo.
    // Reuse preserves the original observation and cannot promote stale evidence.
    const asset = s.results.asset;
    if (asset?.ok && asset.inputRevision === previousInputRevision && asset.details.equipmentId === s.input.equipmentId) {
      asset.reusedFromInputRevision = asset.reusedFromInputRevision ?? previousInputRevision;
      asset.reusedAt = now; asset.inputRevision = s.inputRevision;
    }
  }
  function recordStage(stage, result) {
    validateResult(s, stage, result, now);
    s.results[stage] = { ...structuredClone(result), inputRevision: s.inputRevision, productId: command.productId, recordedAt: now };
    // Historical artifacts remain in their exact event payloads.
    for (const dependent of ({ asset: ['fit', 'warehouse', 'yard', 'quote'], fit: ['warehouse', 'yard', 'quote'], warehouse: ['yard'] }[stage] ?? [])) delete s.results[dependent];
  }
  switch (command.type) {
    case 'asset.publish': {
      own('product-04-asset-studio');
      requireThat(s.status === 'draft', 'Planning decisions are locked after dispatch.', 409);
      requireThat(Object.keys(p).every(key => ['equipmentId', 'result'].includes(key)) && text(p.equipmentId), 'Equipment publication may change only the selected equipment and its reviewed result.');
      requireThat(p.result?.details?.equipmentId === p.equipmentId, 'Reviewed equipment identity differs from the selected equipment.');
      if (p.equipmentId !== s.input.equipmentId) {
        const previousRevision = s.inputRevision;
        s.input = validateInput({ ...s.input, equipmentId: p.equipmentId }); s.inputRevision++;
        carryCurrent(['carrier', 'hos'], previousRevision);
      }
      recordStage('asset', p.result);
      note = 'Reviewed equipment choice and declared snapshot saved atomically; dependent loading, receiving and quote decisions require review.';
      break;
    }
    case 'carrier.publish': {
      own('product-08-carrier-trust');
      requireThat(s.status === 'draft', 'Planning decisions are locked after dispatch.', 409);
      requireThat(Object.keys(p).every(key => ['carrierDot', 'result'].includes(key)) && text(p.carrierDot), 'Carrier publication may change only the selected carrier and its reviewed decision.');
      requireThat(p.result?.details?.dotNumber === p.carrierDot, 'Reviewed carrier identity differs from the selected carrier.');
      if (p.carrierDot !== s.input.carrierDot) {
        const previousRevision = s.inputRevision;
        s.input = validateInput({ ...s.input, carrierDot: p.carrierDot }); s.inputRevision++;
        carryCurrent(['asset', 'fit', 'warehouse', 'yard', 'hos'], previousRevision);
        delete s.results.quote;
      }
      recordStage('carrier', p.result);
      note = 'Reviewed seeded carrier assignment and policy decision saved atomically; no live authority or insurer verification performed.';
      break;
    }
    case 'cargo.amend':
      amendCargo();
      note = 'Cargo updated the identified manifest units; dependent decisions require review. Unchanged current equipment evidence was retained with provenance.';
      break;
    case 'cargo.publish':
      amendCargo();
      recordStage('fit', p.result);
      s.results.fit.details.committedInputRevision = s.inputRevision;
      note = 'Reviewed native loading plan and identified cargo inputs saved atomically. Earlier quote and receiving artifacts remain in history.';
      break;
    case 'amend':
      own('command-center-portal');
      requireThat(s.status === 'draft', 'An executing shipment cannot be amended by the planning editor.', 409);
      s.input = validateInput(p.input);
      s.inputRevision++;
      note = 'Shipment inputs amended; earlier planning decisions are retained as stale.';
      break;
    case 'evaluate':
      requireThat(STAGES.includes(p.stage), 'Unknown evaluation stage.'); own(STAGE_PRODUCTS[p.stage]);
      requireThat(s.status === 'draft', 'Planning decisions are locked after dispatch.', 409);
      recordStage(p.stage, p.result);
      note = `${p.stage}: ${p.result.summary}`;
      break;
    case 'dispatch':
      own('command-center-portal'); requireThat(s.status === 'draft', 'Shipment is already dispatched.', 409);
      requireThat(dispatchBlockers(s, now).length === 0, `Dispatch blocked: ${dispatchBlockers(s, now).join('; ')}`);
      s.status = 'dispatched'; note = 'Scenario dispatch approved against current planning decisions.'; break;
    case 'depart':
      own('product-05-fleet-telematics'); requireThat(s.status === 'dispatched', 'Dispatch approval is required before departure.');
      requireThat(p.tractorId === s.input.tractorId, 'Departure unit differs from assigned tractor.');
      s.status = 'in_transit'; note = 'Scenario departure recorded; this is simulated motion evidence.'; break;
    case 'arrive':
      own('product-05-fleet-telematics'); requireThat(s.status === 'in_transit', 'Record departure before arrival.');
      requireThat(p.tractorId === s.input.tractorId, 'Arrival unit differs from assigned tractor.');
      s.status = 'arrived'; note = 'Scenario arrival recorded at receiving facility.'; break;
    case 'deliver': {
      own('product-06-warehouse-space-flow'); requireThat(s.status === 'arrived', 'Arrival is required before receiving.');
      requireThat(text(p.receiver, 100), 'Receiver name is required.');
      requireThat(Array.isArray(p.units) && sameIds(s.input.units.map(u => u.id), p.units.map(u => u.id)), 'Receive every identified handling unit exactly once.');
      for (const unit of p.units) {
        const expected = s.results.warehouse?.details.assignments?.find(a => a.unitId === unit.id);
        requireThat(expected && unit.barcode === expected.barcode && unit.slotCode.trim().toUpperCase() === expected.slotCode.toUpperCase(), 'Scanned unit or location differs from the approved receiving assignment.');
      }
      s.delivery = { receiver: p.receiver.trim(), receivedAt: now, units: structuredClone(p.units) };
      s.status = 'delivered'; note = `Manually entered scenario receipt confirmed by ${s.delivery.receiver}.`; break;
    }
    case 'invoice': {
      own('command-center-portal'); requireThat(s.status === 'delivered', 'Delivery evidence is required before invoice readiness.');
      requireThat(!s.exceptions.some(e => !e.resolved), 'Resolve outstanding exceptions before invoice readiness.');
      requireThat(s.results.quote?.ok && s.results.quote.inputRevision === s.inputRevision, 'Current accepted quote evidence is required before invoice readiness.');
      validateResult(s, 'quote', s.results.quote, now);
      requireThat(p.totalCents === s.results.quote?.details.totalCents, 'Invoice amount differs from the accepted quote.');
      s.invoice = { number: `DRAFT-${s.id}`, totalCents: p.totalCents, currency: 'USD', preparedAt: now, evidenceEventIds: s.events.map(e => e.id) };
      s.status = 'invoice_ready'; note = 'Scenario invoice reconciled to accepted quote and receipt; ready for local export, not paid.'; break;
    }
    case 'exception.open':
      requireThat([ 'command-center-portal', 'product-05-fleet-telematics' ].includes(command.productId), 'Exception source is unsupported.');
      requireThat(text(p.message, 500) && s.status !== 'invoice_ready', 'Provide an exception reason before invoice closure.');
      s.exceptions.push({ id: command.operationId, message: p.message.trim(), resolved: false }); note = p.message; break;
    case 'exception.resolve': {
      own('command-center-portal'); const ex = s.exceptions.find(e => e.id === p.id && !e.resolved);
      requireThat(ex && text(p.resolution, 500), 'An open exception and resolution note are required.');
      ex.resolved = true; ex.resolution = p.resolution.trim(); note = ex.resolution; break;
    }
    default: throw new FlowError('Unknown shipment action.');
  }
  s.events.push({ id: randomUUID(), type: command.type, productId: command.productId, at: now, inputRevision: s.inputRevision, note, payload: structuredClone(p) });
  s.operations[command.operationId] = { fingerprint };
  s.revision++;
  return s;
}
