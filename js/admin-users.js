document.addEventListener('DOMContentLoaded', function() {
    // Session verification
    const adminData = JSON.parse(sessionStorage.getItem('loggedInAdmin')) || JSON.parse(localStorage.getItem('loggedInAdmin'));
    if (!adminData || !adminData.isAdmin) {
        window.location.href = '../index.html'; // Redirect to login if not admin
        return;
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            sessionStorage.clear();
            window.location.href = '../index.html';
        });
    }
    
    // Referencias a elementos del DOM
    const usersList = document.getElementById('usersList');
    const userForm = document.getElementById('userForm');
    const addUserBtn = document.getElementById('addUserBtn');
    const messageContainer = document.getElementById('messageContainer');
    
    // Variables globales
    let users = [];
    let editingUserId = null;
    
    // Cargar lista de usuarios
    function loadUsers() {
        fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + adminData.username
            },
            body: JSON.stringify({ action: 'list' })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.users) {
                users = data.users;
                renderUsersList();
            } else {
                showMessage('Error al cargar usuarios: ' + (data.message || 'Error desconocido'), 'error');
            }
        })
        .catch(error => {
            console.error('Error al cargar usuarios:', error);
            showMessage('Error de conexión al servidor', 'error');
        });
    }
    
    // Renderizar lista de usuarios
    function renderUsersList() {
        if (!usersList) return;
        
        usersList.innerHTML = '';
        
        if (users.length === 0) {
            usersList.innerHTML = '<tr><td colspan="6" class="text-center">No hay usuarios registrados</td></tr>';
            return;
        }
        
        users.forEach(user => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${user.Nombre} ${user.Apellido}</td>
                <td>${user.Email || 'N/A'}</td>
                <td><span class="user-role ${user.Rol.toLowerCase()}">${user.Rol}</span></td>
                <td><span class="status ${user.Estado.toLowerCase()}">${user.Estado}</span></td>
                <td>${user.fecha_creacion || new Date().toLocaleDateString('es-ES')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" data-id="${user.Id}" title="Editar usuario"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" data-id="${user.Id}" title="Eliminar usuario"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            
            usersList.appendChild(row);
        });
        
        // Agregar event listeners a los botones
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editUser(btn.dataset.id));
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteUser(btn.dataset.id));
        });
    }
    
    // Editar usuario
    function editUser(userId) {
        const user = users.find(u => u.Id == userId);
        if (!user) return;
        
        editingUserId = userId;
        
        // Llenar formulario con datos del usuario
        document.getElementById('nombre').value = user.Nombre;
        document.getElementById('apellido').value = user.Apellido;
        document.getElementById('email').value = user.Email || '';
        document.getElementById('password').value = '';
        document.getElementById('rol').value = user.Rol;
        document.getElementById('estado').value = user.Estado;
        
        // Cambiar texto del modal y botón
        modalTitle.textContent = 'Editar Usuario';
        document.getElementById('submitBtn').textContent = 'Actualizar Usuario';
        
        // Mostrar modal
        userModal.style.display = 'block';
    }
    
    // Eliminar usuario
    function deleteUser(userId) {
        if (!confirm('¿Está seguro de que desea eliminar este usuario?')) return;
        
        fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + adminData.username
            },
            body: JSON.stringify({
                action: 'delete',
                userData: { id: userId }
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('Usuario eliminado correctamente', 'success');
                loadUsers(); // Recargar lista
            } else {
                showMessage('Error al eliminar usuario: ' + (data.message || 'Error desconocido'), 'error');
            }
        })
        .catch(error => {
            console.error('Error al eliminar usuario:', error);
            showMessage('Error de conexión al servidor', 'error');
        });
    }
    
    // Referencias al modal
    const userModal = document.getElementById('userModal');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const modalTitle = document.getElementById('modalTitle');
    
    // Mostrar modal para agregar usuario
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            // Limpiar formulario
            userForm.reset();
            editingUserId = null;
            
            // Cambiar texto del modal y botón
            modalTitle.textContent = 'Agregar Usuario';
            document.getElementById('submitBtn').textContent = 'Crear Usuario';
            
            // Mostrar modal
            userModal.style.display = 'block';
        });
    }
    
    // Cerrar modal
    function closeUserModal() {
        userModal.style.display = 'none';
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', closeUserModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeUserModal);
    }
    
    // Cerrar modal al hacer clic fuera de él
    window.addEventListener('click', function(event) {
        if (event.target === userModal) {
            closeUserModal();
        }
    });
    
    // Manejar envío del formulario
    if (userForm) {
        userForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const userData = {
                nombre: document.getElementById('nombre').value.trim(),
                apellido: document.getElementById('apellido').value.trim(),
                email: document.getElementById('email').value.trim(),
                password: document.getElementById('password').value.trim(),
                rol: document.getElementById('rol').value,
                estado: document.getElementById('estado').value
            };
            
            // Validar campos
            if (!userData.nombre) {
                showMessage('El nombre es obligatorio', 'error');
                return;
            }
            
            if (!userData.apellido) {
                showMessage('El apellido es obligatorio', 'error');
                return;
            }
            
            if (!userData.email) {
                showMessage('El correo electrónico es obligatorio', 'error');
                return;
            }
            
            // Validación de formato de email
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(userData.email)) {
                showMessage('Por favor, ingrese un email válido', 'error');
                return;
            }
            
            // Validación de contraseña para nuevos usuarios
            if (!editingUserId && userData.password.length < 6) {
                showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }
            
            // Si estamos editando, agregar el ID
            if (editingUserId) {
                userData.id = editingUserId;
            } else if (!userData.password) {
                // Si estamos creando, la contraseña es obligatoria
                showMessage('La contraseña es obligatoria para nuevos usuarios', 'error');
                return;
            }
            
            // Determinar acción (crear o actualizar)
            const action = editingUserId ? 'update' : 'create';
            
            fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + adminData.username
                },
                body: JSON.stringify({
                    action: action,
                    userData: userData
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage(
                        editingUserId ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente',
                        'success'
                    );
                    userForm.reset();
                    closeUserModal(); // Cerrar modal
                    loadUsers(); // Recargar lista
                } else {
                    showMessage('Error: ' + (data.message || 'Error desconocido'), 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('Error de conexión al servidor', 'error');
            });
        });
    }
    
    // Función para mostrar mensajes
    function showMessage(message, type = 'info') {
        if (!messageContainer) return;
        
        messageContainer.textContent = message;
        messageContainer.className = 'message ' + type;
        messageContainer.style.display = 'block';
        
        // Ocultar mensaje después de 5 segundos
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, CONFIG.TIMING.NOTIFICATION_TIMEOUT);
    }
    
    // Cargar usuarios al iniciar
    loadUsers();
    
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