document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias a elementos del DOM
    const usernameElement = document.getElementById('username');
    const userInitialElement = document.getElementById('userInitial');
    const userFullNameElement = document.getElementById('userFullName');
    const lastLoginElement = document.getElementById('lastLogin');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Verificar si hay una sesión activa de administrador
    const storedAdmin = localStorage.getItem('loggedInAdmin') || sessionStorage.getItem('loggedInAdmin');
    
    if (!storedAdmin) {
        // Redirigir al login si no hay sesión activa
        window.location.href = '../index.html';
        return;
    }
    
    // Obtener datos del administrador
    const adminData = JSON.parse(storedAdmin);
    const username = adminData.username;
    
    // Verificar que sea un administrador
    if (!adminData.isAdmin) {
        // Redirigir al login si no es administrador
        localStorage.removeItem('loggedInAdmin');
        sessionStorage.removeItem('loggedInAdmin');
        window.location.href = '../index.html';
        return;
    }
    
    // Mostrar información del administrador en la interfaz
    usernameElement.textContent = username;
    
    // Mostrar inicial y nombre completo del administrador
    if (adminData.fullname) {
        const initial = adminData.fullname.charAt(0).toUpperCase();
        userInitialElement.textContent = initial;
        userFullNameElement.textContent = adminData.fullname;
    } else {
        userInitialElement.textContent = username.charAt(0).toUpperCase();
        userFullNameElement.textContent = username;
    }
    
    // Formatear y mostrar la última fecha de inicio de sesión
    const loginTimestamp = adminData.timestamp;
    lastLoginElement.textContent = formatDate(loginTimestamp);
    
    // Manejar cierre de sesión
    logoutBtn.addEventListener('click', function() {
        // Eliminar datos de sesión de administrador
        localStorage.removeItem('loggedInAdmin');
        sessionStorage.removeItem('loggedInAdmin');
        
        // Redirigir al login
        window.location.href = '../index.html';
    });
    
    // Función para formatear fecha
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        // Si es hoy
        if (date.toDateString() === now.toDateString()) {
            if (diffMins < 1) {
                return 'Hace unos segundos';
            } else if (diffMins < 60) {
                return `Hace ${diffMins} minutos`;
            } else {
                return `Hoy, ${formatTime(date)}`;
            }
        }
        // Si fue ayer
        else if (diffDays === 1) {
            return `Ayer, ${formatTime(date)}`;
        }
        // Si fue esta semana
        else if (diffDays < 7) {
            return `Hace ${diffDays} días, ${formatTime(date)}`;
        }
        // Otro caso
        else {
            return `${date.toLocaleDateString()}, ${formatTime(date)}`;
        }
    }
    
    // Función auxiliar para formatear hora
    function formatTime(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // La hora '0' debe ser '12'
        
        const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
        
        return `${hours}:${formattedMinutes} ${ampm}`;
    }
    
    // Cargar datos adicionales desde el servidor
    function loadDashboardData() {
        // Obtener lista de usuarios desde la API
        fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + adminData.username // En una app real usaríamos un token JWT
            },
            body: JSON.stringify({ action: 'list' })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.users) {
                console.log('Usuarios cargados:', data.users.length);
                // Aquí podrías mostrar la lista de usuarios en la interfaz
            }
        })
        .catch(error => {
            console.error('Error al cargar usuarios:', error);
        });
    }
    
    // Cargar datos del dashboard
    loadDashboardData();
});