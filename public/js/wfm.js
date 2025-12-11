// ARQUIVO: public/js/wfm.js

function toggleWfmTab(tab) {
    document.querySelectorAll('.wfm-tab').forEach(e => e.style.display = 'none');
    
    if (tab === 'curves') {
        document.getElementById('wfm-tab-curves').style.display = 'block';
        loadCurvesList();
    } else if (tab === 'shrinkage') {
        document.getElementById('wfm-tab-shrinkage').style.display = 'block';
        loadShrinkageList();
    } else {
        document.getElementById('wfm-tab-simulation').style.display = 'block';
        loadSelects();
    }
}

// ================= CURVAS =================
async function loadCurvesList() {
    const tbody = document.getElementById('curves-list-body');
    tbody.innerHTML = '<tr><td colspan="3">Carregando...</td></tr>';
    try {
        const res = await fetch('http://localhost:3000/wfm/curves');
        const curves = await res.json();
        if (curves.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">Nenhuma curva.</td></tr>'; return;
        }
        tbody.innerHTML = curves.map(c => `
            <tr style="border-bottom: 1px solid #333">
                <td style="padding:10px">${c.name}</td><td>${c.channel}</td>
                <td><button onclick="editCurve('${c.id}')" style="background:#5653d4; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Editar Volumes</button></td>
            </tr>
        `).join('');
    } catch (e) {}
}

function openNewCurveModal() { document.getElementById('new-curve-modal').style.display = 'flex'; }
function closeCurveModal() { document.getElementById('new-curve-modal').style.display = 'none'; }

async function createCurveStub() {
    const name = document.getElementById('curve-name').value;
    const channel = document.getElementById('curve-channel').value;
    const intervals = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            intervals.push({ time: timeStr, volume: 0, percent: 0 });
        }
    }
    await fetch('http://localhost:3000/wfm/curves', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, channel, intervals })
    });
    closeCurveModal(); loadCurvesList();
}

// --- EDIÇÃO DE CURVA ---
let currentCurveIntervals = [];

async function editCurve(id) {
    const res = await fetch(`http://localhost:3000/wfm/curves/${id}`);
    const curve = await res.json();
    currentCurveIntervals = curve.intervals;
    
    // Normaliza
    currentCurveIntervals.forEach(i => { if (i.volume === undefined) i.volume = 0; });

    document.getElementById('edit-curve-id').value = curve.id;
    document.getElementById('edit-curve-title').innerText = `Editando: ${curve.name}`;
    renderIntervalTable();
    calculateDistribution();
    document.getElementById('edit-curve-modal').style.display = 'flex';
}

function renderIntervalTable() {
    const tbody = document.getElementById('curve-intervals-body');
    tbody.innerHTML = '';
    currentCurveIntervals.forEach((item, index) => {
        const timeLabel = item.time || "Erro";
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 5px; color: #aaa;">${timeLabel}</td>
            <td style="padding: 5px;"><input type="number" min="0" value="${item.volume}" onchange="updateLocalVolume(${index}, this.value)" style="width: 80px; padding: 5px; background: #111; border: 1px solid #444; color: white;"></td>
            <td style="padding: 5px; color: #4cd137;" id="percent-${index}">0.00%</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateLocalVolume(index, value) {
    const vol = parseInt(value);
    currentCurveIntervals[index].volume = isNaN(vol) ? 0 : vol;
    calculateDistribution();
}

function calculateDistribution() {
    const totalVolume = currentCurveIntervals.reduce((acc, curr) => acc + curr.volume, 0);
    document.getElementById('total-volume').innerText = totalVolume;
    currentCurveIntervals.forEach((item, index) => {
        let pct = totalVolume > 0 ? (item.volume / totalVolume) * 100 : 0;
        item.percent = pct;
        document.getElementById(`percent-${index}`).innerText = pct.toFixed(2) + '%';
    });
}

async function saveCurveDetails() {
    const id = document.getElementById('edit-curve-id').value;
    await fetch(`http://localhost:3000/wfm/curves/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervals: currentCurveIntervals })
    });
    alert('Salvo!'); closeEditCurveModal();
}

async function deleteCurve() {
    const id = document.getElementById('edit-curve-id').value;
    if (confirm('Excluir esta curva?')) {
        await fetch(`http://localhost:3000/wfm/curves/${id}`, { method: 'DELETE' });
        closeEditCurveModal(); loadCurvesList();
    }
}
function closeEditCurveModal() { document.getElementById('edit-curve-modal').style.display = 'none'; }


// ================= SHRINKAGE =================
function openShrinkageModal() { 
    document.getElementById('shrinkage-modal').style.display = 'flex'; 
    document.getElementById('shrink-items-container').innerHTML = '';
    addShrinkRow(); // Adiciona uma linha vazia por padrão
}
function closeShrinkModal() { document.getElementById('shrinkage-modal').style.display = 'none'; }

function addShrinkRow() {
    const div = document.createElement('div');
    div.className = 'shrink-row';
    div.style = 'display:flex; gap:10px; margin-bottom:5px;';
    div.innerHTML = `<input type="text" placeholder="Item" class="s-label"><input type="number" placeholder="%" class="s-percent" style="width:60px" step="0.01">`;
    document.getElementById('shrink-items-container').appendChild(div);
}

async function saveShrinkage() {
    const name = document.getElementById('shrink-name').value;
    const items = [];
    document.querySelectorAll('.shrink-row').forEach(row => {
        const label = row.querySelector('.s-label').value;
        const percent = parseFloat(row.querySelector('.s-percent').value);
        if(label && percent) items.push({ label, percent });
    });
    await fetch('http://localhost:3000/wfm/shrinkages', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ name, items })
    });
    closeShrinkModal(); loadShrinkageList();
}

