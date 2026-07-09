const fs = require('fs');
const path = require('path');
const { query } = require('./db');

const DEFAULT_AGENTS = [
  { name: 'Chief GodLove', phone: '+254754198840', status: 'Currently Recruiting', sort_order: 1 },
  { name: 'Pan KE', phone: 'Contact via portal', status: 'Currently Recruiting', sort_order: 2 },
  { name: 'Prezzo', phone: 'Contact via portal', status: 'Currently Recruiting', sort_order: 3 },
  { name: 'KRG 650', phone: 'Contact via portal', status: 'Currently Recruiting', sort_order: 4 }
];

async function runSchema() {
  const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await query(schemaSql);
}

async function seedAgents() {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM agents');
  if (rows[0].count > 0) return;

  for (const agent of DEFAULT_AGENTS) {
    await query(
      'INSERT INTO agents (name, phone, status, sort_order) VALUES ($1, $2, $3, $4)',
      [agent.name, agent.phone, agent.status, agent.sort_order]
    );
  }
}

async function initializeDatabase() {
  await runSchema();
  await seedAgents();
  console.log('Database schema verified and agents seeded.');
}

module.exports = { initializeDatabase };
