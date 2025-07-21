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
    document.getElementById('misTotes').textContent = stats.misTotesTotal || 0;
    document.getElementById('totesDisponibles').textContent = stats.totesDisponibles || 0;
    document.getElementById('totesLavado').textContent = stats.totesEnLavado || 0;
    document.getElementById('totesCliente').textContent = stats.totesConCliente || 0;
    document.getElementById('tareasPendientes').textContent = stats.tareasPendientes || 0;
    
    // Actualizar lista de tareas pendientes
    const listaTareas = document.getElementById('listaTareas');
    listaTareas.innerHTML = '';
    
    if (stats.tareas && stats.tareas.length > 0) {
        stats.tareas.forEach(tarea => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${tarea.codigo}</strong> - ${tarea.descripcion}`;
            listaTareas.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'No hay tareas pendientes';
        listaTareas.appendChild(li);
    }
}

// Crear gráfico de mis totes
function createMisTotesChart(data) {
    const ctx = document.getElementById('misTotesChart').getContext('2d');
    
    // Destruir gráfico existente si existe
    if (window.misTotesChart instanceof Chart) {
        window.misTotesChart.destroy();
    }
    
    const labels = data.map(item => item.estado);
    const values = data.map(item => item.cantidad);
    const colors = CONFIG.COLORS.OPERADOR_STATES;
    
    window.misTotesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: labels.map(label => colors[label] || CONFIG.COLORS.BACKGROUND.gray),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
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