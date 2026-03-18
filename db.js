/* ================================================
   SITE COMMAND — Database Layer (localStorage)
   Full CRUD for all app entities.
   Data persists across browser sessions.
   v2 — Added: RFIs, Punch List, Timecards, Documents, Schedule
   ================================================ */

const DB_VERSION = '2.0';
const PREFIX = 'sc_';

// ── Keys ─────────────────────────────────────────
const KEYS = {
  reports:      PREFIX + 'reports',
  changeOrders: PREFIX + 'change_orders',
  safetyLogs:   PREFIX + 'safety_logs',
  photos:       PREFIX + 'photos',
  projects:     PREFIX + 'projects',
  crew:         PREFIX + 'crew',
  budget:       PREFIX + 'budget',
  rfis:         PREFIX + 'rfis',
  punchlist:    PREFIX + 'punchlist',
  timecards:    PREFIX + 'timecards',
  documents:    PREFIX + 'documents',
  schedule:     PREFIX + 'schedule',
  version:      PREFIX + 'version',
};

// ── Low-level helpers ────────────────────────────
function dbGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('DB read error', key, e);
    return null;
  }
}
function dbSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('DB write error', key, e);
    return false;
  }
}
function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}
function now() {
  return new Date().toISOString();
}

// ── Generic Collection ───────────────────────────
function getAll(key) {
  return dbGet(key) || [];
}
function saveAll(key, items) {
  return dbSet(key, items);
}
function addItem(key, item) {
  const items = getAll(key);
  const newItem = { id: uuid(), createdAt: now(), updatedAt: now(), ...item };
  items.unshift(newItem); // newest first
  saveAll(key, items);
  return newItem;
}
function updateItem(key, id, updates) {
  const items = getAll(key);
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates, updatedAt: now() };
  saveAll(key, items);
  return items[idx];
}
function deleteItem(key, id) {
  const items = getAll(key).filter(i => i.id !== id);
  saveAll(key, items);
}
function getById(key, id) {
  return getAll(key).find(i => i.id === id) || null;
}

// ── DAILY REPORTS ────────────────────────────────
const Reports = {
  getAll:  ()         => getAll(KEYS.reports),
  add:     (data)     => addItem(KEYS.reports, data),
  update:  (id, data) => updateItem(KEYS.reports, id, data),
  delete:  (id)       => deleteItem(KEYS.reports, id),
  getById: (id)       => getById(KEYS.reports, id),
};

// ── CHANGE ORDERS ────────────────────────────────
const ChangeOrders = {
  getAll:  ()         => getAll(KEYS.changeOrders),
  add:     (data)     => addItem(KEYS.changeOrders, data),
  update:  (id, data) => updateItem(KEYS.changeOrders, id, data),
  delete:  (id)       => deleteItem(KEYS.changeOrders, id),
  getById: (id)       => getById(KEYS.changeOrders, id),
  approve: (id)       => updateItem(KEYS.changeOrders, id, { status: 'approved', approvedAt: now() }),
  reject:  (id)       => updateItem(KEYS.changeOrders, id, { status: 'rejected', rejectedAt: now() }),
};

// ── SAFETY LOGS ──────────────────────────────────
const SafetyLogs = {
  getAll:  ()         => getAll(KEYS.safetyLogs),
  add:     (data)     => addItem(KEYS.safetyLogs, data),
  update:  (id, data) => updateItem(KEYS.safetyLogs, id, data),
  delete:  (id)       => deleteItem(KEYS.safetyLogs, id),
  resolve: (id)       => updateItem(KEYS.safetyLogs, id, { resolved: true, resolvedAt: now() }),
};

// ── PHOTOS ───────────────────────────────────────
const Photos = {
  getAll:  ()         => getAll(KEYS.photos),
  add:     (data)     => addItem(KEYS.photos, data),
  delete:  (id)       => deleteItem(KEYS.photos, id),
  getByProject: (proj) => getAll(KEYS.photos).filter(p => p.project === proj),
};

// ── PROJECTS ─────────────────────────────────────
const Projects = {
  getAll:  ()         => getAll(KEYS.projects),
  add:     (data)     => addItem(KEYS.projects, data),
  update:  (id, data) => updateItem(KEYS.projects, id, data),
  getById: (id)       => getById(KEYS.projects, id),
};

