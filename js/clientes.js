// Variables globales
let clients = [];
let editingClientId = null;

// Elementos del DOM
const addClientBtn = document.getElementById('addClientBtn');
const clientModal = document.getElementById('clientModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const clientForm = document.getElementById('clientForm');
const modalTitle = document.getElementById('modalTitle');
const submitBtn = document.getElementById('submitBtn');
const clientsList = document.getElementById('clientsList');
const messageContainer = document.getElementById('messageContainer');

// Event Listeners
document.addEventListener('DOMContentLoaded', async function() {
    // Verificación de sesión
    const adminData = JSON.parse(sessionStorage.getItem('loggedInAdmin')) || JSON.parse(localStorage.getItem('loggedInAdmin'));
    if (!adminData || !adminData.isAdmin) {
        window.location.href = '../index.html'; // Redirigir al login si no es admin
        return;
    }
    
    await loadClients();
    renderClients();
    setupEventListeners();
});

function setupEventListeners() {
    addClientBtn.addEventListener('click', openAddClientModal);
    closeModal.addEventListener('click', closeClientModal);
    cancelBtn.addEventListener('click', closeClientModal);
    clientForm.addEventListener('submit', handleFormSubmit);
    
    // Cerrar modal al hacer clic fuera de él
    window.addEventListener('click', function(event) {
        if (event.target === clientModal) {
            closeClientModal();
        }
    });
    
    // Formatear teléfono mientras se escribe
    document.getElementById('telefono').addEventListener('input', formatPhone);
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Está seguro de que desea cerrar sesión?')) {
                sessionStorage.removeItem('loggedInAdmin');
                localStorage.removeItem('loggedInAdmin');
                window.location.href = '../index.html';
            }
        });
    }
}

// Funciones del Modal
function openAddClientModal() {
    editingClientId = null;
    modalTitle.textContent = 'Agregar Cliente';
    submitBtn.textContent = 'Crear Cliente';
    clientForm.reset();
    document.getElementById('estado').value = 'Activo';
    clientModal.style.display = 'block';
    setTimeout(() => {
        clientModal.classList.add('show');
    }, 10);
}

function openEditClientModal(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    editingClientId = clientId;
    modalTitle.textContent = 'Editar Cliente';
    submitBtn.textContent = 'Actualizar Cliente';
    
    // Llenar el formulario con los datos del cliente
    document.getElementById('nombreEmpresa').value = client.nombre_empresa || client.nombreEmpresa || '';
    document.getElementById('contactoPrincipal').value = client.contacto_principal || client.contactoPrincipal || '';
    document.getElementById('email').value = client.email;
    document.getElementById('telefono').value = client.telefono;
    document.getElementById('tipo').value = client.tipo;
    document.getElementById('estado').value = client.estado;
    
    clientModal.style.display = 'block';
    setTimeout(() => {
        clientModal.classList.add('show');
    }, 10);
}

function closeClientModal() {
    clientModal.classList.remove('show');
    setTimeout(() => {
        clientModal.style.display = 'none';
        clientForm.reset();
        editingClientId = null;
    }, 300);
}

// Manejo del formulario
function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(clientForm);
    const clientData = {
        nombre_empresa: formData.get('nombreEmpresa'),
        contacto_principal: formData.get('contactoPrincipal'),
        email: formData.get('email'),
        telefono: formData.get('telefono'),
        tipo: formData.get('tipo'),
        estado: formData.get('estado')
    };
    
    // Validaciones
    if (!validateClientData(clientData)) {
        return;
    }
    
    if (editingClientId) {
        updateClient(editingClientId, clientData);
    } else {
        createClient(clientData);
    }
}

// Validaciones
function validateClientData(data) {
    const { nombre_empresa, contacto_principal, email, telefono, tipo, estado } = data;
    
    // Validación básica
    if (!nombre_empresa || !contacto_principal || !tipo || !estado) {
        showMessage('Por favor, complete todos los campos obligatorios', 'error');
        return false;
    }
    
    // Validación de email si se proporciona (usando el mismo regex que la función de la DB)
    if (email && email.trim() !== '') {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            showMessage('Por favor, ingrese un email válido', 'error');
            return false;
        }
    }
    
    // Validación de teléfono si se proporciona
    if (telefono && telefono.trim() !== '' && !/^[\d\s\-\+\(\)]+$/.test(telefono)) {
        showMessage('Por favor, ingrese un teléfono válido (solo números, espacios, guiones, paréntesis y +)', 'error');
        return false;
    }
    
    return true;
}



