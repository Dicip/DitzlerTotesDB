// Variables globales
let currentUser = null;
let totesData = [];

// Las funciones de autenticación y utilidades ahora están en utils.js

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
        
        // Si el tote está en estado 'Mantenimiento' (lavado), mostrar datos vacíos
        const isLavado = tote.Estado === 'Mantenimiento';
        
        row.innerHTML = `
            <td>${tote.Codigo}</td>
            <td><span class="status-badge status-${tote.Estado.toLowerCase().replace(' ', '-')}">${tote.Estado}</span></td>
            <td>${tote.Ubicacion || '-'}</td>
            <td>${isLavado ? '<em style="color: #999;">Vacío</em>' : (tote.ClienteNombre || '-')}</td>
            <td>${isLavado ? '<em style="color: #999;">Vacío</em>' : (tote.Producto || '-')}</td>
            <td>${isLavado ? '<em style="color: #999;">Vacío</em>' : (tote.Lote || '-')}</td>
            <td>${isLavado ? '<em style="color: #999;">-</em>' : (tote.FechaEnvasado ? formatDate(tote.FechaEnvasado) : '-')}</td>
            <td>${isLavado ? '<em style="color: #999;">-</em>' : (tote.FechaVencimiento ? formatDate(tote.FechaVencimiento) : '-')}</td>
            <td>${isLavado ? '<em style="color: #999;">-</em>' : (tote.FechaDespacho ? formatDate(tote.FechaDespacho) : '-')}</td>
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

// Las funciones formatDate, showMessage y handleLogout ahora están en utils.js

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

    // Función initializeMobileMenu ahora está en utils.js
});