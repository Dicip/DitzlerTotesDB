// JavaScript para el panel de Operador de Totes
// Optimizado para tablets y smartphones con diseño didáctico

document.addEventListener('DOMContentLoaded', function() {
    // Verificación de sesión
    const userData = JSON.parse(sessionStorage.getItem('loggedInAdmin')) || JSON.parse(localStorage.getItem('loggedInAdmin'));
    if (!userData || (userData.role !== 'Operador Totes' && userData.role !== 'Admin' && userData.role !== 'Administrador')) {
        window.location.href = '../index.html';
        return;
    }

    // Referencias a elementos del DOM
    const toteConContenidoCard = document.getElementById('toteConContenido');
    const toteLavadoCard = document.getElementById('toteLavado');
    const messageContainer = document.getElementById('messageContainer');
    const logoutBtn = document.getElementById('logoutBtn');
    const operadorNombre = document.getElementById('operadorNombre');
    const totesHoy = document.getElementById('totesHoy');

    // Variables de estado
    let processingCount = 0;
    let currentModal = null;

    // Inicialización del panel
    init();

    function init() {
        console.log('Panel de Operador de Totes iniciado');
        setupEventListeners();
        updateUserInfo();
        loadTodayStats();
        loadAssignedTotes();
        
        // Actualizar datos cada 30 segundos
        setInterval(() => {
            loadTodayStats();
            loadAssignedTotes();
        }, 30000);
        
        // Prevenir zoom en doble tap en iOS
        document.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });
        
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(e) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    function setupEventListeners() {
        // Logout con confirmación
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        // Opciones de procesamiento con feedback táctil
        if (toteConContenidoCard) {
            addTouchFeedback(toteConContenidoCard);
            toteConContenidoCard.addEventListener('click', () => iniciarProcesoConContenido());
        }
        
        if (toteLavadoCard) {
            addTouchFeedback(toteLavadoCard);
            toteLavadoCard.addEventListener('click', () => iniciarProcesoLavado());
        }
    }

    function addTouchFeedback(element) {
        element.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        element.addEventListener('touchend', function() {
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    }

    function handleLogout() {
        showConfirmDialog(
            '¿Cerrar Sesión?',
            '¿Está seguro que desea cerrar sesión?',
            () => {
                UTILS.clearSession();
                window.location.href = '../index.html';
            }
        );
    }

    function updateUserInfo() {
        if (operadorNombre && userData) {
            operadorNombre.textContent = userData.nombre || userData.username || 'Operador';
        }
    }

    async function loadTodayStats() {
        try {
            const token = userData.token || userData.id;
            const response = await fetch('/api/operador/stats', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (totesHoy && data.totesHoy !== undefined) {
                    totesHoy.textContent = data.totesHoy;
                }
            } else {
                console.warn('No se pudieron cargar las estadísticas');
                if (totesHoy) {
                    totesHoy.textContent = processingCount;
                }
            }
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            if (totesHoy) {
                totesHoy.textContent = processingCount;
            }
        }
    }
    
    async function loadAssignedTotes() {
        try {
            const token = userData.token || userData.id;
            const response = await fetch('/api/operador/totes', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Totes asignados:', data.totes);
                // Aquí se puede agregar lógica para mostrar los totes asignados
                // en una sección adicional del panel si se desea
            } else {
                console.warn('No se pudieron cargar los totes asignados');
            }
        } catch (error) {
            console.error('Error al cargar totes asignados:', error);
        }
    }

    function showMessage(message, type = 'info', duration = 5000) {
        if (!messageContainer) return;
        
        messageContainer.className = `message-container ${type}`;
        messageContainer.innerHTML = `
            <i class="fas fa-${getMessageIcon(type)}"></i>
            <span>${message}</span>
        `;
        messageContainer.style.display = 'block';
        
        // Vibración en móviles para feedback
        if (navigator.vibrate) {
            navigator.vibrate(type === 'error' ? [100, 50, 100] : [50]);
        }
        
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, duration);
    }

    function getMessageIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            info: 'info-circle',
            warning: 'exclamation-circle'
        };
        return icons[type] || 'info-circle';
    }

    function iniciarProcesoConContenido() {
        // Feedback visual
        toteConContenidoCard.classList.add('loading');
        
        setTimeout(() => {
            toteConContenidoCard.classList.remove('loading');
            mostrarModalProceso({
                tipo: 'contenido',
                titulo: 'Tote con Contenido Reutilizable',
                icono: 'fas fa-recycle',
                color: 'success',
                descripcion: 'Este tote contiene producto que puede ser reutilizado',
                flujo: ['Recepción', 'Patio', 'Evaluación'],
                placeholder: 'Escanee o ingrese el código del tote',
                buttonText: 'Procesar Tote',
                onProcess: procesarToteConContenido
            });
        }, 300);
    }

    function iniciarProcesoLavado() {
        // Feedback visual
        toteLavadoCard.classList.add('loading');
        
        setTimeout(() => {
            toteLavadoCard.classList.remove('loading');
            mostrarModalProceso({
                tipo: 'lavado',
                titulo: 'Tote para Lavado Directo',
                icono: 'fas fa-tint',
                color: 'info',
                descripcion: 'Este tote va directamente al proceso de lavado',
                flujo: ['Recepción', 'Lavado', 'Disponible'],
                placeholder: 'Escanee o ingrese el código del tote',
                buttonText: 'Enviar a Lavado',
                onProcess: procesarToteLavado
            });
        }, 300);
    }

    function mostrarModalProceso(config) {
        // Crear modal didáctico
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content ${config.color}">
                <div class="modal-header">
                    <div class="modal-title">
                        <i class="${config.icono}"></i>
                        <h3>${config.titulo}</h3>
                    </div>
                    <button class="modal-close" aria-label="Cerrar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="process-description">
                        <p>${config.descripcion}</p>
                    </div>
                    
                    <div class="process-flow-visual">
                        ${config.flujo.map((step, index) => `
                            <div class="flow-step-visual ${index === 0 ? 'active' : ''}" data-step="${index + 1}">
                                <div class="step-number">${index + 1}</div>
                                <div class="step-label">${step}</div>
                            </div>
                            ${index < config.flujo.length - 1 ? '<div class="flow-arrow"><i class="fas fa-arrow-right"></i></div>' : ''}
                        `).join('')}
                    </div>
                    
                    <div class="input-section">
                        <label for="codigoTote" class="input-label">
                            <i class="fas fa-qrcode"></i>
                            Código del Tote
                        </label>
                        <input 
                            type="text" 
                            id="codigoTote" 
                            class="tote-input" 
                            placeholder="${config.placeholder}"
                            autocomplete="off"
                            inputmode="text"
                        >
                        <button type="button" class="process-btn ${config.color}" id="processBtn">
                            <i class="fas fa-play"></i>
                            ${config.buttonText}
                        </button>
                    </div>
                    
                    <div class="help-section">
                        <p><i class="fas fa-lightbulb"></i> Consejo: Use el escáner o ingrese el código manualmente</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        currentModal = modal;
        
        // Event listeners del modal
        const closeBtn = modal.querySelector('.modal-close');
        const input = modal.querySelector('#codigoTote');
        const processBtn = modal.querySelector('#processBtn');
        
        closeBtn.addEventListener('click', cerrarModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
        });
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                config.onProcess();
            }
        });
        
        input.addEventListener('input', (e) => {
            processBtn.disabled = !e.target.value.trim();
        });
        
        processBtn.addEventListener('click', config.onProcess);
        
        // Focus automático con delay para móviles
        setTimeout(() => {
            input.focus();
        }, 300);
        
        // Animación de entrada
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
    }

    function cerrarModal() {
        if (currentModal) {
            currentModal.classList.add('hide');
            setTimeout(() => {
                if (currentModal && currentModal.parentNode) {
                    currentModal.parentNode.removeChild(currentModal);
                }
                currentModal = null;
            }, 300);
        }
    }

    async function procesarToteConContenido() {
        const codigo = document.getElementById('codigoTote').value.trim();
        
        if (!codigo) {
            showMessage('Por favor ingrese el código del tote', 'error');
            return;
        }
        
        // Validar formato del código (opcional - ajustar según necesidades)
        if (codigo.length < 3) {
            showMessage('El código del tote debe tener al menos 3 caracteres', 'error');
            return;
        }
        
        const processBtn = document.getElementById('processBtn');
        processBtn.classList.add('loading');
        processBtn.disabled = true;
        
        try {
            const operador = userData.nombre || userData.username;
            
            // Actualizar paso visual
            updateFlowStep(2);
            
            const response = await fetch('/api/operador/totes/update-status', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${operador}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    codigo: codigo,
                    nuevoEstado: 'En Uso',
                    nuevaUbicacion: 'Patio - Evaluación',
                    operador: operador,
                    observaciones: 'Tote con contenido reutilizable - Enviado para evaluación'
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                updateFlowStep(3);
                processingCount++;
                await loadTodayStats();
                
                showMessage(`✅ Tote ${codigo} enviado al patio para evaluación`, 'success');
                cerrarModal();
            } else {
                throw new Error(data.message || 'Error al procesar el tote');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showMessage(`❌ ${error.message || 'Error al procesar el tote'}`, 'error');
        } finally {
            processBtn.classList.remove('loading');
            processBtn.disabled = false;
        }
    }

    async function procesarToteLavado() {
        const codigo = document.getElementById('codigoTote').value.trim();
        
        if (!codigo) {
            showMessage('Por favor ingrese el código del tote', 'error');
            return;
        }
        
        // Validar formato del código (opcional - ajustar según necesidades)
        if (codigo.length < 3) {
            showMessage('El código del tote debe tener al menos 3 caracteres', 'error');
            return;
        }
        
        const processBtn = document.getElementById('processBtn');
        processBtn.classList.add('loading');
        processBtn.disabled = true;
        
        try {
            const operador = userData.nombre || userData.username;
            
            // Actualizar paso visual
            updateFlowStep(2);
            
            const response = await fetch('/api/operador/totes/update-status', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${operador}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    codigo: codigo,
                    nuevoEstado: 'Mantenimiento',
                    nuevaUbicacion: 'Área de Lavado',
                    operador: operador,
                    observaciones: 'Tote enviado directamente a lavado'
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                updateFlowStep(3);
                processingCount++;
                await loadTodayStats();
                
                showMessage(`✅ Tote ${codigo} enviado a lavado`, 'success');
                cerrarModal();
            } else {
                throw new Error(data.message || 'Error al procesar el tote');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showMessage(`❌ ${error.message || 'Error al procesar el tote'}`, 'error');
        } finally {
            processBtn.classList.remove('loading');
            processBtn.disabled = false;
        }
    }

    function updateFlowStep(stepNumber) {
        const steps = document.querySelectorAll('.flow-step-visual');
        steps.forEach((step, index) => {
            if (index + 1 <= stepNumber) {
                step.classList.add('active');
                step.classList.add('completed');
            }
        });
    }

    function showConfirmDialog(title, message, onConfirm) {
        const dialog = document.createElement('div');
        dialog.className = 'modal-overlay';
        dialog.innerHTML = `
            <div class="modal-content confirm-dialog">
                <div class="modal-header">
                    <h3><i class="fas fa-question-circle"></i> ${title}</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                    <div class="dialog-buttons">
                        <button class="btn-cancel">Cancelar</button>
                        <button class="btn-confirm">Confirmar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        const cancelBtn = dialog.querySelector('.btn-cancel');
        const confirmBtn = dialog.querySelector('.btn-confirm');
        
        cancelBtn.addEventListener('click', () => {
            dialog.remove();
        });
        
        confirmBtn.addEventListener('click', () => {
            onConfirm();
            dialog.remove();
        });
        
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
        
        requestAnimationFrame(() => {
            dialog.classList.add('show');
        });
    }

    // Manejo de orientación para móviles
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            // Reajustar elementos si es necesario
            if (currentModal) {
                const input = currentModal.querySelector('#codigoTote');
                if (input) {
                    input.blur();
                    setTimeout(() => input.focus(), 100);
                }
            }
        }, 500);
    });

    // Prevenir scroll del body cuando hay modal abierto
    const originalBodyOverflow = document.body.style.overflow;
    
    function lockBodyScroll() {
        document.body.style.overflow = 'hidden';
    }
    
    function unlockBodyScroll() {
        document.body.style.overflow = originalBodyOverflow;
    }

    // Exportar funciones globales si es necesario
    window.operadorTotes = {
        cerrarModal,
        showMessage,
        processingCount: () => processingCount
    };
});

// Estilos adicionales para modales (se inyectan dinámicamente)
const modalStyles = `
<style>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 1rem;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.modal-overlay.show {
    opacity: 1;
}

.modal-overlay.hide {
    opacity: 0;
}

.modal-content {
    background: white;
    border-radius: 20px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    transform: scale(0.9) translateY(20px);
    transition: transform 0.3s ease;
}

.modal-overlay.show .modal-content {
    transform: scale(1) translateY(0);
}

.modal-header {
    padding: 1.5rem;
    border-bottom: 2px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.modal-title i {
    font-size: 1.5rem;
}

.modal-title h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
}

.modal-close {
    background: #ef4444;
    color: white;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.modal-close:hover {
    background: #dc2626;
    transform: scale(1.1);
}

.modal-body {
    padding: 1.5rem;
}

.process-description {
    text-align: center;
    margin-bottom: 2rem;
    font-size: 1.1rem;
    color: #4b5563;
}

.process-flow-visual {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
}

.flow-step-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    opacity: 0.5;
    transition: all 0.3s;
}

.flow-step-visual.active {
    opacity: 1;
}

.flow-step-visual.completed {
    color: #22c55e;
}

.step-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    transition: all 0.3s;
}

.flow-step-visual.active .step-number {
    background: #3b82f6;
    color: white;
}

.flow-step-visual.completed .step-number {
    background: #22c55e;
    color: white;
}

.step-label {
    font-size: 0.875rem;
    font-weight: 600;
    text-align: center;
}

.flow-arrow {
    color: #9ca3af;
    font-size: 1.2rem;
}

.input-section {
    margin-bottom: 1.5rem;
}

.input-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    font-weight: 600;
    color: #374151;
}

.tote-input {
    width: 100%;
    padding: 1rem;
    border: 2px solid #d1d5db;
    border-radius: 12px;
    font-size: 1.1rem;
    margin-bottom: 1rem;
    transition: border-color 0.2s;
}

.tote-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.process-btn {
    width: 100%;
    padding: 1rem;
    border: none;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 56px;
}

.process-btn.success {
    background: #22c55e;
    color: white;
}

.process-btn.info {
    background: #06b6d4;
    color: white;
}

.process-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.process-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.process-btn.loading::after {
    content: '';
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-left: 0.5rem;
}

.help-section {
    background: #f8fafc;
    padding: 1rem;
    border-radius: 12px;
    text-align: center;
    color: #64748b;
    font-size: 0.9rem;
}

.help-section i {
    color: #f59e0b;
    margin-right: 0.5rem;
}

.confirm-dialog .modal-body {
    text-align: center;
}

.dialog-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
}

.btn-cancel, .btn-confirm {
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-cancel {
    background: #e5e7eb;
    color: #374151;
}

.btn-confirm {
    background: #ef4444;
    color: white;
}

.btn-cancel:hover {
    background: #d1d5db;
}

.btn-confirm:hover {
    background: #dc2626;
}

@media (max-width: 480px) {
    .modal-content {
        margin: 0.5rem;
        border-radius: 16px;
    }
    
    .process-flow-visual {
        flex-direction: column;
        gap: 1rem;
    }
    
    .flow-arrow {
        transform: rotate(90deg);
    }
}
</style>
`;

// Inyectar estilos
if (!document.querySelector('#modal-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'modal-styles';
    styleElement.innerHTML = modalStyles;
    document.head.appendChild(styleElement);
}