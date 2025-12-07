// ARQUIVO: public/js/helpdesk.js

let workstations = [];
let isDragging = false;
let currentDragId = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// 1. ALTERNAR VISÃO (Mapa vs Lista)
function toggleHelpDeskView(view) {
    if (view === 'map') {
        document.getElementById('map-view').style.display = 'flex';
        document.getElementById('list-view').style.display = 'none';
        loadWorkstations(); // Recarrega o mapa
    } else {
        document.getElementById('map-view').style.display = 'none';
        document.getElementById('list-view').style.display = 'block';
        loadTicketList(); // Carrega a tabela
    }
}

// 2. CARREGAR E DESENHAR O MAPA
async function loadWorkstations() {
    const canvas = document.getElementById('map-canvas');
    canvas.innerHTML = ''; // Limpa

    const res = await fetch('http://localhost:3000/workstations');
    workstations = await res.json();

    workstations.forEach(ws => {
        const box = document.createElement('div');
        box.className = `workstation-box ${ws.status === 'ERROR' ? 'error' : ''}`;
        box.innerText = ws.name;
        
        // Posicionamento
        box.style.left = ws.posX + 'px';
        box.style.top = ws.posY + 'px';
        box.id = `ws-${ws.id}`;

        // EVENTOS DE MOUSE (Arrastar ou Clicar)
        box.onmousedown = (e) => startDrag(e, ws.id);
        
        // Clique Duplo ou Clique Simples para abrir chamado? Vamos usar clique simples.
        // Mas precisamos diferenciar clique de arrasto. Faremos isso no mouseup.
        
        canvas.appendChild(box);
    });
}

// 3. LÓGICA DE ARRASTAR E SOLTAR (DRAG & DROP)
function startDrag(e, id) {
    // Só deixa arrastar se for ADMIN
    const user = JSON.parse(localStorage.getItem('user'));
    if (user.role !== 'ADMIN' && user.role !== 'IT_SUPPORT') {
        openTicketModal(id); // Se não for admin, só abre o modal
        return;
    }

    isDragging = true;
    currentDragId = id;
    
    const box = document.getElementById(`ws-${id}`);
    dragOffsetX = e.clientX - box.offsetLeft;
    dragOffsetY = e.clientY - box.offsetTop;

    // Adiciona eventos globais para movimento fluido
    document.onmousemove = doDrag;
    document.onmouseup = stopDrag;
}

function doDrag(e) {
    if (!isDragging) return;
    const box = document.getElementById(`ws-${currentDragId}`);
    
    // Move visualmente
    box.style.left = (e.clientX - dragOffsetX) + 'px';
    box.style.top = (e.clientY - dragOffsetY) + 'px';
}

async function stopDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    document.onmousemove = null;
    document.onmouseup = null;

    const box = document.getElementById(`ws-${currentDragId}`);
    
    // Salva nova posição no Backend
    await fetch(`http://localhost:3000/workstations/${currentDragId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            posX: parseInt(box.style.left),
            posY: parseInt(box.style.top)
        })
    });
}

// 4. CRIAR NOVA MESA (Botão +)
async function addWorkstation() {
    const name = prompt("Nome da nova Posição (Ex: PA-10):");
    if (!name) return;

    await fetch('http://localhost:3000/workstations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    loadWorkstations();
}

// 5. MODAL DE CHAMADO (Abrir ou Ver)
function openTicketModal(wsId) {
    const ws = workstations.find(w => w.id === wsId);
    
    // Se estiver VERMELHO, mostra quem está atendendo (Lógica futura)
    // Se estiver VERDE, abre form para abrir chamado
    
    const problem = prompt(`Reportar problema na ${ws.name}?\nDigite o problema:`);
    if (problem) {
        createTicket(ws.id, problem);
    }
}

async function createTicket(wsId, title) {
    const user = JSON.parse(localStorage.getItem('user'));
    
    await fetch('http://localhost:3000/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title,
            category: 'Hardware', // Padrão por enquanto
            workstationId: wsId,
            openerId: user.id
        })
    });
    alert('Chamado aberto! A TI foi notificada.');
    loadWorkstations(); // Atualiza a cor para vermelho
}

// 6. LISTA DE TICKETS (Para a TI)
async function loadTicketList() {
    const res = await fetch('http://localhost:3000/tickets');
    const tickets = await res.json();
    
    const tbody = document.getElementById('ticket-table-body');
    tbody.innerHTML = '';

    tickets.forEach(t => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #444';
        
        // Botão de fechar só aparece se estiver aberto
        const actionBtn = t.status === 'OPEN' 
            ? `<button onclick="closeTicket('${t.id}')" style="background:#4cd137; border:none; padding:5px; border-radius:4px; cursor:pointer;">Concluir</button>`
            : '<span style="color:#888">Fechado</span>';

        tr.innerHTML = `
            <td style="padding:10px">${t.workstation.name}</td>
            <td style="padding:10px">${t.title}</td>
            <td style="padding:10px">${t.opener.fullName}</td>
            <td style="padding:10px">${t.status}</td>
            <td style="padding:10px">${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function closeTicket(ticketId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (confirm('Marcar chamado como resolvido?')) {
        await fetch(`http://localhost:3000/tickets/${ticketId}/close`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ solverId: user.id })
        });
        loadTicketList();
    }
}