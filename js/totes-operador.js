// Variables globales
let currentUser = null;
let totesData = [];

// Verificar autenticación del operador
function checkOperadorAuth() {
    const storedUser = localStorage.getItem('loggedInAdmin') || sessionStorage.getItem('loggedInAdmin');
    
    if (!storedUser) {
        window.location.href = '../index.html';
        return null;
    }
    
    try {
        const userData = JSON.parse(storedUser);
        const currentTime = new Date().getTime();
        const sessionTime = userData.timestamp;
        
        // Verificar si la sesión no ha expirado (8 horas)
        if (currentTime - sessionTime > 8 * 60 * 60 * 1000) {
            localStorage.removeItem('loggedInAdmin');
            sessionStorage.removeItem('loggedInAdmin');
            window.location.href = '../index.html';
            return null;
        }
        
        // Verificar que sea operador o admin
        if (userData.role !== 'Operador' && userData.role !== 'Admin') {
            alert('Acceso denegado. Esta página es solo para operadores.');
            window.location.href = '../index.html';
            return null;
        }
        
        return userData;
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        window.location.href = '../index.html';
        return null;
    }
}

// Cargar totes del operador
async function loadOperadorTotes() {
    try {
        // Usar solo el nombre del operador para el filtrado (coincide con el campo Operador en BD)
        const operadorName = currentUser.username;
        const response = await fetch('/api/operador/totes', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${operadorName}`
            }
        });
        
        if (response.ok) {
            totesData = await response.json();
            renderTotesTable();
        } else {
            console.error('Error al cargar totes');
            showMessage('Error al cargar los totes', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión', 'error');
    }
}

// Renderizar tabla de totes
function renderTotesTable() {
    const tbody = document.getElementById('totesTableBody');
    tbody.innerHTML = '';
    
    if (totesData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">No hay totes asignados</td></tr>';
        return;
    }
    
    totesData.forEach(tote => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${tote.Codigo}</td>
            <td><span class="status-badge status-${tote.Estado.toLowerCase().replace(' ', '-')}">${tote.Estado}</span></td>
            <td>${tote.Ubicacion || '-'}</td>
            <td>${tote.ClienteNombre || '-'}</td>
            <td>${tote.Producto || '-'}</td>
            <td>${tote.Lote || '-'}</td>
            <td>${tote.FechaEnvasado ? formatDate(tote.FechaEnvasado) : '-'}</td>
            <td>${tote.FechaVencimiento ? formatDate(tote.FechaVencimiento) : '-'}</td>
            <td>${tote.FechaDespacho ? formatDate(tote.FechaDespacho) : '-'}</td>
            <td>
                <button class="btn-small btn-primary" onclick="openUpdateModal(${tote.Id})">
                    <i class="fas fa-edit"></i> Actualizar
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Abrir modal de actualización
function openUpdateModal(toteId) {
    const tote = totesData.find(t => t.Id === toteId);
    if (!tote) return;
    
    document.getElementById('toteId').value = tote.Id;
    document.getElementById('codigo').value = tote.Codigo;
    document.getElementById('estadoActual').value = tote.Estado;
    document.getElementById('ubicacion').value = tote.Ubicacion || '';
    document.getElementById('nuevoEstado').value = '';
    document.getElementById('observaciones').value = '';
    
    document.getElementById('updateToteModal').style.display = 'block';
}

// Cerrar modal de actualización
function closeUpdateModal() {
    document.getElementById('updateToteModal').style.display = 'none';
    document.getElementById('updateToteForm').reset();
}

// Actualizar estado del tote
async function updateToteStatus(formData) {
    try {
        // Usar solo el nombre del operador para autorización (coincide con el campo Operador en BD)
        const operadorName = currentUser.username;
        const response = await fetch('/api/operador/totes/update-status', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${operadorName}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showMessage('Estado del tote actualizado correctamente', 'success');
            closeUpdateModal();
            loadOperadorTotes(); // Recargar la tabla
        } else {
            const error = await response.json();
            showMessage(error.message || 'Error al actualizar el tote', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión', 'error');
    }
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
}

// Mostrar mensaje
function showMessage(message, type) {
    // Crear elemento de mensaje si no existe
    let messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'messageContainer';
        messageContainer.className = 'message';
        document.querySelector('.content-card').insertBefore(messageContainer, document.querySelector('.system-table-container'));
    }
    
    messageContainer.textContent = message;
    messageContainer.className = `message ${type}`;
    messageContainer.style.display = 'block';
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        messageContainer.style.display = 'none';
    }, 5000);
}

// Manejar cierre de sesión
function handleLogout() {
    localStorage.removeItem('loggedInAdmin');
    sessionStorage.removeItem('loggedInAdmin');
    window.location.href = '../index.html';
}

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    currentUser = checkOperadorAuth();
    if (!currentUser) return;
    
    // Cargar totes
    loadOperadorTotes();
    
    // Configurar formulario de actualización
    document.getElementById('updateToteForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            toteId: document.getElementById('toteId').value,
            nuevoEstado: document.getElementById('nuevoEstado').value,
            ubicacion: document.getElementById('ubicacion').value,
            observaciones: document.getElementById('observaciones').value
        };
        
        updateToteStatus(formData);
    });
    
    // Configurar botón de logout
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('¿Está seguro que desea cerrar sesión?')) {
            handleLogout();
        }
    });
    
    // Cerrar modal al hacer clic fuera de él
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('updateToteModal');
        if (event.target === modal) {
            closeUpdateModal();
        }
    });
    
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
});