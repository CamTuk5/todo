const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },//duy nhất
    password: { type: String, required: true },
    lastName: { type: String, required: true },//lọc họ
    role: { type: String, enum: ['admin', 'normal'], default: 'normal' }
});


userSchema.pre('save', async function() {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

module.exports = mongoose.model('User', userSchema);