document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias a elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    
    // La autenticación ahora se maneja a través de la API REST
    
    // Manejar envío del formulario de login
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Obtener valores del formulario
        const email = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const remember = document.getElementById('remember').checked;
        
        // Validar campos
        if (!email || !password) {
            showError('Por favor, complete todos los campos.');
            return;
        }
        
        // Limpiar mensajes de error previos
        showError('');
        
        // Autenticar usando la API REST
        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Guardar estado de sesión si se seleccionó "recordarme"
                const adminData = {
                    username: data.username,
                    isAdmin: data.isAdmin,
                    fullname: data.fullname,
                    role: data.role,
                    timestamp: new Date().getTime()
                };
                
                if (remember) {
                    localStorage.setItem('loggedInAdmin', JSON.stringify(adminData));
                } else {
                    sessionStorage.setItem('loggedInAdmin', JSON.stringify(adminData));
                }
                
                // Redirigir según el rol del usuario
                console.log('Redirigiendo según rol:', data.role);
                if (data.role === 'Admin') {
                    window.location.href = 'pages/dashboard.html';
                } else if (data.role === 'Operario') {
                    window.location.href = 'pages/operador.html';
                } else {
                    // Por defecto redirigir al dashboard para otros roles
                    window.location.href = 'pages/dashboard.html';
                }
            } else {
                showError(data.message || 'Credenciales incorrectas. Inténtelo de nuevo.');
            }
        })
        .catch(error => {
            console.error('Error de autenticación:', error);
            showError('Error al conectar con el servidor. Inténtelo de nuevo más tarde.');
        });
    });
    
    // Manejar clic en "Olvidé mi contraseña"
    forgotPasswordLink.addEventListener('click', function(event) {
        event.preventDefault();
        const username = document.getElementById('username').value.trim();
        
        if (!username) {
            showError('Por favor, ingrese su nombre de usuario para recuperar la contraseña.');
        } else {
            showError(''); // Limpiar mensajes de error
            alert('Se ha enviado un correo de recuperación a la dirección asociada con ' + username);
        }
    });
    
    // Función para mostrar mensajes de error
    function showError(message) {
        errorMessage.textContent = message;
    }
    
    // La autenticación ahora se maneja a través de la API REST
    
    // Verificar si hay una sesión de administrador activa al cargar la página
    function checkExistingSession() {
        const storedAdmin = localStorage.getItem('loggedInAdmin') || sessionStorage.getItem('loggedInAdmin');
        
        if (storedAdmin) {
            const adminData = JSON.parse(storedAdmin);
            const currentTime = new Date().getTime();
            const sessionTime = adminData.timestamp;
            
            // Verificar si la sesión no ha expirado (8 horas para mayor seguridad)
            if (currentTime - sessionTime < 8 * 60 * 60 * 1000) {
                // Redirigir según el rol del usuario
                if (adminData.role === 'Admin') {
                    window.location.href = 'pages/dashboard.html';
                } else if (adminData.role === 'Operario') {
                    window.location.href = 'pages/operador.html';
                } else if (adminData.isAdmin) {
                    // Fallback para compatibilidad con sesiones anteriores
                    window.location.href = 'pages/dashboard.html';
                }
            } else {
                // Limpiar sesión expirada
                localStorage.removeItem('loggedInAdmin');
                sessionStorage.removeItem('loggedInAdmin');
            }
        }
    }
    
    // Verificar sesión al cargar
    checkExistingSession();
});