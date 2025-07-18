document.addEventListener('DOMContentLoaded', () => {
    // --- Verificación de sesión de administrador ---
    const storedAdmin = localStorage.getItem('loggedInAdmin') || sessionStorage.getItem('loggedInAdmin');
    
    if (!storedAdmin) {
        window.location.href = '../index.html';
        return;
    }

    try {
        const adminData = JSON.parse(storedAdmin);
        if (!adminData.isAdmin) {
            localStorage.removeItem('loggedInAdmin');
            sessionStorage.removeItem('loggedInAdmin');
            window.location.href = '../index.html';
            return;
        }
    } catch (error) {
        console.error('Error al parsear los datos de sesión:', error);
        localStorage.removeItem('loggedInAdmin');
        sessionStorage.removeItem('loggedInAdmin');
        window.location.href = '../index.html';
        return;
    }

    // --- Lógica para el botón de cerrar sesión ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('loggedInAdmin');
            sessionStorage.removeItem('loggedInAdmin');
            window.location.href = '../index.html';
        });
    }

    // --- Variables globales ---
    let totesData = [];
    let usersData = [];
    let clientsData = [];
    const storedAdminData = JSON.parse(storedAdmin);
    
    // --- Función para cargar usuarios no administradores ---
    async function loadUsers() {
        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + storedAdminData.username
                },
                body: JSON.stringify({
                    action: 'list'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Filtrar solo usuarios no administradores
                usersData = data.users.filter(user => !user.isAdmin);
                populateOperatorSelect();
            } else {
                console.error('Error al cargar usuarios:', data.message);
            }
        } catch (error) {
            console.error('Error de conexión al cargar usuarios:', error);
        }
    }
    
    // --- Función para cargar clientes ---
    async function loadClients() {
        try {
            const response = await fetch('/api/admin/clientes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + storedAdminData.username
                },
                body: JSON.stringify({
                    action: 'list'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                clientsData = data.clientes || [];
                populateClientSelect();
            } else {
                console.error('Error al cargar clientes:', data.message);
            }
        } catch (error) {
            console.error('Error de conexión al cargar clientes:', error);
        }
    }
    
    // --- Función para poblar el select de operadores ---
    function populateOperatorSelect() {
        const operatorSelect = document.getElementById('operador');
        // Limpiar opciones existentes excepto la primera
        operatorSelect.innerHTML = '<option value="">Seleccionar operador</option>';
        
        usersData.forEach(user => {
            const option = document.createElement('option');
            option.value = user.Nombre;
            option.textContent = `${user.Nombre} ${user.Apellido}`;
            operatorSelect.appendChild(option);
        });
    }
    
    // --- Función para poblar el select de clientes ---
    function populateClientSelect() {
        const clientSelect = document.getElementById('cliente');
        // Limpiar opciones existentes excepto la primera
        clientSelect.innerHTML = '<option value="">Seleccionar cliente</option>';
        
        clientsData.forEach(client => {
            const option = document.createElement('option');
            option.value = client.nombre_empresa;
            option.textContent = client.nombre_empresa;
            clientSelect.appendChild(option);
        });
    }
    
    // --- Función para cargar totes desde la base de datos ---
    async function loadTotes() {
        try {
            const response = await fetch('/api/admin/totes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + storedAdminData.username
                },
                body: JSON.stringify({
                    action: 'list'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                totesData = data.totes.map(tote => ({
                     id: tote.Id,
                     codigo: tote.Codigo,
                     estado: tote.Estado,
                     ubicacion: tote.Ubicacion,
                     cliente: tote.Cliente || '-',
                     operador: tote.Operador,
                     producto: tote.Producto || '-',
                     lote: tote.Lote || '-',
                     fEnvasado: tote.fEnvasado || '-',
                     fVencimiento: tote.fVencimiento || '-',
                     fDespacho: tote.fDespacho || '-',
                     alerta: tote.Alerta
                 }));
                 renderTable(totesData);
            } else {
                console.error('Error al cargar totes:', data.message);
                showMessage('Error al cargar los totes: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error de conexión al cargar totes:', error);
            showMessage('Error de conexión al servidor', 'error');
        }
    }

    // --- Función para mostrar mensajes ---
    function showMessage(message, type = 'info') {
        // Crear elemento de mensaje si no existe
        let messageContainer = document.getElementById('messageContainer');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'messageContainer';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 5px;
                color: white;
                font-weight: bold;
                z-index: 1000;
                max-width: 400px;
                word-wrap: break-word;
            `;
            document.body.appendChild(messageContainer);
        }
        
        // Establecer color según el tipo
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        
        messageContainer.style.backgroundColor = colors[type] || colors.info;
        messageContainer.textContent = message;
        messageContainer.style.display = 'block';
        
        // Ocultar mensaje después de 5 segundos
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }
    
    // --- Función para validar fechas en tiempo real ---
    function validateDates() {
        const fechaEnvasado = document.getElementById('fechaEnvasado').value;
        const fechaVencimiento = document.getElementById('fechaVencimiento').value;
        
        if (fechaEnvasado && fechaVencimiento) {
            const fechaEnv = new Date(fechaEnvasado);
            const fechaVenc = new Date(fechaVencimiento);
            
            if (fechaVenc <= fechaEnv) {
                document.getElementById('fechaVencimiento').setCustomValidity('La fecha de vencimiento debe ser posterior a la fecha de envasado');
            } else {
                document.getElementById('fechaVencimiento').setCustomValidity('');
            }
        }
        
        // Validar que fecha de envasado no sea futura
        if (fechaEnvasado) {
            const fechaEnv = new Date(fechaEnvasado);
            const hoy = new Date();
            hoy.setHours(23, 59, 59, 999);
            
            if (fechaEnv > hoy) {
                document.getElementById('fechaEnvasado').setCustomValidity('La fecha de envasado no puede ser futura');
            } else {
                document.getElementById('fechaEnvasado').setCustomValidity('');
            }
        }
    }
    
    // Variables globales
 let editingToteId = null;

 // --- Funciones del Modal ---
 async function openToteModal(toteData = null) {
     const modal = document.getElementById('toteModal');
     const modalTitle = document.getElementById('modalTitle');
     const form = document.getElementById('toteForm');
     
     // Cargar usuarios y clientes si no están cargados
     if (usersData.length === 0) {
         await loadUsers();
     }
     if (clientsData.length === 0) {
         await loadClients();
     }
     
     if (toteData) {
         // Modo edición
         editingToteId = toteData.id;
         modalTitle.textContent = 'Editar Tote';
         
         // Llenar el formulario con los datos existentes
         document.getElementById('codigo').value = toteData.codigo || '';
         document.getElementById('estado').value = toteData.estado || '';
         document.getElementById('ubicacion').value = toteData.ubicacion || '';
         document.getElementById('operador').value = toteData.operador || '';
         document.getElementById('cliente').value = toteData.cliente || '';
         document.getElementById('producto').value = toteData.producto || '';
         document.getElementById('lote').value = toteData.lote || '';
         
         // Convertir fechas del formato dd/MM/yyyy a yyyy-MM-dd para los inputs date
         if (toteData.fEnvasado && toteData.fEnvasado !== '-') {
             const fechaEnvasado = convertDateFormat(toteData.fEnvasado);
             document.getElementById('fechaEnvasado').value = fechaEnvasado;
         }
         if (toteData.fVencimiento && toteData.fVencimiento !== '-') {
             const fechaVencimiento = convertDateFormat(toteData.fVencimiento);
             document.getElementById('fechaVencimiento').value = fechaVencimiento;
         }
         if (toteData.fDespacho && toteData.fDespacho !== '-') {
             const fechaDespacho = convertDateFormat(toteData.fDespacho);
             document.getElementById('fechaDespacho').value = fechaDespacho;
         }
         
         document.getElementById('alerta').checked = toteData.alerta == 1;
     } else {
         // Modo creación
         editingToteId = null;
         modalTitle.textContent = 'Registrar Nuevo Tote';
         form.reset();
     }
     
     modal.style.display = 'block';
 }
 
 window.closeToteModal = function() {
     const modal = document.getElementById('toteModal');
     modal.style.display = 'none';
     editingToteId = null;
 }
 
 // Función para convertir fecha de dd/MM/yyyy a yyyy-MM-dd
 function convertDateFormat(dateStr) {
     if (!dateStr || dateStr === '-') return '';
     const parts = dateStr.split('/');
     if (parts.length === 3) {
         return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
     }
     return '';
 }
 
 // Función para convertir fecha de yyyy-MM-dd a dd/MM/yyyy
 function formatDateForDisplay(dateStr) {
     if (!dateStr) return null;
     const parts = dateStr.split('-');
     if (parts.length === 3) {
         return `${parts[2]}/${parts[1]}/${parts[0]}`;
     }
     return null;
 }
 
 // Manejar envío del formulario
 document.getElementById('toteForm').addEventListener('submit', async function(e) {
     e.preventDefault();
     
     const formData = new FormData(this);
     const toteData = {
         codigo: formData.get('codigo'),
         estado: formData.get('estado'),
         ubicacion: formData.get('ubicacion'),
         operador: formData.get('operador'),
         cliente: formData.get('cliente') || null,
         producto: formData.get('producto') || null,
         lote: formData.get('lote') || null,
         fechaEnvasado: formData.get('fechaEnvasado') || null,
         fechaVencimiento: formData.get('fechaVencimiento') || null,
         fechaDespacho: formData.get('fechaDespacho') || null,
         alerta: formData.get('alerta') ? 1 : 0
     };
     
     // Validaciones básicas
     if (!toteData.codigo || !toteData.estado || !toteData.ubicacion || !toteData.operador) {
         showMessage('Por favor complete todos los campos obligatorios', 'error');
         return;
     }
     
     // Validaciones de fechas según restricciones CHECK de la base de datos
     if (toteData.fechaEnvasado) {
         const fechaEnv = new Date(toteData.fechaEnvasado);
         const hoy = new Date();
         hoy.setHours(23, 59, 59, 999); // Fin del día actual
         
         if (fechaEnv > hoy) {
             showMessage('La fecha de envasado no puede ser futura', 'error');
             return;
         }
     }
     
     if (toteData.fechaVencimiento && toteData.fechaEnvasado) {
         const fechaVenc = new Date(toteData.fechaVencimiento);
         const fechaEnv = new Date(toteData.fechaEnvasado);
         
         if (fechaVenc <= fechaEnv) {
             showMessage('La fecha de vencimiento debe ser posterior a la fecha de envasado', 'error');
             return;
         }
     }
     
     // Validación de código (debe ser único, pero esto se valida en el servidor)
     if (toteData.codigo.length < 3) {
         showMessage('El código debe tener al menos 3 caracteres', 'error');
         return;
     }
     
     try {
         const action = editingToteId ? 'update' : 'create';
         if (editingToteId) {
             toteData.id = editingToteId;
         }
         
         const response = await fetch('/api/admin/totes', {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
                 'Authorization': 'Bearer admin-token'
             },
             body: JSON.stringify({
                 action: action,
                 toteData: toteData
             })
         });
         
         const data = await response.json();
         
         if (data.success) {
             showMessage(editingToteId ? 'Tote actualizado correctamente' : 'Tote creado correctamente', 'success');
             closeToteModal();
             loadTotes(); // Recargar la tabla
         } else {
             showMessage(data.message || 'Error al guardar el tote', 'error');
         }
     } catch (error) {
         console.error('Error al guardar tote:', error);
         showMessage('Error de conexión al guardar el tote', 'error');
     }
 });
 
 // Cargar datos al iniciar la página
 loadTotes();
 loadUsers();
 loadClients();

    // --- Event Listeners ---
    // Establecer fecha máxima para fecha de envasado (hoy)
    const today = new Date().toISOString().split('T')[0];
    const fechaEnvasadoInput = document.getElementById('fechaEnvasado');
    if (fechaEnvasadoInput) {
        fechaEnvasadoInput.setAttribute('max', today);
    }
    
    // Botón "Registrar Tote"
    const registerBtn = document.getElementById('registrarToteBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', () => openToteModal());
    }
    
    // Cerrar modal al hacer clic fuera de él
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('toteModal');
        if (event.target === modal) {
            closeToteModal();
        }
    });
    
    // Botón de cerrar modal
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeToteModal);
    }
    
    // Validación en tiempo real de fechas
    if (fechaEnvasadoInput) {
        fechaEnvasadoInput.addEventListener('change', validateDates);
    }
    const fechaVencimientoInput = document.getElementById('fechaVencimiento');
    if (fechaVencimientoInput) {
        fechaVencimientoInput.addEventListener('change', validateDates);
    }
     
     const tableBody = document.querySelector('.totes-table tbody');

    function renderTable(data) {
        tableBody.innerHTML = '';
        data.forEach(tote => {
            const row = document.createElement('tr');
            
            // Aplicar clase de alerta si es necesario
            if (tote.alerta) {
                row.classList.add('alert-row');
            }
            
            row.innerHTML = `
                <td>${tote.codigo}</td>
                <td><span class="status-badge status-${tote.estado.toLowerCase().replace(/\s+/g, '-')}">${tote.estado}</span></td>
                <td>${tote.ubicacion}</td>
                <td>${tote.cliente}</td>
                <td>${tote.operador}</td>
                <td>${tote.producto}</td>
                <td>${tote.lote}</td>
                <td>${tote.fEnvasado}</td>
                <td>${tote.fVencimiento}</td>
                <td>${tote.fDespacho}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" onclick="editTote(${tote.id})" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" onclick="deleteTote(${tote.id}, '${tote.codigo}')" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // Función para editar tote (global)
    window.editTote = function(toteId) {
        const tote = totesData.find(t => t.id === toteId);
        if (tote) {
            openToteModal(tote);
        }
    }
    
    // Función para eliminar tote (global)
    window.deleteTote = async function(toteId, codigo) {
        if (!confirm(`¿Está seguro de que desea eliminar el tote ${codigo}?`)) {
            return;
        }
        
        try {
            const response = await fetch('/api/admin/totes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer admin-token'
                },
                body: JSON.stringify({
                    action: 'delete',
                    toteData: { id: toteId }
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage('Tote eliminado correctamente', 'success');
                loadTotes(); // Recargar la tabla
            } else {
                showMessage(data.message || 'Error al eliminar el tote', 'error');
            }
        } catch (error) {
            console.error('Error al eliminar tote:', error);
            showMessage('Error de conexión al eliminar el tote', 'error');
        }
    }

    renderTable(totesData);
});