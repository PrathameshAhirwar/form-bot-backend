const mongoose = require('mongoose');
const { Schema } = mongoose;

const responseSchema = new Schema({
    formId: {
        type: Schema.Types.ObjectId,
        ref: 'Form',
        required: true
    },
    analytics: {
        views: {
            type: Number,
            default: 0
        },
        starts: {
            type: Number,
            default: 0
        },
        completed: {
            type: Number,
            default: 0
        },
        completionRate: {
            type: Number,
            default: 0
        }
    },
    responses: [{
        stepId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FlowStep'
        },
        value: Schema.Types.Mixed,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Pre-save middleware to calculate completion rate
responseSchema.pre('save', function(next) {
    if (this.analytics.starts > 0) {
        this.analytics.completionRate = (this.analytics.completed / this.analytics.starts) * 100;
    }
    next();
});

const Response = mongoose.model('Response', responseSchema);

module.exports = Response;