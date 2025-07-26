// Utilidades comunes del sistema
// Este archivo centraliza funciones que se repiten en múltiples archivos

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

// Mostrar mensaje de notificación
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
    }, CONFIG.TIMING.NOTIFICATION_TIMEOUT || 5000);
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
}

// Manejar cierre de sesión
function handleLogout() {
    localStorage.removeItem('loggedInAdmin');
    sessionStorage.removeItem('loggedInAdmin');
    window.location.href = '../index.html';
}

// Limpiar formulario
function clearForm() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => form.reset());
    
    // Limpiar elementos específicos si existen
    const elementsToReset = ['tagInput', 'scanResult'];
    elementsToReset.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === 'INPUT') {
                element.value = '';
            } else {
                element.style.display = 'none';
            }
        }
    });
}

// Inicializar menú móvil
function initializeMobileMenu() {
    // Crear botón de toggle del menú móvil
    const mobileToggle = document.createElement('button');
    mobileToggle.className = 'mobile-menu-toggle';
    mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
    mobileToggle.setAttribute('aria-label', 'Toggle mobile menu');
    
    // Crear overlay de la barra lateral
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    
    // Agregar elementos al DOM
    document.body.appendChild(mobileToggle);
    document.body.appendChild(overlay);
    
    const sidebar = document.querySelector('.sidebar');
    
    // Función para alternar la barra lateral
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
        
        // Actualizar icono del botón
        const icon = mobileToggle.querySelector('i');
        icon.className = sidebar.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
    }
    
    // Función para cerrar la barra lateral
    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Resetear icono del botón
        const icon = mobileToggle.querySelector('i');
        icon.className = 'fas fa-bars';
    }
    
    // Event listeners
    mobileToggle.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', closeSidebar);
    
    // Cerrar barra lateral al hacer clic en enlaces de navegación (móvil)
    const navLinks = sidebar.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });
    
    // Manejar redimensionamiento de ventana
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
    
    // Manejar tecla escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
}

// Mostrar error (para compatibilidad con script.js)
function showError(message) {
    showMessage(message, 'error');
}

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
    window.checkOperadorAuth = checkOperadorAuth;
    window.showMessage = showMessage;
    window.formatDate = formatDate;
    window.handleLogout = handleLogout;
    window.clearForm = clearForm;
    window.initializeMobileMenu = initializeMobileMenu;
    window.showError = showError;
}