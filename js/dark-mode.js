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
        
        // Create a dropdown container for configuration
        const configContainer = document.createElement('div');
        configContainer.className = 'config-dropdown';
        
        // Create the main config button
        const configBtn = document.createElement('button');
        configBtn.className = 'config-toggle-btn';
        configBtn.innerHTML = '<i class="fas fa-cog"></i> Configuración <i class="fas fa-chevron-down"></i>';
        
        // Create dropdown menu
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'config-dropdown-menu';
        
        // Create dark mode toggle option
        const darkModeOption = document.createElement('button');
        darkModeOption.className = 'config-option dark-mode-option';
        darkModeOption.innerHTML = this.getToggleContent();
        darkModeOption.addEventListener('click', () => this.toggleTheme());
        
        // Add other config options
        const generalOption = document.createElement('a');
        generalOption.className = 'config-option';
        generalOption.href = '#';
        generalOption.innerHTML = '<i class="fas fa-sliders-h"></i> Configuración General';
        
        dropdownMenu.appendChild(darkModeOption);
        dropdownMenu.appendChild(generalOption);
        
        configContainer.appendChild(configBtn);
        configContainer.appendChild(dropdownMenu);
        
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
        
        // Add elements to sidebar footer
        sidebarFooter.appendChild(configContainer);
        sidebarFooter.appendChild(logoutLink);
        
        // Add click event to toggle dropdown
        configBtn.addEventListener('click', () => {
            dropdownMenu.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!configContainer.contains(event.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
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
        const toggleButtons = document.querySelectorAll('.dark-mode-toggle');
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