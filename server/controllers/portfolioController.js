const portfolioService = require('../services/portfolioService')

async function getPortfolio(_req, res) {
  const data = await portfolioService.getPortfolioPayload()
  res.json({ data })
}

async function getProject(req, res) {
  const data = await portfolioService.getProjectById(req.params.id)
  res.json({ data })
}

module.exports = {
  getPortfolio,
  getProject,
}
