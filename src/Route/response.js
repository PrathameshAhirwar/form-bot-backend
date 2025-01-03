const express = require('express');
const router = express.Router();
const Response = require('../models/response');
const { Form , FlowStep} = require('../models/form');
const userAuth = require('../middlewares/userAuth');

// Route to increment view count when form is loaded
router.post('/form/:formId/view', async (req, res) => {
  try {
    const { formId } = req.params;

    let response = await Response.findOne({ formId });
    if (!response) {
      response = new Response({ formId });
    }

    response.analytics.views += 1;
    await response.save();

    res.status(200).json({
      message: 'View counted successfully',
      views: response.analytics.views
    });
  } catch (err) {
    console.error('Error counting view:', err);
    res.status(500).send({ message: err.message });
  }
});

router.post('/form/:formId/response', userAuth, async (req, res) => {
  try {
    const { formId } = req.params;
    const { responses, isComplete, isStart } = req.body;

    let response = await Response.findOne({ formId });
    if (!response) {
      response = new Response({ formId });
    }

    // Track start if it's the first message
    if (isStart) {
      response.analytics.starts += 1;
    }

    // Add responses if any
    if (responses && Array.isArray(responses)) {
      responses.forEach((resp) => {
        if (resp.stepId && resp.value !== undefined) {
          response.responses.push({
            stepId: resp.stepId,
            value: resp.value,
            timestamp: new Date()
          });
        }
      });
    }

    // If the form is completed, increment completed counter
    if (isComplete) {
      response.analytics.completed += 1;
      // Update completion rate
      response.analytics.completionRate = 
        (response.analytics.completed / response.analytics.starts) * 100;
    }

    await response.save();

    res.status(200).json({
      message: 'Response saved successfully',
      response
    });
  } catch (err) {
    console.error('Error saving response:', err);
    res.status(500).send({ message: err.message });
  }
});

router.get('/form/:formId/responses', userAuth, async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).send('Form not found');
    }

    const response = await Response.findOne({ formId });
    
    const columns = form.flow.steps.map(step => ({
      id: step._id.toString(),
      label: step.label,
      type: step.type
    }));

    if (!response) {
      return res.status(200).json({
        columns,
        responses: [],
        analytics: {
          views: 0,
          starts: 0,
          completed: 0,
          completionRate: 0
        }
      });
    }

    // Create a map to group responses by submission time
    // Round timestamps to the nearest second to group related inputs
    const submissionGroups = new Map();

    response.responses.forEach(resp => {
      // Round to nearest second to group related submissions
      const roundedTime = new Date(resp.timestamp);
      roundedTime.setMilliseconds(0);
      const timeKey = roundedTime.getTime();

      if (!submissionGroups.has(timeKey)) {
        submissionGroups.set(timeKey, {
          timestamp: resp.timestamp,
          values: {}
        });
      }

      const group = submissionGroups.get(timeKey);
      group.values[resp.stepId.toString()] = resp.value;
    });

    // Convert the grouped submissions to array format
    const formattedResponses = Array.from(submissionGroups.values())
      .map(group => ({
        timestamp: group.timestamp,
        ...group.values
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first

    res.status(200).json({
      columns,
      responses: formattedResponses,
      analytics: response.analytics
    });
  } catch (err) {
    console.error('Error fetching responses:', err);
    res.status(500).send({ message: err.message });
  }
});

module.exports = router;