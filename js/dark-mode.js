// Dark Mode Functionality
class DarkModeManager {
    constructor() {
        this.init();
    }

    init() {
        // Load saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        
        // Create toggle buttons
        this.createToggleButtons();
    }

    createToggleButtons() {
        // Create toggle button for login page
        if (document.querySelector('.login-container')) {
            this.createLoginToggle();
        }
        
        // Create toggle button for dashboard pages
        if (document.querySelector('.sidebar')) {
            this.createSidebarToggle();
        }
    }

    createLoginToggle() {
        const container = document.querySelector('.container');
        if (!container) return;

        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'login-dark-toggle';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'dark-mode-toggle';
        toggleBtn.innerHTML = this.getToggleContent();
        toggleBtn.addEventListener('click', () => this.toggleTheme());
        
        toggleContainer.appendChild(toggleBtn);
        container.appendChild(toggleContainer);
    }

    createSidebarToggle() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        const sidebarFooter = sidebar.querySelector('.sidebar-footer');
        if (!sidebarFooter) return;

        // Clear the sidebar footer content
        sidebarFooter.innerHTML = '';
        
        // Create dark mode toggle button
        const darkModeBtn = document.createElement('button');
        darkModeBtn.className = 'config-option dark-mode-option';
        darkModeBtn.innerHTML = this.getToggleContent();
        darkModeBtn.style.display = 'flex';
        darkModeBtn.style.alignItems = 'center';
        darkModeBtn.style.color = 'var(--sidebar-text)';
        darkModeBtn.style.textDecoration = 'none';
        darkModeBtn.style.marginBottom = '10px';
        darkModeBtn.style.padding = '10px 15px';
        darkModeBtn.style.borderRadius = '5px';
        darkModeBtn.style.transition = 'all 0.3s ease';
        darkModeBtn.style.fontWeight = '500';
        darkModeBtn.style.background = 'transparent';
        darkModeBtn.style.border = 'none';
        darkModeBtn.style.width = '100%';
        darkModeBtn.style.textAlign = 'left';
        darkModeBtn.style.cursor = 'pointer';
        
        darkModeBtn.addEventListener('click', () => this.toggleTheme());
        
        // Add hover effect for dark mode button
        darkModeBtn.addEventListener('mouseenter', () => {
            darkModeBtn.style.background = 'var(--hover-bg, rgba(255, 255, 255, 0.1))';
            darkModeBtn.style.color = document.documentElement.getAttribute('data-theme') === 'dark' ? '#58a6ff' : '#1967d2';
        });
        
        darkModeBtn.addEventListener('mouseleave', () => {
            darkModeBtn.style.background = 'transparent';
            darkModeBtn.style.color = 'var(--sidebar-text)';
        });
        
        // Create logout link
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.innerHTML = '<i class="fas fa-sign-out-alt"></i> Cerrar Sesión';
        logoutLink.style.display = 'flex';
        logoutLink.style.alignItems = 'center';
        logoutLink.style.color = 'var(--sidebar-text)';
        logoutLink.style.textDecoration = 'none';
        logoutLink.style.marginTop = '10px';
        logoutLink.style.padding = '10px 15px';
        logoutLink.style.borderRadius = '5px';
        logoutLink.style.transition = 'all 0.3s ease';
        logoutLink.style.fontWeight = '500';
        
        logoutLink.querySelector('i').style.marginRight = '15px';
        
        // Add logout functionality
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Limpiar almacenamiento local y de sesión
            localStorage.removeItem('loggedInAdmin');
            sessionStorage.removeItem('loggedInAdmin');
            // Redirigir a la página de inicio de sesión
            window.location.href = '../index.html';
        });
        
        // Add hover effect
        logoutLink.addEventListener('mouseenter', () => {
            logoutLink.style.background = 'var(--hover-bg, rgba(255, 255, 255, 0.1))';
            logoutLink.style.color = document.documentElement.getAttribute('data-theme') === 'dark' ? '#58a6ff' : '#1967d2';
        });
        
        logoutLink.addEventListener('mouseleave', () => {
            logoutLink.style.background = 'transparent';
            logoutLink.style.color = 'var(--sidebar-text)';
        });
        
        // Add elements to sidebar footer in correct order
        sidebarFooter.appendChild(darkModeBtn);
        sidebarFooter.appendChild(logoutLink);
    }

    getToggleContent() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        if (currentTheme === 'dark') {
            return '<i class="fas fa-sun"></i> Modo Claro';
        } else {
            return '<i class="fas fa-moon"></i> Modo Oscuro';
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update all toggle buttons
        const toggleButtons = document.querySelectorAll('.dark-mode-toggle, .dark-mode-option');
        toggleButtons.forEach(btn => {
            btn.innerHTML = this.getToggleContent();
        });
    }
}

// Initialize dark mode when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DarkModeManager();
});

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DarkModeManager;
}