// public/js/app.js

// --- 1. SEGURANÇA E INICIALIZAÇÃO ---
const token = localStorage.getItem('token');
const userJson = localStorage.getItem('user');

if (!token || !userJson) {
    window.location.href = '/login.html';
}

const user = JSON.parse(userJson);
document.getElementById('userNameDisplay').innerText = user.name;
document.getElementById('userRoleDisplay').innerText = user.role;

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// --- 2. LAYOUT E MENUS ---
function toggleLeft() {
    const sidebar = document.getElementById('left-sidebar');
    sidebar.classList.toggle('collapsed');
    const spans = document.querySelectorAll('#left-sidebar span:not(.toggle-btn)');
    spans.forEach(s => s.style.display = sidebar.classList.contains('collapsed') ? 'none' : 'inline');
}

function toggleRight() {
    const sidebar = document.getElementById('right-sidebar');
    sidebar.classList.toggle('collapsed');
}

// --- 3. NAVEGAÇÃO ENTRE TELAS (ROTEADOR SIMPLES) ---
// Esconde tudo e mostra só o que queremos
function hideAllViews() {
    document.getElementById('dashboard-view').style.display = 'none';
    document.getElementById('admin-view').style.display = 'none';
    // Aqui adicionaremos as próximas telas: helpdesk-view, wfm-view...
}

function showDashboard() {
    hideAllViews();
    document.getElementById('dashboard-view').style.display = 'block';
}

function showAdmin() {
    hideAllViews();
    document.getElementById('admin-view').style.display = 'block';
    
    // Chama as funções do admin.js se elas existirem
    if (typeof loadUsers === 'function') {
        loadUsers();
        loadRoles();
    }
}

// Adicione essa função no public/js/app.js
function showHelpDesk() {
    hideAllViews();
    document.getElementById('helpdesk-view').style.display = 'block';
    // Carrega o mapa por padrão
    toggleHelpDeskView('map');
}