// ── CREW ─────────────────────────────────────────
const Crew = {
  getAll:  ()         => getAll(KEYS.crew),
  add:     (data)     => addItem(KEYS.crew, data),
  update:  (id, data) => updateItem(KEYS.crew, id, data),
  delete:  (id)       => deleteItem(KEYS.crew, id),
};

// ── BUDGET ───────────────────────────────────────
const Budget = {
  get:    (projectId) => dbGet(PREFIX + 'budget_' + projectId) || null,
  save:   (projectId, data) => dbSet(PREFIX + 'budget_' + projectId, { ...data, updatedAt: now() }),
};

// ═══════════════════════════════════════════════════
// NEW MODULES — v2
// ═══════════════════════════════════════════════════

// ── RFIs (Requests for Information) ─────────────
const RFIs = {
  getAll:   ()         => getAll(KEYS.rfis),
  add:      (data)     => addItem(KEYS.rfis, data),
  update:   (id, data) => updateItem(KEYS.rfis, id, data),
  delete:   (id)       => deleteItem(KEYS.rfis, id),
  getById:  (id)       => getById(KEYS.rfis, id),
  respond:  (id, response) => updateItem(KEYS.rfis, id, { status: 'answered', response, respondedAt: now() }),
  close:    (id)       => updateItem(KEYS.rfis, id, { status: 'closed', closedAt: now() }),
};

// ── PUNCH LIST ──────────────────────────────────
const PunchList = {
  getAll:   ()         => getAll(KEYS.punchlist),
  add:      (data)     => addItem(KEYS.punchlist, data),
  update:   (id, data) => updateItem(KEYS.punchlist, id, data),
  delete:   (id)       => deleteItem(KEYS.punchlist, id),
  getById:  (id)       => getById(KEYS.punchlist, id),
  complete: (id)       => updateItem(KEYS.punchlist, id, { status: 'complete', completedAt: now() }),
  reopen:   (id)       => updateItem(KEYS.punchlist, id, { status: 'open', completedAt: null }),
};

// ── TIMECARDS ───────────────────────────────────
const Timecards = {
  getAll:   ()         => getAll(KEYS.timecards),
  add:      (data)     => addItem(KEYS.timecards, data),
  update:   (id, data) => updateItem(KEYS.timecards, id, data),
  delete:   (id)       => deleteItem(KEYS.timecards, id),
  getById:  (id)       => getById(KEYS.timecards, id),
  getByDate:(date)     => getAll(KEYS.timecards).filter(t => t.date === date),
  getByWorker:(name)   => getAll(KEYS.timecards).filter(t => t.worker === name),
};

// ── DOCUMENTS ───────────────────────────────────
const Documents = {
  getAll:     ()         => getAll(KEYS.documents),
  add:        (data)     => addItem(KEYS.documents, data),
  delete:     (id)       => deleteItem(KEYS.documents, id),
  getById:    (id)       => getById(KEYS.documents, id),
  getByCategory: (cat)   => getAll(KEYS.documents).filter(d => d.category === cat),
};

// ── SCHEDULE (Gantt) ────────────────────────────
const Schedule = {
  getAll:   ()         => getAll(KEYS.schedule),
  add:      (data)     => addItem(KEYS.schedule, data),
  update:   (id, data) => updateItem(KEYS.schedule, id, data),
  delete:   (id)       => deleteItem(KEYS.schedule, id),
  getById:  (id)       => getById(KEYS.schedule, id),
};

