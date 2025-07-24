// Configuración centralizada del sistema
const CONFIG = {
    // Configuración de sesión
    SESSION: {
        EXPIRY_TIME: 8 * 60 * 60 * 1000, // 8 horas en milisegundos
        STORAGE_KEY: 'loggedInAdmin'
    },
    
    // Configuración de colores del sistema
    COLORS: {
        // Colores principales del sistema (rojos)
        PRIMARY: '#ff0000',
        PRIMARY_DARK: '#cc0000',
        PRIMARY_DARKER: '#990000',
        PRIMARY_HOVER: '#e60000',
        PRIMARY_HOVER_DARK: '#b30000',
        
        // Colores de estado de totes
        TOTE_STATES: {
            'Con Cliente': '#4A90E2',
            'Disponible': '#50E3C2',
            'En Lavado': '#7ED321',
            'En Mantenimiento': '#F5A623',
            'En Uso': '#9013FE',
            'Fuera de Servicio': '#D0021B'
        },
        
        // Colores de estado para operador
        OPERADOR_STATES: {
            'Disponible': '#28a745',
            'En Uso': '#007bff',
            'En Lavado': '#17a2b8',
            'Con Cliente': '#ffc107',
            'En Mantenimiento': '#fd7e14',
            'Fuera de Servicio': '#dc3545'
        },
        
        // Colores de notificaciones
        NOTIFICATIONS: {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        },
        
        // Colores de fondo y texto
        BACKGROUND: {
            white: '#ffffff',
            light: '#f8f9fa',
            dark: '#2c3e50',
            gray: '#6c757d'
        }
    },
    
    // Configuración de timeouts y intervalos
    TIMING: {
        NOTIFICATION_TIMEOUT: 5000, // 5 segundos
        DATA_REFRESH_INTERVAL: 30000, // 30 segundos
        LOADING_DELAY: 100 // 100ms para mostrar loading
    },
    
    // Configuración de API
    API: {
        BASE_URL: 'http://localhost:3002',
        ENDPOINTS: {
            LOGIN: '/api/login',
            DASHBOARD_STATS: '/api/dashboard/stats',
            ADMIN_USERS: '/api/admin/users',
            TOTES: '/api/totes',
            CLIENTES: '/api/clientes',
            EVENTOS: '/api/eventos'
        }
    },
    
    // Configuración de UI
    UI: {
        MOBILE_BREAKPOINT: 768,
        CHART_CUTOUT: '70%',
        MAX_NOTIFICATION_WIDTH: '300px'
    },
    
    // Mensajes del sistema
    MESSAGES: {
        LOADING: 'Cargando...',
        NO_DATA: 'Sin datos',
        ERROR_CONNECTION: 'Error al conectar con el servidor. Inténtelo de nuevo más tarde.',
        ERROR_CREDENTIALS: 'Credenciales incorrectas. Inténtelo de nuevo.',
        ERROR_FIELDS: 'Por favor, complete todos los campos.',
        SESSION_EXPIRED: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.'
    }
};

// Utilidades comunes
const UTILS = {
    // Formatear números
    formatNumber: (num) => {
        return new Intl.NumberFormat('es-ES').format(num);
    },
    
    // Formatear fechas
    formatDate: (date) => {
        return new Intl.DateTimeFormat('es-ES').format(new Date(date));
    },
    
    // Validar sesión
    isSessionValid: (sessionData) => {
        if (!sessionData) return false;
        const currentTime = new Date().getTime();
        const sessionTime = sessionData.timestamp;
        return (currentTime - sessionTime) < CONFIG.SESSION.EXPIRY_TIME;
    },
    
    // Obtener datos de sesión
    getSessionData: () => {
        const stored = localStorage.getItem(CONFIG.SESSION.STORAGE_KEY) || 
                      sessionStorage.getItem(CONFIG.SESSION.STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    },
    
    // Limpiar sesión
    clearSession: () => {
        localStorage.removeItem(CONFIG.SESSION.STORAGE_KEY);
        sessionStorage.removeItem(CONFIG.SESSION.STORAGE_KEY);
    },
    
    // Mostrar notificación
    showNotification: (message, type = 'info', duration = CONFIG.TIMING.NOTIFICATION_TIMEOUT) => {
        // Crear elemento de alerta si no existe
        let alertElement = document.querySelector('.system-notification');
        if (!alertElement) {
            alertElement = document.createElement('div');
            alertElement.className = 'system-notification';
            alertElement.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 4px;
                z-index: 1000;
                max-width: ${CONFIG.UI.MAX_NOTIFICATION_WIDTH};
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            `;
            document.body.appendChild(alertElement);
        }
        
        // Aplicar estilos según el tipo
        const colors = {
            success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
            error: { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
            warning: { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' },
            info: { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb' }
        };
        
        const style = colors[type] || colors.info;
        alertElement.style.backgroundColor = style.bg;
        alertElement.style.color = style.color;
        alertElement.style.border = `1px solid ${style.border}`;
        
        alertElement.textContent = message;
        alertElement.style.display = 'block';
        
        // Ocultar después del tiempo especificado
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, duration);
    }
};

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, UTILS };
}