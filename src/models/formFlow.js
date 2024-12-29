const mongoose = require('mongoose')
const { Schema } = mongoose

const flowSchema = new Schema({
    elements: [elementSchema],
    connections: [{
        source: {
            elementId: Schema.Types.ObjectId,
            connector: String
        },
        target: {
            elementId: Schema.Types.ObjectId,
            connector: String
        }
    }],
    startElement: {
        type: Schema.Types.ObjectId,
        ref: 'Element'
    }
});

const Flow = mongoose.model('Flow',flowSchema)

module.exports = Flow;