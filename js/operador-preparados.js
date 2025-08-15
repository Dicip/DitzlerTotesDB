document.addEventListener('DOMContentLoaded', function() {
    // Verificación de sesión
    const userData = JSON.parse(sessionStorage.getItem('loggedInAdmin')) || JSON.parse(localStorage.getItem('loggedInAdmin'));
    if (!userData || (userData.role !== 'Operador Preparados' && userData.role !== 'Producción' && userData.role !== 'Admin' && userData.role !== 'Administrador')) {
        window.location.href = '../index.html';
        return;
    }

    // Variables globales
    let totes = [];
    let clientes = [];
    let preparaciones = [];
    let currentSection = 'panelControl';
    let editingPreparacionId = null;

    // Referencias a elementos del DOM
    const sections = {
        panelControl: document.getElementById('panelControl'),
        preparacion: document.getElementById('preparacion'),
        controlCalidadSection: document.getElementById('controlCalidadSection'),
        inventario: document.getElementById('inventario'),
        reportes: document.getElementById('reportes')
    };

    const navLinks = {
        preparacionTab: document.getElementById('preparacionTab'),
        controlCalidadTab: document.getElementById('controlCalidadTab'),
        inventarioTab: document.getElementById('inventarioTab'),
        reportesTab: document.getElementById('reportesTab')
    };

    const preparacionesList = document.getElementById('preparacionesList');
    const preparacionForm = document.getElementById('preparacionForm');
    const preparacionModal = document.getElementById('preparacionModal');
    const calidadModal = document.getElementById('calidadModal');
    const messageContainer = document.getElementById('messageContainer');
    const logoutBtn = document.getElementById('logoutBtn');

    // Inicialización
    init();

    function init() {
        setupEventListeners();
        loadClientes();
        loadTotes();
        loadPreparaciones();
        loadDashboardStats();
        showSection('panelControl');
        setDefaultDates();
    }

    function setupEventListeners() {
        // Navegación
        navLinks.preparacionTab.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('preparacion');
        });

        navLinks.controlCalidadTab.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('controlCalidadSection');
        });

        navLinks.inventarioTab.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('inventario');
        });

        navLinks.reportesTab.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('reportes');
        });

        // Logout
        logoutBtn.addEventListener('click', function() {
            if (confirm('¿Está seguro que desea cerrar sesión?')) {
                UTILS.clearSession();
                window.location.href = '../index.html';
            }
        });

        // Modales
        document.getElementById('nuevaPreparacionBtn').addEventListener('click', () => openPreparacionModal());
        document.getElementById('closePreparacionModal').addEventListener('click', closePreparacionModal);
        document.getElementById('cancelPreparacionBtn').addEventListener('click', closePreparacionModal);
        document.getElementById('closeCalidadModal').addEventListener('click', closeCalidadModal);
        document.getElementById('cancelCalidadBtn').addEventListener('click', closeCalidadModal);
        
        preparacionForm.addEventListener('submit', handlePreparacionSubmit);
        document.getElementById('calidadForm').addEventListener('submit', handleCalidadSubmit);

        // Filtros
        document.getElementById('estadoPreparacionFilter').addEventListener('change', filterPreparaciones);
        document.getElementById('clientePreparacionFilter').addEventListener('change', filterPreparaciones);
        document.getElementById('fechaPreparacionFilter').addEventListener('change', filterPreparaciones);
    }

    function setDefaultDates() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const datetime = now.toISOString().slice(0, 16);
        
        document.getElementById('fechaInicioPreparacion').value = datetime;
        document.getElementById('fechaEnvasadoPreparacion').value = today;
        
        // Fecha de vencimiento por defecto (30 días después)
        const vencimiento = new Date(now);
        vencimiento.setDate(vencimiento.getDate() + 30);
        document.getElementById('fechaVencimientoPreparacion').value = vencimiento.toISOString().split('T')[0];
    }

    function showSection(sectionName) {
        // Ocultar todas las secciones
        Object.values(sections).forEach(section => {
            if (section) section.classList.remove('active');
        });

        // Mostrar la sección seleccionada
        if (sections[sectionName]) {
            sections[sectionName].classList.add('active');
            currentSection = sectionName;
        }

        // Actualizar navegación activa
        document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
        if (sectionName === 'panelControl') {
            document.querySelector('.nav-links li:first-child').classList.add('active');
        }
    }

    async function loadClientes() {
        try {
            const response = await fetch(CONFIG.API.BASE_URL + '/api/admin/clientes', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + userData.username
                }
            });

            if (response.ok) {
                const data = await response.json();
                clientes = data.clientes || [];
                populateClienteSelects();
            }
        } catch (error) {
            console.error('Error al cargar clientes:', error);
        }
    }

    function populateClienteSelects() {
        const selects = [
            document.getElementById('clientePreparacion'),
            document.getElementById('clientePreparacionFilter')
        ];
        
        selects.forEach(select => {
            if (select) {
                // Limpiar opciones existentes (excepto la primera)
                while (select.children.length > 1) {
                    select.removeChild(select.lastChild);
                }

                // Agregar clientes
                clientes.forEach(cliente => {
                    const option = document.createElement('option');
                    option.value = cliente.Id;
                    option.textContent = cliente.NombreEmpresa;
                    select.appendChild(option);
                });
            }
        });
    }

    async function loadTotes() {
        try {
            const response = await fetch(CONFIG.API.BASE_URL + '/api/operador/totes', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + userData.username
                }
            });

            if (response.ok) {
                const data = await response.json();
                totes = data.totes || [];
                populateToteSelect();
            }
        } catch (error) {
            console.error('Error al cargar totes:', error);
        }
    }

    function populateToteSelect() {
        const select = document.getElementById('toteSeleccion');
        if (!select) return;

        // Limpiar opciones existentes (excepto la primera)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        // Agregar solo totes disponibles
        const totesDisponibles = totes.filter(tote => tote.Estado === 'Disponible');
        totesDisponibles.forEach(tote => {
            const option = document.createElement('option');
            option.value = tote.Id;
            option.textContent = `${tote.Codigo} - ${tote.Estado}`;
            select.appendChild(option);
        });
    }

    async function loadPreparaciones() {
        try {
            // Simular datos de preparaciones (en una implementación real, esto vendría de la API)
            preparaciones = totes.filter(tote => 
                ['En Uso', 'Con Cliente'].includes(tote.Estado)
            ).map(tote => ({
                id: tote.Id,
                codigo_tote: tote.Codigo,
                cliente_nombre: tote.ClienteNombre || 'Sin asignar',
                estado: getEstadoPreparacion(tote.Estado),
                fecha_inicio: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                fecha_envasado: tote.FechaEnvasado,
                fecha_vencimiento: tote.FechaVencimiento,
                operador: userData.fullname || userData.username
            }));

            displayPreparaciones(preparaciones);
            updateDashboardStats();
        } catch (error) {
            console.error('Error al cargar preparaciones:', error);
        }
    }

    function getEstadoPreparacion(estadoTote) {
        switch (estadoTote) {
            case 'Disponible': return 'Pendiente';
            case 'En Uso': return 'En Proceso';
            case 'Con Cliente': return 'Completado';
            default: return 'Pendiente';
        }
    }

    function displayPreparaciones(preparacionesToShow) {
        if (!preparacionesList) return;

        preparacionesList.innerHTML = '';

        if (preparacionesToShow.length === 0) {
            preparacionesList.innerHTML = '<tr><td colspan="8" class="no-data">No hay preparaciones para mostrar</td></tr>';
            return;
        }

        preparacionesToShow.forEach(prep => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${prep.codigo_tote}</td>
                <td>${prep.cliente_nombre}</td>
                <td><span class="status-badge status-${prep.estado.toLowerCase().replace(/\s+/g, '-')}">${prep.estado}</span></td>
                <td>${prep.fecha_inicio ? new Date(prep.fecha_inicio).toLocaleDateString() : '-'}</td>
                <td>${prep.fecha_envasado ? new Date(prep.fecha_envasado).toLocaleDateString() : '-'}</td>
                <td>${prep.fecha_vencimiento ? new Date(prep.fecha_vencimiento).toLocaleDateString() : '-'}</td>
                <td>${prep.operador}</td>
                <td>
                    <button class="btn-icon" onclick="editPreparacion(${prep.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="controlCalidad(${prep.id})" title="Control Calidad">
                        <i class="fas fa-check-circle"></i>
                    </button>
                    <button class="btn-icon" onclick="completarPreparacion(${prep.id})" title="Completar">
                        <i class="fas fa-check"></i>
                    </button>
                </td>
            `;
            preparacionesList.appendChild(row);
        });
    }

    function filterPreparaciones() {
        const estadoFilter = document.getElementById('estadoPreparacionFilter').value;
        const clienteFilter = document.getElementById('clientePreparacionFilter').value;
        const fechaFilter = document.getElementById('fechaPreparacionFilter').value;

        let filteredPreparaciones = preparaciones.filter(prep => {
            const matchesEstado = !estadoFilter || prep.estado === estadoFilter;
            const matchesCliente = !clienteFilter || prep.cliente_id == clienteFilter;
            const matchesFecha = !fechaFilter || 
                (prep.fecha_inicio && new Date(prep.fecha_inicio).toDateString() === new Date(fechaFilter).toDateString());

            return matchesEstado && matchesCliente && matchesFecha;
        });

        displayPreparaciones(filteredPreparaciones);
    }

    function openPreparacionModal(preparacionId = null) {
        editingPreparacionId = preparacionId;
        const modalTitle = document.getElementById('preparacionModalTitle');
        
        if (preparacionId) {
            modalTitle.textContent = 'Editar Preparación';
            const prep = preparaciones.find(p => p.id === preparacionId);
            if (prep) {
                // Llenar formulario con datos existentes
                // Implementar según necesidades
            }
        } else {
            modalTitle.textContent = 'Nueva Preparación';
            preparacionForm.reset();
            setDefaultDates();
        }

        preparacionModal.style.display = 'block';
    }

    function closePreparacionModal() {
        preparacionModal.style.display = 'none';
        editingPreparacionId = null;
        preparacionForm.reset();
    }

    function openCalidadModal(toteId) {
        document.getElementById('calidadForm').dataset.toteId = toteId;
        calidadModal.style.display = 'block';
    }

    function closeCalidadModal() {
        calidadModal.style.display = 'none';
        document.getElementById('calidadForm').reset();
    }

    async function handlePreparacionSubmit(e) {
        e.preventDefault();

        const formData = new FormData(preparacionForm);
        const preparacionData = {
            tote_id: formData.get('tote_id'),
            cliente_id: formData.get('cliente_id'),
            fecha_inicio: formData.get('fecha_inicio'),
            fecha_envasado: formData.get('fecha_envasado'),
            fecha_vencimiento: formData.get('fecha_vencimiento'),
            observaciones: formData.get('observaciones'),
            operador: userData.username
        };

        // Validaciones
        if (!preparacionData.tote_id || !preparacionData.cliente_id) {
            showMessage('Por favor complete todos los campos obligatorios', 'error');
            return;
        }

        try {
            // Actualizar el tote a estado "En Uso"
            const updateResponse = await fetch(CONFIG.API.BASE_URL + '/api/operador/totes/update-status', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + userData.username
                },
                body: JSON.stringify({
                    tote_id: preparacionData.tote_id,
                    nuevo_estado: 'En Uso',
                    cliente_id: preparacionData.cliente_id,
                    fecha_envasado: preparacionData.fecha_envasado,
                    fecha_vencimiento: preparacionData.fecha_vencimiento,
                    observaciones: preparacionData.observaciones
                })
            });

            const result = await updateResponse.json();

            if (updateResponse.ok && result.success) {
                showMessage('Preparación iniciada exitosamente', 'success');
                closePreparacionModal();
                loadTotes();
                loadPreparaciones();
            } else {
                showMessage(result.message || 'Error al iniciar la preparación', 'error');
            }
        } catch (error) {
            console.error('Error al iniciar preparación:', error);
            showMessage('Error de conexión al iniciar la preparación', 'error');
        }
    }

    async function handleCalidadSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const toteId = form.dataset.toteId;
        const resultado = document.getElementById('resultadoCalidad').value;
        const observaciones = document.getElementById('observacionesCalidad').value;

        if (!resultado) {
            showMessage('Por favor seleccione un resultado', 'error');
            return;
        }

        try {
            // Aquí se implementaría la lógica para guardar el resultado del control de calidad
            // Por ahora, simularemos la respuesta
            showMessage(`Control de calidad registrado: ${resultado}`, 'success');
            closeCalidadModal();
            loadPreparaciones();
        } catch (error) {
            console.error('Error al guardar control de calidad:', error);
            showMessage('Error al guardar el control de calidad', 'error');
        }
    }

    function updateDashboardStats() {
        const stats = {
            enPreparacion: preparaciones.filter(p => p.estado === 'En Proceso').length,
            listos: preparaciones.filter(p => p.estado === 'Completado').length,
            controlCalidad: preparaciones.filter(p => p.estado === 'Control Calidad').length,
            proximosVencimientos: totes.filter(t => {
                if (t.FechaVencimiento) {
                    const vencimiento = new Date(t.FechaVencimiento);
                    const hoy = new Date();
                    const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
                    return diasRestantes <= 7 && diasRestantes >= 0;
                }
                return false;
            }).length
        };

        document.getElementById('enPreparacion').textContent = stats.enPreparacion;
        document.getElementById('totesListos').textContent = stats.listos;
        document.getElementById('controlCalidad').textContent = stats.controlCalidad;
        document.getElementById('proximosVencimientos').textContent = stats.proximosVencimientos;

        // Actualizar gráficos
        updateCharts();
    }

    function updateCharts() {
        updateEstadoPreparacionChart();
        updateProduccionDiariaChart();
    }

    function updateEstadoPreparacionChart() {
        const ctx = document.getElementById('estadoPreparacionChart');
        if (!ctx) return;

        const estadoCounts = {};
        preparaciones.forEach(prep => {
            estadoCounts[prep.estado] = (estadoCounts[prep.estado] || 0) + 1;
        });

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(estadoCounts),
                datasets: [{
                    data: Object.values(estadoCounts),
                    backgroundColor: [
                        '#ffc107', // Pendiente
                        '#007bff', // En Proceso
                        '#28a745', // Completado
                        '#fd7e14'  // Control Calidad
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    function updateProduccionDiariaChart() {
        const ctx = document.getElementById('produccionDiariaChart');
        if (!ctx) return;

        // Datos simulados para los últimos 7 días
        const labels = [];
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - i);
            labels.push(fecha.toLocaleDateString('es-ES', { weekday: 'short' }));
            data.push(Math.floor(Math.random() * 20) + 5); // Datos simulados
        }

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Totes Preparados',
                    data: data,
                    backgroundColor: '#007bff',
                    borderColor: '#0056b3',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    async function loadDashboardStats() {
        updateDashboardStats();
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

    // Funciones globales para los botones de la tabla
    window.editPreparacion = function(id) {
        openPreparacionModal(id);
    };

    window.controlCalidad = function(id) {
        openCalidadModal(id);
    };

    window.completarPreparacion = async function(id) {
        if (!confirm('¿Está seguro de que desea completar esta preparación?')) {
            return;
        }

        try {
            // Actualizar estado del tote a "Con Cliente"
            const response = await fetch(CONFIG.API.BASE_URL + '/api/operador/totes/update-status', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + userData.username
                },
                body: JSON.stringify({
                    tote_id: id,
                    nuevo_estado: 'Con Cliente'
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showMessage('Preparación completada exitosamente', 'success');
                loadTotes();
                loadPreparaciones();
            } else {
                showMessage(result.message || 'Error al completar la preparación', 'error');
            }
        } catch (error) {
            console.error('Error al completar preparación:', error);
            showMessage('Error de conexión al completar la preparación', 'error');
        }
    };
});