async function loadShrinkageList() {
    const tbody = document.getElementById('shrinkage-list-body');
    tbody.innerHTML = 'Carregando...';
    try {
        const res = await fetch('http://localhost:3000/wfm/shrinkages');
        const list = await res.json();
        if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="3">Nenhum perfil.</td></tr>'; return; }
        tbody.innerHTML = list.map(s => {
            const total = s.items.reduce((acc, curr) => acc + (parseFloat(curr.percent)||0), 0);
            return `<tr style="border-bottom: 1px solid #333"><td style="padding:10px">${s.name}</td><td>${total.toFixed(2)}%</td><td><button onclick="deleteShrinkage('${s.id}')" style="background:#ff4757;color:white;border:none;padding:5px;border-radius:4px;cursor:pointer">Excluir</button></td></tr>`;
        }).join('');
    } catch(e) {}
}

async function deleteShrinkage(id) {
    if(confirm("Excluir este perfil?")) {
        await fetch(`http://localhost:3000/wfm/shrinkages/${id}`, { method: 'DELETE' });
        loadShrinkageList();
    }
}


// ================= SIMULAÇÃO =================
async function loadSelects() {
    const resC = await fetch('http://localhost:3000/wfm/curves');
    const curves = await resC.json();
    document.getElementById('sim-curve').innerHTML = curves.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    const resS = await fetch('http://localhost:3000/wfm/shrinkages');
    const shrinks = await resS.json();
    document.getElementById('sim-shrink').innerHTML = `<option value="">Sem Perdas (0%)</option>` + shrinks.map(s => {
        const total = s.items.reduce((acc, curr) => acc + (parseFloat(curr.percent)||0), 0);
        return `<option value="${s.id}">${s.name} (${total.toFixed(2)}%)</option>`;
    }).join('');
}

async function runSimulation() {
    console.log("Iniciando...");
    const data = {
        description: document.getElementById('sim-desc').value || "Simulação",
        totalVolume: parseInt(document.getElementById('sim-vol').value),
        aht: parseInt(document.getElementById('sim-aht').value) || 180,
        slaTarget: parseFloat(document.getElementById('sim-sla').value) || 80,
        slaTime: 20,
        curveId: document.getElementById('sim-curve').value,
        shrinkageId: document.getElementById('sim-shrink').value || null
    };

    if(!data.totalVolume || !data.curveId) return alert("Preencha Volume e Curva");

    try {
        const res = await fetch('http://localhost:3000/wfm/simulations', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify(data)
        });
        
        if (!res.ok) {
            const err = await res.json();
            return alert("Erro: " + err.error);
        }

        const sim = await res.json();
        document.getElementById('simulation-result').style.display = 'block';
        const tbody = document.getElementById('sim-result-body');
        
        tbody.innerHTML = sim.items.map(item => `
            <tr style="border-bottom:1px solid #333">
                <td style="padding:5px">${item.interval}</td>
                <td style="padding:5px">${item.volume}</td>
                <td style="padding:5px; color:#e1b12c; font-weight:bold;">${item.requiredAgents}</td>
                <td style="padding:5px"><input type="number" value="${item.scheduledAgents}" style="width:60px; background:#111; color:white; border:1px solid #555"></td>
            </tr>
        `).join('');
        
        document.getElementById('simulation-result').scrollIntoView({ behavior: 'smooth' });

    } catch (e) {
        console.error(e);
        alert("Erro de conexão.");
    }
}