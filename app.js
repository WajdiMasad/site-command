/* ================================================
   SITE COMMAND — App Logic v3
   Fully wired to localStorage DB v2.
   Navigation, rendering, all interactions.
   New: RFIs, Punch List, Timecards, Documents, Gantt Schedule
   ================================================ */

// ── State ──────────────────────────────────────
const state = {
  currentPage: 'dashboard',
};

// ── Init ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  seedIfEmpty();
  navigate('dashboard');
  renderPhotoGrid();
  renderScheduleBoard();
  renderSpendChart();
  setTimeout(animateBars, 200);
  updateDashboardStats();
  console.log('✅ Site Command v3 loaded', getStats());
});

// ── Navigation ──────────────────────────────────
function navigate(page) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) { target.classList.add('active'); }
  state.currentPage = page;
  updateTopbar(page);
  closeSidebar();

  // Refresh page-specific content from DB
  if (page === 'daily-report')  renderReportsTable();
  if (page === 'change-orders') renderChangeOrders();
  if (page === 'safety')        renderSafetyLog();
  if (page === 'photos')        renderPhotoGrid();
  if (page === 'dashboard')     updateDashboardStats();
  if (page === 'rfis')          renderRFIs();
  if (page === 'punchlist')     renderPunchList();
  if (page === 'timecards')     renderTimecards();
  if (page === 'documents')     renderDocuments();
  if (page === 'schedule')      renderGantt();
  if (page === 'pmo')           renderPMO();
  if (page === 'risk')          runRiskScan();
  if (page === 'compliance')    renderCompliance();
  if (page === 'procurement')   renderProcurement();
}

function updateTopbar(page) {
  const titles = {
    'dashboard':     ['Dashboard', 'Monday, March 16, 2026 — Harbour Reach Condos'],
    'daily-report':  ['Daily Reports', 'All projects — site documentation'],
    'photos':        ['Photo Log', 'Harbour Reach Condos – Phase 2'],
    'crew':          ['Crew & Sub Schedule', 'Week of March 16, 2026'],
    'safety':        ['Safety Log', 'Active projects — WCB/WSBC compliance'],
    'change-orders': ['Change Orders', 'Harbour Reach Condos – Phase 2'],
    'budget':        ['Budget Tracker', 'Harbour Reach Condos – Phase 2'],
    'rfis':          ['RFIs', 'Requests for Information — all projects'],
    'punchlist':     ['Punch List', 'Harbour Reach Condos – Phase 2'],
    'timecards':     ['Timecards', 'Week of March 16, 2026'],
    'documents':     ['Document Vault', 'All projects — centralized filing'],
    'schedule':      ['Project Schedule', 'Harbour Reach Condos – Phase 2 — Gantt View'],
    'pmo':           ['PMO Executive Dashboard', 'Portfolio intelligence — PMBOK 8th Edition'],
    'risk':          ['Risk Radar', 'Proactive risk detection — live intelligence engine'],
    'compliance':    ['Compliance', 'Construction safety checklists — OSHA / COR'],
    'procurement':   ['Procurement', 'Vendor management — purchase orders — PMBOK 8th Edition'],
  };
  const actionLabels = {
    'dashboard':     '+ New Report',
    'daily-report':  '+ New Report',
    'photos':        '📤 Upload Photos',
    'crew':          '+ Add Trade',
    'safety':        '+ Log Entry',
    'change-orders': '+ Change Order',
    'budget':        '📤 Export',
    'rfis':          '+ New RFI',
    'punchlist':     '+ Punch Item',
    'timecards':     '+ Clock In',
    'documents':     '📤 Upload',
    'schedule':      '+ Add Task',
    'pmo':           '📄 Generate Summary',
    'risk':          '🔄 Rescan',
    'compliance':    '+ New Checklist',
    'procurement':   '+ New PO',
  };
  const t = titles[page] || ['Site Command', ''];
  document.getElementById('pageTitle').textContent = t[0];
  document.getElementById('pageSubtitle').textContent = t[1];
  document.getElementById('topbarActionBtn').textContent = actionLabels[page] || '+ New';
}

function handlePrimaryAction() {
  const actions = {
    'dashboard':     openNewReport,
    'daily-report':  openNewReport,
    'photos':        () => document.getElementById('photoUpload').click(),
    'crew':          openNewSub,
    'safety':        openNewSafety,
    'change-orders': openNewCO,
    'budget':        () => { exportBackup(); showToast('Backup JSON downloaded', 'success'); },
    'rfis':          openNewRFI,
    'punchlist':     openNewPunch,
    'timecards':     openNewTimecard,
    'documents':     () => showToast('Upload feature — connect to cloud storage for full support', 'info'),
    'schedule':      () => showToast('Add task — coming in next update!', 'info'),
    'pmo':           generateExecutiveSummary,
    'risk':          runRiskScan,
    'compliance':    () => showToast('New checklist template — coming soon!', 'info'),
    'procurement':   openNewPO,
  };
  (actions[state.currentPage] || (() => {}))();
}

// ── Sidebar ─────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