// ── SEED DATA ────────────────────────────────────
function seedIfEmpty() {
  const seeded = localStorage.getItem(PREFIX + 'seeded_v2');
  if (seeded) return;

  // Clear old v1 seed marker
  localStorage.removeItem(PREFIX + 'seeded');

  // Seed reports
  const reportsData = [
    {
      date: '2026-03-16',
      project: 'Harbour Reach Condos – Phase 2',
      foreman: 'Marc Tremblay',
      weather: '🌤️ Partly Cloudy, 4°C',
      crew: 18, hours: 144,
      work: 'Completed floor 6 north section framing. All studs set, 3 headers installed at rough openings 6-04, 6-07, 6-09. OSB sheathing started on west wall — approximately 40% complete by end of shift. LVL beam at grid C-7 lifted into place at 11:20AM with crane; confirmed plumb and level by foreman.',
      issues: 'Anchor bolts for south bearing wall arrived 2.5h late (delivery from Metalfab delayed by truck breakdown). South section framing pushed to tomorrow AM. Notified PM by text at 9:15AM.',
      visitors: 'Building Inspector (NS NSB #4421) — approved F5 rough-in framing. Owner rep David MacLeod on site 1:00–2:30PM.',
      photos: 14, status: 'submitted',
    },
    {
      date: '2026-03-15',
      project: 'Harbour Reach Condos – Phase 2',
      foreman: 'Jake Sullivan',
      weather: '❄️ Clear, -2°C',
      crew: 22, hours: 176,
      work: 'Full plumbing rough-in on F5 — all drain and vent stacks complete in units 501–512. Water supply copper runs set in 8 of 12 units. Pressure test on zone 5A passed at 160 PSI. Framing crew continued header work at stairwell 2.',
      issues: 'No issues. Cold weather protocol in effect.',
      visitors: 'None on site.',
      photos: 8, status: 'submitted',
    },
    {
      date: '2026-03-15',
      project: 'Grafton Street Commercial Reno',
      foreman: 'Raymond Okonkwo',
      weather: '❄️ Clear, -2°C',
      crew: 8, hours: 64,
      work: 'Drywall installation main floor — 60% of walls taped and mudded. Electrical rough-in: 14 additional circuits run per revised drawings.',
      issues: 'Drywall shortage — 48 of 80 sheets delivered. Balance expected Mar 17. Moisture damage found at north wall grid A-3 to A-7.',
      visitors: 'Owner Brian Gallant — agreed moisture repairs proceed as change order.',
      photos: 11, status: 'submitted',
    },
    {
      date: '2026-03-14',
      project: 'Harbour Reach Condos – Phase 2',
      foreman: 'Jake Sullivan',
      weather: '🌧️ Rain, 6°C',
      crew: 19, hours: 152,
      work: 'Concrete pour on F5 slab — 48m³ placed and screeded. Pump truck on site 7AM–12:30PM. Cure blankets installed by 1:00PM.',
      issues: 'Rain delayed start by 45min.',
      visitors: 'Concrete inspector (CTL Group) — approved placement.',
      photos: 6, status: 'submitted',
    },
    {
      date: '2026-03-13',
      project: 'Grafton Street Commercial Reno',
      foreman: 'Raymond Okonkwo',
      weather: '🌤️ Partly Cloudy, 3°C',
      crew: 10, hours: 80,
      work: 'Electrical rough-in on 2nd floor — circuits for commercial kitchen equipment, hood fan, walk-in cooler. Sub-panel installed.',
      issues: 'Fire alarm sub (AgriSafety Controls) did not show up. Rescheduled for Mar 16.',
      visitors: 'Electrical inspector — passed rough-in for main floor circuits.',
      photos: 5, status: 'submitted',
    },
  ];
  reportsData.forEach(r => Reports.add(r));

  // Seed change orders
  const cosData = [
    { number: 'CO-008', project: 'Harbour Reach Condos – Phase 2', title: 'Electrical rough-in — additional circuits F4-F6', desc: 'Engineer revised electrical drawings requiring 3 additional sub-panels on floors 4 through 6. Labour: 2 journeymen x 4 days. Material: 3 x 200A panels, conduit, wire.', requestedBy: 'R. Okonkwo', labourCost: 7200, materialCost: 5200, status: 'pending', date: '2026-03-16' },
    { number: 'CO-007', project: 'Harbour Reach Condos – Phase 2', title: 'Waterproofing upgrade — parking level P1', desc: 'Owner requested upgrade from standard to premium waterproofing membrane on the entire P1 parkade slab.', requestedBy: 'J. Sullivan', labourCost: 1200, materialCost: 4800, status: 'pending', date: '2026-03-14' },
    { number: 'CO-006', project: 'Harbour Reach Condos – Phase 2', title: 'Revised structural beam at grid C-7', desc: 'Structural engineer directed upsizing of beam from W310x86 to W310x129 due to revised loading calculations.', requestedBy: 'J. Sullivan', labourCost: 2800, materialCost: 6000, status: 'approved', date: '2026-03-12' },
    { number: 'CO-005', project: 'Harbour Reach Condos – Phase 2', title: 'Extra excavation — unforeseen rock', desc: 'Rock encountered at -3.2m, beyond geotech report prediction. 2 additional days of rock breaking.', requestedBy: 'J. Sullivan', labourCost: 8200, materialCost: 6000, status: 'approved', date: '2026-03-07' },
  ];
  cosData.forEach(co => ChangeOrders.add(co));

  // Seed safety logs
  const safetyData = [
    { type: 'Near Miss', title: 'Unsecured material at north elevator shaft — F6', desc: 'Loose lumber stacked near open shaft opening. Risk of falling objects to floors below. Immediate barricade needed.', reportedBy: 'M. Tremblay', date: '2026-03-16', attendees: null, resolved: false },
    { type: 'Toolbox Talk', title: 'Working at Heights – Fall Protection', desc: 'Topics: harness inspection, anchor points, tie-off protocols.', reportedBy: 'J. Sullivan', date: '2026-03-16', attendees: 19, resolved: false },
    { type: 'Toolbox Talk', title: 'PPE Requirements – Winter Conditions', desc: 'Topics: high-vis, thermal gloves, ice cleats, frostbite awareness.', reportedBy: 'J. Sullivan', date: '2026-03-13', attendees: 22, resolved: false },
    { type: 'Toolbox Talk', title: 'Crane Lift Operations – Exclusion Zones', desc: 'All crew briefed on exclusion zones during scheduled crane lifts.', reportedBy: 'J. Sullivan', date: '2026-03-10', attendees: 24, resolved: false },
  ];
  safetyData.forEach(s => SafetyLogs.add(s));

  // ═══ NEW v2 SEED DATA ═══

  // Seed RFIs
  const rfisData = [
    { number: 'RFI-012', project: 'Harbour Reach Condos – Phase 2', subject: 'Beam connection detail at grid B-7 / F5', question: 'Drawing S-402 shows a moment connection at B-7, but S-201 detail 6 shows a shear connection at same grid. Which connection type is required? Need clarification before steel fabricator can proceed.', assignedTo: 'Architect — Morrison Partners', priority: 'High', status: 'open', dueDate: '2026-03-18', submittedBy: 'J. Sullivan', response: null },
    { number: 'RFI-011', project: 'Harbour Reach Condos – Phase 2', subject: 'Fire rating at corridor walls – units 508-512', question: 'Specs call for 1-hour rating at corridor demising walls, but drawings A-301 show 2-hour assembly. Please confirm required rating. Affects drywall layer count and insulation type.', assignedTo: 'Architect — Morrison Partners', priority: 'Medium', status: 'answered', dueDate: '2026-03-15', submittedBy: 'R. Okonkwo', response: 'Use 2-hour assembly per A-301. Spec to be revised in next addendum. Proceed with 2-layer Type X each side.', respondedAt: '2026-03-14T14:30:00Z' },
    { number: 'RFI-010', project: 'Grafton Street Commercial Reno', subject: 'Floor drain location — commercial kitchen', question: 'Mechanical drawings show 4 floor drains in kitchen area but architectural layout moved walk-in cooler. Drains 3 and 4 are now under cooler footprint. Advise on relocation.', assignedTo: 'Engineer — KWR Mechanical', priority: 'High', status: 'open', dueDate: '2026-03-17', submittedBy: 'R. Okonkwo', response: null },
    { number: 'RFI-009', project: 'Harbour Reach Condos – Phase 2', subject: 'Window sill height — F4 units', question: 'Nova Scotia building code requires minimum 1070mm sill height for windows above 4th floor. Drawing A-201 shows 900mm sill. Confirm whether upgrade to tempered glass or sill height change.', assignedTo: 'Architect — Morrison Partners', priority: 'Low', status: 'closed', dueDate: '2026-03-10', submittedBy: 'J. Sullivan', response: 'Install tempered glass at lower sill height. Window schedule revised — see addendum 3.', respondedAt: '2026-03-09T09:00:00Z' },
  ];
  rfisData.forEach(r => RFIs.add(r));

  // Seed Punch List
  const punchData = [
    { title: 'Drywall tape bubbling — unit 401 master bath', location: 'F4 — Unit 401', trade: 'Drywall', assignedTo: 'ABC Drywall Co.', priority: 'Medium', status: 'open', notes: 'Approximately 4ft section of tape bubbling above shower enclosure. Re-tape and skim coat required.', dueDate: '2026-03-20' },
    { title: 'Missing fire caulking — plumbing penetration F3', location: 'F3 — Mech room', trade: 'Fireproofing', assignedTo: 'FireStop Inc.', priority: 'High', status: 'open', notes: '3 penetrations in 2-hour rated wall missing firestop caulking. Must be completed before inspection.', dueDate: '2026-03-18' },
    { title: 'Paint touch-up — stairwell B railing', location: 'Stairwell B — F1-F4', trade: 'Painting', assignedTo: 'In-house', priority: 'Low', status: 'open', notes: 'Scuff marks and scratches from material handling. Light sand and repaint.', dueDate: '2026-03-25' },
    { title: 'Electrical cover plate missing — unit 305 kitchen', location: 'F3 — Unit 305', trade: 'Electrical', assignedTo: 'R. Okonkwo', priority: 'Low', status: 'complete', notes: 'Duplex receptacle at counter has no cover plate. Installed white decora plate.', completedAt: '2026-03-15T10:00:00Z', dueDate: '2026-03-15' },
    { title: 'Door hardware — unit 204 entry not latching', location: 'F2 — Unit 204', trade: 'Carpentry', assignedTo: 'In-house', priority: 'Medium', status: 'open', notes: 'Strike plate misaligned. Door does not latch when closed. Adjust strike plate.', dueDate: '2026-03-19' },
    { title: 'Grout cracking — lobby floor tile', location: 'F1 — Main lobby', trade: 'Tile', assignedTo: 'Maritime Tile & Stone', priority: 'Medium', status: 'open', notes: 'Hairline cracks in grout lines at main entrance. Re-grout 3 rows.', dueDate: '2026-03-22' },
    { title: 'Balcony drain test — unit 601', location: 'F6 — Unit 601', trade: 'Plumbing', assignedTo: 'L. Pereira', priority: 'High', status: 'complete', notes: 'Water ponding at balcony corner. Drain cleared and tested with 20L flow — drains properly now.', completedAt: '2026-03-14T16:00:00Z', dueDate: '2026-03-14' },
  ];
  punchData.forEach(p => PunchList.add(p));

  // Seed Timecards
  const timecardData = [
    { date: '2026-03-16', worker: 'Jake Sullivan', role: 'Site Foreman', clockIn: '06:30', clockOut: '17:00', hours: 10.0, costCode: '01-100 General Conditions', project: 'Harbour Reach Condos – Phase 2', overtime: 2.0 },
    { date: '2026-03-16', worker: 'Marc Tremblay', role: 'Carpenter Lead', clockIn: '07:00', clockOut: '17:00', hours: 10.0, costCode: '06-100 Framing', project: 'Harbour Reach Condos – Phase 2', overtime: 2.0 },
    { date: '2026-03-16', worker: 'Raymond Okonkwo', role: 'Electrician', clockIn: '07:00', clockOut: '15:30', hours: 8.0, costCode: '16-100 Electrical Rough-in', project: 'Harbour Reach Condos – Phase 2', overtime: 0 },
    { date: '2026-03-16', worker: 'Luis Pereira', role: 'Plumber Lead', clockIn: '07:00', clockOut: '15:30', hours: 8.0, costCode: '15-100 Plumbing Rough-in', project: 'Harbour Reach Condos – Phase 2', overtime: 0 },
    { date: '2026-03-16', worker: 'Dave Kim', role: 'Carpenter', clockIn: '07:00', clockOut: '17:00', hours: 10.0, costCode: '06-100 Framing', project: 'Harbour Reach Condos – Phase 2', overtime: 2.0 },
    { date: '2026-03-16', worker: 'Amir Bolouri', role: 'Plumber', clockIn: '07:30', clockOut: '15:30', hours: 8.0, costCode: '15-100 Plumbing Rough-in', project: 'Harbour Reach Condos – Phase 2', overtime: 0 },
    { date: '2026-03-15', worker: 'Jake Sullivan', role: 'Site Foreman', clockIn: '06:30', clockOut: '17:00', hours: 10.0, costCode: '01-100 General Conditions', project: 'Harbour Reach Condos – Phase 2', overtime: 2.0 },
    { date: '2026-03-15', worker: 'Marc Tremblay', role: 'Carpenter Lead', clockIn: '07:00', clockOut: '15:30', hours: 8.0, costCode: '06-100 Framing', project: 'Harbour Reach Condos – Phase 2', overtime: 0 },
    { date: '2026-03-15', worker: 'Raymond Okonkwo', role: 'Electrician', clockIn: '07:00', clockOut: '15:30', hours: 8.0, costCode: '16-100 Electrical Rough-in', project: 'Grafton Street Commercial Reno', overtime: 0 },
  ];
  timecardData.forEach(t => Timecards.add(t));

  // Seed Documents
  const docsData = [
    { name: 'General Contract — Harbour Reach P2', category: 'Contracts', fileType: 'PDF', fileSize: '2.4 MB', uploadedBy: 'J. Sullivan', date: '2026-01-12', project: 'Harbour Reach Condos – Phase 2' },
    { name: 'Building Permit #BP-2026-0142', category: 'Permits', fileType: 'PDF', fileSize: '340 KB', uploadedBy: 'J. Sullivan', date: '2025-12-18', project: 'Harbour Reach Condos – Phase 2' },
    { name: 'Architectural Drawings — Rev C (Full Set)', category: 'Drawings', fileType: 'DWG', fileSize: '48 MB', uploadedBy: 'Morrison Partners', date: '2026-02-02', project: 'Harbour Reach Condos – Phase 2' },
    { name: 'Structural Drawings — Rev B', category: 'Drawings', fileType: 'DWG', fileSize: '32 MB', uploadedBy: 'KWR Engineering', date: '2026-01-25', project: 'Harbour Reach Condos – Phase 2' },
    { name: 'Geotechnical Report — Site Investigation', category: 'Specs', fileType: 'PDF', fileSize: '8.2 MB', uploadedBy: 'AGRA Earth', date: '2025-10-05', project: 'Harbour Reach Condos – Phase 2' },
    { name: 'CGL Insurance Certificate — 2026', category: 'Insurance', fileType: 'PDF', fileSize: '180 KB', uploadedBy: 'J. Sullivan', date: '2026-01-01', project: 'All Projects' },
    { name: 'WSIB Clearance Certificate', category: 'Insurance', fileType: 'PDF', fileSize: '95 KB', uploadedBy: 'J. Sullivan', date: '2026-01-15', project: 'All Projects' },
    { name: 'Electrical Subcontract — Okonkwo Electric', category: 'Contracts', fileType: 'PDF', fileSize: '1.1 MB', uploadedBy: 'R. Okonkwo', date: '2026-01-20', project: 'Harbour Reach Condos – Phase 2' },
    { name: 'Addendum #3 — Window Schedule Revision', category: 'Specs', fileType: 'PDF', fileSize: '420 KB', uploadedBy: 'Morrison Partners', date: '2026-03-09', project: 'Harbour Reach Condos – Phase 2' },
    { name: 'Demolition Permit — Grafton St', category: 'Permits', fileType: 'PDF', fileSize: '210 KB', uploadedBy: 'J. Sullivan', date: '2025-11-20', project: 'Grafton Street Commercial Reno' },
  ];
  docsData.forEach(d => Documents.add(d));

  // Seed Schedule (Gantt milestones)
  const scheduleData = [
    { taskName: 'Excavation & Foundation', startDate: '2026-01-06', endDate: '2026-02-14', progress: 100, color: '#6366F1', category: 'Foundation' },
    { taskName: 'Underground Plumbing', startDate: '2026-01-20', endDate: '2026-02-28', progress: 100, color: '#0891B2', category: 'Plumbing' },
    { taskName: 'Concrete Slab — F1-F3', startDate: '2026-02-10', endDate: '2026-03-07', progress: 100, color: '#8B5CF6', category: 'Concrete' },
    { taskName: 'Concrete Slab — F4-F6', startDate: '2026-03-01', endDate: '2026-03-21', progress: 75, color: '#8B5CF6', category: 'Concrete' },
    { taskName: 'Structural Steel', startDate: '2026-02-17', endDate: '2026-04-11', progress: 55, color: '#DC2626', category: 'Structure' },
    { taskName: 'Framing — F1-F3', startDate: '2026-03-03', endDate: '2026-03-28', progress: 85, color: '#EA580C', category: 'Framing' },
    { taskName: 'Framing — F4-F6', startDate: '2026-03-17', endDate: '2026-04-25', progress: 15, color: '#EA580C', category: 'Framing' },
    { taskName: 'Electrical Rough-in', startDate: '2026-03-10', endDate: '2026-05-02', progress: 30, color: '#EAB308', category: 'Electrical' },
    { taskName: 'Plumbing Rough-in', startDate: '2026-03-10', endDate: '2026-04-25', progress: 40, color: '#0891B2', category: 'Plumbing' },
    { taskName: 'HVAC Rough-in', startDate: '2026-04-01', endDate: '2026-05-15', progress: 0, color: '#22C55E', category: 'Mechanical' },
    { taskName: 'Insulation & Vapour Barrier', startDate: '2026-04-28', endDate: '2026-05-30', progress: 0, color: '#EC4899', category: 'Envelope' },
    { taskName: 'Drywall', startDate: '2026-05-11', endDate: '2026-06-20', progress: 0, color: '#9CA3AF', category: 'Finishing' },
    { taskName: 'Finish Trades', startDate: '2026-06-15', endDate: '2026-07-31', progress: 0, color: '#F59E0B', category: 'Finishing' },
    { taskName: 'Landscaping & Paving', startDate: '2026-07-01', endDate: '2026-08-08', progress: 0, color: '#059669', category: 'Exterior' },
    { taskName: 'Final Inspection & Handover', startDate: '2026-08-10', endDate: '2026-08-21', progress: 0, color: '#7C3AED', category: 'Closeout' },
  ];
  scheduleData.forEach(s => Schedule.add(s));

  // Mark seeded
  localStorage.setItem(PREFIX + 'seeded_v2', '1');
  console.log('✅ Site Command DB v2 seeded with demo data (incl. RFIs, Punch List, Timecards, Documents, Schedule)');
}

