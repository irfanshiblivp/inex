/* ==========================================================================
   Apex Fleet & Asset Operations Portal - In-Memory SQL Engine & UI Controller
   ========================================================================== */

let db = null;

// Initialize Database & Populate Seed Data
async function initDatabase() {
  const queryStatus = document.getElementById('queryStatusText');
  try {
    let SQL;
    if (typeof window.initSqlJs === 'function') {
      SQL = await window.initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
      });
    } else {
      throw new Error("sql.js library not available");
    }

    db = new SQL.Database();
    setupSchemaAndData();
    updateDashboardStats();
    executeFleetQuery();
    if (queryStatus) queryStatus.textContent = "Database Engine: Online (SQLite Wasm)";
  } catch (err) {
    console.warn("WASM SqlJs failed or offline, initializing embedded JS fallback database engine...", err);
    initFallbackDbEngine();
  }
}

// Setup Database Tables and Production Fleet Data
function setupSchemaAndData() {
  db.run(`
    CREATE TABLE fleet_units (
      unit_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code_name TEXT NOT NULL,
      category TEXT NOT NULL,
      assigned_region TEXT NOT NULL,
      status TEXT NOT NULL,
      fuel_level INTEGER NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE restricted_access_tokens (
      id INTEGER PRIMARY KEY,
      system_component TEXT NOT NULL,
      token_type TEXT NOT NULL,
      auth_hash TEXT NOT NULL,
      notes TEXT NOT NULL
    );
  `);

  // Populate Fleet Units
  const units = [
    ['APX-101', 'Vanguard Alpha', 'VG-101-ALPHA', 'Transport', 'Sector-North', 'Active', 94],
    ['APX-102', 'Titan Hauler Heavy', 'TH-402-HEAVY', 'Logistics', 'Sector-West', 'Active', 78],
    ['APX-103', 'Ghost Recon-I', 'GR-009-SHADOW', 'Reconnaissance', 'Sector-East', 'Standby', 100],
    ['APX-104', 'Ironclad-X Armored', 'IC-880-ARMOR', 'Armored', 'Sector-South', 'Active', 62],
    ['APX-105', 'Skyward Transport', 'ST-204-AERO', 'Transport', 'Sector-North', 'Maintenance', 15],
    ['APX-106', 'Shadow Scout Unit', 'SS-303-NIGHT', 'Reconnaissance', 'Sector-Central', 'Active', 85],
    ['APX-107', 'Atlas Cargo Heavy', 'AC-909-CARGO', 'Logistics', 'Sector-South', 'Standby', 48],
    ['APX-108', 'Defender-7 Mobile', 'DF-707-SHIELD', 'Armored', 'Sector-West', 'Active', 91]
  ];

  units.forEach(u => {
    db.run(
      `INSERT INTO fleet_units VALUES ('${u[0]}', '${u[1]}', '${u[2]}', '${u[3]}', '${u[4]}', '${u[5]}', ${u[6]});`
    );
  });

  // Populate Confidential Tokens
  const tokens = [
    [101, 'CORE_GATEWAY_AUTH', 'API_LIVE_KEY', 'apex_live_sec_8841920042a9fd183', 'Master Gateway Integration Key'],
    [102, 'FIELD_DISPATCH_ORCHESTRATOR', 'BEARER_JWT', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.apex99', 'Sector Operations Dispatch Authorization'],
    [103, 'COMMANDER_OVERRIDE', 'MASTER_PASS', 'admin:apex_master_pass_2026_x89', 'Level-5 Executive Override Credential'],
    [104, 'ENCRYPTION_VAULT_HSM', 'RSA_PRIV_KEY', 'RSA_PRIV_KEY_APEX_SECURE_991823746109', 'Hardware Security Module Encryption Key']
  ];

  tokens.forEach(t => {
    db.run(
      `INSERT INTO restricted_access_tokens VALUES (${t[0]}, '${t[1]}', '${t[2]}', '${t[3]}', '${t[4]}');`
    );
  });
}

// Fallback pure JavaScript SQL simulation engine if WASM CDN is blocked or unavailable
function initFallbackDbEngine() {
  const fleetData = [
    { unit_id: 'APX-101', name: 'Vanguard Alpha', code_name: 'VG-101-ALPHA', category: 'Transport', assigned_region: 'Sector-North', status: 'Active', fuel_level: 94 },
    { unit_id: 'APX-102', name: 'Titan Hauler Heavy', code_name: 'TH-402-HEAVY', category: 'Logistics', assigned_region: 'Sector-West', status: 'Active', fuel_level: 78 },
    { unit_id: 'APX-103', name: 'Ghost Recon-I', code_name: 'GR-009-SHADOW', category: 'Reconnaissance', assigned_region: 'Sector-East', status: 'Standby', fuel_level: 100 },
    { unit_id: 'APX-104', name: 'Ironclad-X Armored', code_name: 'IC-880-ARMOR', category: 'Armored', assigned_region: 'Sector-South', status: 'Active', fuel_level: 62 },
    { unit_id: 'APX-105', name: 'Skyward Transport', code_name: 'ST-204-AERO', category: 'Transport', assigned_region: 'Sector-North', status: 'Maintenance', fuel_level: 15 },
    { unit_id: 'APX-106', name: 'Shadow Scout Unit', code_name: 'SS-303-NIGHT', category: 'Reconnaissance', assigned_region: 'Sector-Central', status: 'Active', fuel_level: 85 },
    { unit_id: 'APX-107', name: 'Atlas Cargo Heavy', code_name: 'AC-909-CARGO', category: 'Logistics', assigned_region: 'Sector-South', status: 'Standby', fuel_level: 48 },
    { unit_id: 'APX-108', name: 'Defender-7 Mobile', code_name: 'DF-707-SHIELD', category: 'Armored', assigned_region: 'Sector-West', status: 'Active', fuel_level: 91 }
  ];

  const tokenData = [
    { id: 101, system_component: 'CORE_GATEWAY_AUTH', token_type: 'API_LIVE_KEY', auth_hash: 'apex_live_sec_8841920042a9fd183', notes: 'Master Gateway Integration Key' },
    { id: 102, system_component: 'FIELD_DISPATCH_ORCHESTRATOR', token_type: 'BEARER_JWT', auth_hash: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.apex99', notes: 'Sector Operations Dispatch Authorization' },
    { id: 103, system_component: 'COMMANDER_OVERRIDE', token_type: 'MASTER_PASS', auth_hash: 'admin:apex_master_pass_2026_x89', notes: 'Level-5 Executive Override Credential' },
    { id: 104, system_component: 'ENCRYPTION_VAULT_HSM', token_type: 'RSA_PRIV_KEY', auth_hash: 'RSA_PRIV_KEY_APEX_SECURE_991823746109', notes: 'Hardware Security Module Encryption Key' }
  ];

  db = {
    run: function() {},
    exec: function(sqlQuery) {
      const queryLower = sqlQuery.toLowerCase();

      // Check for UNION query targeting tokens
      if (queryLower.includes('union') && (queryLower.includes('restricted_access_tokens') || queryLower.includes('select'))) {
        const unionRows = tokenData.map(t => [
          String(t.id),
          t.system_component,
          t.token_type,
          t.auth_hash,
          t.notes,
          100
        ]);
        return [{
          columns: ['Asset ID', 'Designation', 'Category', 'Assigned Region', 'Status', 'Fuel / Battery'],
          values: unionRows
        }];
      }

      // Check for standard OR 1=1 condition
      let results = fleetData;
      if (queryLower.includes("or '1'='1") || queryLower.includes("or 1=1") || queryLower.includes("or 1 = 1")) {
        // Matches all
      } else {
        // Search filter matching
        const searchMatch = sqlQuery.match(/LIKE '%(.*?)%'/i);
        if (searchMatch && searchMatch[1]) {
          const kw = searchMatch[1].toLowerCase();
          results = fleetData.filter(item => 
            item.name.toLowerCase().includes(kw) || 
            item.code_name.toLowerCase().includes(kw) || 
            item.unit_id.toLowerCase().includes(kw)
          );
        }

        // Category filter
        const catMatch = sqlQuery.match(/category = '(.*?)'/i);
        if (catMatch && catMatch[1] && catMatch[1] !== 'ALL') {
          results = results.filter(item => item.category === catMatch[1]);
        }
      }

      const rows = results.map(r => [r.unit_id, r.name, r.category, r.assigned_region, r.status, r.fuel_level]);
      return [{
        columns: ['unit_id', 'name', 'category', 'assigned_region', 'status', 'fuel_level'],
        values: rows
      }];
    }
  };

  const queryStatus = document.getElementById('queryStatusText');
  if (queryStatus) queryStatus.textContent = "Database Engine: Online (Client Simulator)";
  updateDashboardStatsFallback(fleetData.length);
  executeFleetQuery();
}

// Update UI Stat Counters
function updateDashboardStats() {
  if (!db || typeof db.exec !== 'function') return;
  try {
    const resCount = db.exec("SELECT COUNT(*) FROM fleet_units");
    const count = resCount[0].values[0][0];
    document.getElementById('totalUnitsCount').textContent = count;
    document.getElementById('recordCount').textContent = count + 4;
  } catch (e) {
    console.error(e);
  }
}

function updateDashboardStatsFallback(count) {
  document.getElementById('totalUnitsCount').textContent = count;
  document.getElementById('recordCount').textContent = count + 4;
}

// Main Query Execution Function
function executeFleetQuery() {
  const searchInput = document.getElementById('searchInput').value;
  const categoryFilter = document.getElementById('categoryFilter').value;
  const sortSelect = document.getElementById('sortSelect').value;
  const tableBody = document.getElementById('fleetTableBody');
  const queryStatus = document.getElementById('queryStatusText');

  // Dynamic SQL string construction with unsanitized parameters
  let sqlQuery = `SELECT unit_id, name, category, assigned_region, status, fuel_level FROM fleet_units WHERE 1=1`;

  if (categoryFilter !== 'ALL') {
    sqlQuery += ` AND category = '${categoryFilter}'`;
  }

  if (searchInput && searchInput.trim() !== '') {
    // Note: Search term is interpolated into a multi-parameter clause with parentheses
    sqlQuery += ` AND (name LIKE '%${searchInput}%' OR code_name LIKE '%${searchInput}%' OR unit_id LIKE '%${searchInput}%')`;
  }

  if (sortSelect) {
    sqlQuery += ` ORDER BY ${sortSelect} ASC`;
  }

  if (queryStatus) {
    queryStatus.textContent = `Executed SQL Query`;
  }

  try {
    const res = db.exec(sqlQuery);
    renderTableResults(res);
  } catch (err) {
    console.error("SQL Execution Error:", err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="loading-cell" style="color: var(--accent-rose);">
          <strong>Database Query Execution Exception:</strong><br>
          <code style="font-family: var(--font-mono); font-size: 0.8rem; display: block; margin-top: 8px;">${escapeHtml(err.message)}</code>
        </td>
      </tr>
    `;
  }
}

// Render Query Results in HTML Data Table
function renderTableResults(results) {
  const tableBody = document.getElementById('fleetTableBody');
  tableBody.innerHTML = '';

  if (!results || results.length === 0 || !results[0].values || results[0].values.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="loading-cell">No matching telemetry records returned by query filter.</td>
      </tr>
    `;
    return;
  }

  const rows = results[0].values;
  rows.forEach(row => {
    const unitId = row[0];
    const name = row[1];
    const category = row[2];
    const region = row[3];
    const status = row[4];
    const fuel = row[5];

    let statusClass = 'active';
    if (String(status).toLowerCase().includes('standby')) statusClass = 'standby';
    if (String(status).toLowerCase().includes('maintenance')) statusClass = 'maintenance';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="asset-id">${escapeHtml(String(unitId))}</td>
      <td><strong>${escapeHtml(String(name))}</strong></td>
      <td>${escapeHtml(String(category))}</td>
      <td>${escapeHtml(String(region))}</td>
      <td><span class="status-pill ${statusClass}">${escapeHtml(String(status))}</span></td>
      <td>
        <div class="fuel-meter">
          <div class="fuel-bar">
            <div class="fuel-fill" style="width: ${Math.min(100, Math.max(0, parseInt(fuel) || 50))}%;"></div>
          </div>
          <span class="fuel-text">${escapeHtml(String(fuel))}%</span>
        </div>
      </td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="viewAssetDetails('${escapeHtml(String(unitId))}', '${escapeHtml(String(name))}', '${escapeHtml(String(category))}', '${escapeHtml(String(region))}', '${escapeHtml(String(status))}', '${escapeHtml(String(fuel))}')">
          Details
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// Escape HTML utility
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Asset Modal Handler
function viewAssetDetails(id, name, cat, reg, stat, fuel) {
  const modal = document.getElementById('detailModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  modalTitle.textContent = `Telemetry Detail - ${id}`;
  modalBody.innerHTML = `
    <div class="modal-grid">
      <div class="modal-detail-item">
        <div class="modal-label">Unit Designation</div>
        <div class="modal-val">${name}</div>
      </div>
      <div class="modal-detail-item">
        <div class="modal-label">Category</div>
        <div class="modal-val">${cat}</div>
      </div>
      <div class="modal-detail-item">
        <div class="modal-label">Assigned Sector</div>
        <div class="modal-val">${reg}</div>
      </div>
      <div class="modal-detail-item">
        <div class="modal-label">Current Status</div>
        <div class="modal-val">${stat}</div>
      </div>
      <div class="modal-detail-item" style="grid-column: span 2;">
        <div class="modal-label">Fuel / Power Cell Reserves</div>
        <div class="modal-val">${fuel}%</div>
      </div>
    </div>
  `;

  modal.classList.add('open');
}

// Attach Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initDatabase();

  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const sortSelect = document.getElementById('sortSelect');
  const refreshBtn = document.getElementById('refreshBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modal = document.getElementById('detailModal');

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      executeFleetQuery();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      executeFleetQuery();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', executeFleetQuery);
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', executeFleetQuery);
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      executeFleetQuery();
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  }
});
