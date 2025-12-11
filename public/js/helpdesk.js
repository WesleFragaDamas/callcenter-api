// ARQUIVO: public/js/helpdesk.js

let workstations = [];
let isDragging = false;
let isEditMode = false; 
let currentDragId = null;
let currentWsId = null;
let dragOffsetX = 0, dragOffsetY = 0;
let startX = 0, startY = 0;

function snapToGrid(value) {
    return Math.round(value / 20) * 20;
}

// 1. ALTERNAR VISÃO
function toggleHelpDeskView(view) {
    if (view === 'map') {
        document.getElementById('map-view').style.display = 'flex';
        document.getElementById('list-view').style.display = 'none';
        loadWorkstations();
    } else {
        document.getElementById('map-view').style.display = 'none';
        document.getElementById('list-view').style.display = 'block';
        loadTicketList(); // Garante que carrega a lista
    }
}

// 2. MODO EDIÇÃO
function toggleEditMode() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user.role !== 'ADMIN' && user.role !== 'IT_SUPPORT') return alert('Acesso negado');

    isEditMode = !isEditMode;
    const label = document.getElementById('lock-label');
    const status = document.getElementById('lock-status');
    const btnAdd = document.getElementById('btn-add-ws');

    if (isEditMode) {
        label.innerText = "Modo Edição (Clique para Editar/Excluir)";
        label.style.color = "#ff4757";
        status.style.background = "#ff4757";
        btnAdd.style.display = 'block';
    } else {
        label.innerText = "Modo Uso (Bloqueado)";
        label.style.color = "#aaa";
        status.style.background = "#4cd137";
        btnAdd.style.display = 'none';
    }
}

// 3. CARREGAR MAPA
// ATUALIZE APENAS A FUNÇÃO loadWorkstations
async function loadWorkstations() {
    const canvas = document.getElementById('map-canvas');
    if(!canvas) return;
    
    // Não limpa aqui ainda para evitar piscar
    // canvas.innerHTML = ''; 

    try {
        const res = await fetch('http://localhost:3000/workstations');
        workstations = await res.json();
    } catch (e) { return; }

    // CORREÇÃO: Limpa o canvas AGORA, logo antes de desenhar.
    // Isso garante que nunca teremos itens duplicados vindos de requests anteriores.
    canvas.innerHTML = ''; 

    workstations.forEach(ws => {
        const box = document.createElement('div');
        box.className = `workstation-box ${ws.status === 'ERROR' ? 'error' : ''}`;
        box.innerText = ws.name;
        box.style.left = ws.posX + 'px';
        box.style.top = ws.posY + 'px';
        box.id = `ws-${ws.id}`;

        box.onmousedown = (e) => handleMouseDown(e, ws.id);
        canvas.appendChild(box);
    });
}

// 4. INTERAÇÃO (CLIQUE VS ARRASTO)
function handleMouseDown(e, id) {
    startX = e.clientX; startY = e.clientY;

    // Se NÃO for edição, prepara para clique simples (abrir ticket)
    if (!isEditMode) {
        document.onmouseup = (evt) => checkClick(evt, id, 'ticket');
        return;
    }

    // Se FOR edição, inicia arrasto
    isDragging = true;
    currentDragId = id;
    const box = document.getElementById(`ws-${id}`);
    dragOffsetX = e.clientX - box.offsetLeft;
    dragOffsetY = e.clientY - box.offsetTop;

    document.onmousemove = doDrag;
    document.onmouseup = (evt) => stopDragOrClick(evt, id);
}

function doDrag(e) {
    if (!isDragging) return;
    const box = document.getElementById(`ws-${currentDragId}`);
    box.style.left = (e.clientX - dragOffsetX) + 'px';
    box.style.top = (e.clientY - dragOffsetY) + 'px';
}

async function stopDragOrClick(e, id) {
    if (!isDragging) return;
    isDragging = false;
    document.onmousemove = null; document.onmouseup = null;

    // Calcula se moveu
    const dist = Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2));

    if (dist < 5) {
        // Foi um CLIQUE no modo edição -> GERENCIAR PA
        manageWorkstation(id);
    } else {
        // Foi ARRASTO -> Salvar Posição
        const box = document.getElementById(`ws-${currentDragId}`);
        const finalX = snapToGrid(parseInt(box.style.left));
        const finalY = snapToGrid(parseInt(box.style.top));
        box.style.left = finalX + 'px'; box.style.top = finalY + 'px';

        await fetch(`http://localhost:3000/workstations/${currentDragId}`, {
            method: 'PUT',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ posX: finalX, posY: finalY })
        });
    }
}

