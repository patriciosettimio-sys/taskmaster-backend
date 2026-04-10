// Configuración
const API_BASE_URL = 'http://127.0.0.1:8000/api';
const CREDENTIALS = {
    email: 'admin@taskmaster.com',
    password: 'admin123'
};

let authToken = null;

// Elementos del DOM
const columns = {
    'PENDING': document.getElementById('col-pending'),
    'IN_PROGRESS': document.getElementById('col-in-progress'),
    'DONE': document.getElementById('col-done')
};
const counts = {
    'PENDING': document.getElementById('count-pending'),
    'IN_PROGRESS': document.getElementById('count-in-progress'),
    'DONE': document.getElementById('count-done')
};

// Iniciar aplicación
async function initApp() {
    try {
        console.log("Conectando con Backend...");
        
        // 1. Autenticación
        authToken = await login();
        
        // 2. Obtener tareas
        const tasks = await fetchTasks(authToken);
        
        // 3. Renderizar e inicializar Drag & Drop
        renderTasks(tasks);
        initDragAndDrop();

    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión. Verifica que el servidor Django esté encendido.");
    }
}

// --- FUNCIONES DE API ---

async function login() {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(CREDENTIALS)
    });
    const data = await response.json();
    return data.access;
}

async function fetchTasks(token) {
    const response = await fetch(`${API_BASE_URL}/tasks/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    return data.results;
}

// Función para actualizar el estado en la DB
async function updateTaskStatus(taskId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) throw new Error("Fallo al actualizar en servidor");
        console.log(`Tarea ${taskId} actualizada a ${newStatus}`);
    } catch (error) {
        console.error("Error al sincronizar:", error);
        alert("No se pudo guardar el cambio. Recarga la página.");
    }
}

// --- LÓGICA DE INTERFAZ ---

function renderTasks(tasks) {
    Object.values(columns).forEach(col => col.innerHTML = '');
    let taskCounts = { 'PENDING': 0, 'IN_PROGRESS': 0, 'DONE': 0 };

    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.setAttribute('data-id', task.id); // Importante para identificar la tarea al moverla
        
        const initial = task.assignee_email ? task.assignee_email.charAt(0).toUpperCase() : '?';
        const assigneeText = task.assignee_email ? task.assignee_email.split('@')[0] : 'Unassigned';

        card.innerHTML = `
            <div class="task-header">
                <span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
            </div>
            <h3>${task.title}</h3>
            <div class="task-footer">
                <span class="date">${new Date(task.created_at).toLocaleDateString()}</span>
                <div class="assignee">
                    <div class="avatar">${initial}</div>
                    <span>${assigneeText}</span>
                </div>
            </div>
        `;

        const targetColumn = columns[task.status];
        if (targetColumn) {
            targetColumn.appendChild(card);
            taskCounts[task.status]++;
        }
    });

    updateCounters(taskCounts);
}

function updateCounters(countsObj) {
    Object.keys(counts).forEach(key => {
        counts[key].innerText = countsObj[key] || 0;
    });
}

function initDragAndDrop() {
    Object.keys(columns).forEach(status => {
        new Sortable(columns[status], {
            group: 'shared', // Permite mover entre columnas
            animation: 150,
            ghostClass: 'glass-ghost',
            onEnd: function (evt) {
                const taskId = evt.item.getAttribute('data-id');
                const newStatus = evt.to.id.replace('col-', '').toUpperCase().replace('-', '_');
                
                // Sincronizar con el servidor
                updateTaskStatus(taskId, newStatus);
                
                // Recalcular contadores visuales
                recalculateAllCounters();
            }
        });
    });
}

function recalculateAllCounters() {
    const newCounts = {};
    Object.keys(columns).forEach(status => {
        newCounts[status] = columns[status].children.length;
    });
    updateCounters(newCounts);
}

document.addEventListener('DOMContentLoaded', initApp);
