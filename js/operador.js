// Las funciones de autenticación y utilidades ahora están en utils.js

// Cargar estadísticas del operador
async function loadOperadorStats() {
    try {
        const userData = checkOperadorAuth();
        if (!userData) return;
        
        const response = await fetch('/api/operador/stats', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.username}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            updateStatsDisplay(stats);
            createMisTotesChart(stats.misTotesPorEstado || []);
        } else {
            console.error('Error al cargar estadísticas');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Actualizar la visualización de estadísticas
function updateStatsDisplay(stats) {
    // Actualizar las métricas principales en el nuevo formato de dashboard
    document.getElementById('misTotesAsignados').textContent = stats.misTotesTotal || 0;
    document.getElementById('totesDisponibles').textContent = stats.totesDisponibles || 0;
    document.getElementById('totesEnLavado').textContent = stats.totesEnLavado || 0;
    document.getElementById('totesConCliente').textContent = stats.totesConCliente || 0;
    document.getElementById('numTareasPendientes').textContent = stats.tareasPendientes || 0;
    
    // Actualizar lista de tareas pendientes
    const tareasPendientesList = document.getElementById('tareasPendientesList');
    tareasPendientesList.innerHTML = '';
    
    if (stats.tareas && stats.tareas.length > 0) {
        stats.tareas.forEach(tarea => {
            const tareaItem = document.createElement('li');
            tareaItem.className = 'details-item';
            tareaItem.innerHTML = `
                <div class="details-title">${tarea.codigo} - ${tarea.descripcion}</div>
                <div class="details-info">
                    <span class="details-status">${tarea.estado || 'Pendiente'}</span>
                </div>
            `;
            tareasPendientesList.appendChild(tareaItem);
        });
    } else {
        const noTareasItem = document.createElement('li');
        noTareasItem.className = 'details-item';
        noTareasItem.innerHTML = `
            <div class="details-title">No hay tareas pendientes</div>
        `;
        tareasPendientesList.appendChild(noTareasItem);
    }
    
    // Crear leyenda personalizada para el gráfico
    createCustomLegend(stats.misTotesPorEstado);
    
    // Actualizar los porcentajes de cambio (simulados para este ejemplo)
    document.querySelectorAll('.metric-change').forEach(el => {
        // Aquí se podría calcular el cambio real si los datos estuvieran disponibles
        const randomChange = (Math.random() * 10 - 5).toFixed(1);
        el.textContent = randomChange > 0 ? `+${randomChange}%` : `${randomChange}%`;
        el.classList.remove('positive', 'negative');
        el.classList.add(randomChange > 0 ? 'positive' : 'negative');
        
        // Actualizar el icono
        const iconSpan = document.createElement('span');
        iconSpan.innerHTML = randomChange > 0 ? '↑' : '↓';
        el.prepend(iconSpan);
    });
}

// Función para crear leyenda personalizada
function createCustomLegend(data) {
    const chartLegend = document.getElementById('chartLegend');
    if (!chartLegend) return;
    
    chartLegend.innerHTML = '';
    
    if (!data || !Array.isArray(data)) return;
    
    // Calcular el total para los porcentajes
    const total = data.reduce((sum, item) => sum + (item.cantidad || 0), 0);
    
    // Crear elementos de leyenda
    data.forEach(item => {
        if (!item.estado || item.cantidad === 0) return;
        
        const percentage = total > 0 ? Math.round((item.cantidad / total) * 100) : 0;
        const color = CONFIG.COLORS.OPERADOR_STATES[item.estado] || CONFIG.COLORS.BACKGROUND.gray;
        
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        
        legendItem.innerHTML = `
            <div class="legend-color" style="background-color: ${color}"></div>
            <div class="legend-label">${item.estado}</div>
            <div class="legend-value">${item.cantidad} (${percentage}%)</div>
        `;
        
        chartLegend.appendChild(legendItem);
    });
}

// Crear gráfico de mis totes
function createMisTotesChart(data) {
    const ctx = document.getElementById('misTotesChart').getContext('2d');
    
    // Destruir gráfico existente si existe
    if (window.misTotesChart instanceof Chart) {
        window.misTotesChart.destroy();
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
        // No hay datos para mostrar
        return;
    }
    
    const labels = data.map(item => item.estado);
    const values = data.map(item => item.cantidad);
    const colors = CONFIG.COLORS.OPERADOR_STATES;
    
    // Crear leyenda personalizada
    createCustomLegend(data);
    
    window.misTotesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: labels.map(label => colors[label] || CONFIG.COLORS.BACKGROUND.gray),
                borderWidth: 4,
                borderColor: '#ffffff',
                hoverOffset: 15,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false // Desactivamos la leyenda por defecto ya que usamos una personalizada
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
                            const value = context.parsed || 0;
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
                animateScale: true,
                duration: 1000,
                easing: 'easeOutQuart'
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

// Función handleLogout ahora está en utils.js

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const userData = checkOperadorAuth();
    if (!userData) return;
    
    // Cargar estadísticas
    loadOperadorStats();
    
    // Configurar botón de logout
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('¿Está seguro que desea cerrar sesión?')) {
            handleLogout();
        }
    });
    
    // Actualizar automáticamente
    setInterval(loadOperadorStats, CONFIG.TIMING.DATA_REFRESH_INTERVAL);
    
    // Mobile menu functionality
    initializeMobileMenu();

    // Función initializeMobileMenu ahora está en utils.js
});