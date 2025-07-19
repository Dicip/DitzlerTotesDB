// JavaScript para la página de Registro de Eventos
// DitzlerTotes - Sistema de Auditoría

let currentPage = 1;
let currentFilters = {};
const eventsPerPage = 20;

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    cargarEstadisticas();
    cargarEventos();
    
    // Configurar fecha por defecto (últimos 7 días)
    const ahora = new Date();
    const hace7Dias = new Date(ahora.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    document.getElementById('fechaInicio').value = formatDateForInput(hace7Dias);
    document.getElementById('fechaFin').value = formatDateForInput(ahora);
    
    // Configurar logout desde la barra lateral
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Mobile menu functionality
    initializeMobileMenu();
});

// Función de logout
function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        // Limpiar cualquier dato de sesión local
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirigir al login
        window.location.href = '../index.html';
    }
}

// Formatear fecha para input datetime-local
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Cargar estadísticas de eventos
async function cargarEstadisticas() {
    try {
        const response = await fetch('/api/eventos/estadisticas');
        const data = await response.json();
        
        if (data.success) {
            const stats = data.estadisticas.generales;
            const totalEventos = document.getElementById('totalEventos');
            const eventosExitosos = document.getElementById('eventosExitosos');
            const eventosFallidos = document.getElementById('eventosFallidos');
            const eventosUltimas24h = document.getElementById('eventosUltimas24h');
            
            if (totalEventos) totalEventos.textContent = stats.TotalEventos.toLocaleString();
            if (eventosExitosos) eventosExitosos.textContent = stats.EventosExitosos.toLocaleString();
            if (eventosFallidos) eventosFallidos.textContent = stats.EventosFallidos.toLocaleString();
            if (eventosUltimas24h) eventosUltimas24h.textContent = stats.EventosUltimas24h.toLocaleString();
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        mostrarError('Error al cargar las estadísticas de eventos');
    }
}

// Cargar eventos con filtros y paginación
async function cargarEventos(page = 1) {
    try {
        console.log('Iniciando carga de eventos...');
        mostrarLoading(true);
        currentPage = page;
        
        // Construir parámetros de consulta
        const params = new URLSearchParams({
            page: page,
            limit: eventsPerPage,
            ...currentFilters
        });
        
        console.log('URL de petición:', `/api/eventos?${params}`);
        const response = await fetch(`/api/eventos?${params}`);
        console.log('Respuesta del servidor:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        if (data.success) {
            console.log('Eventos encontrados:', data.eventos.length);
            mostrarEventos(data.eventos);
            mostrarPaginacion(data.pagination);
        } else {
            console.error('Error en respuesta:', data.message);
            mostrarError(data.message || 'Error al cargar eventos');
        }
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        mostrarError('Error al cargar los eventos: ' + error.message);
    } finally {
        mostrarLoading(false);
    }
}

// Mostrar/ocultar loading
function mostrarLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    const container = document.getElementById('tablaEventos');
    const noEventos = document.getElementById('noEventos');
    
    if (show) {
        spinner.style.display = 'block';
        container.innerHTML = '';
        noEventos.classList.add('d-none');
    } else {
        spinner.style.display = 'none';
    }
}