function checkClick(e, id, type) {
    document.onmouseup = null;
    openModal(id); // Abre o modal de chamado
}

// 5. GERENCIAR PA (Agora com Modal Profissional)
function manageWorkstation(id) {
    const ws = workstations.find(w => w.id === id);
    
    // Preenche os dados no Modal Novo
    document.getElementById('edit-ws-id').value = ws.id;
    document.getElementById('edit-ws-name').value = ws.name;
    
    // Mostra o Modal
    document.getElementById('edit-ws-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-ws-modal').style.display = 'none';
}

// Ação 1: Salvar Nome
async function saveWorkstationName() {
    const id = document.getElementById('edit-ws-id').value;
    const newName = document.getElementById('edit-ws-name').value;
    
    if (!newName) return alert("O nome não pode ser vazio");

    await fetch(`http://localhost:3000/workstations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }) // Backend ignora posição se não enviar
    });

    closeEditModal();
    loadWorkstations(); // Atualiza o nome na tela
}

// Ação 2: Excluir
async function deleteWorkstation() {
    const id = document.getElementById('edit-ws-id').value;
    
    // Aqui mantemos um confirm simples só por segurança máxima (para não apagar sem querer)
    // Mas o fluxo principal já está no modal.
    if (confirm('Tem certeza absoluta? Isso apagará todo o histórico de chamados desta mesa.')) {
        await fetch(`http://localhost:3000/workstations/${id}`, {
            method: 'DELETE'
        });
        
        closeEditModal();
        loadWorkstations();
    }
}

// 6. MODAL E TICKETS (Manteve igual, só garantindo carregamento)
async function openModal(wsId) {
    currentWsId = wsId;
    const ws = workstations.find(w => w.id === wsId);
    document.getElementById('modal-title').innerText = `${ws.name}`;
    document.getElementById('ticket-modal').style.display = 'flex';
    document.getElementById('ticket-desc').value = '';
    
    // Histórico
    const div = document.getElementById('history-list');
    div.innerHTML = 'Carregando...';
    try {
        const res = await fetch('http://localhost:3000/tickets');
        const all = await res.json();
        const mine = all.filter(t => t.workstationId === wsId);
        
        if(mine.length === 0) div.innerHTML = '<p>Sem histórico.</p>';
        else div.innerHTML = mine.map(t => `<div class="history-item ${t.status}"><b>${t.title}</b><br><small>${t.status}</small></div>`).join('');
    } catch(e) { div.innerHTML = 'Erro ao carregar'; }
}

function closeModal() { document.getElementById('ticket-modal').style.display = 'none'; }
function openModalTab(id) {
    document.querySelectorAll('.tab-content').forEach(e => e.style.display='none');
    document.getElementById(id).style.display='block';
}

async function submitTicket() {
    const title = document.getElementById('ticket-desc').value;
    if(!title) return;
    const user = JSON.parse(localStorage.getItem('user'));
    await fetch('http://localhost:3000/tickets', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ title, category:'Hardware', workstationId: currentWsId, openerId: user.id })
    });
    closeModal(); loadWorkstations();
}

async function loadTicketList() {
    const res = await fetch('http://localhost:3000/tickets');
    const tickets = await res.json();
    const tbody = document.getElementById('ticket-table-body');
    tbody.innerHTML = '';
    tickets.forEach(t => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #444';
        const btn = t.status === 'OPEN' ? `<button onclick="closeTicket('${t.id}')" style="color:black">Concluir</button>` : 'Fechado';
        tr.innerHTML = `<td style="padding:10px">${t.workstation.name}</td><td style="padding:10px">${t.title}</td><td style="padding:10px">${t.status}</td><td style="padding:10px">${btn}</td>`;
        tbody.appendChild(tr);
    });
}

async function closeTicket(id) {
    const user = JSON.parse(localStorage.getItem('user'));
    await fetch(`http://localhost:3000/tickets/${id}/close`, {
        method: 'PUT', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ solverId: user.id })
    });
    loadTicketList();
}