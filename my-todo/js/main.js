// ===========================
// 상태 (State)
// ===========================
let todos = loadFromStorage();
let currentFilter = 'all';
let draggedId = null;

// ===========================
// DOM 요소
// ===========================
const form         = document.getElementById('todoForm');
const input        = document.getElementById('todoInput');
const dueDateInput = document.getElementById('dueDateInput');
const list         = document.getElementById('todoList');
const countText    = document.getElementById('countText');
const clearBtn     = document.getElementById('clearDone');
const filterBtns   = document.querySelectorAll('.filter-btn');

// ===========================
// 초기 렌더링
// ===========================
render();

// ===========================
// 이벤트 연결
// ===========================

// 할 일 추가
form.addEventListener('submit', function (e) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    todos.push({
        id: Date.now(),
        text: text,
        done: false,
        dueDate: dueDateInput.value || null
    });

    input.value = '';
    dueDateInput.value = '';
    saveToStorage();
    render();
});

// 완료 항목 삭제
clearBtn.addEventListener('click', function () {
    todos = todos.filter(t => !t.done);
    saveToStorage();
    render();
});

// 필터 변경
filterBtns.forEach(btn => {
    btn.addEventListener('click', function () {
        filterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        render();
    });
});

// ===========================
// 렌더링
// ===========================

function render() {
    const filtered = getFiltered();
    list.innerHTML = '';

    if (filtered.length === 0) {
        list.innerHTML = '<li class="empty-msg">할 일이 없어요 🎉</li>';
    } else {
        filtered.forEach(todo => {
            list.appendChild(createItem(todo));
        });
    }

    const activeCount = todos.filter(t => !t.done).length;
    countText.textContent = `${activeCount}개 남음`;
}

function createItem(todo) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');
    li.dataset.id = todo.id;
    li.draggable = true;

    // 드래그 핸들
    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.innerHTML = '&#8942;';
    handle.title = '드래그하여 순서 변경';

    // 체크 버튼
    const check = document.createElement('div');
    check.className = 'todo-check';
    check.title = '완료 토글';
    check.addEventListener('click', () => toggleDone(todo.id));

    // 텍스트 + 마감일 콘텐츠 영역
    const content = document.createElement('div');
    content.className = 'todo-content';

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;
    content.appendChild(text);

    if (todo.dueDate) {
        const badge = document.createElement('span');
        badge.className = 'due-date-badge';
        if (!todo.done && isOverdue(todo.dueDate)) {
            badge.classList.add('overdue');
            badge.textContent = `⚠ ${formatDate(todo.dueDate)}`;
        } else if (!todo.done && isDueToday(todo.dueDate)) {
            badge.classList.add('due-today');
            badge.textContent = `오늘 ${formatDate(todo.dueDate)}`;
        } else {
            badge.textContent = `📅 ${formatDate(todo.dueDate)}`;
        }
        content.appendChild(badge);
    }

    // 삭제 버튼
    const del = document.createElement('button');
    del.className = 'btn-delete';
    del.innerHTML = '✕';
    del.title = '삭제';
    del.addEventListener('click', () => deleteTodo(todo.id));

    // 드래그 이벤트
    li.addEventListener('dragstart', onDragStart);
    li.addEventListener('dragover',  onDragOver);
    li.addEventListener('dragleave', onDragLeave);
    li.addEventListener('drop',      onDrop);
    li.addEventListener('dragend',   onDragEnd);

    li.appendChild(handle);
    li.appendChild(check);
    li.appendChild(content);
    li.appendChild(del);
    return li;
}

// ===========================
// 액션
// ===========================

function toggleDone(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.done = !todo.done;
        saveToStorage();
        render();
    }
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveToStorage();
    render();
}

function getFiltered() {
    if (currentFilter === 'active') return todos.filter(t => !t.done);
    if (currentFilter === 'done')   return todos.filter(t => t.done);
    return todos;
}

// ===========================
// 드래그 & 드롭
// ===========================

function onDragStart(e) {
    draggedId = Number(this.dataset.id);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (Number(this.dataset.id) !== draggedId) {
        this.classList.add('drag-over');
    }
}

function onDragLeave() {
    this.classList.remove('drag-over');
}

function onDrop(e) {
    e.preventDefault();
    const targetId = Number(this.dataset.id);
    if (targetId === draggedId) return;

    const fromIndex = todos.findIndex(t => t.id === draggedId);
    const toIndex   = todos.findIndex(t => t.id === targetId);

    const [item] = todos.splice(fromIndex, 1);
    todos.splice(toIndex, 0, item);

    saveToStorage();
    render();
}

function onDragEnd() {
    document.querySelectorAll('.todo-item').forEach(el => {
        el.classList.remove('dragging', 'drag-over');
    });
    draggedId = null;
}

// ===========================
// 날짜 유틸
// ===========================

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [, month, day] = dateStr.split('-');
    return `${parseInt(month)}/${parseInt(day)}`;
}

function isOverdue(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
}

function isDueToday(dateStr) {
    return dateStr === new Date().toISOString().split('T')[0];
}

// ===========================
// LocalStorage
// ===========================

function saveToStorage() {
    localStorage.setItem('my-todo-list', JSON.stringify(todos));
}

function loadFromStorage() {
    try {
        return JSON.parse(localStorage.getItem('my-todo-list')) || [];
    } catch {
        return [];
    }
}
