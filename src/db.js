/* ==========================================================================
   AEGIS Gateway - In-Memory Database Engine & Authentication Subsystem
   ========================================================================== */

let db = null;
const SYSTEM_FLAG = 'neelakuzhil';

// Initialize SQLite WASM Database or Client Fallback Engine
export async function initAuthDatabase() {
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
    setupAuthSchema();
    return { success: true, engine: 'SQLite WASM' };
  } catch (err) {
    console.warn("WASM SqlJs init failed or offline, loading client db engine fallback...", err);
    initFallbackAuthDb();
    return { success: true, engine: 'Client Simulation' };
  }
}

// Setup Database Schema & Production User Records
function setupAuthSchema() {
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      user_alias TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      clearance_level INTEGER NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE system_flags (
      id INTEGER PRIMARY KEY,
      flag_key TEXT NOT NULL,
      flag_val TEXT NOT NULL
    );
  `);

  // Insert valid credentials: AVCD10 / PIDN@456
  db.run(`
    INSERT INTO users VALUES 
    (1, 'AVCD10', 'OPERATOR_ALPHA', 'PIDN@456', 'Executive Operations Dispatch', 5),
    (2, 'SYSTEM_DAEMON', 'DAEMON_SVC', 'kx99_daemon_pass_#1', 'System Service Account', 1),
    (3, 'FIELD_SCOUT', 'SCOUT_UNIT', 'scout_field_pass_99', 'Field Reconnaissance', 2);
  `);

  db.run(`
    INSERT INTO system_flags VALUES (1, 'PRIMARY_FLAG', '${SYSTEM_FLAG}');
  `);
}

// Fallback client simulation engine if CDN is unavailable
function initFallbackAuthDb() {
  const users = [
    { id: 1, username: 'AVCD10', user_alias: 'OPERATOR_ALPHA', password: 'PIDN@456', role: 'Executive Operations Dispatch', clearance_level: 5 },
    { id: 2, username: 'SYSTEM_DAEMON', user_alias: 'DAEMON_SVC', password: 'kx99_daemon_pass_#1', role: 'System Service Account', clearance_level: 1 },
    { id: 3, username: 'FIELD_SCOUT', user_alias: 'SCOUT_UNIT', password: 'scout_field_pass_99', role: 'Field Reconnaissance', clearance_level: 2 }
  ];

  db = {
    exec: function(sqlQuery) {
      const qLower = sqlQuery.toLowerCase();
      
      // Match valid credentials
      if (qLower.includes("username = 'avcd10'") && qLower.includes("password = 'pidn@456'")) {
        return [{ values: [[1, 'AVCD10', 'OPERATOR_ALPHA', 'PIDN@456', 'Executive Operations Dispatch', 5]] }];
      }

      // Check for valid SQL injection bypass (e.g. closing parenthesis and OR condition)
      if (qLower.includes("or '1'='1") || qLower.includes("or 1=1") || qLower.includes("') or ('1'='1") || qLower.includes("avcd10') --")) {
        return [{ values: [[1, 'AVCD10', 'OPERATOR_ALPHA', 'PIDN@456', 'Executive Operations Dispatch', 5]] }];
      }

      return [];
    }
  };
}

// Authenticate Credentials via SQL Query Execution
export function verifyCredentials(username, password) {
  if (!db) throw new Error("Database engine not initialized");

  // Multi-parameter unescaped SQL query string construction
  const sqlQuery = `SELECT id, username, user_alias, role, clearance_level FROM users WHERE (username = '${username}' OR user_alias = '${username}') AND password = '${password}'`;

  try {
    const res = db.exec(sqlQuery);
    if (res && res.length > 0 && res[0].values && res[0].values.length > 0) {
      const userRow = res[0].values[0];
      return {
        success: true,
        user: {
          id: userRow[0],
          username: userRow[1],
          user_alias: userRow[2],
          role: userRow[3],
          clearance_level: userRow[4]
        },
        flag: SYSTEM_FLAG
      };
    } else {
      return {
        success: false,
        message: "Authentication failed: Invalid clearance credentials provided."
      };
    }
  } catch (err) {
    // SQL syntax error exception (e.g. unclosed quotes or invalid syntax)
    return {
      success: false,
      message: `Authentication Engine Exception: ${err.message}`
    };
  }
}
