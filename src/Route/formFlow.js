const express = require('express');
const router = express.Router();
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

// Add step to flow
router.post('/:userId/form/:formId/flow/step', userAuth, async (req, res) => {
    try {
      const { userId, formId } = req.params;
      const stepData = req.body;
        console.log("Step data received :" + stepData)
      if (req.user._id.toString() !== userId) {
        return res.status(403).send('Unauthorized access');
      }
  
      const form = await Form.findOne({ _id: formId, userId, isDeleted: false });
      if (!form) {
        return res.status(404).send('Form not found');
      }
  
      // Create new step
      const newStep = new FlowStep({
        type: stepData.type,
        label: stepData.label,
        required: stepData.required || false,
        placeholder: stepData.placeholder || '',
        validation: new Map(Object.entries(stepData.validation || {})),
        properties: new Map(Object.entries(stepData.properties || {})),
        nextSteps: stepData.nextSteps || [],
        endStep: stepData.endStep || false,
      });
  
      // Add step to form's flow (sequentially)
      form.flow.steps.push(newStep);
  
      // Set as start step if it's the first one
      if (form.flow.steps.length === 1 && !form.flow.startStep) {
        form.flow.startStep = newStep._id;
      }
      
      if (stepData.endStep) {
        form.flow.endSteps.push(newStep._id);
      }
      await form.save();
  
      // Send the updated form back with the flow
      const updatedForm = await Form.findOne({ _id: formId, userId }).populate('flow.steps');
      res.status(201).json(updatedForm.flow);
    } catch (err) {
      res.status(400).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  });
  

// Update step connections (next steps)
router.patch('/:userId/form/:formId/flow/step/:stepId/next', async (req, res) => {
    console.log('Request body for PATCH:', req.body);
    try {
        const { userId, formId, stepId } = req.params;
        const { nextSteps } = req.body;

        if (req.user._id.toString() !== userId) {
            return res.status(403).send('Unauthorized access');
        }

        const form = await Form.findOneAndUpdate(
            { 
                _id: formId, 
                userId,
                'flow.steps._id': stepId 
            },
            {
                $set: {
                    'flow.steps.$.nextSteps': nextSteps
                }
            },
            { new: true }
        );

        if (!form) {
            return res.status(404).send('Form or step not found');
        }

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
        const { name, description, isPublished, inputValues } = req.body; // Add inputValues field
        console.log("The form is saved");

        if (req.user._id.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        const form = await Form.findOne({ _id: formId, userId });
        if (!form) {
            return res.status(404).send('Form not found');
        }

        // Update the form with the provided data
        if (name) form.name = name;
        if (description) form.description = description;
        if (typeof isPublished === 'boolean') form.isPublished = isPublished;

        // Update the input values for each step in the flow
        if (inputValues && Array.isArray(inputValues)) {
            form.flow.steps.forEach((step) => {
                // Check if there's an input value for the step
                const inputValue = inputValues.find(input => input.stepId.toString() === step._id.toString());
                if (inputValue) {
                    step.value = inputValue.value; // Save the value entered by the user
                }
            });
        }

        // Save the form
        await form.save();
        res.status(200).json({ message: 'Form saved successfully', form });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});


module.exports = router;
