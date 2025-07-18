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
            document.getElementById('totalEventos').textContent = stats.TotalEventos.toLocaleString();
            document.getElementById('eventosExitosos').textContent = stats.EventosExitosos.toLocaleString();
            document.getElementById('eventosFallidos').textContent = stats.EventosFallidos.toLocaleString();
            document.getElementById('eventosUltimas24h').textContent = stats.EventosUltimas24h.toLocaleString();
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        mostrarError('Error al cargar las estadísticas de eventos');
    }
}

// Cargar eventos con filtros y paginación
async function cargarEventos(page = 1) {
    try {
        mostrarLoading(true);
        currentPage = page;
        
        // Construir parámetros de consulta
        const params = new URLSearchParams({
            page: page,
            limit: eventsPerPage,
            ...currentFilters
        });
        
        const response = await fetch(`/api/eventos?${params}`);
        const data = await response.json();
        
        if (data.success) {
            mostrarEventos(data.eventos);
            mostrarPaginacion(data.pagination);
        } else {
            mostrarError(data.message || 'Error al cargar eventos');
        }
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        mostrarError('Error al cargar los eventos');
    } finally {
        mostrarLoading(false);
    }
}

// Mostrar/ocultar loading
function mostrarLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    const container = document.getElementById('eventosContainer');
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
    const container = document.getElementById('eventosContainer');
    const noEventos = document.getElementById('noEventos');
    
    if (eventos.length === 0) {
        container.innerHTML = '';
        noEventos.classList.remove('d-none');
        return;
    }
    
    noEventos.classList.add('d-none');
    
    const html = eventos.map(evento => {
        const cardClass = getEventCardClass(evento);
        const iconClass = getEventIcon(evento.TipoEvento);
        const badgeClass = getEventBadgeClass(evento.TipoEvento);
        
        return `
            <div class="event-card card mb-3 ${cardClass}" onclick="mostrarDetalleEvento(${evento.Id})" style="cursor: pointer;">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-1 text-center">
                            <i class="${iconClass} fa-2x"></i>
                        </div>
                        <div class="col-md-8">
                            <div class="d-flex align-items-center mb-2">
                                <span class="badge ${badgeClass} event-type-badge me-2">${evento.TipoEvento}</span>
                                <span class="badge bg-secondary event-type-badge me-2">${evento.Modulo}</span>
                                ${evento.Exitoso ? 
                                    '<span class="badge bg-success event-type-badge">Exitoso</span>' : 
                                    '<span class="badge bg-danger event-type-badge">Fallido</span>'
                                }
                            </div>
                            <h6 class="card-title mb-1">${evento.Descripcion}</h6>
                            <div class="text-muted small">
                                <i class="fas fa-user me-1"></i>
                                ${evento.UsuarioNombre} (${evento.UsuarioRol})
                                ${evento.ObjetoId ? `<span class="ms-3"><i class="fas fa-tag me-1"></i>ID: ${evento.ObjetoId}</span>` : ''}
                            </div>
                        </div>
                        <div class="col-md-3 text-end">
                            <div class="text-muted small">
                                <i class="fas fa-clock me-1"></i>
                                ${evento.TiempoTranscurrido}
                            </div>
                            <div class="text-muted small mt-1">
                                <i class="fas fa-calendar me-1"></i>
                                ${formatearFecha(evento.FechaEvento)}
                            </div>
                            ${evento.DireccionIP ? 
                                `<div class="text-muted small mt-1">
                                    <i class="fas fa-globe me-1"></i>
                                    ${evento.DireccionIP}
                                </div>` : ''
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
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
    
    if (pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<nav><ul class="pagination">';
    
    // Botón anterior
    if (pagination.page > 1) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cargarEventos(${pagination.page - 1})">
                        <i class="fas fa-chevron-left"></i>
                    </a>
                </li>`;
    }
    
    // Páginas
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.totalPages, pagination.page + 2);
    
    if (startPage > 1) {
        html += `<li class="page-item"><a class="page-link" href="#" onclick="cargarEventos(1)">1</a></li>`;
        if (startPage > 2) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === pagination.page ? 'active' : '';
        html += `<li class="page-item ${activeClass}">
                    <a class="page-link" href="#" onclick="cargarEventos(${i})">${i}</a>
                </li>`;
    }
    
    if (endPage < pagination.totalPages) {
        if (endPage < pagination.totalPages - 1) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
        html += `<li class="page-item"><a class="page-link" href="#" onclick="cargarEventos(${pagination.totalPages})">${pagination.totalPages}</a></li>`;
    }
    
    // Botón siguiente
    if (pagination.page < pagination.totalPages) {
        html += `<li class="page-item">
                    <a class="page-link" href="#" onclick="cargarEventos(${pagination.page + 1})">
                        <i class="fas fa-chevron-right"></i>
                    </a>
                </li>`;
    }
    
    html += '</ul></nav>';
    container.innerHTML = html;
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
                <div class="row">
                    <div class="col-md-6">
                        <h6><i class="fas fa-info-circle me-2"></i>Información General</h6>
                        <table class="table table-sm">
                            <tr><td><strong>ID:</strong></td><td>${evento.Id}</td></tr>
                            <tr><td><strong>Tipo:</strong></td><td><span class="badge ${getEventBadgeClass(evento.TipoEvento)}">${evento.TipoEvento}</span></td></tr>
                            <tr><td><strong>Módulo:</strong></td><td><span class="badge bg-secondary">${evento.Modulo}</span></td></tr>
                            <tr><td><strong>Estado:</strong></td><td>${evento.Exitoso ? '<span class="badge bg-success">Exitoso</span>' : '<span class="badge bg-danger">Fallido</span>'}</td></tr>
                            <tr><td><strong>Fecha:</strong></td><td>${formatearFecha(evento.FechaEvento)}</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6><i class="fas fa-user me-2"></i>Usuario</h6>
                        <table class="table table-sm">
                            <tr><td><strong>ID:</strong></td><td>${evento.UsuarioId || 'N/A'}</td></tr>
                            <tr><td><strong>Nombre:</strong></td><td>${evento.UsuarioNombre}</td></tr>
                            <tr><td><strong>Email:</strong></td><td>${evento.UsuarioEmail || 'N/A'}</td></tr>
                            <tr><td><strong>Rol:</strong></td><td>${evento.UsuarioRol}</td></tr>
                            <tr><td><strong>IP:</strong></td><td>${evento.DireccionIP || 'N/A'}</td></tr>
                        </table>
                    </div>
                </div>
                
                <div class="row mt-3">
                    <div class="col-12">
                        <h6><i class="fas fa-file-alt me-2"></i>Descripción</h6>
                        <p class="border p-2 rounded bg-light">${evento.Descripcion}</p>
                    </div>
                </div>
                
                ${evento.ObjetoId ? `
                <div class="row mt-3">
                    <div class="col-md-6">
                        <h6><i class="fas fa-tag me-2"></i>Objeto Afectado</h6>
                        <table class="table table-sm">
                            <tr><td><strong>ID:</strong></td><td>${evento.ObjetoId}</td></tr>
                            <tr><td><strong>Tipo:</strong></td><td>${evento.ObjetoTipo || 'N/A'}</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6><i class="fas fa-globe me-2"></i>Información Técnica</h6>
                        <table class="table table-sm">
                            <tr><td><strong>Sesión:</strong></td><td>${evento.Sesion || 'N/A'}</td></tr>
                            <tr><td><strong>User Agent:</strong></td><td class="text-break small">${evento.UserAgent || 'N/A'}</td></tr>
                        </table>
                    </div>
                </div>
                ` : ''}
                
                ${!evento.Exitoso && evento.MensajeError ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <h6><i class="fas fa-exclamation-triangle me-2 text-danger"></i>Error</h6>
                        <div class="alert alert-danger">${evento.MensajeError}</div>
                    </div>
                </div>
                ` : ''}
                
                ${evento.ValoresAnteriores ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <h6><i class="fas fa-history me-2"></i>Valores Anteriores</h6>
                        <div class="json-viewer">${typeof evento.ValoresAnteriores === 'object' ? JSON.stringify(evento.ValoresAnteriores, null, 2) : evento.ValoresAnteriores}</div>
                    </div>
                </div>
                ` : ''}
                
                ${evento.ValoresNuevos ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <h6><i class="fas fa-plus me-2"></i>Valores Nuevos</h6>
                        <div class="json-viewer">${typeof evento.ValoresNuevos === 'object' ? JSON.stringify(evento.ValoresNuevos, null, 2) : evento.ValoresNuevos}</div>
                    </div>
                </div>
                ` : ''}
            `;
            
            document.getElementById('eventoDetailContent').innerHTML = html;
            
            const modal = new bootstrap.Modal(document.getElementById('eventoDetailModal'));
            modal.show();
        } else {
            mostrarError(data.message || 'Error al cargar el detalle del evento');
        }
    } catch (error) {
        console.error('Error al cargar detalle del evento:', error);
        mostrarError('Error al cargar el detalle del evento');
    }
}

// Mostrar mensaje de error
function mostrarError(mensaje) {
    // Crear toast de error
    const toastHtml = `
        <div class="toast align-items-center text-white bg-danger border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${mensaje}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    // Agregar toast al DOM
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Mostrar toast
    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
    toast.show();
    
    // Remover del DOM después de que se oculte
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Función de logout
function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        window.location.href = 'login.html';
    }
}