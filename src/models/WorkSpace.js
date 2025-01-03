const mongoose = require('mongoose');
const { Schema } = mongoose;

const workspaceAccessSchema = new Schema({
  workspace: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accessibleBy: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    accessType: {
      type: String,
      enum: ['edit', 'view'],
      default: 'view'
    }
  }],
  shareLinks: [{
    link: String,
    accessType: {
      type: String,
      enum: ['edit', 'view'],
      default: 'view'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

const WorkspaceAccess = mongoose.model('WorkspaceAccess', workspaceAccessSchema);

module.exports = WorkspaceAccess;