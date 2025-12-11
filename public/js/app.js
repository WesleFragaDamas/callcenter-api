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

// --- NAVEGAÇÃO ENTRE TELAS ---
function hideAllViews() {
    // Lista de IDs de todas as views possíveis
    const views = ['dashboard-view', 'admin-view', 'helpdesk-view'];
    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function showDashboard() {
    hideAllViews();
    document.getElementById('dashboard-view').style.display = 'block';
}

function showAdmin() {
    hideAllViews();
    document.getElementById('admin-view').style.display = 'block';
    
    // Carrega a lista de usuários
    if (typeof loadUsers === 'function') loadUsers();
    
    // CORREÇÃO: Carrega a lista de cargos também!
    if (typeof loadRoles === 'function') loadRoles();
}

function showHelpDesk(subView = 'map') {
    hideAllViews();
    document.getElementById('helpdesk-view').style.display = 'block';
    
    // CORREÇÃO: Apenas chamamos o toggle. Ele já cuida de carregar os dados.
    if (subView === 'map') {
        toggleHelpDeskView('map');
    } else {
        toggleHelpDeskView('list');
    }
}

// --- SUBMENUS ---
function toggleSubmenu(submenuId) {
    const submenu = document.getElementById(submenuId);
    if (submenu.classList.contains('open')) {
        submenu.classList.remove('open');
    } else {
        // Fecha outros submenus se houver
        document.querySelectorAll('.submenu').forEach(s => s.classList.remove('open'));
        submenu.classList.add('open');
    }
}
// public/js/app.js - Atualize a função showWfm
function showWfm() {
    hideAllViews();
    document.getElementById('wfm-view').style.display = 'block';
    
    // Carrega a lista de curvas ao entrar
    if (typeof loadCurvesList === 'function') loadCurvesList();
}