const mongoose = require('mongoose');
const { Schema } = mongoose;

const formResponseSchema = new Schema({
    formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        required: true
    },
    responses: [{
        stepId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FlowStep',
            required: true
        },
        question: String,
        answer: Schema.Types.Mixed,
        answeredAt: {
            type: Date,
            default: Date.now
        }
    }],
    currentStep: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FlowStep'
    },
    flowPath: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FlowStep'
    }],
    isCompleted: {
        type: Boolean,
        default: false
    },
    submittedAt: Date
}, {
    timestamps: true
});

// Add index for faster queries
formResponseSchema.index({ formId: 1, createdAt: 1 });

const Response = mongoose.model('Response', formResponseSchema);

module.exports = Response;