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
                loadAlertas(); // Cargar alertas después de cargar los datos principales
            } else {
                console.error('Error al cargar estadísticas:', result.message);
                showErrorMessage('Error al cargar las estadísticas del dashboard');
            }
        } catch (error) {
            console.error('Error al conectar con el servidor:', error);
            UTILS.showNotification(CONFIG.MESSAGES.ERROR_CONNECTION, 'error');
        }
    }

    // Función para cargar alertas
    async function loadAlertas() {
        try {
            const response = await fetch(CONFIG.API.ENDPOINTS.ALERTAS);
            const result = await response.json();
            
            if (result.success) {
                updateAlertasUI(result.alertas);
            } else {
                console.error('Error al cargar alertas:', result.message);
                showNoAlertas();
            }
        } catch (error) {
            console.error('Error al cargar alertas:', error);
            showNoAlertas();
        }
    }

    // Función para actualizar la UI de alertas
    function updateAlertasUI(alertas) {
        const alertasContent = document.getElementById('alertsContent');
        if (!alertasContent) return;

        if (!alertas || alertas.length === 0) {
            showNoAlertas();
            return;
        }

        alertasContent.innerHTML = '';
        
        alertas.forEach(alerta => {
            const alertItem = document.createElement('div');
            alertItem.className = `alert-item ${alerta.tipo}`;
            
            alertItem.innerHTML = `
                <div class="alert-icon">
                    <i class="${alerta.icono}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${alerta.titulo}</div>
                    <div class="alert-description">${alerta.descripcion}</div>
                    <div class="alert-timestamp">${formatAlertTime(alerta.timestamp)}</div>
                </div>
                ${alerta.accion ? `
                    <div class="alert-actions">
                        <button class="alert-action-btn resolve" onclick="resolverAlerta('${alerta.id}')">
                            ${alerta.accion}
                        </button>
                        <button class="alert-action-btn dismiss" onclick="descartarAlerta('${alerta.id}')">
                            Descartar
                        </button>
                    </div>
                ` : ''}
            `;
            
            alertasContent.appendChild(alertItem);
        });
    }
    
    // Función para mostrar cuando no hay alertas
    function showNoAlertas() {
        const alertasContent = document.getElementById('alertsContent');
        if (!alertasContent) return;
        
        alertasContent.innerHTML = `
            <div class="no-alerts">
                <i class="fas fa-check-circle"></i>
                <h3>¡Todo en orden!</h3>
                <p>No hay alertas activas en este momento</p>
            </div>
        `;
    }



    // Función para formatear el tiempo de la alerta
    function formatAlertTime(fecha) {
        const now = new Date();
        const alertTime = new Date(fecha);
        const diffMs = now - alertTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) {
            return 'Hace un momento';
        } else if (diffMins < 60) {
            return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
        } else if (diffHours < 24) {
            return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        } else {
            return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        }
    }
    
    // Función para resolver una alerta
    window.resolverAlerta = function(alertaId) {
        console.log('Resolviendo alerta:', alertaId);
        // Aquí se puede agregar lógica específica según el tipo de alerta
        switch(alertaId) {
            case 'totes-fuera-plazo':
                window.location.href = 'totes.html?filter=fuera-plazo';
                break;
            case 'totes-proximos-vencer':
                window.location.href = 'totes.html?filter=proximos-vencer';
                break;
            case 'stock-bajo':
                window.location.href = 'totes.html?filter=disponibles';
                break;
            case 'errores-sistema':
                window.location.href = 'eventos.html?filter=errores';
                break;
            case 'usuarios-inactivos':
                window.location.href = 'admin-users.html?filter=inactivos';
                break;
            default:
                UTILS.showNotification('Acción no disponible', 'info');
        }
    };
    
    // Función para descartar una alerta
    window.descartarAlerta = function(alertaId) {
        console.log('Descartando alerta:', alertaId);
        // Remover visualmente la alerta
        const alertElement = document.querySelector(`[onclick*="${alertaId}"]`)?.closest('.alert-item');
        if (alertElement) {
            alertElement.style.transition = 'all 0.3s ease';
            alertElement.style.opacity = '0';
            alertElement.style.transform = 'translateX(100%)';
            setTimeout(() => {
                alertElement.remove();
                // Verificar si quedan alertas
                const remainingAlerts = document.querySelectorAll('.alert-item');
                if (remainingAlerts.length === 0) {
                    showNoAlertas();
                }
            }, 300);
        }
        UTILS.showNotification('Alerta descartada', 'success');
    };
    
    // Event listeners para los botones del panel de alertas
    document.addEventListener('DOMContentLoaded', function() {
        // Botón de actualizar alertas
        const refreshBtn = document.getElementById('refreshAlertsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                const icon = this.querySelector('i');
                icon.classList.add('fa-spin');
                loadAlertas().finally(() => {
                    setTimeout(() => {
                        icon.classList.remove('fa-spin');
                    }, 500);
                });
                UTILS.showNotification('Alertas actualizadas', 'success');
            });
        }
        
        // Botón de configurar alertas
        const configBtn = document.getElementById('configAlertsBtn');
        if (configBtn) {
            configBtn.addEventListener('click', function() {
                UTILS.showNotification('Configuración de alertas próximamente disponible', 'info');
            });
        }
    });

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
        updateTotalTotes(data.totalTotes, data.cambios?.totalTotes);
        
        // Actualizar totes en uso (usando totesEnUso del procedimiento almacenado)
        updateTotesEnUso(data.totesEnUso, data.totalTotes, data.cambios?.totesEnUso);
        
        // Actualizar totes fuera de plazo
        updateTotesFueraPlazo(data.totesFueraPlazo, data.totalFueraPlazo, data.cambios?.fueraPlazo);
        
        // Actualizar usuarios activos
        updateUsuariosActivos(data.usuariosActivos, data.cambios?.usuariosActivos);
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
            borderColor.push('#ffffff');
                borderWidth.push(4);
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
    };

    // Función para actualizar el cambio porcentual de una métrica
    function updateMetricChange(metricId, cambio) {
        // Mapear IDs de métricas a selectores de elementos de cambio
        const changeSelectors = {
            'totalTotes': '.card:nth-child(1) .metric-change',
            'totesEnUso': '.card:nth-child(2) .metric-change',
            'totesFueraPlazo': '.card:nth-child(4) .metric-change',
            'usuariosActivos': '.card:nth-child(5) .metric-change'
        };
        
        const changeElement = document.querySelector(changeSelectors[metricId]);
        if (!changeElement) return;
        
        const percentageSpan = changeElement.querySelector('span');
        const arrowIcon = changeElement.querySelector('i');
        
        if (percentageSpan && arrowIcon) {
            // Formatear el porcentaje
            const formattedChange = Math.abs(cambio).toFixed(1);
            percentageSpan.textContent = `${formattedChange}%`;
            
            // Actualizar clase y icono según el cambio
            changeElement.className = 'metric-change';
            if (cambio > 0) {
                changeElement.classList.add('positive');
                arrowIcon.className = 'fas fa-arrow-up';
            } else if (cambio < 0) {
                changeElement.classList.add('negative');
                arrowIcon.className = 'fas fa-arrow-down';
            } else {
                changeElement.classList.add('neutral');
                arrowIcon.className = 'fas fa-minus';
                percentageSpan.textContent = '0.0%';
            }
        }
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
    function updateTotalTotes(total, cambio) {
        const totalElement = document.getElementById('totalTotes');
        if (totalElement) {
            totalElement.textContent = total;
            totalElement.style.opacity = '1';
        }
        
        // Actualizar porcentaje de cambio
        if (cambio !== undefined) {
            updateMetricChange('totalTotes', cambio);
        }
    }

    // Función para actualizar totes en uso
    function updateTotesEnUso(totesEnUso, totalTotes, cambio) {
        // Actualizar número principal con el valor directo del procedimiento almacenado
        const mainMetric = document.getElementById('totesEnUso');
        if (mainMetric) {
            mainMetric.textContent = totesEnUso;
            mainMetric.style.opacity = '1';
        }
        
        // Actualizar la unidad 'of total'
        const unitElement = mainMetric?.parentElement?.querySelector('.metric-unit');
        if (unitElement && totalTotes) {
            unitElement.textContent = `of ${totalTotes}`;
        }
        
        // Actualizar porcentaje de cambio
        if (cambio !== undefined) {
            updateMetricChange('totesEnUso', cambio);
        }
        
        // Para la lista de detalles, podemos mostrar información adicional si está disponible
        const detailsList = document.querySelector('.card:nth-child(2) .details-list');
        if (detailsList) {
            detailsList.innerHTML = '';
            
            // Mostrar información básica sobre totes en uso
            if (totesEnUso > 0) {
                const detailItem = document.createElement('div');
                detailItem.className = 'detail-item';
                detailItem.innerHTML = `
                    <span class="detail-label">Totes actualmente en uso</span>
                    <span class="detail-value">${totesEnUso} tote${totesEnUso > 1 ? 's' : ''}</span>
                `;
                detailsList.appendChild(detailItem);
            } else {
                const detailItem = document.createElement('div');
                detailItem.className = 'detail-item';
                detailItem.innerHTML = `
                    <span class="detail-label">Sin totes en uso</span>
                    <span class="detail-value">0 totes</span>
                `;
                detailsList.appendChild(detailItem);
            }
        }
    }

    // Función para actualizar totes fuera de plazo
    function updateTotesFueraPlazo(totesFueraPlazo, totalFueraPlazo, cambio) {
        // Actualizar número principal
        const mainMetric = document.getElementById('totesFueraPlazo');
        if (mainMetric) {
            mainMetric.textContent = totalFueraPlazo;
            mainMetric.style.opacity = '1';
        }
        
        // Actualizar porcentaje de cambio
        if (cambio !== undefined) {
            updateMetricChange('totesFueraPlazo', cambio);
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
    function updateUsuariosActivos(total, cambio) {
        const totalElement = document.getElementById('usuariosActivos');
        if (totalElement) {
            totalElement.textContent = total;
            totalElement.style.opacity = '1';
        }
        
        // Actualizar porcentaje de cambio
        if (cambio !== undefined) {
            updateMetricChange('usuariosActivos', cambio);
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

    // Función initializeMobileMenu ahora está en utils.js

 });