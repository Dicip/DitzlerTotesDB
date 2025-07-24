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

    // Mobile menu functionality
    initializeMobileMenu();

    function initializeMobileMenu() {
        // Create mobile menu toggle button
        const mobileToggle = document.createElement('button');
        mobileToggle.className = 'mobile-menu-toggle';
        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
        mobileToggle.setAttribute('aria-label', 'Toggle mobile menu');
        
        // Create sidebar overlay
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        
        // Add elements to DOM
        document.body.appendChild(mobileToggle);
        document.body.appendChild(overlay);
        
        const sidebar = document.querySelector('.sidebar');
        
        // Toggle sidebar function
        function toggleSidebar() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
            
            // Update button icon
            const icon = mobileToggle.querySelector('i');
            icon.className = sidebar.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
        }
        
        // Close sidebar function
        function closeSidebar() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            
            // Reset button icon
            const icon = mobileToggle.querySelector('i');
            icon.className = 'fas fa-bars';
        }
        
        // Event listeners
        mobileToggle.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', closeSidebar);
        
        // Close sidebar when clicking on navigation links (mobile)
        const navLinks = sidebar.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
            });
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                closeSidebar();
            }
        });
        
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                closeSidebar();
            }
        });
    }

    // --- Variables globales ---
    let totesData = [];
    const storedAdminData = JSON.parse(storedAdmin);
    
    // --- Función para cargar operadores para el modal ---
    async function loadOperatorsForModal() {
        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + storedAdminData.username
                },
                body: JSON.stringify({ action: 'list' })
            });
            
            const data = await response.json();
            
            if (data.success) {
                const operatorSelect = document.getElementById('operador');
                operatorSelect.innerHTML = '<option value="">Seleccionar operador</option>';
                
                // Filtrar solo usuarios no administradores
                const operators = data.users.filter(user => !user.isAdmin);
                operators.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.Nombre;
                    option.textContent = `${user.Nombre} ${user.Apellido}`;
                    operatorSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error al cargar operadores:', error);
        }
    }
    
    // --- Función para cargar clientes para el modal ---
    async function loadClientsForModal() {
        try {
            const response = await fetch('/api/admin/clientes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + storedAdminData.username
                },
                body: JSON.stringify({ action: 'list' })
            });
            
            const data = await response.json();
            
            if (data.success) {
                const clientSelect = document.getElementById('cliente');
                clientSelect.innerHTML = '<option value="">Seleccionar cliente</option>';
                
                data.clientes.forEach(client => {
                    const option = document.createElement('option');
                    option.value = client.nombre_empresa;
                    option.textContent = client.nombre_empresa;
                    clientSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error al cargar clientes:', error);
        }
    }
    
    // --- Función para cargar totes desde la base de datos ---
    async function loadTotes() {
        try {
            // Verificar que tenemos los datos de autenticación
            if (!storedAdminData || !storedAdminData.username) {
                console.error('Datos de autenticación no válidos:', storedAdminData);
                showMessage('Error de autenticación. Por favor, inicie sesión nuevamente.', 'error');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 2000);
                return;
            }
            
            console.log('Cargando totes con usuario:', storedAdminData.username);
            
            const response = await fetch('/api/admin/totes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + storedAdminData.username
                },
                body: JSON.stringify({ action: 'list' })
            });
            
            console.log('Respuesta del servidor - Status:', response.status);
            console.log('Respuesta del servidor - OK:', response.ok);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error HTTP:', response.status, errorText);
                showMessage(`Error del servidor (${response.status}): ${errorText}`, 'error');
                return;
            }
            
            const data = await response.json();
            console.log('Datos recibidos:', data);
            
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
                 
                 console.log('Totes procesados:', totesData.length);
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
     
     // Cargar operadores y clientes dinámicamente
     await loadOperatorsForModal();
     await loadClientsForModal();
     
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
         
         document.getElementById('alerta').value = toteData.alerta || '';
        document.getElementById('observaciones').value = toteData.observaciones || '';
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
         alerta: !formData.get('alerta') || formData.get('alerta').trim() === '' ? null : formData.get('alerta').trim(),
        observaciones: formData.get('observaciones') || null
     };
     
     // Logs de depuración para verificar los datos
      console.log('Datos del formulario capturados:');
      console.log('- Código:', toteData.codigo);
      console.log('- Estado:', toteData.estado);
      console.log('- Ubicación:', toteData.ubicacion);
      console.log('- Operador:', toteData.operador);
      console.log('- Cliente:', toteData.cliente);
      console.log('- Producto:', toteData.producto);
      console.log('- Lote:', toteData.lote);
      console.log('- Fecha Envasado:', toteData.fechaEnvasado);
      console.log('- Fecha Vencimiento:', toteData.fechaVencimiento);
      console.log('- Fecha Despacho:', toteData.fechaDespacho);
      console.log('- Alerta:', toteData.alerta);
      console.log('- Observaciones:', toteData.observaciones);
      console.log('- Tipo de alerta:', typeof toteData.alerta);
      console.log('- Valor raw de alerta desde formData:', formData.get('alerta'));
      console.log('- Tipo de valor raw:', typeof formData.get('alerta'));
     
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
         
         const requestBody = {
             action: action,
             toteData: toteData
         };
         
         console.log('Datos a enviar:', requestBody);
         console.log('JSON a enviar:', JSON.stringify(requestBody));
         
         const response = await fetch('/api/admin/totes', {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
                 'Authorization': 'Bearer ' + storedAdminData.username
             },
             body: JSON.stringify(requestBody)
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
 
 // --- Función para verificar totes próximos a vencer ---
    function checkExpiringTotes() {
        if (!totesData || totesData.length === 0) return;
        
        const today = new Date();
        const warningDays = 7; // Alertar 7 días antes del vencimiento
        const criticalDays = 3; // Crítico 3 días antes
        
        let expiringTotes = [];
        let expiredTotes = [];
        let criticalTotes = [];
        
        totesData.forEach(tote => {
            if (tote.fVencimiento && tote.fVencimiento !== '-') {
                // Convertir fecha de formato dd/MM/yyyy a Date
                const dateParts = tote.fVencimiento.split('/');
                const expiryDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
                
                const timeDiff = expiryDate.getTime() - today.getTime();
                const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                
                if (daysDiff < 0) {
                    // Ya vencido
                    expiredTotes.push({ ...tote, daysDiff });
                } else if (daysDiff <= criticalDays) {
                    // Crítico (3 días o menos)
                    criticalTotes.push({ ...tote, daysDiff });
                } else if (daysDiff <= warningDays) {
                    // Advertencia (7 días o menos)
                    expiringTotes.push({ ...tote, daysDiff });
                }
            }
        });
        
        // Mostrar notificaciones
        if (expiredTotes.length > 0) {
            const message = `⚠️ ${expiredTotes.length} tote(s) ya vencido(s): ${expiredTotes.map(t => t.codigo).join(', ')}`;
            UTILS.showNotification(message, 'error', 10000);
        }
        
        if (criticalTotes.length > 0) {
            const message = `🔴 ${criticalTotes.length} tote(s) vence(n) en ${criticalTotes[0].daysDiff} día(s): ${criticalTotes.map(t => t.codigo).join(', ')}`;
            UTILS.showNotification(message, 'warning', 8000);
        }
        
        if (expiringTotes.length > 0) {
            const message = `🟡 ${expiringTotes.length} tote(s) próximo(s) a vencer en 7 días: ${expiringTotes.map(t => t.codigo).join(', ')}`;
            UTILS.showNotification(message, 'info', 6000);
        }
        
        // Actualizar indicadores visuales en la tabla
        updateTableExpiryIndicators(expiredTotes, criticalTotes, expiringTotes);
    }
    
    // --- Función para actualizar indicadores visuales en la tabla ---
    function updateTableExpiryIndicators(expired, critical, expiring) {
        const tableRows = document.querySelectorAll('.system-table tbody tr');
        
        tableRows.forEach(row => {
            const codigoCell = row.cells[0];
            if (!codigoCell) return;
            
            const codigo = codigoCell.textContent.trim();
            
            // Remover clases anteriores
            row.classList.remove('tote-expired', 'tote-critical', 'tote-expiring');
            
            // Agregar clase según estado de vencimiento
            if (expired.some(t => t.codigo === codigo)) {
                row.classList.add('tote-expired');
            } else if (critical.some(t => t.codigo === codigo)) {
                row.classList.add('tote-critical');
            } else if (expiring.some(t => t.codigo === codigo)) {
                row.classList.add('tote-expiring');
            }
        });
    }
    
    // --- Función para verificar vencimientos periódicamente ---
    function startExpiryMonitoring() {
        // Verificar inmediatamente
        setTimeout(() => {
            checkExpiringTotes();
        }, 2000); // Esperar 2 segundos para que carguen los datos
        
        // Verificar cada 5 minutos
        setInterval(() => {
            checkExpiringTotes();
        }, 5 * 60 * 1000);
    }
    
    // Cargar datos al iniciar la página
    loadTotes();
    
    // Iniciar monitoreo de vencimientos
    startExpiryMonitoring();

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
     
    function renderTable(data) {
        const tableBody = document.querySelector('.system-table tbody');
        console.log('renderTable llamada con:', data.length, 'totes');
        console.log('tableBody elemento:', tableBody);
        
        if (!tableBody) {
            console.error('No se encontró el elemento tableBody');
            return;
        }
        
        tableBody.innerHTML = '';
        
        if (!data || data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="11" class="text-center">No hay totes para mostrar</td></tr>';
            return;
        }
        
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
        
        // Verificar vencimientos después de renderizar la tabla
        setTimeout(() => {
            checkExpiringTotes();
        }, 100);
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
            const requestBody = {
             action: 'delete',
             toteData: { id: toteId }
         };
         
         console.log('Datos de eliminación a enviar:', requestBody);
         console.log('JSON de eliminación a enviar:', JSON.stringify(requestBody));
         
         const response = await fetch('/api/admin/totes', {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
                 'Authorization': 'Bearer ' + storedAdminData.username
             },
             body: JSON.stringify(requestBody)
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



    // Cargar totes al inicializar la página
    loadTotes();
});