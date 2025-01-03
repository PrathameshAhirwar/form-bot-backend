const mongoose = require('mongoose');
const { Schema } = mongoose;

// Step Schema to replace Element Schema
const flowStepSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ['text', 'image', 'video', 'gif', 'textInput', 'number', 'email', 'phone', 'date', 'rating', 'button']
    },
    label: {
        type: String,
        required: true
    },
    placeholder: String,
    required: {
        type: Boolean,
        default: false
    },
    validation: {
        type: Map,
        of: Schema.Types.Mixed
    },
    properties: {
        type: Map,
        of: Schema.Types.Mixed
    },
    nextSteps: [{
        stepId: {
            type: Schema.Types.ObjectId,
            ref: 'FlowStep'
        },
        condition: {
            type: Map,
            of: Schema.Types.Mixed
        }
    }],
    endStep: {
        type: Boolean,
        default: false
    },
    value: {
        type: Schema.Types.Mixed,
        default: null
    }
});

// Form Schema with updated flow structure
const formSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Form name is required'],
        trim: true,
        validate: {
            validator: function(v) {
                return v && v.length > 0;
            },
            message: 'Form name cannot be empty'
        }
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    folderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null
    },
    flow: {
        steps: [flowStepSchema], // Steps will be ordered as they are added
        startStep: {
            type: Schema.Types.ObjectId,
            ref: 'FlowStep'
        },
        endSteps: [{
            type: Schema.Types.ObjectId,
            ref: 'FlowStep'
        }]
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    settings: {
        theme: {
            type: String,
            default: 'light'
        }
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Add compound index for unique form names per user
formSchema.index({ userId: 1, name: 1, isDeleted: 1 }, { unique: true });

// Remove previous index if it exists
formSchema.index({ userId: 1, folderId: 1, isDeleted: 1 });

// Pre-save middleware to trim form name
formSchema.pre('save', function(next) {
    if (this.name) {
        this.name = this.name.trim();
    }
    next();
});

// Create models
const FlowStep = mongoose.model('FlowStep', flowStepSchema);
const Form = mongoose.model('Form', formSchema);

module.exports = { Form, FlowStep };