// Mostrar lista de eventos
function mostrarEventos(eventos) {
    const container = document.getElementById('tablaEventos');
    const noEventos = document.getElementById('noEventos');
    const contadorEventos = document.getElementById('contadorEventos');
    
    // Contador eliminado para evitar errores
    
    if (eventos.length === 0) {
        container.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron eventos</td></tr>';
        noEventos.classList.remove('d-none');
        return;
    }
    
    noEventos.classList.add('d-none');
    
    const html = eventos.map(evento => {
        const statusBadge = evento.Exitoso ? 
            '<span class="status-badge success">Exitoso</span>' : 
            '<span class="status-badge error">Fallido</span>';
        
        return `
            <tr onclick="mostrarDetalleEvento(${evento.Id})" style="cursor: pointer;">
                <td>${formatearFecha(evento.FechaEvento)}</td>
                <td><span class="type-badge">${evento.TipoEvento}</span></td>
                <td>${evento.Modulo}</td>
                <td>${evento.UsuarioNombre || 'N/A'}</td>
                <td>${evento.Descripcion}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-modern info" onclick="event.stopPropagation(); mostrarDetalleEvento(${evento.Id})" title="Ver detalle">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    if (container) {
        container.innerHTML = html;
    }
}

// Obtener clase CSS para la tarjeta del evento
function getEventCardClass(evento) {
    if (!evento.Exitoso) return 'error';
    
    switch (evento.TipoEvento) {
        case 'LOGIN':
        case 'CREATE':
        case 'UPDATE':
            return 'success';
        case 'DELETE':
        case 'LOGOUT':
            return 'warning';
        case 'ERROR':
            return 'error';
        case 'VIEW':
        case 'SISTEMA':
            return 'info';
        default:
            return '';
    }
}

// Obtener icono para el tipo de evento
function getEventIcon(tipoEvento) {
    const iconos = {
        'LOGIN': 'fas fa-sign-in-alt text-success',
        'LOGOUT': 'fas fa-sign-out-alt text-warning',
        'CREATE': 'fas fa-plus-circle text-success',
        'UPDATE': 'fas fa-edit text-primary',
        'DELETE': 'fas fa-trash text-danger',
        'VIEW': 'fas fa-eye text-info',
        'ERROR': 'fas fa-exclamation-triangle text-danger',
        'SISTEMA': 'fas fa-cog text-secondary'
    };
    
    return iconos[tipoEvento] || 'fas fa-circle text-muted';
}

// Obtener clase de badge para el tipo de evento
function getEventBadgeClass(tipoEvento) {
    const clases = {
        'LOGIN': 'bg-success',
        'LOGOUT': 'bg-warning',
        'CREATE': 'bg-success',
        'UPDATE': 'bg-primary',
        'DELETE': 'bg-danger',
        'VIEW': 'bg-info',
        'ERROR': 'bg-danger',
        'SISTEMA': 'bg-secondary'
    };
    
    return clases[tipoEvento] || 'bg-secondary';
}

// Formatear fecha para mostrar
function formatearFecha(fechaString) {
    const fecha = new Date(fechaString);
    return fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Mostrar paginación
function mostrarPaginacion(pagination) {
    const container = document.getElementById('paginationContainer');
    const infoContainer = document.getElementById('paginationInfo');
    
    // Actualizar información de paginación
    const inicio = ((pagination.page - 1) * eventsPerPage) + 1;
    const fin = Math.min(pagination.page * eventsPerPage, pagination.total);
    if (infoContainer) {
        infoContainer.textContent = `Mostrando ${inicio}-${fin} de ${pagination.total} eventos`;
    }
    
    if (pagination.totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Botón anterior
    if (pagination.page > 1) {
        html += `<a class="pagination-btn" href="#" onclick="cargarEventos(${pagination.page - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>`;
    } else {
        html += `<span class="pagination-btn disabled">
                    <i class="fas fa-chevron-left"></i>
                </span>`;
    }
    
    // Páginas
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.totalPages, pagination.page + 2);
    
    if (startPage > 1) {
        html += `<a class="pagination-btn" href="#" onclick="cargarEventos(1)">1</a>`;
        if (startPage > 2) {
            html += '<span class="pagination-btn disabled">...</span>';
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === pagination.page ? 'active' : '';
        html += `<a class="pagination-btn ${activeClass}" href="#" onclick="cargarEventos(${i})">${i}</a>`;
    }
    
    if (endPage < pagination.totalPages) {
        if (endPage < pagination.totalPages - 1) {
            html += '<span class="pagination-btn disabled">...</span>';
        }
        html += `<a class="pagination-btn" href="#" onclick="cargarEventos(${pagination.totalPages})">${pagination.totalPages}</a>`;
    }
    
    // Botón siguiente
    if (pagination.page < pagination.totalPages) {
        html += `<a class="pagination-btn" href="#" onclick="cargarEventos(${pagination.page + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>`;
    } else {
        html += `<span class="pagination-btn disabled">
                    <i class="fas fa-chevron-right"></i>
                </span>`;
    }
    
    if (container) {
        container.innerHTML = html;
    }
}

// Aplicar filtros
function aplicarFiltros() {
    currentFilters = {};
    
    const tipoEvento = document.getElementById('filtroTipo').value;
    const modulo = document.getElementById('filtroModulo').value;
    const exitoso = document.getElementById('filtroExitoso').value;
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    
    if (tipoEvento) currentFilters.tipoEvento = tipoEvento;
    if (modulo) currentFilters.modulo = modulo;
    if (exitoso) currentFilters.exitoso = exitoso;
    if (fechaInicio) currentFilters.fechaInicio = fechaInicio;
    if (fechaFin) currentFilters.fechaFin = fechaFin;
    
    cargarEventos(1);
}

// Limpiar filtros
function limpiarFiltros() {
    document.getElementById('filtroTipo').value = '';
    document.getElementById('filtroModulo').value = '';
    document.getElementById('filtroExitoso').value = '';
    document.getElementById('fechaInicio').value = '';
    document.getElementById('fechaFin').value = '';
    
    currentFilters = {};
    cargarEventos(1);
}

// Mostrar detalle de evento
async function mostrarDetalleEvento(eventoId) {
    try {
        const response = await fetch(`/api/eventos/${eventoId}`);
        const data = await response.json();
        
        if (data.success) {
            const evento = data.evento;
            
            const html = `
                <div class="detail-section">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                        <div>
                            <h6><i class="fas fa-info-circle" style="margin-right: 8px;"></i>Información General</h6>
                            <table class="detail-table">
                                <tr><td>ID:</td><td>${evento.Id}</td></tr>
                                <tr><td>Tipo:</td><td><span class="detail-badge ${getEventBadgeClass(evento.TipoEvento)}">${evento.TipoEvento}</span></td></tr>
                                <tr><td>Módulo:</td><td><span class="detail-badge secondary">${evento.Modulo}</span></td></tr>
                                <tr><td>Estado:</td><td>${evento.Exitoso ? '<span class="detail-badge success">Exitoso</span>' : '<span class="detail-badge danger">Fallido</span>'}</td></tr>
                                <tr><td>Fecha:</td><td>${formatearFecha(evento.FechaEvento)}</td></tr>
                            </table>
                        </div>
                        <div>
                            <h6><i class="fas fa-user" style="margin-right: 8px;"></i>Usuario</h6>
                            <table class="detail-table">
                                <tr><td>ID:</td><td>${evento.UsuarioId || 'N/A'}</td></tr>
                                <tr><td>Nombre:</td><td>${evento.UsuarioNombre}</td></tr>
                                <tr><td>Email:</td><td>${evento.UsuarioEmail || 'N/A'}</td></tr>
                                <tr><td>Rol:</td><td>${evento.UsuarioRol}</td></tr>
                                <tr><td>IP:</td><td>${evento.DireccionIP || 'N/A'}</td></tr>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h6><i class="fas fa-file-alt" style="margin-right: 8px;"></i>Descripción</h6>
                    <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 12px;">${evento.Descripcion}</div>
                </div>
                
                ${evento.ObjetoId ? `
                <div class="detail-section">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                        <div>
                            <h6><i class="fas fa-tag" style="margin-right: 8px;"></i>Objeto Afectado</h6>
                            <table class="detail-table">
                                <tr><td>ID:</td><td>${evento.ObjetoId}</td></tr>
                                <tr><td>Tipo:</td><td>${evento.ObjetoTipo || 'N/A'}</td></tr>
                            </table>
                        </div>
                        <div>
                            <h6><i class="fas fa-globe" style="margin-right: 8px;"></i>Información Técnica</h6>
                            <table class="detail-table">
                                <tr><td>Sesión:</td><td>${evento.Sesion || 'N/A'}</td></tr>
                                <tr><td>User Agent:</td><td style="word-break: break-all; font-size: 11px;">${evento.UserAgent || 'N/A'}</td></tr>
                            </table>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                ${!evento.Exitoso && evento.MensajeError ? `
                <div class="detail-section">
                    <h6><i class="fas fa-exclamation-triangle" style="margin-right: 8px; color: #dc3545;"></i>Error</h6>
                    <div class="alert alert-danger">${evento.MensajeError}</div>
                </div>
                ` : ''}
                
                ${evento.ValoresAnteriores ? `
                <div class="detail-section">
                    <h6><i class="fas fa-history" style="margin-right: 8px;"></i>Valores Anteriores</h6>
                    <div class="json-viewer">${typeof evento.ValoresAnteriores === 'object' ? JSON.stringify(evento.ValoresAnteriores, null, 2) : evento.ValoresAnteriores}</div>
                </div>
                ` : ''}
                
                ${evento.ValoresNuevos ? `
                <div class="detail-section">
                    <h6><i class="fas fa-plus" style="margin-right: 8px;"></i>Valores Nuevos</h6>
                    <div class="json-viewer">${typeof evento.ValoresNuevos === 'object' ? JSON.stringify(evento.ValoresNuevos, null, 2) : evento.ValoresNuevos}</div>
                </div>
                ` : ''}
            `;
            
            const detailContent = document.getElementById('eventoDetailContent');
            if (detailContent) {
                detailContent.innerHTML = html;
            }
            abrirModal();
        } else {
            mostrarError(data.message || 'Error al cargar el detalle del evento');
        }
    } catch (error) {
        console.error('Error al cargar detalle del evento:', error);
        mostrarError('Error al cargar el detalle del evento');
    }
}

// Abrir modal personalizado
function abrirModal() {
    const modal = document.getElementById('eventoDetailModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Cerrar modal personalizado
function cerrarModal() {
    const modal = document.getElementById('eventoDetailModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Cerrar modal al hacer clic fuera del contenido
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('eventoDetailModal');
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            cerrarModal();
        }
    });
    
    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            cerrarModal();
        }
    });
});

// Mostrar mensaje de error
function mostrarError(mensaje) {
    // Crear toast de error simple sin Bootstrap
    const toastHtml = `
        <div class="custom-toast error" style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        ">
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${mensaje}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    margin-left: auto;
                    font-size: 16px;
                ">&times;</button>
            </div>
        </div>
    `;
    
    // Agregar toast al DOM
    document.body.insertAdjacentHTML('beforeend', toastHtml);
    
    // Auto-remover después de 5 segundos
    const toastElement = document.body.lastElementChild;
    setTimeout(() => {
        if (toastElement && toastElement.parentNode) {
            toastElement.remove();
        }
    }, 5000);
}

// Función de logout
function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        window.location.href = '../index.html';
    }
}

// Mobile menu functionality
function initializeMobileMenu() {
    // Create mobile menu toggle button
    const mobileToggle = document.createElement('button');
    mobileToggle.className = 'mobile-menu-toggle';
    mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
    mobileToggle.setAttribute('aria-label', 'Toggle mobile menu');
    
    // Insert the button at the beginning of the body
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        document.body.appendChild(mobileToggle);
    }
    
    // Toggle sidebar function
    function toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        const icon = mobileToggle.querySelector('i');
        
        if (sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        } else {
            sidebar.classList.add('active');
            if (overlay) overlay.classList.add('active');
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        }
    }
    
    mobileToggle.addEventListener('click', toggleSidebar);
    
    // Close sidebar when clicking on navigation links (mobile)
    const navLinks = document.querySelectorAll('.sidebar .nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.querySelector('.sidebar-overlay');
            const icon = mobileToggle.querySelector('i');
            
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });
    
    // Create overlay for mobile
    if (!document.querySelector('.sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', toggleSidebar);
        document.body.appendChild(overlay);
    }
}