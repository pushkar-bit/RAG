const express = require('express');
const router = express.Router();
const { evaluateDataset, getEvaluationHistory } = require('../controllers/evaluation.controller');

// @route   POST api/evaluation/run
// @desc    Run evaluation on a dataset
router.post('/run', evaluateDataset);

// @route   GET api/evaluation/history
// @desc    Get historical evaluation results
router.get('/history', getEvaluationHistory);

module.exports = router;
