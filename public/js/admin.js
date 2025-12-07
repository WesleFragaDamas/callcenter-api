// ARQUIVO: public/js/admin.js

function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => { el.style.display = 'none'; });
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).style.display = 'grid';
    if(event && event.currentTarget) event.currentTarget.classList.add('active');
}

function toggleUserForm(isEdit = false) {
    const form = document.getElementById('user-form-card');
    
    if (form.style.display === 'none' || form.style.display === '') {
        form.style.display = 'block';
        openTab('tab-acesso');
        
        if (!isEdit) {
            // Se for NOVO, limpa tudo
            document.getElementById('createUserForm').reset();
            document.getElementById('user_id').value = ''; 
            document.getElementById('formTitle').innerText = 'Novo Cadastro';
        }
    } else {
        form.style.display = 'none';
    }
}

async function loadUsers() {
    try {
        const response = await fetch('http://localhost:3000/users');
        const users = await response.json();
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';

        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #333';
            
            // Prepara dados para o botão editar
            const userJson = JSON.stringify(u).replace(/"/g, '&quot;');

            tr.innerHTML = `
                <td style="padding: 10px;">${u.fullName} <br><small style="color:#888">${u.email}</small></td>
                <td style="padding: 10px;">${u.role ? u.role.name : '-'}</td>
                <td style="padding: 10px;">${u.shift || '-'}</td>
                <td style="padding: 10px;">
                    <button onclick="editUser(${userJson})" style="background: #f1c40f; border:none; padding: 5px 10px; border-radius: 4px; color: #000; font-weight: bold; cursor:pointer;">EDITAR</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {}
}

function editUser(user) {
    toggleUserForm(true);
    document.getElementById('formTitle').innerText = 'Editando: ' + user.fullName;
    document.getElementById('user_id').value = user.id;

    // Preenche campos
    document.getElementById('new_email').value = user.email;
    document.getElementById('new_role').value = user.roleId;
    document.getElementById('new_name').value = user.fullName;
    document.getElementById('new_cpf').value = user.cpf || '';
    document.getElementById('new_phone').value = user.phone || '';
    document.getElementById('new_matricula').value = user.matricula;
    document.getElementById('new_shift').value = user.shift || '';
}

async function loadRoles() {
    const select = document.getElementById('new_role');
    if(select.options.length > 1) return;
    try {
        const res = await fetch('http://localhost:3000/roles');
        const roles = await res.json();
        roles.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.id; opt.innerText = r.name; select.appendChild(opt);
        });
    } catch(e){}
}

// ENVIO (Cria ou Edita)
document.getElementById('createUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('user_id').value;
    const isEdit = !!id; // Se tem ID, é edição
    
    const data = {
        email: document.getElementById('new_email').value,
        roleId: document.getElementById('new_role').value,
        fullName: document.getElementById('new_name').value,
        cpf: document.getElementById('new_cpf').value,
        phone: document.getElementById('new_phone').value,
        matricula: document.getElementById('new_matricula').value,
        shift: document.getElementById('new_shift').value
    };

    const pass = document.getElementById('new_password').value;
    if(pass) data.password = pass;

    const url = isEdit ? `http://localhost:3000/users/${id}` : 'http://localhost:3000/users';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

        if(res.ok) {
            alert('Salvo com sucesso!');
            toggleUserForm();
            loadUsers();
        } else {
            const err = await res.json();
            alert('Erro: ' + err.error);
        }
    } catch(err) { alert('Erro de conexão'); }
});