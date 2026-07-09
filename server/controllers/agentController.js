const agentModel = require('../models/agentModel');

async function listAgents(req, res, next) {
  try {
    const agents = await agentModel.getAllAgents();
    return res.json({ agents });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listAgents };
