// Temp inspector — lists tables/columns/row counts across every service DB.
// Run from any service dir that has better-sqlite3 installed:
//   cd implementations/payment-service && node ../../_migration/inspect-dbs.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..', 'implementations');
const targets = [
  ['course-service / fitness.db',                path.join(root, 'course-service', 'fitness.db')],
  ['payment-service / fitness_payment.db',       path.join(root, 'payment-service', 'data', 'fitness_payment.db')],
  ['Admin / admin_audit.db',                     path.join(root, 'Admin', 'backend', 'backend', 'databases', 'admin_audit.db')],
  ['Admin / course.db',                          path.join(root, 'Admin', 'backend', 'backend', 'databases', 'course.db')],
  ['Admin / promotion.db',                       path.join(root, 'Admin', 'backend', 'backend', 'databases', 'promotion.db')],
  ['reservation-service / fitcourt.db',          path.join(root, 'reservation-service', 'backend', 'src', 'db', 'fitcourt.db')],
];

for (const [label, p] of targets) {
  console.log('\n=== ' + label + ' ===');
  if (!fs.existsSync(p)) { console.log('  (missing file: ' + p + ')'); continue; }
  try {
    const db = new Database(p, { readonly: true });
    const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    if (tables.length === 0) console.log('  (no tables)');
    for (const t of tables) {
      const cols = db.pragma('table_info(' + t.name + ')');
      let count = '?';
      try { count = db.prepare('SELECT COUNT(*) c FROM "' + t.name + '"').get().c; } catch {}
      console.log('  ' + t.name + ' (' + count + ' rows)');
      for (const c of cols) {
        const flags = [c.pk ? 'PK' : null, c.notnull ? 'NN' : null, c.dflt_value ? 'DEF=' + c.dflt_value : null].filter(Boolean).join(' ');
        console.log('    - ' + c.name + ' : ' + (c.type || '?') + (flags ? ' [' + flags + ']' : ''));
      }
    }
    db.close();
  } catch (e) {
    console.log('  ERROR: ' + e.message);
  }
}
