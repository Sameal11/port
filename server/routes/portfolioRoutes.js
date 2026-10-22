const express = require('express')
const { asyncHandler } = require('../utils/asyncHandler')
const {
  getPortfolio,
  getProject,
} = require('../controllers/portfolioController')

const router = express.Router()

router.get('/', asyncHandler(getPortfolio))
router.get('/overview', asyncHandler(getPortfolio))
router.get('/projects/:id', asyncHandler(getProject))

module.exports = router
