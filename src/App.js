import React, { useState, useEffect } from 'react';
import { Chart } from 'react-google-charts';
import './App.css';

// --- Helper Functions ---
const generateColorFromString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 80%)`; // Pastel colors
};

// --- Default Data ---
const defaultTasks = [
  { id: '1', name: 'Fase de Investigación', start: '2025-10-01', end: '2025-10-10', progress: 50, dependencies: null, responsible: 'Ana', category: 'Planificación' },
  { id: '2', name: 'Diseño de UI/UX', start: '2025-10-11', end: '2025-10-20', progress: 20, dependencies: '1', responsible: 'Pablo', category: 'Diseño' },
  { id: '3', name: 'Desarrollo del Frontend', start: '2025-10-21', end: '2025-11-10', progress: 0, dependencies: '2', responsible: 'Carlos', category: 'Desarrollo' },
];

const App = () => {
  // --- ESTADOS PRINCIPALES (con carga desde localStorage) ---
  const [projectTitle, setProjectTitle] = useState(() => {
    const savedTitle = localStorage.getItem('gantt-title');
    return savedTitle || 'Mi Proyecto (Haz clic para editar)';
  });

  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('gantt-tasks');
    try {
      return savedTasks ? JSON.parse(savedTasks) : defaultTasks;
    } catch (e) {
      console.error("Failed to parse tasks from localStorage", e);
      return defaultTasks;
    }
  });

  const [totalDuration, setTotalDuration] = useState(0);
  const [categoryColors, setCategoryColors] = useState({});

  // --- ESTADOS PARA FORMULARIOS Y UI ---
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [newTask, setNewTask] = useState({ name: '', start: '', end: '', progress: 0, dependencies: [], responsible: '', category: '' });
  const [editingTask, setEditingTask] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  // --- EFECTOS SECUNDARIOS (Hooks) ---

  // Guardado automático en localStorage
  useEffect(() => {
    localStorage.setItem('gantt-title', projectTitle);
    localStorage.setItem('gantt-tasks', JSON.stringify(tasks));
  }, [projectTitle, tasks]);

  // Sincronización de colores de categoría
  useEffect(() => {
    const newCategoryColors = { ...categoryColors };
    let needsUpdate = false;
    tasks.forEach(task => {
      if (task.category && !newCategoryColors[task.category]) {
        newCategoryColors[task.category] = generateColorFromString(task.category);
        needsUpdate = true;
      }
    });
    if (needsUpdate) {
      setCategoryColors(newCategoryColors);
    }
  }, [tasks, categoryColors]);

  // Cálculo de la duración total del proyecto
  useEffect(() => {
    if (tasks.length > 0) {
      const startDates = tasks.map(t => new Date(t.start).getTime());
      const endDates = tasks.map(t => new Date(t.end).getTime());
      const minStart = Math.min(...startDates);
      const maxEnd = Math.max(...endDates);
      const durationInMs = maxEnd - minStart;
      const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24)) + 1;
      setTotalDuration(durationInDays);
    } else {
      setTotalDuration(0);
    }
  }, [tasks]);


  // --- MANEJADORES DE EVENTOS ---

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'select-multiple') {
      const options = Array.from(e.target.selectedOptions, option => option.value);
      setNewTask(prev => ({ ...prev, [name]: options }));
    } else {
      setNewTask(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.name || !newTask.start || !newTask.end || !newTask.responsible || !newTask.category) {
      alert('Por favor, completa todos los campos requeridos.');
      return;
    }
    if (new Date(newTask.start) > new Date(newTask.end)) {
      alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }
    const finalTask = {
      ...newTask,
      id: String(Date.now()),
      progress: Number(newTask.progress) || 0,
      dependencies: newTask.dependencies.join(','),
    };
    setTasks(prev => [...prev, finalTask]);
    setNewTask({ name: '', start: '', end: '', progress: 0, dependencies: [], responsible: '', category: '' });
  };

  const handleClearTasks = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar todas las tareas? Esta acción no se puede deshacer.')) {
      setTasks([]);
    }
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('¿Seguro que quieres eliminar esta tarea?')) {
      setTasks(prev => {
        const newTasks = prev.filter(task => task.id !== taskId);
        return newTasks.map(task => {
          if (!task.dependencies) return task;
          const deps = task.dependencies.split(',').filter(depId => depId !== taskId);
          return { ...task, dependencies: deps.join(',') };
        });
      });
    }
  };

  const handleStartEditing = (task) => {
    setEditingTask({
      ...task,
      dependencies: task.dependencies ? task.dependencies.split(',') : []
    });
    setExpandedTaskId(null);
  };

  const handleCancelEditing = () => {
    setEditingTask(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'select-multiple') {
      const options = Array.from(e.target.selectedOptions, option => option.value);
      setEditingTask(prev => ({ ...prev, [name]: options }));
    } else {
      setEditingTask(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveEditing = (e) => {
    e.preventDefault();
    if (new Date(editingTask.start) > new Date(editingTask.end)) {
      alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }
    const updatedTask = {
      ...editingTask,
      progress: Number(editingTask.progress) || 0,
      dependencies: editingTask.dependencies.join(','),
    };
    setTasks(prev => prev.map(task => task.id === editingTask.id ? updatedTask : task));
    setEditingTask(null);
  };

  const toggleExpand = (taskId) => {
    setExpandedTaskId(prev => (prev === taskId ? null : taskId));
  };

  // --- CONFIGURACIÓN DEL GRÁFICO ---
  const chartColumns = [
    { type: 'string', label: 'Task ID' },
    { type: 'string', label: 'Task Name' },
    { type: 'string', label: 'Resource' },
    { type: 'date', label: 'Start Date' },
    { type: 'date', label: 'End Date' },
    { type: 'number', label: 'Duration' },
    { type: 'number', label: 'Percent Complete' },
    { type: 'string', label: 'Dependencies' },
  ];

  const chartData = [
    chartColumns,
    ...tasks.map(t => [t.id, t.name, t.category, new Date(t.start), new Date(t.end), null, t.progress, t.dependencies]),
  ];

  const chartOptions = {
    height: tasks.length * 40 + 50,
    gantt: {
      trackHeight: 30,
      percentEnabled: true,
    }
  };

  const uniqueCategories = [...new Set(tasks.map(t => t.category).filter(Boolean))];

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <div className="App">
      {isTitleEditing ? (
        <input
          type="text"
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          onBlur={() => setIsTitleEditing(false)}
          onKeyDown={(e) => { if (e.key === 'Enter') setIsTitleEditing(false); }}
          className="title-input"
          autoFocus
        />
      ) : (
        <h1 onClick={() => setIsTitleEditing(true)} className="project-title">
          {projectTitle}
        </h1>
      )}

      <div className="dashboard no-print">
        <h2>Panel de Control</h2>
        <p>Duración total del proyecto: <strong>{totalDuration} días</strong></p>
        <button onClick={handleClearTasks} className="clear-button">Limpiar Todas las Tareas</button>
        <button onClick={() => window.print()} className="pdf-button">Descargar como PDF</button>
      </div>

      <div className="add-task-form no-print">
        <h3>Añadir Nueva Tarea</h3>
        <form onSubmit={handleAddTask}>
          <div className="form-group">
            <label htmlFor="name">Nombre de la tarea</label>
            <input id="name" type="text" name="name" value={newTask.name} onChange={handleInputChange} required />
          </div>
           <div className="form-group">
            <label htmlFor="responsible">Responsable</label>
            <input id="responsible" type="text" name="responsible" value={newTask.responsible} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="start">Fecha de Inicio</label>
            <input id="start" type="date" name="start" value={newTask.start} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="end">Fecha de Fin</label>
            <input id="end" type="date" name="end" value={newTask.end} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="progress">% de progreso</label>
            <input id="progress" type="number" name="progress" value={newTask.progress} onChange={handleInputChange} min="0" max="100" />
          </div>
          <div className="form-group">
            <label htmlFor="category">Categoría</label>
            <input id="category" type="text" name="category" list="category-list" value={newTask.category} onChange={handleInputChange} required />
            <datalist id="category-list">
              {uniqueCategories.map(cat => <option key={cat} value={cat} />)}
            </datalist>
          </div>
          <div className="form-group">
            <label htmlFor="dependencies">Dependencias</label>
            <select multiple id="dependencies" name="dependencies" value={newTask.dependencies} onChange={handleInputChange}>
              {tasks.map(task => <option key={task.id} value={task.id}>{task.name}</option>)}
            </select>
          </div>
          <button type="submit">Añadir Tarea</button>
        </form>
      </div>

      <div className="task-list-container no-print">
        <h3>Lista de Tareas</h3>
        <ul>
          {tasks.map(task => (
            <li key={task.id} className="task-item">
              {editingTask && editingTask.id === task.id ? (
                // --- Vista de Edición ---
                <form onSubmit={handleSaveEditing} className="edit-form">
                  <div className="form-group"><label>Nombre</label><input type="text" name="name" value={editingTask.name} onChange={handleEditInputChange} /></div>
                  <div className="form-group"><label>Responsable</label><input type="text" name="responsible" value={editingTask.responsible} onChange={handleEditInputChange} /></div>
                  <div className="form-group"><label>Inicio</label><input type="date" name="start" value={editingTask.start} onChange={handleEditInputChange} /></div>
                  <div className="form-group"><label>Fin</label><input type="date" name="end" value={editingTask.end} onChange={handleEditInputChange} /></div>
                  <div className="form-group"><label>% Progreso</label><input type="number" name="progress" value={editingTask.progress} onChange={handleEditInputChange} min="0" max="100" /></div>
                  <div className="form-group"><label>Categoría</label><input type="text" name="category" list="category-list" value={editingTask.category} onChange={handleEditInputChange} /></div>
                  <div className="form-group"><label>Dependencias</label><select multiple name="dependencies" value={editingTask.dependencies} onChange={handleEditInputChange}>{tasks.filter(t => t.id !== editingTask.id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                  <button type="submit" className="save-btn">Guardar</button>
                  <button type="button" onClick={handleCancelEditing} className="cancel-btn">Cancelar</button>
                </form>
              ) : (
                // --- Vista Normal ---
                <>
                  <div className="task-header" onClick={() => toggleExpand(task.id)}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="category-dot" style={{ backgroundColor: categoryColors[task.category] || '#ccc' }}></span>
                      <span>{task.name} ({task.progress || 0}%)</span>
                    </div>
                    <span>{expandedTaskId === task.id ? '▲' : '▼'}</span>
                  </div>
                  {expandedTaskId === task.id && (
                    <div className="task-details-expanded">
                      <p><strong>Responsable:</strong> {task.responsible}</p>
                      <p><strong>Categoría:</strong> {task.category}</p>
                      <div className="task-actions">
                        <button onClick={() => handleStartEditing(task)} className="edit-btn">Editar</button>
                        <button onClick={() => handleDeleteTask(task.id)} className="delete-btn">Eliminar</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <h2>Diagrama de Gantt</h2>
      {tasks.length > 0 ? (
        <Chart chartType="Gantt" width="100%" height={chartOptions.height} data={chartData} options={chartOptions} />
      ) : (
        <p className="no-print">No hay tareas para mostrar en el gráfico. ¡Añade una para empezar!</p>
      )}
    </div>
  );
};

export default App;
