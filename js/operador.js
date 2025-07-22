// Verificar autenticación del operador
function checkOperadorAuth() {
    const storedUser = localStorage.getItem('loggedInAdmin') || sessionStorage.getItem('loggedInAdmin');
    
    if (!storedUser) {
        window.location.href = '../index.html';
        return null;
    }
    
    try {
        const userData = JSON.parse(storedUser);
        const currentTime = new Date().getTime();
        const sessionTime = userData.timestamp;
        
        // Verificar si la sesión no ha expirado (8 horas)
        if (currentTime - sessionTime > 8 * 60 * 60 * 1000) {
            localStorage.removeItem('loggedInAdmin');
            sessionStorage.removeItem('loggedInAdmin');
            window.location.href = '../index.html';
            return null;
        }
        
        // Verificar que sea operador o admin
        if (userData.role !== 'Operador' && userData.role !== 'Admin') {
            alert('Acceso denegado. Esta página es solo para operadores.');
            window.location.href = '../index.html';
            return null;
        }
        
        return userData;
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        window.location.href = '../index.html';
        return null;
    }
}

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
    
    // Determinar si estamos en modo oscuro
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const borderColor = isDarkMode ? 'transparent' : '#ffffff';
    
    window.misTotesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: labels.map(label => colors[label] || CONFIG.COLORS.BACKGROUND.gray),
                borderWidth: isDarkMode ? 0 : 4,
                borderColor: borderColor,
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

// Manejar cierre de sesión
function handleLogout() {
    localStorage.removeItem('loggedInAdmin');
    sessionStorage.removeItem('loggedInAdmin');
    window.location.href = '../index.html';
}

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