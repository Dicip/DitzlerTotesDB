document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay una sesión activa de administrador
    const storedAdmin = localStorage.getItem('loggedInAdmin') || sessionStorage.getItem('loggedInAdmin');
    
    if (!storedAdmin) {
        window.location.href = '../index.html';
        return;
    }
    
    const adminData = JSON.parse(storedAdmin);
    
    // Verificar que sea un administrador
    if (!adminData.isAdmin) {
        localStorage.removeItem('loggedInAdmin');
        sessionStorage.removeItem('loggedInAdmin');
        window.location.href = '../index.html';
        return;
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
            usersList.innerHTML = '<tr><td colspan="7" class="text-center">No hay usuarios registrados</td></tr>';
            return;
        }
        
        users.forEach(user => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${user.Id}</td>
                <td>${user.Nombre}</td>
                <td>${user.Apellido}</td>
                <td>${user.Email || 'N/A'}</td>
                <td>${user.Rol}</td>
                <td>${user.Estado}</td>
                <td>
                    <button class="btn-edit" data-id="${user.Id}">Editar</button>
                    <button class="btn-delete" data-id="${user.Id}">Eliminar</button>
                </td>
            `;
            
            usersList.appendChild(row);
        });
        
        // Agregar event listeners a los botones
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => editUser(btn.dataset.id));
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
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
        
        // Cambiar texto del botón de envío
        document.getElementById('submitBtn').textContent = 'Actualizar Usuario';
        
        // Mostrar formulario
        userForm.style.display = 'block';
        window.scrollTo(0, userForm.offsetTop);
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
    
    // Mostrar formulario para agregar usuario
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            // Limpiar formulario
            userForm.reset();
            editingUserId = null;
            
            // Cambiar texto del botón de envío
            document.getElementById('submitBtn').textContent = 'Crear Usuario';
            
            // Mostrar formulario
            userForm.style.display = 'block';
            window.scrollTo(0, userForm.offsetTop);
        });
    }
    
    // Manejar envío del formulario
    if (userForm) {
        userForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const userData = {
                Nombre: document.getElementById('nombre').value.trim(),
                Apellido: document.getElementById('apellido').value.trim(),
                Email: document.getElementById('email').value.trim(),
                Password: document.getElementById('password').value.trim(),
                Rol: document.getElementById('rol').value,
                Estado: document.getElementById('estado').value
            };
            
            // Validar campos
            if (!userData.Nombre) {
                showMessage('El nombre es obligatorio', 'error');
                return;
            }
            
            if (!userData.Apellido) {
                showMessage('El apellido es obligatorio', 'error');
                return;
            }
            
            if (!userData.Email) {
                showMessage('El correo electrónico es obligatorio', 'error');
                return;
            }
            
            // Si estamos editando, agregar el ID
            if (editingUserId) {
                userData.Id = editingUserId;
            } else if (!userData.Password) {
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
                    userForm.style.display = 'none';
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
        }, 5000);
    }
    
    // Cargar usuarios al iniciar
    loadUsers();
});