const path = require('path');
const express = require('express');
const cors = require('cors');
const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: './todo.db' // Tên file database sẽ được tạo
    },
    useNullAsDefault: true
});

const app = express();
// --- BẮT ĐẦU PHẦN CẬP NHẬT ---

// 1. Định nghĩa các origin được phép
const allowedOrigins = [
    'https://euphonious-cascaron-aad832.netlify.app', // URL frontend của bạn
    'http://localhost:8080', // Thêm các URL local nếu bạn muốn test trên máy
    'http://127.0.0.1:5500'  // Thêm URL của Live Server nếu bạn dùng
];

// 2. Cấu hình CORS
const corsOptions = {
    origin: function (origin, callback) {
        // Nếu origin của request nằm trong danh sách được phép, hoặc không có origin (VD: gọi bằng Postman)
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Cho phép các phương thức này
    credentials: true, // Cho phép gửi cookie (nếu có)
    optionsSuccessStatus: 204
};

// 3. Sử dụng CORS với cấu hình mới
app.use(cors(corsOptions));

// --- KẾT THÚC PHẦN CẬP NHẬT ---
app.use(express.json()); // Cho phép server đọc dữ liệu JSON từ request
app.use(cors());         // Cho phép cross-origin requests
// Serve static files (HTML, CSS, JS) from the 'frontend' directory
app.use(express.static(path.join(__dirname, '../frontend')));
const PORT = process.env.PORT || 3000;
//const PORT = 3000;

// --- Khởi tạo Database ---
// Kiểm tra và tạo bảng 'tasks' nếu nó chưa tồn tại
knex.schema.hasTable('tasks').then((exists) => {
    if (!exists) {
        return knex.schema.createTable('tasks', (table) => {
            table.increments('id').primary(); // Cột ID tự tăng
            table.string('text');
            table.boolean('completed');
            table.timestamp('createdAt').defaultTo(knex.fn.now());
            table.timestamp('completedAt');
        });
    }
}).then(() => {
    console.log("Bảng 'tasks' đã sẵn sàng.");
}).catch(e => {
    console.error("Lỗi khi tạo bảng:", e);
});

// --- Định nghĩa các API Endpoints ---

// 1. GET: Lấy toàn bộ công việc (có thể tra cứu lịch sử ở đây)
// Ví dụ: GET http://localhost:3000/api/tasks
// Nâng cao: GET http://localhost:3000/api/tasks?completed=true để lọc
app.get('/api/tasks', async (req, res) => {
    try {
        const query = knex('tasks');
        // Mở rộng để tra cứu/lọc
        if (req.query.completed) {
            query.where('completed', req.query.completed === 'true');
        }
        if (req.query.search) {
            query.where('text', 'like', `%${req.query.search}%`);
        }
        // Sắp xếp theo ngày tạo mới nhất
        const tasks = await query.orderBy('createdAt', 'desc');
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: "Lỗi máy chủ", error: err });
    }
});

// 2. POST: Thêm một công việc mới
// POST http://localhost:3000/api/tasks
app.post('/api/tasks', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ message: 'Nội dung công việc không được để trống' });
        }
        const newTask = {
            text: text,
            completed: false
        };
        const [id] = await knex('tasks').insert(newTask);
        const createdTask = await knex('tasks').where({ id }).first();
        res.status(201).json(createdTask);
    } catch (err) {
        res.status(500).json({ message: "Lỗi máy chủ", error: err });
    }
});

// 3. PUT: Cập nhật một công việc (đánh dấu hoàn thành, sửa text)
// PUT http://localhost:3000/api/tasks/123
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // { text: "...", completed: true }

        // Nếu đánh dấu hoàn thành, cập nhật completedAt
        if (updates.completed === true) {
            updates.completedAt = new Date();
        } else if (updates.completed === false) {
            updates.completedAt = null;
        }

        const count = await knex('tasks').where({ id }).update(updates);
        if (count > 0) {
            const updatedTask = await knex('tasks').where({ id }).first();
            res.json(updatedTask);
        } else {
            res.status(404).json({ message: 'Không tìm thấy công việc' });
        }
    } catch (err) {
        res.status(500).json({ message: "Lỗi máy chủ", error: err });
    }
});


// 4. DELETE: Xóa một công việc
// DELETE http://localhost:3000/api/tasks/123
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const count = await knex('tasks').where({ id }).del();
        if (count > 0) {
            res.status(204).send(); // 204 No Content
        } else {
            res.status(404).json({ message: 'Không tìm thấy công việc' });
        }
    } catch (err) {
        res.status(500).json({ message: "Lỗi máy chủ", error: err });
    }
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
