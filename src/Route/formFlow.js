const express = require('express');
const router = express.Router();
const { Form } = require('../models/form');
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
        const { type, label, position, properties, nextSteps } = req.body;

        if (req.user._id.toString() !== userId) {
            return res.status(403).send('Unauthorized access');
        }

        const form = await Form.findOne({ _id: formId, userId });
        if (!form) {
            return res.status(404).send('Form not found');
        }

        const newStep = {
            type,
            label,
            position,
            properties,
            nextSteps: nextSteps || []
        };

        form.flow.steps.push(newStep);
        
        // If this is the first step and no start step is set
        if (form.flow.steps.length === 1 && !form.flow.startStep) {
            form.flow.startStep = newStep._id;
        }

        await form.save();
        res.status(201).json(newStep);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Update step position
router.patch('/:userId/form/:formId/flow/step/:stepId/position', userAuth, async (req, res) => {
    try {
        const { userId, formId, stepId } = req.params;
        const { position } = req.body;

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
                    'flow.steps.$.position': position
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

// Update step connections
router.patch('/:userId/form/:formId/flow/step/:stepId/next', userAuth, async (req, res) => {
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

// Delete step
router.delete('/:userId/form/:formId/flow/step/:stepId', userAuth, async (req, res) => {
    try {
        const { userId, formId, stepId } = req.params;

        if (req.user._id.toString() !== userId) {
            return res.status(403).send('Unauthorized access');
        }

        const form = await Form.findOne({ _id: formId, userId });
        if (!form) {
            return res.status(404).send('Form not found');
        }

        // Remove step
        form.flow.steps = form.flow.steps.filter(
            step => step._id.toString() !== stepId
        );

        // Remove references to deleted step from nextSteps arrays
        form.flow.steps.forEach(step => {
            step.nextSteps = step.nextSteps.filter(
                next => next.stepId.toString() !== stepId
            );
        });

        // Update start step if needed
        if (form.flow.startStep?.toString() === stepId) {
            form.flow.startStep = form.flow.steps[0]?._id || null;
        }

        // Update end steps if needed
        form.flow.endSteps = form.flow.endSteps.filter(
            endStepId => endStepId.toString() !== stepId
        );

        await form.save();
        res.json(form.flow);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

module.exports = router;