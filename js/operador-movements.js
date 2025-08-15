// Operador Movements - Gestión de registro de movimientos
// Autor: Sistema DitzlerTotes
// Fecha: 2024

class MovementsManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 1;
        this.movements = [];
        this.filteredMovements = [];
        this.init();
    }

    init() {
        this.loadMovements();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Event listener para el botón de actualizar
        const refreshBtn = document.querySelector('[onclick="refreshMovements()"]');
        if (refreshBtn) {
            refreshBtn.onclick = () => this.refreshMovements();
        }
    }

    async loadMovements() {
        try {
            // Get user data from session storage consistent with other files
            const userData = (typeof UTILS !== 'undefined' && UTILS.getSessionData) 
                ? UTILS.getSessionData() 
                : JSON.parse(sessionStorage.getItem('loggedInAdmin')) || JSON.parse(localStorage.getItem('loggedInAdmin'));
            const token = userData ? (userData.token || userData.id) : null;
            
            if (!token) {
                // Mostrar mensaje de sesión requerida y salir sin lanzar excepción
                this.showError('Debe iniciar sesión para ver el registro de movimientos.');
                return;
            }

            // Use API_BASE_URL if available, otherwise use empty string for relative paths
            const baseUrl = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '';
            
            const response = await fetch(`${baseUrl}/api/movements`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.movements = data.movements || [];
            this.filteredMovements = [...this.movements];
            this.renderTable();
            this.renderPagination();
        } catch (error) {
            console.error('Error al cargar movimientos:', error);
            this.showError('Error al cargar los movimientos. Por favor, intente nuevamente.');
        }
    }

    renderTable() {
        const tbody = document.getElementById('movementsTableBody');
        if (!tbody) return;

        // Calcular elementos para la página actual
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageMovements = this.filteredMovements.slice(startIndex, endIndex);

        if (pageMovements.length === 0) {
            tbody.innerHTML = `
                <tr class="no-data-row">
                    <td colspan="7" class="text-center">
                        <i class="fas fa-inbox"></i>
                        <p>No hay movimientos registrados</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pageMovements.map(movement => `
            <tr class="movement-row" data-id="${movement.id}">
                <td class="datetime-cell">
                    <div class="datetime-info">
                        <span class="date">${this.formatDate(movement.fecha_hora)}</span>
                        <span class="time">${this.formatTime(movement.fecha_hora)}</span>
                    </div>
                </td>
                <td class="movement-type-cell">
                    <span class="movement-type ${this.getMovementTypeClass(movement.tipo_movimiento)}">
                        <i class="${this.getMovementTypeIcon(movement.tipo_movimiento)}"></i>
                        ${movement.tipo_movimiento}
                    </span>
                </td>
                <td class="tote-id-cell">
                    <span class="tote-id">${movement.tote_id}</span>
                </td>
                <td class="location-cell">
                    <span class="location origin">${movement.ubicacion_origen || '-'}</span>
                </td>
                <td class="location-cell">
                    <span class="location destination">${movement.ubicacion_destino || '-'}</span>
                </td>
                <td class="user-cell">
                    <div class="user-info">
                        <i class="fas fa-user"></i>
                        <span class="username">${movement.usuario}</span>
                    </div>
                </td>
                <td class="status-cell">
                    <span class="status-badge ${this.getStatusClass(movement.estado)}">
                        ${movement.estado}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    renderPagination() {
        const paginationContainer = document.getElementById('movementsPagination');
        if (!paginationContainer) return;

        this.totalPages = Math.ceil(this.filteredMovements.length / this.itemsPerPage);

        if (this.totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <div class="pagination-info">
                Mostrando ${(this.currentPage - 1) * this.itemsPerPage + 1} - 
                ${Math.min(this.currentPage * this.itemsPerPage, this.filteredMovements.length)} 
                de ${this.filteredMovements.length} movimientos
            </div>
            <div class="pagination-controls">
        `;

        // Botón anterior
        paginationHTML += `
            <button class="btn btn-pagination ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="movementsManager.goToPage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Números de página
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="btn btn-pagination ${i === this.currentPage ? 'active' : ''}" 
                        onclick="movementsManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        // Botón siguiente
        paginationHTML += `
            <button class="btn btn-pagination ${this.currentPage === this.totalPages ? 'disabled' : ''}" 
                    onclick="movementsManager.goToPage(${this.currentPage + 1})" 
                    ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationHTML += '</div>';
        paginationContainer.innerHTML = paginationHTML;
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.renderTable();
        this.renderPagination();
    }

    refreshMovements() {
        const refreshBtn = document.querySelector('[onclick="refreshMovements()"]');
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i');
            icon.classList.add('fa-spin');
        }

        this.loadMovements().finally(() => {
            if (refreshBtn) {
                const icon = refreshBtn.querySelector('i');
                icon.classList.remove('fa-spin');
            }
        });
    }

    // Métodos de utilidad para formateo
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    getMovementTypeClass(type) {
        const typeClasses = {
            'asignación': 'assignment',
            'desasignación': 'unassignment',
            'reubicación': 'relocation',
            'recepción': 'reception',
            'despacho': 'dispatch',
            'mantenimiento': 'maintenance'
        };
        return typeClasses[type.toLowerCase()] || 'default';
    }

    getMovementTypeIcon(type) {
        const typeIcons = {
            'asignación': 'fas fa-user-plus',
            'desasignación': 'fas fa-user-minus',
            'reubicación': 'fas fa-exchange-alt',
            'recepción': 'fas fa-inbox',
            'despacho': 'fas fa-shipping-fast',
            'mantenimiento': 'fas fa-tools'
        };
        return typeIcons[type.toLowerCase()] || 'fas fa-circle';
    }

    getStatusClass(status) {
        const statusClasses = {
            'completado': 'success',
            'en proceso': 'warning',
            'pendiente': 'info',
            'cancelado': 'danger',
            'error': 'danger'
        };
        return statusClasses[status.toLowerCase()] || 'secondary';
    }

    showError(message) {
        const tbody = document.getElementById('movementsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr class="error-row">
                    <td colspan="7" class="text-center error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>${message}</p>
                        <button class="btn btn-primary btn-sm" onclick="movementsManager.loadMovements()">
                            <i class="fas fa-retry"></i> Reintentar
                        </button>
                    </td>
                </tr>
            `;
        }
    }
}

// Función global para compatibilidad
function refreshMovements() {
    if (window.movementsManager) {
        window.movementsManager.refreshMovements();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    const userData = (typeof UTILS !== 'undefined' && UTILS.getSessionData) 
        ? UTILS.getSessionData() 
        : JSON.parse(sessionStorage.getItem('loggedInAdmin')) || JSON.parse(localStorage.getItem('loggedInAdmin'));
    if (!userData) {
        // No inicializar si no hay sesión; operador-totes.js se encarga de redirigir
        return;
    }
    window.movementsManager = new MovementsManager();
});

// Exportar para uso en otros módulos si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MovementsManager;
}