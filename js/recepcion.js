// Variables globales
let currentUser = null;
let currentTote = null;
let selectedRoute = null;
let recentScans = [];

// Verificar autenticación del operador
function checkOperadorAuth() {
    const storedUser = localStorage.getItem('loggedInAdmin') || sessionStorage.getItem('loggedInAdmin');
    
    if (!storedUser) {
        window.location.href = '../index.html';
        return null;
    }
    
    try {
        const userData = JSON.parse(storedUser);
        
        // Verificar expiración de sesión (8 horas)
        const loginTime = new Date(userData.loginTime);
        const now = new Date();
        const diffHours = (now - loginTime) / (1000 * 60 * 60);
        
        if (diffHours > 8) {
            localStorage.removeItem('loggedInAdmin');
            sessionStorage.removeItem('loggedInAdmin');
            window.location.href = '../index.html';
            return null;
        }
        
        // Verificar que sea operador o admin
        if (userData.rol !== 'Operador' && userData.rol !== 'Admin') {
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

// Escanear/verificar TAG
async function scanTag(tagCode) {
    try {
        const response = await fetch('/api/recepcion/scan-tag', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.username}`
            },
            body: JSON.stringify({ tagCode })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            currentTote = result.tote;
            showScanResult(true, 'TAG verificado correctamente', result.tote);
        } else {
            showScanResult(false, result.message || 'Error al verificar TAG');
        }
    } catch (error) {
        console.error('Error al escanear TAG:', error);
        showScanResult(false, 'Error de conexión al verificar TAG');
    }
}

// Mostrar resultado del escaneo
function showScanResult(success, message, toteData = null) {
    const resultDiv = document.getElementById('scanResult');
    const messageDiv = document.getElementById('resultMessage');
    const toteInfoDiv = document.getElementById('toteInfo');
    const routeSelectionDiv = document.getElementById('routeSelection');
    
    resultDiv.style.display = 'block';
    resultDiv.className = success ? 'scan-result' : 'scan-result error';
    messageDiv.innerHTML = `<i class="fas fa-${success ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    
    if (success && toteData) {
        // Mostrar información del tote
        document.getElementById('toteCodigo').textContent = toteData.Codigo || '-';
        document.getElementById('toteEstado').textContent = toteData.Estado || '-';
        document.getElementById('toteCliente').textContent = toteData.Cliente || '-';
        document.getElementById('toteOperador').textContent = toteData.Operador || '-';
        document.getElementById('toteUbicacion').textContent = toteData.Ubicacion || '-';
        document.getElementById('toteProducto').textContent = toteData.Producto || '-';
        
        toteInfoDiv.style.display = 'grid';
        routeSelectionDiv.style.display = 'block';
    } else {
        toteInfoDiv.style.display = 'none';
        routeSelectionDiv.style.display = 'none';
        currentTote = null;
    }
    
    // Reset route selection
    selectedRoute = null;
    document.querySelectorAll('.route-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.getElementById('confirmRouteBtn').disabled = true;
}

// Asignar ruta al tote
async function assignRoute(route) {
    if (!currentTote || !route) return;
    
    try {
        const response = await fetch('/api/recepcion/assign-route', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.username}`
            },
            body: JSON.stringify({
                toteId: currentTote.Id,
                route: route,
                tagCode: document.getElementById('tagInput').value
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showMessage('Ruta asignada correctamente', 'success');
            
            // Agregar a escaneos recientes
            addToRecentScans({
                time: new Date().toLocaleTimeString('es-CL'),
                tagCode: document.getElementById('tagInput').value,
                toteCode: currentTote.Codigo,
                route: getRouteDisplayName(route),
                status: 'Completado'
            });
            
            // Limpiar formulario
            clearForm();
        } else {
            showMessage(result.message || 'Error al asignar ruta', 'error');
        }
    } catch (error) {
        console.error('Error al asignar ruta:', error);
        showMessage('Error de conexión al asignar ruta', 'error');
    }
}

// Obtener nombre de visualización de la ruta
function getRouteDisplayName(route) {
    const routeNames = {
        'lavado': 'Área de Lavado',
        'almacenamiento': 'Almacenamiento',
        'mantenimiento': 'Mantenimiento',
        'despacho': 'Área de Despacho',
        'inspeccion': 'Inspección',
        'cuarentena': 'Cuarentena'
    };
    return routeNames[route] || route;
}

// Agregar a escaneos recientes
function addToRecentScans(scanData) {
    recentScans.unshift(scanData);
    if (recentScans.length > 10) {
        recentScans = recentScans.slice(0, 10);
    }
    renderRecentScans();
}

// Renderizar escaneos recientes
function renderRecentScans() {
    const tbody = document.getElementById('recentScansTable');
    tbody.innerHTML = '';
    
    if (recentScans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No hay escaneos recientes</td></tr>';
        return;
    }
    
    recentScans.forEach(scan => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${scan.time}</td>
            <td>${scan.tagCode}</td>
            <td>${scan.toteCode}</td>
            <td>${scan.route}</td>
            <td><span class="status-badge status-${scan.status.toLowerCase()}">${scan.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Limpiar formulario
function clearForm() {
    document.getElementById('tagInput').value = '';
    document.getElementById('scanResult').style.display = 'none';
    currentTote = null;
    selectedRoute = null;
    document.getElementById('tagInput').focus();
}

// Mostrar mensaje
function showMessage(message, type) {
    // Crear elemento de mensaje si no existe
    let messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'messageContainer';
        messageContainer.className = 'message';
        document.querySelector('.content-card').insertBefore(messageContainer, document.querySelector('.scanner-container'));
    }
    
    messageContainer.textContent = message;
    messageContainer.className = `message ${type}`;
    messageContainer.style.display = 'block';
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        messageContainer.style.display = 'none';
    }, CONFIG.TIMING.NOTIFICATION_TIMEOUT);
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
    
    // Configurar eventos
    const tagInput = document.getElementById('tagInput');
    const scanBtn = document.getElementById('scanBtn');
    const confirmRouteBtn = document.getElementById('confirmRouteBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    // Evento para escanear al presionar Enter
    tagInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const tagCode = tagInput.value.trim();
            if (tagCode) {
                scanTag(tagCode);
            }
        }
    });
    
    // Evento para botón de escanear
    scanBtn.addEventListener('click', function() {
        const tagCode = tagInput.value.trim();
        if (tagCode) {
            scanTag(tagCode);
        } else {
            showMessage('Por favor ingrese un código de TAG', 'error');
        }
    });
    
    // Eventos para selección de ruta
    document.querySelectorAll('.route-option').forEach(option => {
        option.addEventListener('click', function() {
            // Remover selección anterior
            document.querySelectorAll('.route-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Seleccionar nueva ruta
            this.classList.add('selected');
            selectedRoute = this.dataset.route;
            confirmRouteBtn.disabled = false;
        });
    });
    
    // Evento para confirmar ruta
    confirmRouteBtn.addEventListener('click', function() {
        if (selectedRoute) {
            assignRoute(selectedRoute);
        }
    });
    
    // Evento para cancelar
    cancelBtn.addEventListener('click', function() {
        clearForm();
    });
    
    // Configurar botón de logout
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('¿Está seguro que desea cerrar sesión?')) {
            handleLogout();
        }
    });
    
    // Renderizar escaneos recientes
    renderRecentScans();
    
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