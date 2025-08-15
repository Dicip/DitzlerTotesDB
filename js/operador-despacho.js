document.addEventListener('DOMContentLoaded', function() {
    // Verificación de sesión
    const userData = JSON.parse(sessionStorage.getItem('loggedInAdmin')) || JSON.parse(localStorage.getItem('loggedInAdmin'));
    if (!userData || (userData.role !== 'Operador Despacho' && userData.role !== 'Calidad/Despacho' && userData.role !== 'Admin' && userData.role !== 'Administrador')) {
        window.location.href = '../index.html';
        return;
    }

    // Variables globales
    let despachos = [];
    let clientes = [];
    let transportistas = [];
    let totes = [];
    let currentSection = 'panelControl';
    let editingDespachoId = null;

    // Referencias a elementos del DOM
    const sections = {
        panelControl: document.getElementById('panelControl'),
        despacho: document.getElementById('despacho'),
        entregas: document.getElementById('entregas'),
        transporte: document.getElementById('transporte'),
        reportesDespacho: document.getElementById('reportesDespacho')
    };

    const navLinks = {
        despachoTab: document.getElementById('despachoTab'),
        entregasTab: document.getElementById('entregasTab'),
        transporteTab: document.getElementById('transporteTab'),
        reportesDespachoTab: document.getElementById('reportesDespachoTab')
    };

    const despachosList = document.getElementById('despachosList');
    const entregasHoyList = document.getElementById('entregasHoyList');
    const despachoForm = document.getElementById('despachoForm');
    const transportistaForm = document.getElementById('transportistaForm');
    const despachoModal = document.getElementById('despachoModal');
    const transportistaModal = document.getElementById('transportistaModal');
    const messageContainer = document.getElementById('messageContainer');
    const logoutBtn = document.getElementById('logoutBtn');

    // Inicialización
    init();

    function init() {
        setupEventListeners();
        loadClientes();
        loadTransportistas();
        loadTotes();
        loadDespachos();
        loadDashboardStats();
        showSection('panelControl');
        setDefaultDates();
    }

    function setupEventListeners() {
        // Navegación
        navLinks.despachoTab.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('despacho');
        });

        navLinks.entregasTab.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('entregas');
        });

        navLinks.transporteTab.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('transporte');
        });

        navLinks.reportesDespachoTab.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('reportesDespacho');
        });

        // Logout
        logoutBtn.addEventListener('click', function() {
            if (confirm('¿Está seguro que desea cerrar sesión?')) {
                UTILS.clearSession();
                window.location.href = '../index.html';
            }
        });

        // Modales
        document.getElementById('nuevoDespachoBtn').addEventListener('click', () => openDespachoModal());
        document.getElementById('closeDespachoModal').addEventListener('click', closeDespachoModal);
        document.getElementById('cancelDespachoBtn').addEventListener('click', closeDespachoModal);
        
        document.getElementById('nuevoTransportistaBtn').addEventListener('click', () => openTransportistaModal());
        document.getElementById('closeTransportistaModal').addEventListener('click', closeTransportistaModal);
        document.getElementById('cancelTransportistaBtn').addEventListener('click', closeTransportistaModal);
        
        despachoForm.addEventListener('submit', handleDespachoSubmit);
        transportistaForm.addEventListener('submit', handleTransportistaSubmit);

        // Filtros
        document.getElementById('estadoDespachoFilter').addEventListener('change', filterDespachos);
        document.getElementById('clienteDespachoFilter').addEventListener('change', filterDespachos);
        document.getElementById('fechaDespachoFilter').addEventListener('change', filterDespachos);
        document.getElementById('transportistaFilter').addEventListener('change', filterDespachos);

        // Confirmar entrega
        document.getElementById('confirmarEntregaBtn').addEventListener('click', confirmarEntrega);
        document.getElementById('codigoEntrega').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                confirmarEntrega();
            }
        });

        // Optimizar rutas
        document.getElementById('optimizarRutasBtn').addEventListener('click', optimizarRutas);

        // Generar reporte
        document.getElementById('generarReporteBtn').addEventListener('click', generarReporte);
    }

    function setDefaultDates() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const datetime = now.toISOString().slice(0, 16);
        
        document.getElementById('fechaProgramadaDespacho').value = datetime;
        document.getElementById('fechaDespachoFilter').value = today;
        document.getElementById('fechaInicioReporte').value = today;
        document.getElementById('fechaFinReporte').value = today;
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
            document.getElementById('clienteDespacho'),
            document.getElementById('clienteDespachoFilter')
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

    async function loadTransportistas() {
        try {
            // Simular datos de transportistas (en una implementación real, esto vendría de la API)
            transportistas = [
                { id: 1, nombre: 'Juan Pérez', telefono: '555-0001', vehiculo: 'Camión', placa: 'ABC-123', estado: 'Disponible' },
                { id: 2, nombre: 'María García', telefono: '555-0002', vehiculo: 'Furgoneta', placa: 'DEF-456', estado: 'En Ruta' },
                { id: 3, nombre: 'Carlos López', telefono: '555-0003', vehiculo: 'Camión', placa: 'GHI-789', estado: 'Disponible' }
            ];
            
            populateTransportistaSelects();
            displayTransportistas();
        } catch (error) {
            console.error('Error al cargar transportistas:', error);
        }
    }

    function populateTransportistaSelects() {
        const selects = [
            document.getElementById('transportistaDespacho'),
            document.getElementById('transportistaFilter')
        ];
        
        selects.forEach(select => {
            if (select) {
                // Limpiar opciones existentes (excepto la primera)
                while (select.children.length > 1) {
                    select.removeChild(select.lastChild);
                }

                // Agregar transportistas
                transportistas.forEach(transportista => {
                    const option = document.createElement('option');
                    option.value = transportista.id;
                    option.textContent = `${transportista.nombre} - ${transportista.vehiculo}`;
                    select.appendChild(option);
                });
            }
        });
    }

    function displayTransportistas() {
        const disponiblesContainer = document.getElementById('transportistasDisponibles');
        const enRutaContainer = document.getElementById('transportistasEnRuta');
        
        if (disponiblesContainer) {
            disponiblesContainer.innerHTML = '';
            transportistas.filter(t => t.estado === 'Disponible').forEach(transportista => {
                const div = document.createElement('div');
                div.className = 'transportista-item';
                div.innerHTML = `
                    <strong>${transportista.nombre}</strong><br>
                    <small>${transportista.vehiculo} - ${transportista.placa}</small><br>
                    <small><i class="fas fa-phone"></i> ${transportista.telefono}</small>
                `;
                disponiblesContainer.appendChild(div);
            });
        }

        if (enRutaContainer) {
            enRutaContainer.innerHTML = '';
            transportistas.filter(t => t.estado === 'En Ruta').forEach(transportista => {
                const div = document.createElement('div');
                div.className = 'transportista-item';
                div.innerHTML = `
                    <strong>${transportista.nombre}</strong><br>
                    <small>${transportista.vehiculo} - ${transportista.placa}</small><br>
                    <small><i class="fas fa-route"></i> En ruta</small>
                `;
                enRutaContainer.appendChild(div);
            });
        }
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
                populateTotesSelect();
            }
        } catch (error) {
            console.error('Error al cargar totes:', error);
        }
    }

    function populateTotesSelect() {
        const select = document.getElementById('totesDespacho');
        if (!select) return;

        // Limpiar opciones existentes
        select.innerHTML = '';

        // Agregar solo totes listos para despacho (Con Cliente)
        const totesListos = totes.filter(tote => tote.Estado === 'Con Cliente');
        totesListos.forEach(tote => {
            const option = document.createElement('option');
            option.value = tote.Id;
            option.textContent = `${tote.Codigo} - ${tote.ClienteNombre || 'Sin cliente'}`;
            select.appendChild(option);
        });
    }

    async function loadDespachos() {
        try {
            // Simular datos de despachos basados en totes
            despachos = totes.filter(tote => tote.Estado === 'Con Cliente').map((tote, index) => ({
                id: index + 1,
                cliente_nombre: tote.ClienteNombre || 'Sin asignar',
                cliente_id: tote.ClienteId,
                totes: [tote.Codigo],
                estado: getEstadoDespacho(),
                fecha_programada: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
                transportista: transportistas[Math.floor(Math.random() * transportistas.length)]?.nombre || 'Sin asignar',
                direccion: 'Dirección de ejemplo',
                observaciones: ''
            }));

            displayDespachos(despachos);
            loadEntregasHoy();
            updateDashboardStats();
        } catch (error) {
            console.error('Error al cargar despachos:', error);
        }
    }

    function getEstadoDespacho() {
        const estados = ['Pendiente', 'En Preparación', 'Listo', 'En Tránsito', 'Entregado'];
        return estados[Math.floor(Math.random() * estados.length)];
    }

    function displayDespachos(despachosToShow) {
        if (!despachosList) return;

        despachosList.innerHTML = '';

        if (despachosToShow.length === 0) {
            despachosList.innerHTML = '<tr><td colspan="8" class="no-data">No hay despachos para mostrar</td></tr>';
            return;
        }

        despachosToShow.forEach(despacho => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>DSP-${String(despacho.id).padStart(4, '0')}</td>
                <td>${despacho.cliente_nombre}</td>
                <td>${despacho.totes.length} tote(s)</td>
                <td><span class="status-badge status-${despacho.estado.toLowerCase().replace(/\s+/g, '-')}">${despacho.estado}</span></td>
                <td>${new Date(despacho.fecha_programada).toLocaleDateString()}</td>
                <td>${despacho.transportista}</td>
                <td>${despacho.direccion}</td>
                <td>
                    <button class="btn-icon" onclick="editDespacho(${despacho.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="iniciarDespacho(${despacho.id})" title="Iniciar Despacho">
                        <i class="fas fa-truck"></i>
                    </button>
                    <button class="btn-icon" onclick="verDetalles(${despacho.id})" title="Ver Detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            despachosList.appendChild(row);
        });
    }

    function loadEntregasHoy() {
        const hoy = new Date().toDateString();
        const entregasHoy = despachos.filter(despacho => 
            new Date(despacho.fecha_programada).toDateString() === hoy
        );

        displayEntregasHoy(entregasHoy);
    }

    function displayEntregasHoy(entregas) {
        if (!entregasHoyList) return;

        entregasHoyList.innerHTML = '';

        if (entregas.length === 0) {
            entregasHoyList.innerHTML = '<tr><td colspan="7" class="no-data">No hay entregas programadas para hoy</td></tr>';
            return;
        }

        entregas.forEach(entrega => {
            const row = document.createElement('tr');
            const hora = new Date(entrega.fecha_programada).toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            row.innerHTML = `
                <td>${hora}</td>
                <td>${entrega.cliente_nombre}</td>
                <td>${entrega.direccion}</td>
                <td>${entrega.totes.length} tote(s)</td>
                <td>${entrega.transportista}</td>
                <td><span class="status-badge status-${entrega.estado.toLowerCase().replace(/\s+/g, '-')}">${entrega.estado}</span></td>
                <td>
                    <button class="btn-icon" onclick="confirmarEntregaManual(${entrega.id})" title="Confirmar Entrega">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-icon" onclick="contactarTransportista(${entrega.id})" title="Contactar">
                        <i class="fas fa-phone"></i>
                    </button>
                </td>
            `;
            entregasHoyList.appendChild(row);
        });
    }

    function filterDespachos() {
        const estadoFilter = document.getElementById('estadoDespachoFilter').value;
        const clienteFilter = document.getElementById('clienteDespachoFilter').value;
        const fechaFilter = document.getElementById('fechaDespachoFilter').value;
        const transportistaFilter = document.getElementById('transportistaFilter').value;

        let filteredDespachos = despachos.filter(despacho => {
            const matchesEstado = !estadoFilter || despacho.estado === estadoFilter;
            const matchesCliente = !clienteFilter || despacho.cliente_id == clienteFilter;
            const matchesFecha = !fechaFilter || 
                new Date(despacho.fecha_programada).toDateString() === new Date(fechaFilter).toDateString();
            const matchesTransportista = !transportistaFilter || 
                despacho.transportista.toLowerCase().includes(transportistaFilter.toLowerCase());

            return matchesEstado && matchesCliente && matchesFecha && matchesTransportista;
        });

        displayDespachos(filteredDespachos);
    }

    function openDespachoModal(despachoId = null) {
        editingDespachoId = despachoId;
        const modalTitle = document.getElementById('despachoModalTitle');
        
        if (despachoId) {
            modalTitle.textContent = 'Editar Despacho';
            const despacho = despachos.find(d => d.id === despachoId);
            if (despacho) {
                // Llenar formulario con datos existentes
                // Implementar según necesidades
            }
        } else {
            modalTitle.textContent = 'Nuevo Despacho';
            despachoForm.reset();
            setDefaultDates();
        }

        despachoModal.style.display = 'block';
    }

    function closeDespachoModal() {
        despachoModal.style.display = 'none';
        editingDespachoId = null;
        despachoForm.reset();
    }

    function openTransportistaModal() {
        transportistaModal.style.display = 'block';
    }

    function closeTransportistaModal() {
        transportistaModal.style.display = 'none';
        transportistaForm.reset();
    }

    async function handleDespachoSubmit(e) {
        e.preventDefault();

        const formData = new FormData(despachoForm);
        const despachoData = {
            cliente_id: formData.get('cliente_id'),
            totes: Array.from(document.getElementById('totesDespacho').selectedOptions).map(option => option.value),
            fecha_programada: formData.get('fecha_programada'),
            transportista_id: formData.get('transportista_id'),
            direccion: formData.get('direccion'),
            observaciones: formData.get('observaciones')
        };

        // Validaciones
        if (!despachoData.cliente_id || despachoData.totes.length === 0 || !despachoData.direccion) {
            showMessage('Por favor complete todos los campos obligatorios', 'error');
            return;
        }

        try {
            // Simular creación de despacho
            showMessage('Despacho creado exitosamente', 'success');
            closeDespachoModal();
            loadDespachos();
        } catch (error) {
            console.error('Error al crear despacho:', error);
            showMessage('Error al crear el despacho', 'error');
        }
    }

    async function handleTransportistaSubmit(e) {
        e.preventDefault();

        const formData = new FormData(transportistaForm);
        const transportistaData = {
            nombre: formData.get('nombre'),
            telefono: formData.get('telefono'),
            vehiculo: formData.get('vehiculo'),
            placa: formData.get('placa'),
            observaciones: formData.get('observaciones')
        };

        // Validaciones
        if (!transportistaData.nombre || !transportistaData.telefono) {
            showMessage('Por favor complete los campos obligatorios', 'error');
            return;
        }

        try {
            // Simular creación de transportista
            const nuevoTransportista = {
                id: transportistas.length + 1,
                ...transportistaData,
                estado: 'Disponible'
            };
            
            transportistas.push(nuevoTransportista);
            populateTransportistaSelects();
            displayTransportistas();
            
            showMessage('Transportista agregado exitosamente', 'success');
            closeTransportistaModal();
        } catch (error) {
            console.error('Error al crear transportista:', error);
            showMessage('Error al crear el transportista', 'error');
        }
    }

    function confirmarEntrega() {
        const codigo = document.getElementById('codigoEntrega').value.trim();
        
        if (!codigo) {
            showMessage('Por favor ingrese un código de entrega', 'error');
            return;
        }

        // Simular confirmación de entrega
        showMessage(`Entrega confirmada para código: ${codigo}`, 'success');
        document.getElementById('codigoEntrega').value = '';
        loadDespachos();
    }

    function optimizarRutas() {
        const rutasContainer = document.getElementById('rutasOptimizadas');
        
        // Simular optimización de rutas
        rutasContainer.innerHTML = `
            <div class="ruta-optimizada">
                <h4><i class="fas fa-route"></i> Ruta Optimizada 1</h4>
                <p><strong>Transportista:</strong> Juan Pérez</p>
                <p><strong>Entregas:</strong> 3 paradas</p>
                <p><strong>Distancia estimada:</strong> 45 km</p>
                <p><strong>Tiempo estimado:</strong> 2.5 horas</p>
            </div>
            <div class="ruta-optimizada">
                <h4><i class="fas fa-route"></i> Ruta Optimizada 2</h4>
                <p><strong>Transportista:</strong> Carlos López</p>
                <p><strong>Entregas:</strong> 2 paradas</p>
                <p><strong>Distancia estimada:</strong> 30 km</p>
                <p><strong>Tiempo estimado:</strong> 1.8 horas</p>
            </div>
        `;
        
        showMessage('Rutas optimizadas generadas exitosamente', 'success');
    }

    function generarReporte() {
        const fechaInicio = document.getElementById('fechaInicioReporte').value;
        const fechaFin = document.getElementById('fechaFinReporte').value;
        const tipoReporte = document.getElementById('tipoReporte').value;
        const reporteContainer = document.getElementById('reporteResultado');

        if (!fechaInicio || !fechaFin) {
            showMessage('Por favor seleccione las fechas del reporte', 'error');
            return;
        }

        // Simular generación de reporte
        reporteContainer.innerHTML = `
            <div class="reporte-header">
                <h3>Reporte de ${tipoReporte.charAt(0).toUpperCase() + tipoReporte.slice(1)}</h3>
                <p>Período: ${new Date(fechaInicio).toLocaleDateString()} - ${new Date(fechaFin).toLocaleDateString()}</p>
            </div>
            <div class="reporte-stats">
                <div class="stat-item">
                    <span class="stat-label">Total Entregas:</span>
                    <span class="stat-value">25</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Entregas a Tiempo:</span>
                    <span class="stat-value">23 (92%)</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Entregas Tardías:</span>
                    <span class="stat-value">2 (8%)</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Eficiencia Promedio:</span>
                    <span class="stat-value">94.5%</span>
                </div>
            </div>
        `;
        
        showMessage('Reporte generado exitosamente', 'success');
    }

    function updateDashboardStats() {
        const stats = {
            pendientes: despachos.filter(d => d.estado === 'Pendiente').length,
            enTransito: despachos.filter(d => d.estado === 'En Tránsito').length,
            entregados: despachos.filter(d => {
                const hoy = new Date().toDateString();
                return d.estado === 'Entregado' && new Date(d.fecha_programada).toDateString() === hoy;
            }).length,
            urgentes: despachos.filter(d => {
                const fechaDespacho = new Date(d.fecha_programada);
                const hoy = new Date();
                const horasRestantes = (fechaDespacho - hoy) / (1000 * 60 * 60);
                return horasRestantes <= 24 && horasRestantes >= 0 && d.estado !== 'Entregado';
            }).length
        };

        document.getElementById('pendientesDespacho').textContent = stats.pendientes;
        document.getElementById('enTransito').textContent = stats.enTransito;
        document.getElementById('entregados').textContent = stats.entregados;
        document.getElementById('urgentes').textContent = stats.urgentes;

        // Actualizar gráficos
        updateCharts();
    }

    function updateCharts() {
        updateEstadoDespachoChart();
        updateEntregasDiariaChart();
    }

    function updateEstadoDespachoChart() {
        const ctx = document.getElementById('estadoDespachoChart');
        if (!ctx) return;

        const estadoCounts = {};
        despachos.forEach(despacho => {
            estadoCounts[despacho.estado] = (estadoCounts[despacho.estado] || 0) + 1;
        });

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(estadoCounts),
                datasets: [{
                    data: Object.values(estadoCounts),
                    backgroundColor: [
                        '#ffc107', // Pendiente
                        '#17a2b8', // En Preparación
                        '#007bff', // Listo
                        '#fd7e14', // En Tránsito
                        '#28a745'  // Entregado
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

    function updateEntregasDiariaChart() {
        const ctx = document.getElementById('entregasDiariaChart');
        if (!ctx) return;

        // Datos simulados para los últimos 7 días
        const labels = [];
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - i);
            labels.push(fecha.toLocaleDateString('es-ES', { weekday: 'short' }));
            data.push(Math.floor(Math.random() * 15) + 3); // Datos simulados
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Entregas Realizadas',
                    data: data,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4,
                    fill: true
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
    window.editDespacho = function(id) {
        openDespachoModal(id);
    };

    window.iniciarDespacho = async function(id) {
        if (!confirm('¿Está seguro de que desea iniciar este despacho?')) {
            return;
        }

        try {
            // Simular inicio de despacho
            const despacho = despachos.find(d => d.id === id);
            if (despacho) {
                despacho.estado = 'En Tránsito';
                displayDespachos(despachos);
                updateDashboardStats();
                showMessage('Despacho iniciado exitosamente', 'success');
            }
        } catch (error) {
            console.error('Error al iniciar despacho:', error);
            showMessage('Error al iniciar el despacho', 'error');
        }
    };

    window.verDetalles = function(id) {
        const despacho = despachos.find(d => d.id === id);
        if (despacho) {
            alert(`Detalles del Despacho DSP-${String(id).padStart(4, '0')}:\n\nCliente: ${despacho.cliente_nombre}\nTotes: ${despacho.totes.join(', ')}\nEstado: ${despacho.estado}\nTransportista: ${despacho.transportista}\nDirección: ${despacho.direccion}`);
        }
    };

    window.confirmarEntregaManual = async function(id) {
        if (!confirm('¿Confirmar la entrega de este despacho?')) {
            return;
        }

        try {
            const despacho = despachos.find(d => d.id === id);
            if (despacho) {
                despacho.estado = 'Entregado';
                displayDespachos(despachos);
                loadEntregasHoy();
                updateDashboardStats();
                showMessage('Entrega confirmada exitosamente', 'success');
            }
        } catch (error) {
            console.error('Error al confirmar entrega:', error);
            showMessage('Error al confirmar la entrega', 'error');
        }
    };

    window.contactarTransportista = function(id) {
        const despacho = despachos.find(d => d.id === id);
        if (despacho) {
            const transportista = transportistas.find(t => t.nombre === despacho.transportista);
            if (transportista) {
                alert(`Contactando a ${transportista.nombre}\nTeléfono: ${transportista.telefono}`);
            }
        }
    };
});