// ── Modals ───────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function openNewReport()   { openModal('modalReport'); }
function openNewCO()       { openModal('modalCO'); }
function openNewSafety()   { openModal('modalSafety'); }
function openNewRFI()      { openModal('modalRFI'); }
function openNewPunch()    { openModal('modalPunch'); }
function openNewTimecard() { openModal('modalTimecard'); }
function openNewSub()      { showToast('Sub management — coming in next update!', 'info'); }
function openNewPO()       {
  // Populate vendor dropdown
  const sel = document.getElementById('poVendorSelect');
  if (sel) {
    const vendors = Vendors.getAll();
    sel.innerHTML = vendors.map(v => `<option>${v.name}</option>`).join('');
  }
  openModal('modalPO');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ── Dashboard Stats ──────────────────────────────
function updateDashboardStats() {
  const reports = Reports.getAll();
  const cos     = ChangeOrders.getAll();
  const pending = cos.filter(c => c.status === 'pending').length;

  const rBadge = document.querySelector('[data-page="daily-report"] .nav-badge');
  if (rBadge) rBadge.textContent = reports.length;
  const cBadge = document.querySelector('[data-page="change-orders"] .nav-badge');
  if (cBadge) cBadge.textContent = pending;

  // RFI badge
  const openRFIs = RFIs.getAll().filter(r => r.status === 'open').length;
  const rfiBadge = document.querySelector('[data-page="rfis"] .nav-badge');
  if (rfiBadge) rfiBadge.textContent = openRFIs;
}

// ══════════════════════════════════════════════════
// DAILY REPORTS
// ══════════════════════════════════════════════════
function renderReportsTable() {
  const tbody = document.getElementById('reportsTableBody');
  if (!tbody) return;
  const reports = Reports.getAll();

  if (!reports.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">No reports yet</div><div class="empty-desc">Submit your first daily report above.</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = reports.map(r => {
    const d = r.date ? new Date(r.date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '—';
    const hasIssues = r.issues && r.issues.trim() && r.issues.toLowerCase() !== 'none' && r.issues.toLowerCase() !== 'no issues';
    return `
      <tr>
        <td class="font-mono" style="font-size:0.77rem;color:var(--text-secondary);">${d}</td>
        <td><strong>${r.project || '—'}</strong></td>
        <td>${r.foreman || '—'}</td>
        <td>${r.crew || 0} workers</td>
        <td>${(r.weather || '').replace(/[^\x00-\x7F]/g,'').trim() || '—'}</td>
        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.work ? r.work.slice(0,60)+'…' : '—'}</td>
        <td>${hasIssues ? '<span class="badge badge-yellow">Issues</span>' : '<span class="badge badge-gray">None</span>'}</td>
        <td><span class="badge badge-green">Submitted</span></td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm btn-outline" onclick="openReportView('${r.id}')">View</button>
            <button class="btn btn-sm btn-outline" onclick="exportReportPDF(Reports.getById('${r.id}'))" title="Export PDF">📄</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function openReportView(id) {
  const r = Reports.getById(id);
  if (!r) return;
  document.getElementById('reportViewTitle').textContent = `Daily Report — ${r.date || ''}`;
  document.getElementById('reportViewBody').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;">
      ${infoBox('Project', r.project)}
      ${infoBox('Foreman', r.foreman)}
      ${infoBox('Weather', r.weather?.replace(/[^\x00-\x7F]/g,'').trim() || '—')}
      ${infoBox('Crew / Man-Hrs', `<span style="color:var(--brand);font-weight:800;">${r.crew || 0} workers — ${r.hours || 0} man-hrs</span>`)}
    </div>
    ${section('Work Completed', r.work)}
    ${section('Issues & Delays', r.issues)}
    ${section('Visitors On-Site', r.visitors)}
    <div style="display:flex;align-items:center;gap:8px;background:var(--brand-dim);border:1px solid var(--brand-border);border-radius:var(--r);padding:10px 14px;margin-top:4px;">
      <span>📸</span>
      <span style="font-size:0.84rem;font-weight:600;">${r.photos || 0} photos attached</span>
      <button class="btn btn-sm btn-orange" style="margin-left:auto;" onclick="exportReportPDF(Reports.getById('${r.id}'))">📄 Export PDF</button>
    </div>`;
  openModal('modalReportView');
}
function infoBox(label, val) {
  return `<div style="background:var(--surface-3);border:1px solid var(--border);border-radius:10px;padding:12px 14px;">
    <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:4px;">${label}</div>
    <div style="font-weight:700;font-size:0.88rem;">${val || '—'}</div>
  </div>`;
}
function section(title, body) {
  return `<div style="margin-bottom:14px;">
    <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border);">${title}</div>
    <p style="font-size:0.84rem;line-height:1.7;color:var(--text-secondary);">${body || 'None reported.'}</p>
  </div>`;
}

function submitReport() {
  const f = document.getElementById('formReport');
  const data = {
    project: f.querySelector('[name=project]').value,
    date: f.querySelector('[name=date]').value,
    foreman: f.querySelector('[name=foreman]').value,
    weather: f.querySelector('[name=weather]').value,
    crew: parseInt(f.querySelector('[name=crew]').value) || 0,
    hours: parseInt(f.querySelector('[name=hours]').value) || 0,
    work: f.querySelector('[name=work]').value.trim(),
    issues: f.querySelector('[name=issues]').value.trim(),
    visitors: f.querySelector('[name=visitors]').value.trim(),
    photos: 0, status: 'submitted',
  };
  if (!data.work) { showToast('Please describe work completed', 'error'); return; }
  Reports.add(data);
  closeModal('modalReport');
  f.reset();
  f.querySelector('[name=date]').value = '2026-03-16';
  showToast('✅ Daily report saved to database', 'success');
  if (state.currentPage === 'daily-report') renderReportsTable();
  updateDashboardStats();
}

// ══════════════════════════════════════════════════
// CHANGE ORDERS
// ══════════════════════════════════════════════════
function renderChangeOrders() {
  const pendingEl = document.getElementById('coPendingList');
  const approvedEl = document.getElementById('coApprovedList');
  if (!pendingEl || !approvedEl) return;

  const all = ChangeOrders.getAll();
  const pending = all.filter(c => c.status === 'pending');
  const approved = all.filter(c => c.status !== 'pending');

  const renderCO = (co, showActions) => {
    const total = Number(co.labourCost||0) + Number(co.materialCost||0);
    const statusBadge = co.status === 'approved' ? 'badge-green' : co.status === 'rejected' ? 'badge-red' : 'badge-yellow';
    return `<div class="co-card">
      <div class="co-header"><span class="co-id">${co.number || '#CO-?'}</span><span class="badge ${statusBadge}">${(co.status||'Pending').charAt(0).toUpperCase()+(co.status||'Pending').slice(1)}</span></div>
      <div class="co-title">${co.title || 'Untitled'}</div>
      <div class="co-desc">${co.desc || ''}</div>
      <div class="co-footer">
        <div><div class="co-amount" style="${co.status==='approved'?'color:var(--green)':''}">\$${total.toLocaleString()}</div><div style="font-size:0.72rem;color:var(--text-muted);">Submitted ${co.date||''} — ${co.requestedBy||''}</div></div>
        <div class="co-actions">
          <button class="btn btn-sm btn-outline" onclick="exportChangOrderPDF(ChangeOrders.getById('${co.id}'))" title="Export PDF">📄 PDF</button>
          ${showActions ? `<button class="btn btn-sm btn-success" onclick="doApproveCO('${co.id}')">✓ Approve</button><button class="btn btn-sm btn-danger" onclick="doRejectCO('${co.id}')">✗ Reject</button>` : ''}
        </div>
      </div>
    </div>`;
  };

  pendingEl.innerHTML = pending.length ? pending.map(c => renderCO(c, true)).join('') :
    `<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">No pending change orders</div></div>`;
  approvedEl.innerHTML = approved.length ? approved.map(c => renderCO(c, false)).join('') :
    `<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-title">No approved COs yet</div></div>`;

  const all2 = ChangeOrders.getAll();
  const el = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
  el('coPendingCount', all2.filter(c=>c.status==='pending').length);
  el('coApprovedCount', all2.filter(c=>c.status==='approved').length);
  el('coTotalCount', all2.length);
  el('coPendingVal', '$' + all2.filter(c=>c.status==='pending').reduce((s,c)=>s+Number(c.labourCost||0)+Number(c.materialCost||0),0).toLocaleString() + ' outstanding');
}

function doApproveCO(id) { const co = ChangeOrders.getById(id); ChangeOrders.approve(id); renderChangeOrders(); updateDashboardStats(); showToast(`✓ ${co?.number||''} approved — contract updated`, 'success'); }
function doRejectCO(id) { const co = ChangeOrders.getById(id); ChangeOrders.reject(id); renderChangeOrders(); updateDashboardStats(); showToast(`✗ ${co?.number||''} rejected`, 'error'); }

function submitCO() {
  const f = document.getElementById('formCO');
  const num = 'CO-' + String(ChangeOrders.getAll().length + 5).padStart(3,'0');
  const data = {
    number: num, project: f.querySelector('[name=coProject]').value,
    title: f.querySelector('[name=coTitle]').value.trim(),
    desc: f.querySelector('[name=coDesc]').value.trim(),
    requestedBy: f.querySelector('[name=coRequestedBy]').value,
    date: f.querySelector('[name=coDate]').value,
    labourCost: parseFloat(f.querySelector('[name=coLabour]').value) || 0,
    materialCost: parseFloat(f.querySelector('[name=coMaterial]').value) || 0,
    status: 'pending',
  };
  if (!data.title) { showToast('Please enter a title', 'error'); return; }
  ChangeOrders.add(data);
  closeModal('modalCO'); f.reset();
  f.querySelector('[name=coDate]').value = '2026-03-16';
  renderChangeOrders(); updateDashboardStats();
  showToast(`📝 ${num} submitted for approval`, 'success');
}

// ══════════════════════════════════════════════════
// SAFETY LOG
// ══════════════════════════════════════════════════
function renderSafetyLog() {
  const openEl = document.getElementById('safetyOpenList');
  const talksEl = document.getElementById('safetyTalksList');
  if (!openEl || !talksEl) return;

  const all = SafetyLogs.getAll();
  const open = all.filter(s => s.type !== 'Toolbox Talk' && !s.resolved);
  const talks = all.filter(s => s.type === 'Toolbox Talk');

  const daysClean = document.getElementById('daysWithoutIncident');
  if (daysClean) daysClean.textContent = open.length === 0 ? '48' : '0';

  openEl.innerHTML = open.length ? open.map(s => `
    <div class="safety-item"><div class="safety-icon">⚠️</div><div class="safety-content">
      <div class="safety-title">${s.title}</div><div class="safety-desc">${s.desc || ''}</div>
      <div class="safety-footer"><span class="badge badge-red">${s.type}</span><span class="text-muted" style="font-size:0.72rem;">Reported by ${s.reportedBy||'—'} — ${s.date||''}</span><button class="btn btn-sm btn-success" onclick="doResolveSafety('${s.id}')">Mark Resolved</button></div>
    </div></div>`).join('') :
    `<div class="empty-state" style="padding:24px;"><div class="empty-icon">✅</div><div class="empty-title">No open items</div><div class="empty-desc">All clear!</div></div>`;

  const openBadge = document.getElementById('safetyOpenBadge');
  if (openBadge) { openBadge.textContent = open.length ? `${open.length} Open` : 'All Clear'; openBadge.className = open.length ? 'badge badge-red' : 'badge badge-green'; }

  talksEl.innerHTML = talks.length ? talks.map(s => `
    <div class="safety-item"><div class="safety-icon">✅</div><div class="safety-content">
      <div class="safety-title">${s.title}</div><div class="safety-desc">${s.desc||''}</div>
      <div class="safety-footer">${s.attendees ? `<span class="badge badge-green">${s.attendees} attendees</span>` : ''}<span class="text-muted" style="font-size:0.72rem;">${s.date||''}</span></div>
    </div></div>`).join('') :
    `<div class="empty-state" style="padding:24px;"><div class="empty-icon">📋</div><div class="empty-title">No toolbox talks yet</div></div>`;

  const sBadge = document.querySelector('[data-page="safety"] .nav-badge');
  if (sBadge) { sBadge.textContent = open.length; sBadge.style.background = open.length ? 'var(--red)' : 'var(--green)'; }
}

function doResolveSafety(id) { SafetyLogs.resolve(id); renderSafetyLog(); showToast('✅ Safety item marked resolved', 'success'); }

function submitSafety() {
  const f = document.getElementById('formSafety');
  const data = {
    type: f.querySelector('[name=safetyType]').value,
    title: f.querySelector('[name=safetyTitle]').value.trim(),
    desc: f.querySelector('[name=safetyDesc]').value.trim(),
    reportedBy: f.querySelector('[name=safetyBy]').value,
    date: (f.querySelector('[name=safetyDate]').value || '').slice(0,10),
    attendees: parseInt(f.querySelector('[name=safetyAttendees]').value) || null,
    resolved: false,
  };
  if (!data.title) { showToast('Please enter a title', 'error'); return; }
  SafetyLogs.add(data); closeModal('modalSafety'); f.reset();
  renderSafetyLog(); showToast('⚠️ Safety entry saved to database', 'success');
}

// ══════════════════════════════════════════════════
// RFIs — Requests for Information
// ══════════════════════════════════════════════════
function renderRFIs() {
  const tbody = document.getElementById('rfisTableBody');
  if (!tbody) return;
  const all = RFIs.getAll();

  const el = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
  el('rfiOpenCount', all.filter(r => r.status === 'open').length);
  el('rfiAnsweredCount', all.filter(r => r.status === 'answered').length);
  el('rfiTotalCount', all.length);

  if (!all.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📨</div><div class="empty-title">No RFIs yet</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = all.map(r => {
    const statusBadge = r.status === 'open' ? 'badge-orange' : r.status === 'answered' ? 'badge-green' : 'badge-blue';
    const statusLabel = r.status === 'open' ? 'Open' : r.status === 'answered' ? 'Answered' : 'Closed';
    const priorityBadge = r.priority === 'High' ? 'badge-red' : r.priority === 'Medium' ? 'badge-yellow' : 'badge-gray';
    return `<tr>
      <td class="font-mono" style="font-size:0.77rem;">${r.number || '—'}</td>
      <td><strong style="cursor:pointer;" onclick="viewRFI('${r.id}')">${r.subject || '—'}</strong></td>
      <td style="font-size:0.78rem;">${r.assignedTo || '—'}</td>
      <td><span class="badge ${priorityBadge}">${r.priority||'—'}</span></td>
      <td><span class="badge ${statusBadge}">${statusLabel}</span></td>
      <td class="font-mono" style="font-size:0.77rem;">${r.dueDate || '—'}</td>
      <td><button class="btn btn-sm btn-outline" onclick="viewRFI('${r.id}')">View</button></td>
    </tr>`;
  }).join('');
}

function viewRFI(id) {
  const r = RFIs.getById(id);
  if (!r) return;
  document.getElementById('rfiViewTitle').textContent = `${r.number} — ${r.subject || ''}`;
  const statusBadge = r.status === 'open' ? 'badge-orange' : r.status === 'answered' ? 'badge-green' : 'badge-blue';
  const statusLabel = r.status === 'open' ? 'Open' : r.status === 'answered' ? 'Answered' : 'Closed';
  document.getElementById('rfiViewBody').innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
      <span class="badge ${statusBadge}">${statusLabel}</span>
      <span class="badge badge-${r.priority==='High'?'red':r.priority==='Medium'?'yellow':'gray'}">${r.priority} Priority</span>
      <span class="badge badge-gray">Due: ${r.dueDate||'—'}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
      ${infoBox('Project', r.project)}
      ${infoBox('Assigned To', r.assignedTo)}
      ${infoBox('Submitted By', r.submittedBy)}
      ${infoBox('Date', r.createdAt?.slice(0,10)||'—')}
    </div>
    ${section('Question', r.question)}
    ${r.response ? section('Response', r.response) : '<div style="background:var(--yellow-bg);border:1px solid var(--yellow-border);border-radius:var(--r);padding:12px 16px;font-size:0.84rem;color:var(--yellow);">⏳ Awaiting response from design team</div>'}
    ${r.status === 'open' ? `<div style="margin-top:16px;"><button class="btn btn-sm btn-success" onclick="markRFIAnswered('${r.id}')">Mark as Answered</button></div>` : ''}
  `;
  openModal('modalRFIView');
}

function markRFIAnswered(id) {
  RFIs.respond(id, 'Acknowledged — response received verbally. Will be documented in next addendum.');
  closeModal('modalRFIView'); renderRFIs(); updateDashboardStats();
  showToast('✅ RFI marked as answered', 'success');
}

function submitRFI() {
  const f = document.getElementById('formRFI');
  const num = 'RFI-' + String(RFIs.getAll().length + 13).padStart(3,'0');
  const data = {
    number: num, project: f.querySelector('[name=rfiProject]').value,
    subject: f.querySelector('[name=rfiSubject]').value.trim(),
    question: f.querySelector('[name=rfiQuestion]').value.trim(),
    assignedTo: f.querySelector('[name=rfiAssigned]').value.trim(),
    priority: f.querySelector('[name=rfiPriority]').value,
    dueDate: f.querySelector('[name=rfiDue]').value,
    submittedBy: 'J. Sullivan',
    status: 'open', response: null,
  };
  if (!data.subject) { showToast('Please enter a subject', 'error'); return; }
  RFIs.add(data); closeModal('modalRFI'); f.reset();
  f.querySelector('[name=rfiDue]').value = '2026-03-20';
  renderRFIs(); updateDashboardStats();
  showToast(`📨 ${num} submitted`, 'success');
}

// ══════════════════════════════════════════════════
// PUNCH LIST
// ══════════════════════════════════════════════════
function renderPunchList() {
  const container = document.getElementById('punchListItems');
  if (!container) return;
  const all = PunchList.getAll();
  const open = all.filter(p => p.status !== 'complete');
  const done = all.filter(p => p.status === 'complete');

  const el = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
  el('plOpenCount', open.length);
  el('plCompleteCount', done.length);
  el('plTotalCount', all.length);
  el('plRate', all.length ? Math.round((done.length / all.length) * 100) + '%' : '0%');

  const renderItem = (p) => {
    const isComplete = p.status === 'complete';
    const priorityBadge = p.priority === 'High' ? 'badge-red' : p.priority === 'Medium' ? 'badge-yellow' : 'badge-gray';
    return `<div class="co-card" style="${isComplete ? 'opacity:0.6;' : ''}">
      <div class="co-header">
        <span style="display:flex;align-items:center;gap:8px;">
          <span class="badge ${priorityBadge}">${p.priority}</span>
          <span class="badge badge-blue">${p.trade||'—'}</span>
        </span>
        <span class="badge ${isComplete ? 'badge-green' : 'badge-orange'}">${isComplete ? '✓ Complete' : 'Open'}</span>
      </div>
      <div class="co-title">${p.title || 'Untitled'}</div>
      <div class="co-desc">${p.notes || ''}</div>
      <div class="co-footer">
        <div>
          <div style="font-size:0.78rem;color:var(--text-secondary);"><strong>Location:</strong> ${p.location||'—'} · <strong>Assigned:</strong> ${p.assignedTo||'—'}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">Due: ${p.dueDate||'—'}</div>
        </div>
        <div class="co-actions">
          ${isComplete
            ? `<button class="btn btn-sm btn-outline" onclick="reopenPunch('${p.id}')">↩ Reopen</button>`
            : `<button class="btn btn-sm btn-success" onclick="completePunch('${p.id}')">✓ Complete</button>`}
        </div>
      </div>
    </div>`;
  };

  container.innerHTML = `
    ${open.length ? `<div class="section-header" style="margin-bottom:12px;"><div class="section-title" style="font-size:0.9rem;"><span class="badge badge-orange">${open.length} Open</span></div></div>` : ''}
    ${open.map(renderItem).join('')}
    ${done.length ? `<div class="section-header" style="margin-top:20px;margin-bottom:12px;"><div class="section-title" style="font-size:0.9rem;"><span class="badge badge-green">${done.length} Completed</span></div></div>` : ''}
    ${done.map(renderItem).join('')}
    ${!all.length ? '<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">No punch list items yet</div></div>' : ''}
  `;
}

function completePunch(id) { PunchList.complete(id); renderPunchList(); showToast('✅ Punch item marked complete', 'success'); }
function reopenPunch(id) { PunchList.reopen(id); renderPunchList(); showToast('↩ Punch item reopened', 'info'); }

function submitPunch() {
  const f = document.getElementById('formPunch');
  const data = {
    title: f.querySelector('[name=punchTitle]').value.trim(),
    location: f.querySelector('[name=punchLocation]').value.trim(),
    trade: f.querySelector('[name=punchTrade]').value,
    assignedTo: f.querySelector('[name=punchAssigned]').value.trim(),
    priority: f.querySelector('[name=punchPriority]').value,
    notes: f.querySelector('[name=punchNotes]').value.trim(),
    dueDate: f.querySelector('[name=punchDue]').value,
    status: 'open',
  };
  if (!data.title) { showToast('Please enter a title', 'error'); return; }
  PunchList.add(data); closeModal('modalPunch'); f.reset();
  f.querySelector('[name=punchDue]').value = '2026-03-22';
  renderPunchList(); showToast('✅ Punch list item added', 'success');
}

// ══════════════════════════════════════════════════
// TIMECARDS
// ══════════════════════════════════════════════════
function renderTimecards() {
  const listEl = document.getElementById('timecardsList');
  const costEl = document.getElementById('costCodeBreakdown');
  if (!listEl) return;

  const today = Timecards.getByDate('2026-03-16');
  const all = Timecards.getAll();

  const totalHrs = today.reduce((s,t) => s + (t.hours||0), 0);
  const totalOT = today.reduce((s,t) => s + (t.overtime||0), 0);
  const regHrs = totalHrs - totalOT;

  const el = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
  el('tcTodayHours', totalHrs);
  el('tcRegHours', regHrs);
  el('tcOTHours', totalOT);
  el('tcWeekHours', all.reduce((s,t) => s + (t.hours||0), 0));

  listEl.innerHTML = today.length ? today.map(t => `
    <div class="crew-row">
      <div class="crew-avatar">${t.worker.split(' ').map(w=>w[0]).join('')}</div>
      <div class="crew-info">
        <div class="crew-name">${t.worker}</div>
        <div class="crew-trade">${t.role||'—'}</div>
      </div>
      <span class="font-mono" style="font-size:0.75rem;color:var(--text-muted);">${t.clockIn} – ${t.clockOut}</span>
      <span class="crew-hours">${t.hours}h${t.overtime ? ` <span style="color:var(--yellow);font-size:0.7rem;">(+${t.overtime}OT)</span>` : ''}</span>
    </div>`).join('') :
    `<div class="empty-state" style="padding:24px;"><div class="empty-icon">⏱️</div><div class="empty-title">No timecards for today</div></div>`;

  // Cost code breakdown
  if (costEl) {
    const codes = {};
    today.forEach(t => {
      if (!codes[t.costCode]) codes[t.costCode] = { hours: 0, workers: 0 };
      codes[t.costCode].hours += t.hours;
      codes[t.costCode].workers++;
    });
    costEl.innerHTML = Object.keys(codes).length ? Object.entries(codes).map(([code, data]) => {
      const pct = Math.min((data.hours / totalHrs) * 100, 100);
      return `<div class="budget-item">
        <div class="budget-row"><span class="budget-label" style="font-size:0.8rem;">${code}</span><div class="budget-amounts"><span class="amount-spent">${data.hours}h</span><span class="amount-total">${data.workers} worker${data.workers>1?'s':''}</span></div></div>
        <div class="budget-fill-bar"><div class="budget-fill fill-safe" style="width:${pct}%"></div></div>
      </div>`;
    }).join('') : `<div class="empty-state" style="padding:24px;"><div class="empty-icon">💰</div></div>`;
  }
}

function submitTimecard() {
  const f = document.getElementById('formTimecard');
  const clockIn = f.querySelector('[name=tcIn]').value;
  const clockOut = f.querySelector('[name=tcOut]').value;
  const [inH, inM] = clockIn.split(':').map(Number);
  const [outH, outM] = clockOut.split(':').map(Number);
  const hours = Math.round(((outH*60+outM) - (inH*60+inM)) / 60 * 10) / 10;
  const ot = Math.max(0, hours - 8);

  const workerSel = f.querySelector('[name=tcWorker]');
  const roles = {'Jake Sullivan':'Site Foreman','Marc Tremblay':'Carpenter Lead','Raymond Okonkwo':'Electrician','Luis Pereira':'Plumber Lead','Dave Kim':'Carpenter','Amir Bolouri':'Plumber'};
  const data = {
    date: f.querySelector('[name=tcDate]').value,
    worker: workerSel.value,
    role: roles[workerSel.value] || '',
    clockIn, clockOut, hours, overtime: ot,
    costCode: f.querySelector('[name=tcCostCode]').value,
    project: f.querySelector('[name=tcProject]').value,
  };
  Timecards.add(data); closeModal('modalTimecard'); f.reset();
  f.querySelector('[name=tcDate]').value = '2026-03-16';
  f.querySelector('[name=tcIn]').value = '07:00';
  f.querySelector('[name=tcOut]').value = '15:30';
  renderTimecards(); showToast(`⏱️ ${data.worker} clocked — ${hours}h`, 'success');
}

// ══════════════════════════════════════════════════
// DOCUMENTS
// ══════════════════════════════════════════════════
function renderDocuments() {
  const tbody = document.getElementById('docsTableBody');
  if (!tbody) return;
  const filter = document.getElementById('docCategoryFilter')?.value || 'all';
  const all = Documents.getAll();
  const filtered = filter === 'all' ? all : all.filter(d => d.category === filter);

  const el = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
  el('docTotalCount', all.length);
  el('docContractCount', all.filter(d => d.category === 'Contracts').length);
  el('docDrawingCount', all.filter(d => d.category === 'Drawings').length);
  el('docPermitCount', all.filter(d => d.category === 'Permits').length);

  const catIcons = { 'Contracts': '📃', 'Permits': '🏛️', 'Drawings': '📐', 'Specs': '📑', 'Insurance': '🛡️' };
  const catBadge = { 'Contracts': 'badge-blue', 'Permits': 'badge-yellow', 'Drawings': 'badge-green', 'Specs': 'badge-orange', 'Insurance': 'badge-gray' };

  tbody.innerHTML = filtered.length ? filtered.map(d => `<tr>
    <td><div style="display:flex;align-items:center;gap:8px;"><span>${catIcons[d.category]||'📄'}</span><strong>${d.name}</strong></div></td>
    <td><span class="badge ${catBadge[d.category]||'badge-gray'}">${d.category}</span></td>
    <td class="font-mono" style="font-size:0.77rem;">${d.fileType||'—'}</td>
    <td style="font-size:0.78rem;">${d.fileSize||'—'}</td>
    <td style="font-size:0.78rem;">${d.uploadedBy||'—'}</td>
    <td class="font-mono" style="font-size:0.77rem;">${d.date||'—'}</td>
  </tr>`).join('') :
  `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📁</div><div class="empty-title">No documents found</div></div></td></tr>`;
}

// ══════════════════════════════════════════════════
// GANTT CHART
// ══════════════════════════════════════════════════
function renderGantt() {
  const container = document.getElementById('ganttChart');
  if (!container) return;
  const tasks = Schedule.getAll().sort((a,b) => new Date(a.startDate) - new Date(b.startDate));
  if (!tasks.length) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-title">No schedule items</div></div>'; return; }

  const projectStart = new Date('2026-01-06');
  const projectEnd = new Date('2026-08-21');
  const totalDays = Math.ceil((projectEnd - projectStart) / (1000*60*60*24));
  const todayOffset = Math.ceil((new Date('2026-03-16') - projectStart) / (1000*60*60*24));

  // Month headers
  const months = [];
  let curMonth = new Date(projectStart);
  while (curMonth < projectEnd) {
    const monthStart = new Date(curMonth.getFullYear(), curMonth.getMonth(), 1);
    const monthEnd = new Date(curMonth.getFullYear(), curMonth.getMonth()+1, 0);
    const startDays = Math.max(0, Math.ceil((monthStart - projectStart) / (1000*60*60*24)));
    const endDays = Math.min(totalDays, Math.ceil((monthEnd - projectStart) / (1000*60*60*24)));
    months.push({ label: curMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), left: (startDays/totalDays)*100, width: ((endDays-startDays)/totalDays)*100 });
    curMonth.setMonth(curMonth.getMonth() + 1);
  }

  const todayPct = (todayOffset / totalDays) * 100;

  container.innerHTML = `
    <div style="display:flex;border-bottom:1px solid var(--border);margin-bottom:8px;position:relative;">
      ${months.map(m => `<div style="flex:0 0 ${m.width}%;font-size:0.66rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);padding:4px 6px;border-right:1px solid var(--border);">${m.label}</div>`).join('')}
    </div>
    <div style="position:relative;">
      <div style="position:absolute;left:${todayPct}%;top:0;bottom:0;width:2px;background:var(--brand);z-index:2;opacity:0.7;" title="Today — Mar 16, 2026"></div>
      <div style="position:absolute;left:${todayPct-0.3}%;top:-18px;font-size:0.58rem;font-weight:700;color:var(--brand);white-space:nowrap;">▼ Today</div>
      ${tasks.map(t => {
        const start = Math.ceil((new Date(t.startDate) - projectStart) / (1000*60*60*24));
        const end = Math.ceil((new Date(t.endDate) - projectStart) / (1000*60*60*24));
        const left = (start / totalDays) * 100;
        const width = ((end - start) / totalDays) * 100;
        const progressBg = t.progress === 100 ? 'var(--green)' : t.progress > 0 ? (t.color || 'var(--brand)') : 'var(--border)';
        return `<div style="display:flex;align-items:center;margin-bottom:3px;height:28px;">
          <div style="width:160px;flex-shrink:0;font-size:0.74rem;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:8px;" title="${t.taskName}">${t.taskName}</div>
          <div style="flex:1;position:relative;height:20px;">
            <div style="position:absolute;left:${left}%;width:${width}%;height:100%;background:var(--surface-4);border-radius:4px;overflow:hidden;">
              <div style="height:100%;width:${t.progress}%;background:${progressBg};border-radius:4px;transition:width 1s ease;"></div>
            </div>
            <div style="position:absolute;left:${left+width+0.5}%;top:2px;font-size:0.62rem;font-weight:700;color:${t.progress===100?'var(--green)':t.progress>0?'var(--text-secondary)':'var(--text-muted)'};white-space:nowrap;">${t.progress}%</div>
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
}

// ══════════════════════════════════════════════════
// PHOTO GRID (unchanged)
// ══════════════════════════════════════════════════
const DEMO_PHOTOS_1 = [
  { label: 'F6 North framing – progress', color: '#2a3a2a' },
  { label: 'Anchor bolt layout verified', color: '#1a2a3a' },
  { label: 'Header installation – door 6-04', color: '#3a2a1a' },
  { label: 'OSB sheathing – west wall', color: '#2a1a3a' },
  { label: 'Temporary bracing detail', color: '#1a3a2a' },
  { label: 'Crane lift – LVL beam F6', color: '#3a1a2a' },
  { label: 'Stairwell framing complete', color: '#2a3a3a' },
  { label: 'Elevator shaft opening – F6', color: '#3a3a1a' },
  { label: 'Fire blocking at penetration', color: '#1a2a2a' },
  { label: 'Blocking for mechanical', color: '#2a2a3a' },
  { label: 'F6 south view – noon', color: '#3a2a2a' },
  { label: 'Hardware delivery received', color: '#2a3a1a' },
  { label: 'Site sign-in sheet – 7AM', color: '#1a3a3a' },
  { label: 'Safety barricade – N shaft', color: '#3a3a2a' },
];
const DEMO_PHOTOS_2 = [
  { label: 'Plumbing rough-in F5 – bath', color: '#1a2a3a' },
  { label: 'Stack venting – unit 501', color: '#3a1a1a' },
  { label: 'Water supply – copper run', color: '#2a3a2a' },
  { label: 'Drain slope verified', color: '#1a3a2a' },
  { label: 'Hanger placement F4-ceiling', color: '#3a2a3a' },
  { label: 'Pressure test – zone 5B', color: '#2a2a1a' },
  { label: 'Cleanout access framed', color: '#3a3a1a' },
  { label: 'Overview rough-in complete F5', color: '#1a1a3a' },
];

function renderPhotoGrid() {
  const grid1 = document.getElementById('photoGrid');
  const grid2 = document.getElementById('photoGrid2');
  const saved = Photos.getAll();
  const savedHTML = saved.map(p => `<div class="photo-item" onclick="showToast('Photo: ${p.name}', 'info')"><img src="${p.dataUrl}" alt="${p.name}" /><div class="photo-tag">${p.name}</div></div>`).join('');
  if (grid1) {
    grid1.innerHTML = savedHTML + DEMO_PHOTOS_1.map(p => `<div class="photo-item" onclick="showToast('Viewing: ${p.label}', 'info')"><div class="photo-placeholder" style="background:${p.color};"><span class="ph-icon">🏗️</span><span style="font-size:0.7rem;text-align:center;padding:0 8px;">${p.label}</span></div><div class="photo-tag">${p.label}</div></div>`).join('');
  }
  if (grid2) {
    grid2.innerHTML = DEMO_PHOTOS_2.map(p => `<div class="photo-item" onclick="showToast('Viewing: ${p.label}', 'info')"><div class="photo-placeholder" style="background:${p.color};"><span class="ph-icon">🔧</span><span style="font-size:0.7rem;text-align:center;padding:0 8px;">${p.label}</span></div><div class="photo-tag">${p.label}</div></div>`).join('');
  }
}

function handlePhotoUpload(event) {
  const files = Array.from(event.target.files);
  let done = 0;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      Photos.add({ name: file.name, dataUrl: e.target.result, project: 'Harbour Reach Condos – Phase 2', uploadedAt: new Date().toISOString() });
      done++;
      if (done === files.length) { renderPhotoGrid(); showToast(`📸 ${files.length} photo${files.length > 1 ? 's' : ''} saved to database`, 'success'); }
    };
    reader.readAsDataURL(file);
  });
}

function handleDrop(event) {
  event.preventDefault();
  document.getElementById('uploadZone').classList.remove('drag-over');
  const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  if (!files.length) { showToast('Only image files supported', 'error'); return; }
  handlePhotoUpload({ target: { files } });
}

// ── Trade schedule board ─────────────────────────
const TRADES = [
  { name: 'Framing Crew',  color: '#FF6B2B', schedule: ['full','full','full','full','full','off','off'] },
  { name: 'Electricians',  color: '#3B82F6', schedule: ['full','full','half','full','full','off','off'] },
  { name: 'Plumbing Crew', color: '#22C55E', schedule: ['full','full','full','off','full','off','off'] },
  { name: 'HVAC Crew',     color: '#EAB308', schedule: ['half','full','full','full','half','off','off'] },
  { name: 'Concrete Sub',  color: '#8B5CF6', schedule: ['off','off','full','full','off','off','off'] },
  { name: 'Insulation',    color: '#EC4899', schedule: ['off','off','off','full','full','half','off'] },
];

function renderScheduleBoard() {
  const container = document.getElementById('scheduleRows');
  if (!container) return;
  container.innerHTML = TRADES.map(trade => `
    <div class="schedule-row">
      <div class="schedule-trade"><div class="trade-dot" style="background:${trade.color}"></div><span>${trade.name}</span></div>
      ${trade.schedule.map(shift => `
        <div class="schedule-cell">
          ${shift !== 'off' ? `<div class="schedule-block ${shift === 'full' ? 'shift-full' : 'shift-half'}" style="${shift === 'full' ? `background:${trade.color}15;color:${trade.color};border-color:${trade.color}33;` : ''}" onclick="showToast('${trade.name}: ${shift === 'full' ? 'Full day (8h)' : 'Half day (4h)'}', 'info')">${shift === 'full' ? '8h' : '4h'}</div>` : `<div></div>`}
        </div>`).join('')}
    </div>`).join('');
}

// ── Budget Spend Chart ───────────────────────────
const MONTHLY_SPEND = [
  { month: 'Jan', amount: 180000, max: 280000 },
  { month: 'Feb', amount: 312000, max: 280000 },
  { month: 'Mar', amount: 168000, max: 280000 },
  { month: 'Apr', amount: 0, max: 280000 },
  { month: 'May', amount: 0, max: 280000 },
  { month: 'Jun', amount: 0, max: 280000 },
];

function renderSpendChart() {
  const container = document.getElementById('spendChart');
  if (!container) return;
  container.innerHTML = MONTHLY_SPEND.map(m => {
    const pct = m.amount ? Math.min((m.amount / m.max) * 100, 100) : 0;
    const over = m.amount > m.max;
    const lbl = m.amount ? `$${(m.amount/1000).toFixed(0)}K` : '—';
    return `<div style="display:flex;align-items:center;gap:12px;">
      <span style="font-size:0.75rem;font-weight:700;color:var(--text-muted);width:28px;">${m.month}</span>
      <div style="flex:1;height:10px;background:var(--surface-4);border-radius:5px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;border-radius:5px;background:${over?'linear-gradient(90deg,#dc2626,#ef4444)':'linear-gradient(90deg,var(--brand),var(--brand-bright))'};transition:width 1s ease;"></div>
      </div>
      <span style="font-size:0.78rem;font-weight:700;width:44px;text-align:right;color:${m.amount?(over?'var(--red)':'var(--text-primary)'):'var(--text-muted)'};">${lbl}</span>
    </div>`;
  }).join('');
}

// ── Animate progress bars ────────────────────────
function animateBars() {
  document.querySelectorAll('.progress-bar, .budget-fill').forEach(bar => {
    const t = bar.style.width;
    bar.style.width = '0';
    setTimeout(() => { bar.style.width = t; }, 50);
  });
}

// ── Checklist interactivity ──────────────────────
document.addEventListener('click', e => {
  const box = e.target.closest('.check-box');
  if (box) {
    box.classList.toggle('checked');
    box.textContent = box.classList.contains('checked') ? '✓' : '';
    const label = box.nextElementSibling;
    if (label) label.classList.toggle('done');
  }
});

// ── Toast ────────────────────────────────────────
function showToast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = '0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ══════════════════════════════════════════════════
// v3 — RISK INTELLIGENCE ENGINE
// ══════════════════════════════════════════════════

function computeRiskScore() {
  const cos = ChangeOrders.getAll();
  const rfis = RFIs.getAll();
  const safety = SafetyLogs.getAll();
  const punch = PunchList.getAll();

  const flags = [];

  // Scope Creep: >2 pending COs
  const pendingCOs = cos.filter(c => c.status === 'pending');
  if (pendingCOs.length >= 2) {
    flags.push({ level: 'high', signal: 'Scope Creep', project: 'Harbour Reach Condos – Phase 2',
      message: `${pendingCOs.length} change orders pending approval ($${pendingCOs.reduce((s,c)=>s+Number(c.labourCost||0)+Number(c.materialCost||0),0).toLocaleString()} outstanding). Rising CO velocity is the #1 indicator of scope creep.`,
      action: 'Review each change order with the owner and confirm scope before approving.',
    });
  }

  // Timeline Drift: Grafton St is delayed
  flags.push({ level: 'high', signal: 'Timeline Drift', project: 'Grafton Street Commercial Reno',
    message: 'Project is 14 days behind schedule with 78% overall progress. At current velocity, projected completion has moved from Apr 1 to Apr 15, 2026.',
    action: 'Implement recovery plan: add weekend shifts, accelerate drywall completion.',
  });

  // Budget Burn: Equipment > 89%
  flags.push({ level: 'medium', signal: 'Budget Overrun Risk', project: 'Harbour Reach Condos – Phase 2',
    message: 'Equipment rental is at 89% of budget with 39% of project remaining. At this burn rate, the equipment line will be exhausted before project completion.',
    action: 'Review equipment rental rates with Cooper Crane. Consider returning non-critical equipment early.',
  });

  // RFI Overload: open RFIs near due date
  const openRFIs = rfis.filter(r => r.status === 'open');
  if (openRFIs.length > 1) {
    flags.push({ level: 'medium', signal: 'RFI Backlog', project: 'Harbour Reach Condos – Phase 2',
      message: `${openRFIs.length} open RFIs, including RFI-012 due ${openRFIs[0]?.dueDate||'—'}. Unresolved RFIs are the leading cause of schedule delay in design-build projects.`,
      action: 'Escalate RFI-012 directly to Morrison Partners. Request response by COB today.',
    });
  }

  // Safety: Near Miss logged recently
  const nearMisses = safety.filter(s => s.type === 'Near Miss' && !s.resolved);
  if (nearMisses.length > 0) {
    flags.push({ level: 'medium', signal: 'Safety Alert', project: 'Harbour Reach Condos – Phase 2',
      message: `${nearMisses.length} unresolved near-miss incident(s). Last: "${nearMisses[0].title}". Unresolved near-misses indicate elevated risk of an LTI event.`,
      action: 'Conduct site walkthrough and resolve open safety items before next crane lift.',
    });
  }

  // Process Maturity: Punch list growing
  const openPunch = punch.filter(p => p.status !== 'complete').length;
  if (openPunch > 4) {
    flags.push({ level: 'low', signal: 'Punch List Growth', project: 'Harbour Reach Condos – Phase 2',
      message: `${openPunch} open punch items. More than 4 open items at this project phase suggests quality control gaps before handover.`,
      action: 'Schedule weekly punch list walk with trades. Target zero open items before F6 final inspection.',
    });
  }

  // Good signal: Budget otherwise healthy
  flags.push({ level: 'low', signal: 'Labour Tracking On Track', project: 'Harbour Reach Condos – Phase 2',
    message: 'Labour and materials spend are both within 5% of expected burn rate for the current project phase. No cost overrun risk detected.',
    action: 'Maintain current weekly timecard reviews to preserve this trend.',
  });

  return flags;
}

function runRiskScan() {
  const flags = computeRiskScore();
  const high = flags.filter(f => f.level === 'high');
  const med  = flags.filter(f => f.level === 'medium');
  const low  = flags.filter(f => f.level === 'low');

  const el = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
  el('riskHighCount', high.length);
  el('riskMedCount',  med.length);
  el('riskLowCount',  low.length);
  el('riskLastScan',  'Just now');

  // Update sidebar badge
  const badge = document.getElementById('riskBadge');
  if (badge) {
    badge.textContent = high.length + med.length;
    badge.style.display = (high.length + med.length) > 0 ? 'inline-flex' : 'none';
  }

  const container = document.getElementById('riskCards');
  if (!container) return;

  const levelConfig = {
    high:   { icon: '🚨', color: 'var(--red)', bg: '#fff5f5', border: '#fecaca', label: 'HIGH RISK' },
    medium: { icon: '⚠️', color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'MEDIUM RISK' },
    low:    { icon: '✅', color: 'var(--green)', bg: '#f0fdf4', border: '#bbf7d0', label: 'LOW / INFO' },
  };

  container.innerHTML = [...high, ...med, ...low].map(f => {
    const cfg = levelConfig[f.level];
    return `<div style="background:${cfg.bg};border:1px solid ${cfg.border};border-radius:12px;padding:18px 20px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <span style="font-size:1.4rem;">${cfg.icon}</span>
        <div>
          <div style="font-size:0.6rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${cfg.color};">${cfg.label}</div>
          <div style="font-weight:700;font-size:0.92rem;">${f.signal}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);">Project: ${f.project}</div>
        </div>
      </div>
      <p style="font-size:0.84rem;line-height:1.65;color:var(--text-secondary);margin-bottom:10px;">${f.message}</p>
      <div style="background:rgba(0,0,0,0.04);border-radius:8px;padding:10px 14px;font-size:0.8rem;">
        <strong style="color:${cfg.color};">Recommended Action:</strong> ${f.action}
      </div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════
// v3 — PMO EXECUTIVE DASHBOARD
// ══════════════════════════════════════════════════

function renderPMO() {
  renderPortfolioHeatmap();
  renderOKRs();
}

function renderPortfolioHeatmap() {
  const container = document.getElementById('portfolioHeatmap');
  if (!container) return;

  const projects = [
    { name: 'Harbour Reach Condos – Phase 2', status: 'on-track', progress: 61, health: 'green', methodology: 'PMBOK Classic', contract: '$2.4M', completion: 'Aug 2026' },
    { name: 'Grafton Street Commercial Reno',  status: 'delayed',   progress: 78, health: 'red',   methodology: 'Waterfall',     contract: '$640K', completion: 'Apr 2026 – DELAYED' },
    { name: 'Bedford Commons – Framing',       status: 'pre-start', progress: 8,  health: 'yellow', methodology: 'Hybrid',        contract: '$890K', completion: 'TBD' },
  ];

  const healthConfig = {
    green:  { icon: '🟢', label: 'On Track',  bg: '#f0fdf4', border: '#86efac' },
    red:    { icon: '🔴', label: 'Delayed',   bg: '#fff5f5', border: '#fca5a5' },
    yellow: { icon: '🟡', label: 'Pre-Start', bg: '#fffbeb', border: '#fde68a' },
  };

  container.innerHTML = projects.map(p => {
    const cfg = healthConfig[p.health];
    const badge = { 'PMBOK Classic': 'badge-blue', 'Waterfall': 'badge-gray', 'Hybrid': 'badge-orange' };
    return `<div style="background:${cfg.bg};border:1px solid ${cfg.border};border-radius:10px;padding:14px 16px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <div>
          <div style="font-weight:700;font-size:0.88rem;">${p.name}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px;">${p.contract} · ${p.completion}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
          <span class="badge ${badge[p.methodology]||'badge-gray'}" style="font-size:0.65rem;">${p.methodology}</span>
          <span>${cfg.icon}</span>
        </div>
      </div>
      <div style="background:rgba(0,0,0,0.06);border-radius:4px;height:6px;overflow:hidden;">
        <div style="height:100%;width:${p.progress}%;background:${p.health==='red'?'linear-gradient(90deg,#dc2626,#ef4444)':p.health==='green'?'var(--brand)':'linear-gradient(90deg,#d97706,#f59e0b)'};border-radius:4px;transition:width 1s;"></div>
      </div>
      <div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">${p.progress}% complete</div>
    </div>`;
  }).join('');
}

function renderOKRs() {
  const container = document.getElementById('okrList');
  if (!container) return;
  const okrs = OKRs.getAll();

  if (!okrs.length) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-title">No OKRs yet</div></div>'; return; }

  container.innerHTML = okrs.map(o => {
    const avgProgress = Math.round(o.keyResults.reduce((s,k)=>s+k.progress,0)/o.keyResults.length);
    const healthColor = avgProgress >= 80 ? 'var(--green)' : avgProgress >= 50 ? '#d97706' : 'var(--red)';
    return `<div style="border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <div style="font-weight:700;font-size:0.88rem;line-height:1.3;flex:1;">${o.title}</div>
        <div style="font-size:1.1rem;font-weight:900;color:${healthColor};flex-shrink:0;margin-left:8px;">${avgProgress}%</div>
      </div>
      <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:10px;">${o.quarter} · Owner: ${o.owner}</div>
      ${o.keyResults.map(kr => `
        <div style="margin-bottom:6px;">
          <div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:3px;">${kr.kr}</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:5px;background:var(--surface-4);border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${kr.progress}%;background:${kr.progress>=80?'var(--green)':kr.progress>=50?'#d97706':'var(--red)'};border-radius:3px;transition:width 1s;"></div>
            </div>
            <span style="font-size:0.7rem;font-weight:700;color:var(--text-muted);width:28px;text-align:right;">${kr.progress}%</span>
          </div>
        </div>`).join('')}
    </div>`;
  }).join('');
}

function generateExecutiveSummary() {
  const cos = ChangeOrders.getAll();
  const rfis = RFIs.getAll();
  const punch = PunchList.getAll();
  const vendors = Vendors.getAll();
  const pos = PurchaseOrders.getAll();
  const flags = computeRiskScore();

  const pendingCOs = cos.filter(c=>c.status==='pending');
  const openRFIs = rfis.filter(r=>r.status==='open');
  const openPunch = punch.filter(p=>p.status!=='complete').length;
  const highFlags = flags.filter(f=>f.level==='high').length;
  const openPOValue = pos.filter(p=>p.status!=='paid').reduce((s,p)=>s+Number(p.amount||0),0);

  const today = new Date().toLocaleDateString('en-CA', { year:'numeric', month:'long', day:'numeric' });

  const summary = `SULLIVAN BUILD CO. — EXECUTIVE PROJECT SUMMARY
Prepared by: Site Command AI Intelligence Engine
Date: ${today}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PORTFOLIO OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sullivan Build Co. currently manages three active projects with a combined contract value of $3.93M. The flagship project, Harbour Reach Condos – Phase 2 ($2.4M), is progressing at 61% completion and remains projected on budget, with a current spend of $1.49M against a revised contract of $2.46M. The project is leveraging a PMBOK Classic methodology with phase-gate controls and is tracking toward an August 2026 handover.

The Grafton Street Commercial Reno ($640K) is the portfolio's primary risk concern. At 78% completion, the project is currently 14 calendar days behind the original April 2026 completion date. A recovery plan has been activated, and the project team is targeting an April 15 revised completion through accelerated drywall and MEP coordination.

Bedford Commons – Framing ($890K) is in pre-mobilization, with an April 1, 2026 start date confirmed and key subcontracts under review.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY RISK FLAGS (${highFlags} HIGH / ${flags.filter(f=>f.level==='medium').length} MEDIUM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${flags.filter(f=>f.level==='high').map(f=>`• [HIGH] ${f.signal}: ${f.message}`).join('\n\n')}

${flags.filter(f=>f.level==='medium').map(f=>`• [MEDIUM] ${f.signal}: ${f.message}`).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADMIN STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Change Orders: ${pendingCOs.length} pending approval, totalling $${pendingCOs.reduce((s,c)=>s+Number(c.labourCost||0)+Number(c.materialCost||0),0).toLocaleString()}.
RFIs: ${openRFIs.length} open, ${openRFIs.filter(r=>r.priority==='High').length} high priority.
Punch List: ${openPunch} open items requiring trade coordination before inspection.
Procurement: ${pos.filter(p=>!['paid'].includes(p.status)).length} active purchase orders. Total committed: $${openPOValue.toLocaleString()}.
Safety: Zero lost-time incidents reported across all projects.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXECUTIVE DECISION ITEMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Approve or reject CO-008 ($12,400) and CO-007 ($6,000) before next billing cycle.
2. Authorize Grafton Street recovery plan and confirm Saturday overtime with R. Okonkwo.
3. Escalate RFI-012 (beam connection detail) to Morrison Partners — holds steel fabrication.
4. Review equipment rental utilization on Harbour Reach — 89% budget consumed.

Generated by Site Command v3 — PMBOK 8th Edition Intelligence Engine.`;

  const card = document.getElementById('execSummaryCard');
  const text = document.getElementById('execSummaryText');
  if (card && text) { card.style.display = 'block'; text.textContent = summary; card.scrollIntoView({ behavior: 'smooth' }); }
  showToast('📄 Executive summary generated!', 'success');
  return summary;
}

function copyExecSummary() {
  const text = document.getElementById('execSummaryText')?.textContent;
  if (text) { navigator.clipboard.writeText(text).then(()=>showToast('📋 Copied to clipboard!','success')).catch(()=>showToast('Copy failed','error')); }
}

// ══════════════════════════════════════════════════
// v3 — COMPLIANCE CHECKLISTS
// ══════════════════════════════════════════════════

function renderCompliance() {
  const all = Compliance.getAll();
  const complete = all.filter(c=>c.status==='complete').length;
  const pending  = all.filter(c=>c.status==='pending').length;
  const score = all.length ? Math.round((complete / all.length) * 100) + '%' : '—';

  const el = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
  el('compCompleteCount', complete);
  el('compPendingCount',  pending);
  el('compTotalCount',    all.length);
  el('compScore',         score);

  const container = document.getElementById('complianceCards');
  if (!container) return;

  const typeIcons = { 'Fall Protection': '🪝', 'Electrical Lockout/Tagout': '⚡', 'Scaffolding': '🏗️', 'Equipment Inspection': '🏗️' };
  const freqBadge = { 'Daily': 'badge-orange', 'Weekly': 'badge-blue', 'Per Task': 'badge-yellow' };

  container.innerHTML = all.map(c => {
    const icon = typeIcons[c.type] || '✅';
    const isComplete = c.status === 'complete';
    const itemsDone = (c.completedItems||[]).filter(Boolean).length;
    const total = (c.items||[]).length;
    const pct = total ? Math.round((itemsDone/total)*100) : 0;

    return `<div class="card mb-24">
      <div class="card-header">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:1.5rem;">${icon}</span>
          <div>
            <div class="card-title" style="margin-bottom:2px;">${c.title}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);">Project: ${c.project} · Inspector: ${c.inspector||'—'} · Last: ${c.lastCompleted||'—'}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <span class="badge ${freqBadge[c.frequency]||'badge-gray'}">${c.frequency}</span>
          <span class="badge ${isComplete?'badge-green':'badge-orange'}">${isComplete?'✓ Complete':'Pending'}</span>
        </div>
      </div>
      <div class="card-body" style="padding:16px 22px;">
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="font-size:0.78rem;font-weight:600;color:var(--text-secondary);">Checklist Items (${itemsDone}/${total})</div>
            <span style="font-size:0.78rem;font-weight:700;color:${pct===100?'var(--green)':'var(--text-muted)'};">${pct}%</span>
          </div>
          <div style="height:4px;background:var(--surface-4);border-radius:2px;overflow:hidden;margin-bottom:12px;">
            <div style="height:100%;width:${pct}%;background:${pct===100?'var(--green)':'var(--brand)'};border-radius:2px;transition:width 1s;"></div>
          </div>
        </div>
        ${(c.items||[]).map((item,i) => {
          const checked = (c.completedItems||[])[i] === true;
          return `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-light);">
            <div class="check-box ${checked?'checked':''}" data-compliance-id="${c.id}" data-idx="${i}" style="width:18px;height:18px;border-radius:4px;border:2px solid ${checked?'var(--green)':'var(--border)'};background:${checked?'var(--green)':'transparent'};cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.75rem;color:#fff;" onclick="toggleComplianceItem('${c.id}',${i},this)">${checked?'✓':''}</div>
            <div style="font-size:0.82rem;color:${checked?'var(--text-muted)':'var(--text-primary)'};${checked?'text-decoration:line-through;':''}">${item.item}</div>
            ${item.required ? '<span class="badge badge-red" style="font-size:0.6rem;flex-shrink:0;">Required</span>' : ''}
          </div>`;
        }).join('')}
        <div style="padding-top:12px;">
          <button class="btn btn-sm btn-orange" onclick="completeChecklist('${c.id}')">✓ Mark All Complete</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleComplianceItem(id, idx, el) {
  const c = Compliance.getById(id);
  if (!c) return;
  const items = [...(c.completedItems||new Array(c.items.length).fill(false))];
  while (items.length < c.items.length) items.push(false);
  items[idx] = !items[idx];
  Compliance.update(id, { completedItems: items });
  renderCompliance();
  showToast(items[idx] ? '✓ Item checked' : 'Item unchecked', 'info');
}

function completeChecklist(id) {
  const c = Compliance.getById(id);
  if (!c) return;
  const allTrue = new Array(c.items.length).fill(true);
  Compliance.complete(id, allTrue);
  renderCompliance();
  showToast('✅ Checklist marked complete!', 'success');
}

// ══════════════════════════════════════════════════
// v3 — PROCUREMENT
// ══════════════════════════════════════════════════

function renderProcurement() {
  const pos = PurchaseOrders.getAll();
  const vendors = Vendors.getAll();

  const open  = pos.filter(p=>['pending','issued','received'].includes(p.status));
  const inv   = pos.filter(p=>p.status==='invoiced');
  const paid  = pos.filter(p=>p.status==='paid');
  const totalCommitted = open.concat(inv).reduce((s,p)=>s+Number(p.amount||0),0);

  const el = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
  el('poOpenCount',  open.length);
  el('poInvCount',   inv.length);
  el('poPaidCount',  paid.length);
  el('poTotalValue', '$' + totalCommitted.toLocaleString());

  // PO Table
  const tbody = document.getElementById('poTableBody');
  if (tbody) {
    const statusBadge = { pending:'badge-yellow', issued:'badge-blue', received:'badge-orange', invoiced:'badge-red', paid:'badge-green' };
    const statusLabel = { pending:'Pending', issued:'Issued', received:'Received', invoiced:'Invoiced', paid:'Paid' };
    tbody.innerHTML = pos.map(p => `<tr>
      <td class="font-mono" style="font-size:0.77rem;">${p.poNumber||'—'}</td>
      <td style="font-size:0.82rem;">${p.vendor||'—'}</td>
      <td style="font-size:0.78rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${p.description||''}">${p.description||'—'}</td>
      <td style="font-weight:700;">$${Number(p.amount||0).toLocaleString()}</td>
      <td><span class="badge ${statusBadge[p.status]||'badge-gray'}">${statusLabel[p.status]||p.status}</span></td>
      <td class="font-mono" style="font-size:0.77rem;">${p.dueDate||'—'}</td>
      <td>
        <div style="display:flex;gap:4px;">
          ${p.status==='issued'?`<button class="btn btn-sm btn-outline" onclick="doPOReceive('${p.id}')">Receive</button>`:''}
          ${p.status==='received'?`<button class="btn btn-sm btn-outline" onclick="doPOInvoice('${p.id}')">Invoice</button>`:''}
          ${p.status==='invoiced'?`<button class="btn btn-sm btn-success" onclick="doPOPay('${p.id}')">Pay</button>`:''}
        </div>
      </td>
    </tr>`).join('');
  }

  // Vendor List
  const vList = document.getElementById('vendorList');
  if (vList) {
    const stars = n => '★'.repeat(n) + '☆'.repeat(5-n);
    vList.innerHTML = vendors.map(v => `
      <div class="crew-row" style="padding:10px 0;">
        <div class="crew-avatar" style="background:${v.status==='active'?'var(--brand-dim)':'var(--surface-3)'};border:1px solid ${v.status==='active'?'var(--brand-border)':'var(--border)'};">${v.name.charAt(0)}</div>
        <div class="crew-info">
          <div class="crew-name">${v.name}</div>
          <div class="crew-trade">${v.category}</div>
          <div style="font-size:0.7rem;color:#d97706;">${stars(v.rating||0)}</div>
        </div>
        <span class="badge ${v.status==='active'?'badge-green':'badge-gray'}">${v.status}</span>
      </div>`).join('');
  }
}

function doPOReceive(id) { PurchaseOrders.receive(id); renderProcurement(); showToast('📦 PO marked as Received', 'success'); }
function doPOInvoice(id) { PurchaseOrders.invoice(id); renderProcurement(); showToast('🧾 PO marked as Invoiced', 'success'); }
function doPOPay(id)     { PurchaseOrders.pay(id);     renderProcurement(); showToast('✅ PO marked as Paid',     'success'); }

function submitPO() {
  const f = document.getElementById('formPO');
  const data = {
    poNumber: 'PO-2026-' + String(PurchaseOrders.getAll().length + 45).padStart(3,'0'),
    vendor:      f.querySelector('[name=poVendor]').value,
    project:     f.querySelector('[name=poProject]').value,
    description: f.querySelector('[name=poDesc]').value.trim(),
    amount:      parseFloat(f.querySelector('[name=poAmount]').value) || 0,
    dueDate:     f.querySelector('[name=poDue]').value,
    status: 'pending',
    issueDate: new Date().toISOString().slice(0,10),
  };
  if (!data.description) { showToast('Please enter a description', 'error'); return; }
  PurchaseOrders.add(data);
  closeModal('modalPO'); f.reset();
  f.querySelector('[name=poDue]').value = '2026-04-30';
  renderProcurement();
  showToast(`📦 ${data.poNumber} issued to ${data.vendor}`, 'success');
}

// ══════════════════════════════════════════════════
// v3 — AI INSIGHTS PANEL
// ══════════════════════════════════════════════════

let aiPanelOpen = false;

function toggleAIPanel() {
  aiPanelOpen = !aiPanelOpen;
  const panel = document.getElementById('aiPanel');
  if (panel) {
    panel.style.display = aiPanelOpen ? 'block' : 'none';
    if (aiPanelOpen) loadAIInsights();
  }
}

function generateInsights() {
  const flags = computeRiskScore();
  const pos = PurchaseOrders.getAll();
  const rfis = RFIs.getAll();
  const punch = PunchList.getAll();
  const cos = ChangeOrders.getAll();
  const compliance = Compliance.getAll();

  const insights = [];

  // High priority first — from risk engine
  flags.filter(f=>f.level==='high').forEach(f => {
    insights.push({ level: 'high', icon: '🚨', text: f.message, action: f.action, signal: f.signal });
  });
  flags.filter(f=>f.level==='medium').forEach(f => {
    insights.push({ level: 'medium', icon: '⚠️', text: f.message, action: f.action, signal: f.signal });
  });

  // Procurement insights
  const unpaidInvoiced = pos.filter(p=>p.status==='invoiced').length;
  if (unpaidInvoiced > 0) {
    insights.push({ level: 'medium', icon: '🧾', signal: 'Invoice Due',
      text: `${unpaidInvoiced} purchase order(s) have been invoiced and are awaiting payment. Late payments can affect subcontractor availability.`,
      action: 'Review in Procurement → mark as paid when processed.',
    });
  }

  // Compliance insight
  const pendingComp = compliance.filter(c=>c.status==='pending').length;
  if (pendingComp > 0) {
    insights.push({ level: 'medium', icon: '🦺', signal: 'Compliance Gap',
      text: `${pendingComp} compliance checklist(s) are pending completion. OSHA requires daily fall protection and equipment inspections.`,
      action: 'Complete pending checklists before tomorrow\'s morning crew arrival.',
    });
  }

  // Positive signal
  insights.push({ level: 'low', icon: '✅', signal: 'Budget Healthy',
    text: 'Overall project spend is on track. Labour ($612K/$840K) and materials ($698K/$1.02M) are both within 5% of expected burn rate.',
    action: 'Continue weekly budget reviews.',
  });

  return insights.slice(0, 5);
}

function loadAIInsights() {
  const container = document.getElementById('aiInsightsList');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:16px;">🤖 Scanning all project data…</div>';

  setTimeout(() => {
    const insights = generateInsights();
    const levelColor = { high: '#dc2626', medium: '#d97706', low: '#16a34a' };
    const levelBg = { high: '#fff5f5', medium: '#fffbeb', low: '#f0fdf4' };

    container.innerHTML = insights.map(ins => `
      <div style="background:${levelBg[ins.level]};border-radius:10px;padding:12px 14px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="font-size:1.1rem;">${ins.icon}</span>
          <span style="font-size:0.72rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:${levelColor[ins.level]};">${ins.signal}</span>
        </div>
        <p style="font-size:0.8rem;line-height:1.55;color:var(--text-secondary);margin-bottom:6px;">${ins.text}</p>
        <div style="font-size:0.75rem;color:${levelColor[ins.level]};font-weight:600;">→ ${ins.action}</div>
      </div>`).join('');
  }, 600);
}

// ══════════════════════════════════════════════════
// INIT — on load, run risk scan to update badges
// ══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Run a silent risk scan on load to populate the sidebar badge
  setTimeout(() => {
    const flags = computeRiskScore();
    const badge = document.getElementById('riskBadge');
    const highMed = flags.filter(f => f.level === 'high' || f.level === 'medium').length;
    if (badge && highMed > 0) {
      badge.textContent = highMed;
      badge.style.display = 'inline-flex';
    }
  }, 500);
});
