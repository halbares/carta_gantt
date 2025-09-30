import React, { useState, useEffect } from 'react';
import { Chart } from 'react-google-charts';
import './App.css';

const App = () => {
  // --- ESTADOS PRINCIPALES ---
  const [tasks, setTasks] = useState([
    { id: '1', name: 'Fase de Investigación', start: '2025-10-01', end: '2025-10-10' },
    { id: '2', name: 'Diseño de UI/UX', start: '2025-10-11', end: '2025-10-20' },
  ]);
  const [totalDuration, setTotalDuration] = useState(0);

  // --- ESTADOS PARA FORMULARIOS Y UI ---
  const [newTask, setNewTask] = useState({ name: '', start: '', end: '' });
  const [editingTask, setEditingTask] = useState(null); // Objeto de la tarea que se está editando
  const [expandedTaskId, setExpandedTaskId] = useState(null); // ID de la tarea expandida en el acordeón

  // --- MANEJADORES DE EVENTOS ---

  // Añadir nueva tarea
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.name || !newTask.start || !newTask.end) {
      alert('Por favor, completa todos los campos.');
      return;
    }
    if (new Date(newTask.start) > new Date(newTask.end)) {
      alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }
    setTasks(prev => [...prev, { ...newTask, id: String(Date.now()) }]);
    setNewTask({ name: '', start: '', end: '' });
  };

  // Limpiar todas las tareas
  const handleClearTasks = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar todas las tareas? Esta acción no se puede deshacer.')) {
      setTasks([]);
    }
  };

  // Eliminar una tarea específica
  const handleDeleteTask = (taskId) => {
    if (window.confirm('¿Seguro que quieres eliminar esta tarea?')) {
      setTasks(prev => prev.filter(task => task.id !== taskId));
    }
  };

  // Edición de una tarea
  const handleStartEditing = (task) => {
    setEditingTask({ ...task });
    setExpandedTaskId(null); // Cierra el acordeón al editar
  };

  const handleCancelEditing = () => {
    setEditingTask(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEditing = (e) => {
    e.preventDefault();
    if (new Date(editingTask.start) > new Date(editingTask.end)) {
      alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }
    setTasks(prev => prev.map(task => task.id === editingTask.id ? editingTask : task));
    setEditingTask(null);
  };

  // Acordeón
  const toggleExpand = (taskId) => {
    setExpandedTaskId(prev => (prev === taskId ? null : taskId));
  };

  // --- LÓGICA DEL GRÁFICO Y CÁLCULOS ---
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

  const chartColumns = [
    { type: 'string', label: 'Task ID' },
    { type: 'string', label: 'Task Name' },
    { type: 'date', label: 'Start Date' },
    { type: 'date', label: 'End Date' },
    { type: 'number', label: 'Duration' },
    { type: 'number', label: 'Percent Complete' },
    { type: 'string', label: 'Dependencies' },
  ];

  const chartData = [
    chartColumns,
    ...tasks.map(t => [t.id, t.name, new Date(t.start), new Date(t.end), null, 0, null]),
  ];

  const chartOptions = { height: tasks.length * 40 + 50, gantt: { trackHeight: 30 } };

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <div className="App">
      <h1>Proyecto Carta Gantt</h1>

      <div className="dashboard">
        <h2>Panel de Control</h2>
        <p>Duración total del proyecto: <strong>{totalDuration} días</strong></p>
        <button onClick={handleClearTasks} className="clear-button">Limpiar Todas las Tareas</button>
      </div>

      <div className="add-task-form">
        <h3>Añadir Nueva Tarea</h3>
        <form onSubmit={handleAddTask}>
          <input
            type="text"
            name="name"
            placeholder="Nombre de la tarea"
            value={newTask.name}
            onChange={handleInputChange}
            required
          />
          <input
            type="date"
            name="start"
            value={newTask.start}
            onChange={handleInputChange}
            required
          />
          <input
            type="date"
            name="end"
            value={newTask.end}
            onChange={handleInputChange}
            required
          />
          <button type="submit">Añadir Tarea</button>
        </form>
      </div>

      <div className="task-list-container">
        <h3>Lista de Tareas</h3>
        <ul>
          {tasks.map(task => (
            <li key={task.id} className="task-item">
              {editingTask && editingTask.id === task.id ? (
                // --- Vista de Edición ---
                <form onSubmit={handleSaveEditing} className="edit-form">
                  <input type="text" name="name" value={editingTask.name} onChange={handleEditInputChange} />
                  <input type="date" name="start" value={editingTask.start} onChange={handleEditInputChange} />
                  <input type="date" name="end" value={editingTask.end} onChange={handleEditInputChange} />
                  <button type="submit" className="save-btn">Guardar</button>
                  <button type="button" onClick={handleCancelEditing} className="cancel-btn">Cancelar</button>
                </form>
              ) : (
                // --- Vista Normal ---
                <>
                  <div className="task-header" onClick={() => toggleExpand(task.id)}>
                    <span>{task.name}</span>
                    <span>{expandedTaskId === task.id ? '▲' : '▼'}</span>
                  </div>
                  {expandedTaskId === task.id && (
                    <div className="task-actions">
                      <button onClick={() => handleStartEditing(task)} className="edit-btn">Editar</button>
                      <button onClick={() => handleDeleteTask(task.id)} className="delete-btn">Eliminar</button>
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
        <p>No hay tareas para mostrar en el gráfico. ¡Añade una para empezar!</p>
      )}
    </div>
  );
};

export default App;
