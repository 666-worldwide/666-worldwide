const { query } = require('../config/db');

async function getAllAgents() {
  const { rows } = await query(
    'SELECT id, name, phone, status, sort_order FROM agents ORDER BY sort_order ASC, id ASC'
  );
  return rows;
}

module.exports = { getAllAgents };
