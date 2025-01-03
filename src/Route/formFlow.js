const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); 
const { Form, FlowStep } = require('../models/form');
const userAuth = require('../middlewares/userAuth');

// Get form flow
router.get('/:userId/form/:formId/flow', userAuth, async (req, res) => {
    try {
        const { userId, formId } = req.params;

        if (req.user._id.toString() !== userId) {
            return res.status(403).send('Unauthorized access');
        }

        const form = await Form.findOne({ _id: formId, userId });
        if (!form) {
            return res.status(404).send('Form not found');
        }

        res.json(form.flow);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/:userId/form/:formId/flow/step', userAuth, async (req, res) => {
  try {
    const { userId, formId } = req.params;
    const stepData = req.body;

    console.log("Step data received:", stepData); // Debug log

    // Check if the user is authorized to modify this form
    if (req.user._id.toString() !== userId) {
      return res.status(403).send('Unauthorized access');
    }

    // Find the form to update
    const form = await Form.findOne({ _id: formId, userId, isDeleted: false });
    if (!form) {
      return res.status(404).send('Form not found');
    }

    // Create a new step from the received data
    const newStep = new FlowStep({
      type: stepData.type,
      label: stepData.label,
      required: stepData.required || false,
      placeholder: stepData.placeholder || '',
      validation: new Map(Object.entries(stepData.validation || {})),
      properties: new Map(Object.entries(stepData.properties || {})),
      nextSteps: [],  // Initialize nextSteps as an empty array
      endStep: stepData.endStep || false,
      value: stepData.value || ''  // Add value here
    });

    // Add the new step to the form's flow
    form.flow.steps.push(newStep);

    // Set as start step if this is the first step
    if (form.flow.steps.length === 1 && !form.flow.startStep) {
      form.flow.startStep = newStep._id;
    }

    // If it's an end step, add to the endSteps
    if (stepData.endStep) {
      form.flow.endSteps.push(newStep._id);
    }

    // If this isn't the first step, update the previous step's nextSteps
    if (form.flow.steps.length > 1) {
      const previousStep = form.flow.steps[form.flow.steps.length - 2];
      
      // Push the new step to nextSteps as an object with stepId
      previousStep.nextSteps.push({
        stepId: newStep._id,
        condition: stepData.condition || {} // Optional condition can be passed
      });

      // Save the previous step with updated nextSteps
      await previousStep.save();  
    }

    // Save the new step and form
    await newStep.save();
    await form.save();

    // Populate the flow with the updated steps and send back the response
    const updatedForm = await Form.findOne({ _id: formId, userId }).populate('flow.steps');
    res.status(201).json(updatedForm.flow);
  } catch (err) {
    console.error('Error adding step:', err);
    res.status(400).json({
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});




  

router.put('/:userId/form/:formId/flow/step/:stepId', userAuth, async (req, res) => {
    try {
      const { userId, formId, stepId } = req.params;
      const stepData = req.body;
  
      if (req.user._id.toString() !== userId) {
        return res.status(403).send('Unauthorized access');
      }
  
      const form = await Form.findOne({ _id: formId, userId });
      if (!form) {
        return res.status(404).send('Form not found');
      }
  
      // Find and update the step
      const stepIndex = form.flow.steps.findIndex(step => step._id.toString() === stepId);
      if (stepIndex !== -1) {
        form.flow.steps[stepIndex] = {
          ...form.flow.steps[stepIndex],
          ...stepData,
          value: stepData.value || form.flow.steps[stepIndex].value
        };
      }
  
      await form.save();
      res.json(form.flow);
    } catch (err) {
      res.status(400).send(err.message);
    }
  });
  



// Delete step from flow
router.delete('/:userId/form/:formId/flow/step/:stepId', userAuth, async (req, res) => {
    try {
        const { userId, formId, stepId } = req.params;

        if (req.user._id.toString() !== userId) {
            return res.status(403).send('Unauthorized access');
        }

        const form = await Form.findOne({ _id: formId, userId, 'flow.steps._id': stepId });
        if (!form) {
            return res.status(404).send('Form not found');
        }

        // Remove the step from the flow
        form.flow.steps = form.flow.steps.filter(step => step._id.toString() !== stepId);

        // Update the nextSteps in other steps
        form.flow.steps.forEach(step => {
            step.nextSteps = step.nextSteps.filter(nextStep => nextStep.stepId.toString() !== stepId);
        });

        // Update start step if the deleted step was the start
        if (form.flow.startStep?.toString() === stepId) {
            form.flow.startStep = form.flow.steps.length > 0 ? form.flow.steps[0]._id : null;
        }

        // Update end steps if the deleted step was an end step
        form.flow.endSteps = form.flow.endSteps.filter(endStepId => endStepId.toString() !== stepId);

        await form.save();
        res.json(form.flow);
    } catch (err) {
        res.status(400).send(err.message);
    }
});


// Save form endpoint
router.post('/:userId/form/:formId/save', userAuth, async (req, res) => {
  try {
    const { userId, formId } = req.params;
    const { name, description, isPublished, steps } = req.body;

    // Check if the user is authorized to modify this form
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Find the form to update
    const form = await Form.findOne({ _id: formId, userId });
    if (!form) {
      return res.status(404).send('Form not found');
    }

    // Update the form properties
    if (name) form.name = name;
    if (description) form.description = description;
    if (typeof isPublished === 'boolean') form.isPublished = isPublished;

    // Update the steps in the flow
    if (steps && Array.isArray(steps)) {
      form.flow.steps = steps.map((step, index) => {
        const updatedStep = {
          ...step,
          value: step.value || '',  // Ensure value is always set
        };

        // Set nextStep for each step except the last one
        if (index < steps.length - 1) {
          updatedStep.nextSteps = [{ stepId: steps[index + 1]._id }];
        } else {
          // For the last step, nextStep should be null
          updatedStep.nextSteps = [];
        }

        // If the step is an end step, add it to the endSteps
        if (updatedStep.endStep) {
          form.flow.endSteps.push(updatedStep._id);
        }

        return updatedStep;
      });

      // Set the startStep if it's the first step
      if (form.flow.steps.length > 0 && !form.flow.startStep) {
        form.flow.startStep = form.flow.steps[0]._id;
      }
    }

    console.log('Saving form with steps:', form.flow.steps); // Debug log

    // Save the form with the updated flow
    await form.save();

    // Send the updated form back as the response
    const updatedForm = await Form.findOne({ _id: formId, userId }).populate('flow.steps');
    res.status(200).json({ message: 'Form saved successfully', form: updatedForm });
  } catch (err) {
    console.error('Error saving form:', err);
    res.status(500).send({ message: err.message });
  }
});




// routes/form.js
router.get('/form/:formId/flow', async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await Form.findOne({ _id: formId });
    if (!form) {
      return res.status(404).send('Form not found');
    }

    res.json(form.flow);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


module.exports = router;
