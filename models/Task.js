const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Mảng chứa những người được phân công
    assignees: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        isUserDone: { type: Boolean, default: false } // Người này đã làm xong chưa?
    }],
    isDone: { type: Boolean, default: false }, // Khi tất cả cùng xong thì cái này mới thành true
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);