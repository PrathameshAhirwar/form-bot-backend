const mongoose = require('mongoose');
const { Schema } = mongoose;

const folderSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    forms: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form'
    }],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});


folderSchema.index({ userId: 1, isDeleted: 1 });
const Folder = mongoose.model('Folder', folderSchema);

module.exports = Folder