// Totes Table Management
class TotesTableManager {
    constructor() {
        this.allTotes = [];
        this.filteredTotes = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.init();
    }

    async init() {
        console.log('Inicializando TotesTableManager...');
        
        // Verificar sesión
        if (!this.verifySession()) {
            window.location.href = '../index.html';
            return;
        }

        // Configurar event listeners
        this.setupEventListeners();
        
        // Cargar datos iniciales
        await this.loadTotesData();
        
        // Configurar actualización automática cada 30 segundos
        setInterval(() => {
            this.refreshTotesTable();
        }, 30000);
    }

    verifySession() {
        const userData = JSON.parse(sessionStorage.getItem('loggedInAdmin')) || JSON.parse(localStorage.getItem('loggedInAdmin'));
        if (!userData || (userData.role !== 'Operador Totes' && userData.role !== 'Admin' && userData.role !== 'Administrador')) {
            return false;
        }
        return true;
    }

    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    logout() {
        localStorage.removeItem('loggedInAdmin');
        sessionStorage.removeItem('loggedInAdmin');
        window.location.href = '../index.html';
    }

    async loadTotesData() {
        try {
            console.log('Cargando datos de totes...');
            
            const response = await fetch('/api/totes');
            const data = await response.json();
            
            if (data.success) {
                this.allTotes = data.totes || [];
                this.filteredTotes = [...this.allTotes];
                this.updateStatistics();
                this.renderTable();
                // Mensaje de éxito eliminado
            } else {
                throw new Error(data.message || 'Error al cargar datos');
            }
        } catch (error) {
            console.error('Error cargando totes:', error);
            console.error('Error al cargar los datos:', error.message);
        }
    }

    updateStatistics() {
        const total = this.allTotes.length;
        const active = this.allTotes.filter(t => t.estado === 'Activo').length;
        const inactive = this.allTotes.filter(t => t.estado === 'Inactivo').length;
        const maintenance = this.allTotes.filter(t => t.estado === 'Mantenimiento').length;

        document.getElementById('totalTotes').textContent = total;
        document.getElementById('activeTotes').textContent = active;
        document.getElementById('inactiveTotes').textContent = inactive;
        document.getElementById('maintenanceTotes').textContent = maintenance;
    }

    renderTable() {
        const tbody = document.getElementById('totesTableBody');
        if (!tbody) return;

        // Calcular paginación
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredTotes.slice(startIndex, endIndex);

        // Limpiar tabla
        tbody.innerHTML = '';

        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No se encontraron totes</td></tr>';
            this.updatePagination();
            return;
        }

        // Renderizar filas
        pageData.forEach(tote => {
            const row = this.createTableRow(tote);
            tbody.appendChild(row);
        });

        this.updatePagination();
    }

    createTableRow(tote) {
        const row = document.createElement('tr');
        
        const statusClass = this.getStatusClass(tote.estado);
        const formattedDate = this.formatDate(tote.fecha_actualizacion);
        const peso = tote.Peso ? `${tote.Peso} kg` : 'N/A';
        
        row.innerHTML = `
            <td>${tote.id_tote || 'N/A'}</td>
            <td><span class="status-badge ${statusClass}">${tote.estado || 'N/A'}</span></td>
            <td>${tote.cliente_nombre || 'N/A'}</td>
            <td>${tote.ubicacion || 'N/A'}</td>
            <td>${tote.Producto || 'N/A'}</td>
            <td>${peso}</td>
            <td>${formattedDate}</td>
        `;
        
        return row;
    }

    getStatusClass(estado) {
        const statusMap = {
            'Activo': 'status-activo',
            'Inactivo': 'status-inactivo',
            'En Proceso': 'status-en-proceso',
            'Mantenimiento': 'status-mantenimiento'
        };
        return statusMap[estado] || 'status-default';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-CL', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Fecha inválida';
        }
    }

    updatePagination() {
        const totalItems = this.filteredTotes.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, totalItems);

        // Actualizar información de paginación
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) {
            paginationInfo.textContent = `Mostrando ${startItem}-${endItem} de ${totalItems} registros`;
        }

        // Actualizar botones de navegación
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= totalPages;
        }

        // Actualizar números de página
        this.updatePageNumbers(totalPages);
    }

    updatePageNumbers(totalPages) {
        const pageNumbers = document.getElementById('pageNumbers');
        if (!pageNumbers) return;

        pageNumbers.innerHTML = '';
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `btn btn-sm ${i === this.currentPage ? 'btn-primary' : 'btn-outline'}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => this.goToPage(i);
            pageNumbers.appendChild(pageBtn);
        }
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderTable();
    }

    // Función showMessage eliminada

    // Métodos públicos para uso desde HTML
    async refreshTotesTable() {
        await this.loadTotesData();
    }



    exportTotesTable() {
        console.log('Exportar tabla de totes');
        // TODO: Implementar exportación
        console.log('Funcionalidad de exportación en desarrollo');
    }
}

// Funciones globales para uso desde HTML
let totesManager;



// Funciones de ordenamiento
function sortTable(columnIndex) {
    if (!totesManager) return;
    
    const columns = ['id_tote', 'estado', 'cliente_nombre', 'ubicacion', 'Producto', 'Peso', 'fecha_actualizacion'];
    const column = columns[columnIndex];
    
    if (totesManager.sortColumn === column) {
        totesManager.sortDirection = totesManager.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        totesManager.sortColumn = column;
        totesManager.sortDirection = 'asc';
    }
    
    totesManager.filteredTotes.sort((a, b) => {
        let aVal = a[column] || '';
        let bVal = b[column] || '';
        
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (aVal < bVal) return totesManager.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return totesManager.sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    totesManager.renderTable();
}

// Funciones de paginación
function previousPage() {
    if (totesManager && totesManager.currentPage > 1) {
        totesManager.currentPage--;
        totesManager.renderTable();
    }
}

function nextPage() {
    if (totesManager) {
        const totalPages = Math.ceil(totesManager.filteredTotes.length / totesManager.itemsPerPage);
        if (totesManager.currentPage < totalPages) {
            totesManager.currentPage++;
            totesManager.renderTable();
        }
    }
}

// Funciones de actualización
function refreshTotesTable() {
    if (totesManager) {
        totesManager.refreshTotesTable();
    }
}

function exportTotesTable() {
    if (totesManager) {
        totesManager.exportTotesTable();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    totesManager = new TotesTableManager();
});

// Exponer funciones globalmente para compatibilidad
window.totesManager = totesManager;
window.sortTable = sortTable;
window.previousPage = previousPage;
window.nextPage = nextPage;
window.refreshTotesTable = refreshTotesTable;
window.exportTotesTable = exportTotesTable;