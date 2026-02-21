const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User'); 
const Task = require('./models/Task');

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- KẾT NỐI DB & TẠO DỮ LIỆU MẪU (Dành cho Level 1) ---
mongoose.connect('mongodb://127.0.0.1:27017/todoApp')
    .then(async () => {
        console.log('Đã kết nối MongoDB thành công!');
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            // Tạo 3 tài khoản mẫu, mật khẩu sẽ tự động băm qua Bcrypt ở model User.js
            await User.create([
                { username: 'camtu_admin', password: '123', lastName: 'Nguyễn', role: 'admin' },
                { username: 'hoang_nam', password: '123', lastName: 'Trần', role: 'normal' },
                { username: 'thu_huong', password: '123', lastName: 'Lê', role: 'normal' }
            ]);
            console.log('Đã khởi tạo dữ liệu mẫu cho Level 1!');
        }
    })
    .catch(err => console.error(err));

// ============================================================
// CÁC ĐƯỜNG DẪN API TRUY XUẤT DỮ LIỆU (PHỤC VỤ LEVEL 1)
// ============================================================

// 1. Lấy tất cả các task (getAllTasks)
app.get('/api/tasks', async (req, res) => {
    const tasks = await Task.find().populate('creator assignees.user');
    res.json(tasks);
});

// 2. Lấy task của người dùng họ 'Nguyễn' (Sử dụng Regex)
app.get('/api/tasks/nguyen', async (req, res) => {
    const users = await User.find({ lastName: { $regex: /Nguyễn/i } });
    const ids = users.map(u => u._id);
    const tasks = await Task.find({ $or: [{ creator: { $in: ids } }, { 'assignees.user': { $in: ids } }] });
    res.json(tasks);
});

// 3. Lấy task theo tên User cụ thể (Ví dụ: /api/tasks/user/thu_huong)
app.get('/api/tasks/user/:username', async (req, res) => {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    const tasks = await Task.find({ $or: [{ creator: user._id }, { 'assignees.user': user._id }] }).populate('creator assignees.user');
    res.json(tasks);
});

// 4. Xuất các task chưa hoàn thành
app.get('/api/tasks/incomplete', async (req, res) => {
    const tasks = await Task.find({ isDone: false }).populate('creator assignees.user');
    res.json(tasks);
});

// 5. Xuất các task trong ngày hiện tại
app.get('/api/tasks/today', async (req, res) => {
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);
    const tasks = await Task.find({ createdAt: { $gte: start, $lte: end } });
    res.json(tasks);
});

// ============================================================
// GIAO DIỆN QUẢN LÝ (PHỤC VỤ LEVEL 2 & 3)
// ============================================================

app.get('/', async (req, res) => {
    const users = await User.find();
    const currentUserId = req.query.userId || users[0]._id;
    const currentUser = await User.findById(currentUserId);
    const tasks = await Task.find().populate('assignees.user creator');
    res.render('index', { tasks, users, currentUser });
});

app.post('/tasks/add', async (req, res) => {
    await new Task({ title: req.body.title, creator: req.body.creatorId }).save();
    res.redirect(`/?userId=${req.body.creatorId}`);
});

app.post('/tasks/assign/:taskId', async (req, res) => {
    const task = await Task.findById(req.params.taskId);
    if (!task.assignees.some(a => a.user.toString() === req.body.targetUserId)) {
        task.assignees.push({ user: req.body.targetUserId, isUserDone: false });
        await task.save();
    }
    res.redirect(`/?userId=${req.body.currentAdminId}`);
});

app.post('/tasks/done/:taskId', async (req, res) => {
    const task = await Task.findById(req.params.taskId);
    const assignment = task.assignees.find(a => a.user.toString() === req.body.currentUserId);
    if (assignment) assignment.isUserDone = true;
    if (task.assignees.length > 0 && task.assignees.every(a => a.isUserDone)) {
        task.isDone = true;
    }
    await task.save();
    res.redirect(`/?userId=${req.body.currentUserId}`);
});

app.post('/tasks/delete/:id', async (req, res) => {
    await Task.findByIdAndDelete(req.params.id);
    res.redirect(`/?userId=${req.body.currentUserId}`);
});

app.listen(3000, () => console.log('Server chạy tại http://localhost:3000'));