// ── Export DB stats ───────────────────────────────
function getStats() {
  return {
    reports:      Reports.getAll().length,
    changeOrders: ChangeOrders.getAll().length,
    safetyLogs:   SafetyLogs.getAll().length,
    photos:       Photos.getAll().length,
    rfis:         RFIs.getAll().length,
    punchlist:    PunchList.getAll().length,
    timecards:    Timecards.getAll().length,
    documents:    Documents.getAll().length,
    schedule:     Schedule.getAll().length,
    storageUsed:  Object.keys(localStorage)
                    .filter(k => k.startsWith(PREFIX))
                    .reduce((sum, k) => sum + (localStorage.getItem(k) || '').length, 0),
  };
}

// ── Clear all data ───────────────────────────────
function clearAll() {
  Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k));
}

// ── Export backup JSON ───────────────────────────
function exportBackup() {
  const backup = {
    version: DB_VERSION,
    exportedAt: now(),
    data: {
      reports:      Reports.getAll(),
      changeOrders: ChangeOrders.getAll(),
      safetyLogs:   SafetyLogs.getAll(),
      photos:       Photos.getAll(),
      rfis:         RFIs.getAll(),
      punchlist:    PunchList.getAll(),
      timecards:    Timecards.getAll(),
      documents:    Documents.getAll(),
      schedule:     Schedule.getAll(),
    },
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `site-command-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
