// ===========================
// 상태 (State)
// ===========================
const state = {
    notes: [],
    currentView: 'list',
    editingId: null,
    searchQuery: '',
};

// ===========================
// DOM 요소
// ===========================
const listView      = document.getElementById('list-view');
const editView      = document.getElementById('edit-view');
const searchInput   = document.getElementById('search-input');
const notesContainer = document.getElementById('notes-container');
const fab           = document.getElementById('fab');
const editTitle     = document.getElementById('edit-title');
const editBody      = document.getElementById('edit-body');
const btnBack       = document.getElementById('btn-back');
const btnSave       = document.getElementById('btn-save');
const btnDelete     = document.getElementById('btn-delete');

// ===========================
// 초기화
// ===========================
function init() {
    state.notes = loadNotes();
    renderList();
    bindEvents();
    registerSW();
}

function bindEvents() {
    // 검색
    searchInput.addEventListener('input', function () {
        state.searchQuery = this.value;
        renderList();
    });

    // 새 메모
    fab.addEventListener('click', openNew);

    // 메모 카드 클릭 (이벤트 위임)
    notesContainer.addEventListener('click', function (e) {
        const card = e.target.closest('.note-card');
        if (card) openEdit(Number(card.dataset.id));
    });

    // 편집 뷰 버튼
    btnBack.addEventListener('click', () => showView('list'));
    btnSave.addEventListener('click', saveNote);
    btnDelete.addEventListener('click', function () {
        if (confirm('정말 삭제할까요?')) {
            deleteNote(state.editingId);
        }
    });
}

// ===========================
// 라우팅
// ===========================
function showView(view) {
    state.currentView = view;
    listView.hidden = (view !== 'list');
    editView.hidden = (view !== 'edit');
}

function openNew() {
    state.editingId = null;
    editTitle.value = '';
    editBody.value = '';
    btnDelete.hidden = true;
    showView('edit');
    editTitle.focus();
}

function openEdit(id) {
    const note = state.notes.find(n => n.id === id);
    if (!note) return;

    state.editingId = id;
    editTitle.value = note.title;
    editBody.value = note.body;
    btnDelete.hidden = false;
    showView('edit');
    editBody.focus();
}

// ===========================
// CRUD
// ===========================
function saveNote() {
    const title = editTitle.value.trim();
    const body  = editBody.value.trim();

    if (!title && !body) {
        alert('내용을 입력하세요.');
        return;
    }

    const now = new Date().toISOString();

    if (state.editingId === null) {
        // 새 메모 추가
        state.notes.unshift({
            id: Date.now(),
            title,
            body,
            createdAt: now,
            updatedAt: now,
        });
    } else {
        // 기존 메모 수정
        const note = state.notes.find(n => n.id === state.editingId);
        if (note) {
            note.title     = title;
            note.body      = body;
            note.updatedAt = now;
        }
    }

    saveNotes();
    renderList();
    showView('list');
}

function deleteNote(id) {
    state.notes = state.notes.filter(n => n.id !== id);
    saveNotes();
    renderList();
    showView('list');
}

// ===========================
// 렌더링
// ===========================
function renderList() {
    const query = state.searchQuery.toLowerCase();

    const filtered = state.notes
        .filter(n =>
            n.title.toLowerCase().includes(query) ||
            n.body.toLowerCase().includes(query)
        )
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    notesContainer.innerHTML = '';

    if (filtered.length === 0) {
        const msg = query
            ? '검색 결과가 없어요.'
            : '메모가 없어요.\n＋를 눌러 첫 메모를 작성하세요.';
        const div = document.createElement('div');
        div.className = 'empty-state';
        div.textContent = msg;
        notesContainer.appendChild(div);
        return;
    }

    filtered.forEach(note => {
        notesContainer.appendChild(createCard(note));
    });
}

function createCard(note) {
    const div = document.createElement('div');
    div.className = 'note-card';
    div.dataset.id = note.id;

    const titleEl = document.createElement('div');
    titleEl.className = 'note-title';
    titleEl.textContent = note.title || '(제목 없음)';

    const preview = getPreview(note.body);
    const metaEl = document.createElement('div');
    metaEl.className = 'note-meta';
    metaEl.textContent = formatDate(note.updatedAt) + (preview ? ' · ' + preview : '');

    div.appendChild(titleEl);
    div.appendChild(metaEl);
    return div;
}

// ===========================
// 유틸
// ===========================
function formatDate(iso) {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getPreview(text) {
    if (!text) return '';
    return text.split('\n').slice(0, 2).join(' ').substring(0, 60);
}

// ===========================
// LocalStorage
// ===========================
function loadNotes() {
    try {
        return JSON.parse(localStorage.getItem('mobile-memo-notes')) || [];
    } catch {
        return [];
    }
}

function saveNotes() {
    localStorage.setItem('mobile-memo-notes', JSON.stringify(state.notes));
}

// ===========================
// Service Worker 등록
// ===========================
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(function (err) {
            console.warn('SW 등록 실패:', err);
        });
    }
}

// ===========================
// 시작
// ===========================
init();