// Operaciones CRUD
async function createClient(clientData) {
    try {
        const adminData = JSON.parse(sessionStorage.getItem('loggedInAdmin')) || JSON.parse(localStorage.getItem('loggedInAdmin'));
        const response = await fetch('/api/admin/clientes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + adminData.username
            },
            body: JSON.stringify({
                action: 'create',
                clientData: clientData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadClients();
            renderClients();
            closeClientModal();
            showMessage('Cliente creado exitosamente.', 'success');
        } else {
            showMessage(result.message || 'Error al crear cliente', 'error');
        }
    } catch (error) {
        console.error('Error al crear cliente:', error);
        showMessage('Error al conectar con el servidor', 'error');
    }
}

async function updateClient(clientId, clientData) {
    try {
        const adminData = JSON.parse(sessionStorage.getItem('loggedInAdmin')) || JSON.parse(localStorage.getItem('loggedInAdmin'));
        const response = await fetch('/api/admin/clientes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + adminData.username
            },
            body: JSON.stringify({
                action: 'update',
                clientData: { ...clientData, id: clientId }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadClients();
            renderClients();
            closeClientModal();
            showMessage('Cliente actualizado exitosamente.', 'success');
        } else {
            showMessage(result.message || 'Error al actualizar cliente', 'error');
        }
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        showMessage('Error al conectar con el servidor', 'error');
    }
}

async function deleteClient(clientId) {
    if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
        try {
            const adminData = JSON.parse(sessionStorage.getItem('loggedInAdmin')) || JSON.parse(localStorage.getItem('loggedInAdmin'));
            const response = await fetch('/api/admin/clientes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + adminData.username
                },
                body: JSON.stringify({
                    action: 'delete',
                    clientData: { id: clientId }
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                await loadClients();
                renderClients();
                showMessage('Cliente eliminado exitosamente.', 'success');
            } else {
                showMessage(result.message || 'Error al eliminar cliente', 'error');
            }
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            showMessage('Error al conectar con el servidor', 'error');
        }
    }
}

// Renderizado
function renderClients() {
    clientsList.innerHTML = '';
    
    if (clients.length === 0) {
        clientsList.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-user-friends" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                    No hay clientes registrados
                </td>
            </tr>
        `;
        return;
    }
    
    clients.forEach(client => {
        const row = document.createElement('tr');
        const nombreEmpresa = client.nombre_empresa || client.nombreEmpresa || '';
        const contactoPrincipal = client.contacto_principal || client.contactoPrincipal || '';
        row.innerHTML = `
            <td>${nombreEmpresa}</td>
            <td>${contactoPrincipal}</td>
            <td class="hide-mobile">${client.email}</td>
            <td class="hide-mobile">${client.telefono}</td>
            <td>
                <span class="client-type ${client.tipo.toLowerCase()}">${client.tipo}</span>
            </td>
            <td>
                <span class="status ${client.estado.toLowerCase()}">${client.estado}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="openEditClientModal(${client.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteClient(${client.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        clientsList.appendChild(row);
    });
}

function getClientInitials(companyName) {
    return companyName
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

// Utilidades

function formatPhone(event) {
    let value = event.target.value.replace(/[^0-9+]/g, '');
    
    if (value.length > 0 && !value.startsWith('+')) {
        value = '+56' + value;
    }
    
    event.target.value = value;
}

// Función showMessage ahora está en utils.js

// Persistencia de datos
// Función saveClients eliminada - ahora usamos la base de datos

async function loadClients() {
    try {
        const adminData = JSON.parse(sessionStorage.getItem('loggedInAdmin')) || JSON.parse(localStorage.getItem('loggedInAdmin'));
        const response = await fetch('/api/admin/clientes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + adminData.username
            },
            body: JSON.stringify({
                action: 'list'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            clients = result.clientes || [];
        } else {
            console.error('Error al cargar clientes:', result.message);
            clients = [];
        }
    } catch (error) {
        console.error('Error al conectar con el servidor:', error);
        // Fallback a datos de ejemplo si no hay conexión
        clients = [
            {
                id: 1,
                nombreEmpresa: 'Agroindustrial Los Andes',
                contactoPrincipal: 'Carmen Gloria Soto',
                email: 'cgloria.s@losgrandes.cl',
                telefono: '+56977778888',
                tipo: 'Distribuidor',
                estado: 'Activo'
            },
            {
                id: 2,
                nombreEmpresa: 'Exportadora Sol Radiante S.A.',
                contactoPrincipal: 'Roberto Parra',
                email: 'roberto.p@solradiante.com',
                telefono: '+56223456789',
                tipo: 'Mayorista',
                estado: 'Activo'
            }
        ];
     }
}

// Función initializeMobileMenu ahora está en utils.js