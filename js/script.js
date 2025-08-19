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
            showError(CONFIG.MESSAGES.ERROR_FIELDS);
            return;
        }
        
        // Limpiar mensajes de error previos
        showError('');
        
        // Autenticar usando la API REST
        fetch(CONFIG.API.BASE_URL + CONFIG.API.ENDPOINTS.LOGIN, {
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
                    email: email, // Agregar el email que se usó para el login
                    timestamp: new Date().getTime()
                };
                
                if (remember) {
                    localStorage.setItem(CONFIG.SESSION.STORAGE_KEY, JSON.stringify(adminData));
                } else {
                    sessionStorage.setItem(CONFIG.SESSION.STORAGE_KEY, JSON.stringify(adminData));
                }
                
                // Redirigir según el rol del usuario
                console.log('Redirigiendo según rol:', data.role);
                if (data.role === 'Admin' || data.role === 'Administrador') {
                    window.location.href = 'pages/dashboard.html';
                } else if (data.role === 'Operador') {
                    window.location.href = 'pages/operador.html';
                } else if (data.role === 'Operador Totes') {
                    window.location.href = 'pages/operador-totes.html';
                } else if (data.role === 'Operador Preparados' || data.role === 'Producción') {
                    window.location.href = 'pages/operador-preparados.html';
                } else if (data.role === 'Operador Despacho' || data.role === 'Calidad/Despacho') {
                    window.location.href = 'pages/operador-despacho.html';
                } else {
                    // Por defecto redirigir al dashboard para otros roles
                    window.location.href = 'pages/dashboard.html';
                }
            } else {
                showError(data.message || CONFIG.MESSAGES.ERROR_CREDENTIALS);
            }
        })
        .catch(error => {
            console.error('Error de autenticación:', error);
            showError(CONFIG.MESSAGES.ERROR_CONNECTION);
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
    
    // Manejar clic en "Cerrar Sesión Activa"
    const clearSessionLink = document.getElementById('clear-session');
    if (clearSessionLink) {
        clearSessionLink.addEventListener('click', function(event) {
            event.preventDefault();
            UTILS.clearSession();
            showError(''); // Limpiar mensajes de error
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            alert('Sesión cerrada correctamente. Ahora puede iniciar sesión nuevamente.');
        });
    }
    
    // Función para mostrar mensajes de error
    function showError(message) {
        errorMessage.textContent = message;
    }
    
    // La autenticación ahora se maneja a través de la API REST
    
    // Verificar si hay una sesión de administrador activa al cargar la página
    function checkExistingSession() {
        const adminData = UTILS.getSessionData();
        
        // Solo redirigir si hay una sesión válida Y no hay intento de login en curso
        if (adminData && UTILS.isSessionValid(adminData)) {
            // Verificar si el usuario está intentando hacer login (campos llenos)
            const emailField = document.getElementById('username');
            const passwordField = document.getElementById('password');
            
            // Si los campos están vacíos, proceder con la redirección automática
            if (!emailField.value.trim() && !passwordField.value.trim()) {
                // Redirigir según el rol del usuario
                if (adminData.role === 'Admin' || adminData.role === 'Administrador') {
                    window.location.href = 'pages/dashboard.html';
                } else if (adminData.role === 'Operador') {
                    window.location.href = 'pages/operador.html';
                } else if (adminData.role === 'Operador Totes') {
                    window.location.href = 'pages/operador-totes.html';
                } else if (adminData.role === 'Operador Preparados' || adminData.role === 'Producción') {
                    window.location.href = 'pages/operador-preparados.html';
                } else if (adminData.role === 'Operador Despacho' || adminData.role === 'Calidad/Despacho') {
                    window.location.href = 'pages/operador-despacho.html';
                } else if (adminData.isAdmin) {
                    // Fallback para compatibilidad con sesiones anteriores
                    window.location.href = 'pages/dashboard.html';
                }
            }
        } else if (adminData) {
            // Limpiar sesión expirada
            UTILS.clearSession();
        }
    }
    
    // Verificar sesión al cargar
    checkExistingSession();
});