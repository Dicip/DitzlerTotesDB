document.addEventListener('DOMContentLoaded', function() {
    // Verificación de sesión
    const userData = JSON.parse(sessionStorage.getItem('loggedInAdmin')) || JSON.parse(localStorage.getItem('loggedInAdmin'));
    if (!userData || (userData.role !== 'Operador Totes' && userData.role !== 'Admin' && userData.role !== 'Administrador')) {
        window.location.href = '../index.html';
        return;
    }

    // Referencias a elementos del DOM
    const toteConContenidoCard = document.getElementById('toteConContenido');
    const toteSinContenidoCard = document.getElementById('toteSinContenido');
    const messageContainer = document.getElementById('messageContainer');
    const logoutBtn = document.getElementById('logoutBtn');

    // Inicialización
    init();

    function init() {
        setupEventListeners();
    }

    function setupEventListeners() {
        // Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                if (confirm('¿Está seguro que desea cerrar sesión?')) {
                    sessionStorage.clear();
                    localStorage.clear();
                    window.location.href = '../index.html';
                }
            });
        }

        // Opciones de procesamiento
        if (toteConContenidoCard) {
            toteConContenidoCard.addEventListener('click', () => iniciarProcesoConContenido());
        }
        
        if (toteSinContenidoCard) {
            toteSinContenidoCard.addEventListener('click', () => iniciarProcesoSinContenido());
        }
    }

    function showMessage(message, type = 'info') {
        if (!messageContainer) return;
        
        messageContainer.className = `message ${type}`;
        messageContainer.textContent = message;
        messageContainer.style.display = 'block';
        
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }

    function showMessage(message, type = 'info') {
        if (!messageContainer) return;
        
        messageContainer.className = `message ${type}`;
        messageContainer.textContent = message;
        messageContainer.style.display = 'block';
        
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }

    // Funciones para los nuevos procesos de totes
    function iniciarProcesoConContenido() {
        // Marcar la opción como activa
        toteConContenidoCard.classList.add('active');
        toteSinContenidoCard.classList.remove('active');
        
        // Mostrar modal o formulario para escanear tote con contenido
        mostrarModalProcesoContenido();
    }

    function iniciarProcesoSinContenido() {
        // Marcar la opción como activa
        toteSinContenidoCard.classList.add('active');
        toteConContenidoCard.classList.remove('active');
        
        // Mostrar modal o formulario para escanear tote sin contenido
        mostrarModalProcesoSinContenido();
    }

    function mostrarModalProcesoContenido() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-recycle"></i> Proceso: Tote con Contenido Reutilizable</h3>
                    <button class="close-btn" onclick="cerrarModalProceso()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="proceso-info">
                        <p><strong>Flujo:</strong> Recepción → Patio → Evaluación</p>
                        <p>Escanee el código del tote que contiene producto reutilizable:</p>
                    </div>
                    <div class="scan-section">
                        <input type="text" id="codigoToteContenido" placeholder="Código del tote" class="form-control" autofocus>
                        <button type="button" class="btn-primary" onclick="procesarToteConContenido()">Procesar Tote</button>
                    </div>
                    <div class="proceso-steps">
                        <div class="step">
                            <i class="fas fa-box"></i>
                            <span>1. Recepción</span>
                        </div>
                        <div class="step">
                            <i class="fas fa-warehouse"></i>
                            <span>2. Envío a Patio</span>
                        </div>
                        <div class="step">
                            <i class="fas fa-search"></i>
                            <span>3. Evaluación</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Focus en el input
        setTimeout(() => {
            document.getElementById('codigoToteContenido').focus();
        }, 100);
        
        // Permitir cerrar con Enter
        document.getElementById('codigoToteContenido').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                procesarToteConContenido();
            }
        });
    }

    function mostrarModalProcesoSinContenido() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-tint"></i> Proceso: Tote para Lavado Directo</h3>
                    <button class="close-btn" onclick="cerrarModalProceso()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="proceso-info">
                        <p><strong>Flujo:</strong> Recepción → Lavado → Disponible</p>
                        <p>Escanee el código del tote que va directamente a lavado:</p>
                    </div>
                    <div class="scan-section">
                        <input type="text" id="codigoToteSinContenido" placeholder="Código del tote" class="form-control" autofocus>
                        <button type="button" class="btn-secondary" onclick="procesarToteSinContenido()">Procesar Tote</button>
                    </div>
                    <div class="proceso-steps">
                        <div class="step">
                            <i class="fas fa-box"></i>
                            <span>1. Recepción</span>
                        </div>
                        <div class="step">
                            <i class="fas fa-tint"></i>
                            <span>2. Lavado</span>
                        </div>
                        <div class="step">
                            <i class="fas fa-check-circle"></i>
                            <span>3. Disponible</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Focus en el input
        setTimeout(() => {
            document.getElementById('codigoToteSinContenido').focus();
        }, 100);
        
        // Permitir cerrar con Enter
        document.getElementById('codigoToteSinContenido').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                procesarToteSinContenido();
            }
        });
    }

    function cerrarModalProceso() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
        // Limpiar selecciones activas
        toteConContenidoCard.classList.remove('active');
        toteSinContenidoCard.classList.remove('active');
    }

    async function procesarToteConContenido() {
        const codigo = document.getElementById('codigoToteContenido').value.trim();
        
        if (!codigo) {
            showMessage('Por favor ingrese el código del tote', 'error');
            return;
        }
        
        try {
            // Simular procesamiento del tote con contenido
            const response = await fetch(CONFIG.API.BASE_URL + '/api/admin/totes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + userData.username
                },
                body: JSON.stringify({
                    action: 'proceso_contenido',
                    codigo: codigo,
                    estado: 'En Patio',
                    flujo: 'contenido_reutilizable'
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showMessage(`Tote ${codigo} enviado al patio para evaluación`, 'success');
                cerrarModalProceso();
            } else {
                showMessage('Error al procesar el tote: ' + (result.message || 'Error desconocido'), 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Error de conexión al procesar el tote', 'error');
        }
    }

    async function procesarToteSinContenido() {
        const codigo = document.getElementById('codigoToteSinContenido').value.trim();
        
        if (!codigo) {
            showMessage('Por favor ingrese el código del tote', 'error');
            return;
        }
        
        try {
            // Simular procesamiento del tote sin contenido
            const response = await fetch(CONFIG.API.BASE_URL + '/api/admin/totes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + userData.username
                },
                body: JSON.stringify({
                    action: 'proceso_lavado',
                    codigo: codigo,
                    estado: 'En Lavado',
                    flujo: 'lavado_directo'
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showMessage(`Tote ${codigo} enviado a lavado`, 'success');
                cerrarModalProceso();
            } else {
                showMessage('Error al procesar el tote: ' + (result.message || 'Error desconocido'), 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Error de conexión al procesar el tote', 'error');
        }
    }

    // Hacer las funciones globales para que puedan ser llamadas desde el HTML
    window.cerrarModalProceso = cerrarModalProceso;
    window.procesarToteConContenido = procesarToteConContenido;
    window.procesarToteSinContenido = procesarToteSinContenido;
});