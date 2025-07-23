document.addEventListener('DOMContentLoaded', () => {
    // --- Verificación de sesión de administrador ---
    const adminData = UTILS.getSessionData();
    
    if (!adminData || !adminData.username || !adminData.isAdmin) {
        window.location.href = '../index.html';
        return;
    }
    
    // Verificar si la sesión no ha expirado
    if (!UTILS.isSessionValid(adminData)) {
        UTILS.clearSession();
        window.location.href = '../index.html';
        return;
    }

    // Cargar datos del dashboard
    loadDashboardData();
    setInterval(loadDashboardData, CONFIG.TIMING.DATA_REFRESH_INTERVAL);

    // Variable global para el gráfico
    let totesChart = null;

    // Función para cargar datos del dashboard
    async function loadDashboardData() {
        try {
            // Mostrar indicadores de carga
            showLoadingState();
            
            const response = await fetch(CONFIG.API.ENDPOINTS.DASHBOARD_STATS);
            const result = await response.json();
            
            if (result.success) {
                updateDashboardUI(result.data);
            } else {
                console.error('Error al cargar estadísticas:', result.message);
                showErrorMessage('Error al cargar las estadísticas del dashboard');
            }
        } catch (error) {
            console.error('Error al conectar con el servidor:', error);
            UTILS.showNotification(CONFIG.MESSAGES.ERROR_CONNECTION, 'error');
        }
    }

    // Función para mostrar estado de carga
    function showLoadingState() {
        const elements = [
            { id: 'totalTotes', text: CONFIG.MESSAGES.LOADING },
            { id: 'totesConClientes', text: CONFIG.MESSAGES.LOADING },
            { id: 'totesFueraPlazo', text: CONFIG.MESSAGES.LOADING },
            { id: 'usuariosActivos', text: CONFIG.MESSAGES.LOADING }
        ];
        
        elements.forEach(element => {
            const el = document.getElementById(element.id);
            if (el) {
                el.textContent = element.text;
                el.style.opacity = '0.6';
            }
        });
    }

    // Función para actualizar la interfaz con los datos
    function updateDashboardUI(data) {
        // Actualizar gráfico de estado de totes
        updateTotesChart(data.statusStats);
        
        // Actualizar total de totes
        updateTotalTotes(data.totalTotes);
        
        // Actualizar totes con clientes
        updateTotesConClientes(data.totesConClientes, data.totalTotes);
        
        // Actualizar totes fuera de plazo
        updateTotesFueraPlazo(data.totesFueraPlazo, data.totalFueraPlazo);
        
        // Actualizar usuarios activos
        updateUsuariosActivos(data.usuariosActivos);
    }

    // Función para actualizar el gráfico de totes
        function updateTotesChart(statusStats) {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        // Definir todos los estados posibles con sus colores
        const stateColors = CONFIG.COLORS.TOTE_STATES;

        // Filtrar solo los estados que tienen totes (cantidad > 0)
        const activeStates = statusStats.filter(stat => stat.cantidad > 0);

        // Preparar datos para el gráfico solo con estados activos
        const labels = [];
        const data = [];
        const backgroundColor = [];
        const borderColor = [];
        const borderWidth = [];
        
        activeStates.forEach(stat => {
            labels.push(stat.Estado);
            data.push(stat.cantidad);
            
            // Usar el color definido para el estado
            const color = stateColors[stat.Estado] || CONFIG.COLORS.BACKGROUND.gray;
            backgroundColor.push(color);
            borderColor.push(document.documentElement.getAttribute('data-theme') === 'dark' ? 'transparent' : '#ffffff');
            borderWidth.push(document.documentElement.getAttribute('data-theme') === 'dark' ? 0 : 4);
        });

        // Destruir gráfico anterior si existe
        if (totesChart) {
            totesChart.destroy();
        }

        // Crear leyenda personalizada
        createCustomLegend(labels, data, backgroundColor);

        // Crear nuevo gráfico
        totesChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Estado de Totes',
                    data: data,
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                    hoverBorderWidth: borderWidth.map(w => w + 1),
                    hoverBorderColor: borderColor
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#ffffff',
                        borderWidth: 1,
                        cornerRadius: 6,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                
                                if (value === 0) {
                                    return `${label}: Sin datos disponibles`;
                                } else {
                                    return `${label}: ${value} totes (${percentage}%)`;
                                }
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animation: {
                    animateRotate: true,
                    animateScale: false
                }
            },
            plugins: [{
                id: 'doughnutlabel',
                afterDatasetsDraw: function(chart, args, options) {
                    const { ctx, data } = chart;
                    const meta = chart.getDatasetMeta(0);
                    
                    meta.data.forEach((element, index) => {
                        const value = data.datasets[0].data[index];
                        
                        // Solo mostrar números para valores mayores a 0
                        if (value > 0) {
                            const { x, y } = element.tooltipPosition();
                            
                            ctx.save();
                            ctx.font = 'bold 14px Arial';
                            ctx.fillStyle = '#ffffff';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            
                            // Agregar sombra al texto para mejor legibilidad
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                            ctx.shadowBlur = 3;
                            ctx.shadowOffsetX = 1;
                            ctx.shadowOffsetY = 1;
                            
                            ctx.fillText(value.toString(), x, y);
                            ctx.restore();
                        }
                    });
                }
            }]
        });
    }

    // Función para crear leyenda personalizada
    function createCustomLegend(labels, data, backgroundColor) {
        const legendContainer = document.getElementById('chartLegend');
        if (!legendContainer) return;

        legendContainer.innerHTML = '';

        labels.forEach((label, index) => {
            const value = data[index];
            const color = backgroundColor[index];
            
            // Extraer el color base sin transparencia para el borde
            const baseColor = color.length > 7 ? color.substring(0, 7) : color;
            
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.style.borderLeftColor = baseColor;
            
            legendItem.innerHTML = `
                <div class="legend-item-info">
                    <div class="legend-color" style="background-color: ${color};"></div>
                    <span class="legend-label">${label}</span>
                </div>
                <span class="legend-value ${value === 0 ? 'zero' : ''}">
                    ${value === 0 ? 'Sin datos' : value}
                </span>
            `;
            
            legendContainer.appendChild(legendItem);
        });
    }

    // Función para actualizar total de totes
    function updateTotalTotes(total) {
        const totalElement = document.getElementById('totalTotes');
        if (totalElement) {
            totalElement.textContent = total;
            totalElement.style.opacity = '1';
        }
    }

    // Función para actualizar totes en uso
    function updateTotesConClientes(totesConClientes, totalTotes) {
        const totalConClientes = totesConClientes.reduce((sum, item) => sum + item.cantidad, 0);
        
        // Actualizar número principal
        const mainMetric = document.getElementById('totesEnUso');
        if (mainMetric) {
            mainMetric.textContent = totalConClientes;
            mainMetric.style.opacity = '1';
        }
        
        // Actualizar la unidad 'of total'
        const unitElement = mainMetric?.parentElement?.querySelector('.metric-unit');
        if (unitElement && totalTotes) {
            unitElement.textContent = `of ${totalTotes}`;
        }
        
        // Actualizar lista de detalles
        const detailsList = document.querySelector('.card:nth-child(2) .details-list');
        if (detailsList) {
            detailsList.innerHTML = '';
            totesConClientes.forEach(item => {
                const detailItem = document.createElement('div');
                detailItem.className = 'detail-item';
                detailItem.innerHTML = `
                    <span class="detail-label">${item.Cliente}</span>
                    <span class="detail-value">${item.cantidad} tote${item.cantidad > 1 ? 's' : ''}</span>
                `;
                detailsList.appendChild(detailItem);
            });
        }
    }

    // Función para actualizar totes fuera de plazo
    function updateTotesFueraPlazo(totesFueraPlazo, totalFueraPlazo) {
        // Actualizar número principal
        const mainMetric = document.getElementById('totesFueraPlazo');
        if (mainMetric) {
            mainMetric.textContent = totalFueraPlazo;
            mainMetric.style.opacity = '1';
        }
        
        // Actualizar lista de detalles
        const detailsList = document.querySelector('.card:nth-child(4) .details-list');
        if (detailsList) {
            detailsList.innerHTML = '';
            totesFueraPlazo.forEach(item => {
                const detailItem = document.createElement('div');
                detailItem.className = 'detail-item';
                detailItem.innerHTML = `
                    <span class="detail-label">${item.Cliente}</span>
                    <span class="detail-value danger-text">${item.cantidad} tote${item.cantidad > 1 ? 's' : ''}</span>
                `;
                detailsList.appendChild(detailItem);
            });
        }
    }

    // Función para actualizar usuarios activos
    function updateUsuariosActivos(total) {
        const totalElement = document.getElementById('usuariosActivos');
        if (totalElement) {
            totalElement.textContent = total;
            totalElement.style.opacity = '1';
        }
    }

    // Función para mostrar mensajes de error (usar UTILS.showNotification en su lugar)

    // --- Lógica para el botón de cerrar sesión ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            UTILS.clearSession();
            window.location.href = '../index.html';
        });
    }

    // Mobile menu functionality
    initializeMobileMenu();

    function initializeMobileMenu() {
        // Create mobile menu toggle button
        const mobileToggle = document.createElement('button');
        mobileToggle.className = 'mobile-menu-toggle';
        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
        mobileToggle.setAttribute('aria-label', 'Toggle mobile menu');
        
        // Create sidebar overlay
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        
        // Add elements to DOM
        document.body.appendChild(mobileToggle);
        document.body.appendChild(overlay);
        
        const sidebar = document.querySelector('.sidebar');
        
        // Toggle sidebar function
        function toggleSidebar() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
            
            // Update button icon
            const icon = mobileToggle.querySelector('i');
            icon.className = sidebar.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
        }
        
        // Close sidebar function
        function closeSidebar() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            
            // Reset button icon
            const icon = mobileToggle.querySelector('i');
            icon.className = 'fas fa-bars';
        }
        
        // Event listeners
        mobileToggle.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', closeSidebar);
        
        // Close sidebar when clicking on navigation links (mobile)
        const navLinks = sidebar.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
            });
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                closeSidebar();
            }
        });
        
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                closeSidebar();
            }
        });
    }

 });