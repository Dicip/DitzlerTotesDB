document.addEventListener('DOMContentLoaded', () => {
    // --- Verificación de sesión de administrador ---
    const storedAdmin = localStorage.getItem('loggedInAdmin') || sessionStorage.getItem('loggedInAdmin');
    
    if (!storedAdmin) {
        // Si no hay datos de sesión, redirigir a la página de inicio de sesión
        window.location.href = '../index.html';
        return; // Detener la ejecución del script si no hay sesión
    }

    try {
        const adminData = JSON.parse(storedAdmin);
        // Opcional: Verificar si el usuario es realmente un administrador
        if (!adminData.isAdmin) {
            // Si no es admin, limpiar la sesión y redirigir
            localStorage.removeItem('loggedInAdmin');
            sessionStorage.removeItem('loggedInAdmin');
            window.location.href = '../index.html';
            return;
        }
    } catch (error) {
        console.error('Error al parsear los datos de sesión:', error);
        // Limpiar datos corruptos y redirigir
        localStorage.removeItem('loggedInAdmin');
        sessionStorage.removeItem('loggedInAdmin');
        window.location.href = '../index.html';
        return;
    }

    // Cargar datos del dashboard
    loadDashboardData();
    setInterval(loadDashboardData, 30000); // Actualizar cada 30 segundos

    // Variable global para el gráfico
    let totesChart = null;

    // Función para cargar datos del dashboard
    async function loadDashboardData() {
        try {
            const response = await fetch('/api/dashboard/stats');
            const result = await response.json();
            
            if (result.success) {
                updateDashboardUI(result.data);
            } else {
                console.error('Error al cargar estadísticas:', result.message);
                showErrorMessage('Error al cargar las estadísticas del dashboard');
            }
        } catch (error) {
            console.error('Error al conectar con el servidor:', error);
            showErrorMessage('Error de conexión con el servidor');
        }
    }

    // Función para actualizar la interfaz con los datos
    function updateDashboardUI(data) {
        // Actualizar gráfico de estado de totes
        updateTotesChart(data.statusStats);
        
        // Actualizar total de totes
        updateTotalTotes(data.totalTotes);
        
        // Actualizar totes con clientes
        updateTotesConClientes(data.totesConClientes);
        
        // Actualizar totes fuera de plazo
        updateTotesFueraPlazo(data.totesFueraPlazo, data.totalFueraPlazo);
        
        // Actualizar usuarios activos
        updateUsuariosActivos(data.usuariosActivos);
    }

    // Función para actualizar el gráfico de totes
        function updateTotesChart(statusStats) {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        // Definir todos los estados posibles
        const allStates = {
            'Con Cliente': '#4A90E2',
            'Disponible': '#50E3C2',
            'En Lavado': '#7ED321',
            'En Mantenimiento': '#F5A623',
            'En Uso': '#9013FE',
            'Fuera de Servicio': '#D0021B'
        };

        // Crear un mapa de los datos existentes
        const dataMap = {};
        statusStats.forEach(stat => {
            dataMap[stat.Estado] = stat.cantidad;
        });

        // Preparar datos para el gráfico incluyendo todos los estados
        const labels = [];
        const data = [];
        const backgroundColor = [];
        const borderColor = [];
        const borderWidth = [];
        
        Object.keys(allStates).forEach(state => {
            labels.push(state);
            const count = dataMap[state] || 0;
            data.push(count);
            
            if (count > 0) {
                // Estados con datos: colores normales
                backgroundColor.push(allStates[state]);
                borderColor.push(document.documentElement.getAttribute('data-theme') === 'dark' ? 'transparent' : '#ffffff');
                borderWidth.push(document.documentElement.getAttribute('data-theme') === 'dark' ? 0 : 4);
            } else {
                // Estados sin datos: colores atenuados con patrón
                backgroundColor.push(allStates[state] + '20'); // 20 = 12.5% opacity
                borderColor.push(allStates[state]);
                borderWidth.push(2);
            }
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
        }
    }

    // Función para actualizar totes con clientes
    function updateTotesConClientes(totesConClientes) {
        const totalConClientes = totesConClientes.reduce((sum, item) => sum + item.cantidad, 0);
        
        // Actualizar número principal
        const mainMetric = document.getElementById('totesConClientes');
        if (mainMetric) {
            mainMetric.textContent = totalConClientes;
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
        }
    }

    // Función para mostrar mensajes de error
    function showErrorMessage(message) {
        // Crear elemento de alerta si no existe
        let alertElement = document.querySelector('.dashboard-alert');
        if (!alertElement) {
            alertElement = document.createElement('div');
            alertElement.className = 'dashboard-alert alert-error';
            alertElement.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: #f8d7da;
                color: #721c24;
                padding: 12px 20px;
                border: 1px solid #f5c6cb;
                border-radius: 4px;
                z-index: 1000;
                max-width: 300px;
            `;
            document.body.appendChild(alertElement);
        }
        
        alertElement.textContent = message;
        alertElement.style.display = 'block';
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, 5000);
    }

    // --- Lógica para el botón de cerrar sesión ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir la acción por defecto del enlace
            
            // Limpiar almacenamiento local y de sesión
            localStorage.removeItem('loggedInAdmin');
            sessionStorage.removeItem('loggedInAdmin');
            
            // Redirigir a la página de inicio de sesión
            window.location.href = '../index.html';
        });
    }


 });