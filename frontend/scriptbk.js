document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addButton = document.getElementById('add-button');
    const taskList = document.getElementById('task-list');
    const API_URL = 'http://localhost:3000/api/tasks'; // Địa chỉ backend

    let tasks = [];

    // Hàm định dạng ngày giờ cho dễ đọc
    const formatDateTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('vi-VN');
    };

    // Hàm render lại danh sách công việc
    const renderTasks = () => {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const listItem = document.createElement('li');
            listItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            listItem.dataset.id = task.id;

            // Checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => toggleComplete(task.id, !task.completed));

            // Vùng nội dung
            const taskContent = document.createElement('div');
            taskContent.className = 'task-content';
            const taskText = document.createElement('span');
            taskText.className = 'task-text';
            taskText.textContent = task.text;
            const taskTimestamps = document.createElement('div');
            taskTimestamps.className = 'task-timestamps';
            let timestampsHTML = `Tạo: ${formatDateTime(task.createdAt)}`;
            if (task.completedAt) {
                timestampsHTML += ` | Hoàn thành: ${formatDateTime(task.completedAt)}`;
            }
            taskTimestamps.innerHTML = timestampsHTML;
            taskContent.appendChild(taskText);
            taskContent.appendChild(taskTimestamps);

            // Vùng hành động
            const taskActions = document.createElement('div');
            taskActions.className = 'task-actions';
            const editButton = document.createElement('button');
            editButton.textContent = 'Sửa';
            editButton.className = 'edit-btn';
            editButton.addEventListener('click', () => startEditing(task, listItem));
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Xóa';
            deleteButton.className = 'delete-btn';
            deleteButton.addEventListener('click', () => deleteTask(task.id));
            taskActions.appendChild(editButton);
            taskActions.appendChild(deleteButton);

            listItem.appendChild(checkbox);
            listItem.appendChild(taskContent);
            listItem.appendChild(taskActions);
            taskList.appendChild(listItem);
        });
    };

    // Lấy danh sách công việc từ server khi tải trang
    const fetchTasks = async () => {
        try {
            const response = await fetch(API_URL);
            tasks = await response.json();
            renderTasks();
        } catch (error) {
            console.error('Lỗi khi tải công việc:', error);
        }
    };

    // Thêm công việc mới
    const addTask = async () => {
        const text = taskInput.value.trim();
        if (text === '') return;
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text })
            });
            const newTask = await response.json();
            tasks.unshift(newTask); // Thêm vào đầu danh sách
            renderTasks();
            taskInput.value = '';
            taskInput.focus();
        } catch (error) {
            console.error('Lỗi khi thêm công việc:', error);
        }
    };

    // Xóa công việc
    const deleteTask = async (id) => {
        try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            tasks = tasks.filter(task => task.id !== id);
            renderTasks();
        } catch (error) {
            console.error('Lỗi khi xóa công việc:', error);
        }
    };

    // Đánh dấu hoàn thành
    const toggleComplete = async (id, isCompleted) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: isCompleted })
            });
            const updatedTask = await response.json();
            const taskIndex = tasks.findIndex(t => t.id === id);
            if (taskIndex > -1) {
                tasks[taskIndex] = updatedTask;
            }
            renderTasks();
        } catch (error) {
            console.error('Lỗi khi cập nhật công việc:', error);
        }
    };

    // Sửa công việc
    const startEditing = (task, listItem) => {
        // Tương tự phiên bản trước, nhưng khi lưu sẽ gọi API
        const taskContent = listItem.querySelector('.task-content');
        const taskTextSpan = listItem.querySelector('.task-text');
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.value = task.text;
        editInput.className = 'edit-input';
        
        taskContent.replaceChild(editInput, taskTextSpan);
        editInput.focus();

        const saveEdit = async () => {
            const newText = editInput.value.trim();
            if (newText && newText !== task.text) {
                try {
                    const response = await fetch(`${API_URL}/${task.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: newText })
                    });
                    const updatedTask = await response.json();
                     const taskIndex = tasks.findIndex(t => t.id === task.id);
                    if (taskIndex > -1) {
                        tasks[taskIndex] = updatedTask;
                    }
                } catch (error) {
                    console.error('Lỗi khi sửa công việc:', error);
                }
            }
            renderTasks(); // Render lại để thoát chế độ sửa
        };

        editInput.addEventListener('keypress', e => e.key === 'Enter' && saveEdit());
        editInput.addEventListener('blur', saveEdit);
    };

    // Gắn sự kiện và tải dữ liệu ban đầu
    addButton.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', e => e.key === 'Enter' && addTask());
    fetchTasks();
});