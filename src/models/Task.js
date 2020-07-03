const mongoose = require('mongoose');
mongoose.pluralize(null);

const taskSchema = mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        required: false,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    }
}, {
    timestamps: true
})

const Task = mongoose.model('tasks', taskSchema)

module.exports = Task;