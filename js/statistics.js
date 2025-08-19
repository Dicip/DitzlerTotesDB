/**
 * Gestor de Estadísticas - Ditzler Chile
 * Maneja KPIs, gráficos interactivos y métricas detalladas
 * Autor: Sistema de Gestión Ditzler
 * Fecha: 2024
 */

class StatisticsManager {
    constructor() {
        this.charts = {};
        this.currentUser = null;
        this.refreshInterval = null;
        this.init();
    }

    /**
     * Inicializa el gestor de estadísticas
     */
    async init() {
        try {
            await this.verifySession();
            this.initializeCharts();
            this.setupEventListeners();
            this.loadAllData();
            this.startAutoRefresh();
        } catch (error) {
            console.error('Error inicializando estadísticas:', error);
            this.showMessage('Error al cargar las estadísticas', 'error');
        }
    }

    /**
     * Verifica la sesión del usuario
     */
    async verifySession() {
        try {
            // Usar el mismo sistema de verificación que otras páginas
            const userData = UTILS.getSessionData();
            
            if (!userData || !UTILS.isSessionValid(userData)) {
                UTILS.clearSession();
                window.location.href = '../index.html';
                return;
            }
            
            // Verificar permisos de rol para estadísticas
            if (userData.role !== 'Operador Totes' && userData.role !== 'Admin' && userData.role !== 'Administrador') {
                UTILS.showNotification('Acceso denegado. Esta página es solo para Operadores de Totes.', 'error');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 2000);
                return;
            }
            
            this.currentUser = userData;
        } catch (error) {
            console.error('Error verificando sesión:', error);
            window.location.href = '../index.html';
        }
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Botones del header
        const refreshAllBtn = document.querySelector('[onclick="refreshAllData()"]');
        if (refreshAllBtn) {
            refreshAllBtn.onclick = () => this.refreshAllData();
        }

        const exportBtn = document.querySelector('[onclick="exportReport()"]');
        if (exportBtn) {
            exportBtn.onclick = () => this.exportReport();
        }

        // Controles de gráficos
        const statusPeriod = document.getElementById('statusPeriod');
        if (statusPeriod) {
            statusPeriod.addEventListener('change', () => this.updateStatusChart());
        }

        const productivityPeriod = document.getElementById('productivityPeriod');
        if (productivityPeriod) {
            productivityPeriod.addEventListener('change', () => this.updateProductivityChart());
        }

        // Filtros de tabla
        const searchTotes = document.getElementById('searchTotes');
        if (searchTotes) {
            searchTotes.addEventListener('input', (e) => this.filterTotesTable(e.target.value));
        }

        const filterStatus = document.getElementById('filterStatus');
        if (filterStatus) {
            filterStatus.addEventListener('change', (e) => this.filterTotesByStatus(e.target.value));
        }

        const searchMovements = document.getElementById('searchMovements');
        if (searchMovements) {
            searchMovements.addEventListener('input', (e) => this.filterMovementsTable(e.target.value));
        }
    }

    /**
     * Inicializa todos los gráficos
     */
    initializeCharts() {
        this.initStatusChart();
        this.initProductivityChart();
        this.initEfficiencyChart();
    }

    /**
     * Inicializa el gráfico de distribución de estados
     */
    initStatusChart() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        this.charts.status = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Activos', 'Inactivos', 'Mantenimiento', 'Procesados'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        '#10b981', // Verde para activos
                        '#64748b', // Gris para inactivos
                        '#f59e0b', // Amarillo para mantenimiento
                        '#06b6d4'  // Azul para procesados
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Inicializa el gráfico de productividad
     */
    initProductivityChart() {
        const ctx = document.getElementById('productivityChart');
        if (!ctx) return;

        this.charts.productivity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Totes Procesados',
                    data: [],
                    backgroundColor: '#2563eb',
                    borderColor: '#1d4ed8',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e2e8f0'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#2563eb',
                        borderWidth: 1
                    }
                }
            }
        });
    }

    /**
     * Inicializa el gráfico de eficiencia operativa
     */
    initEfficiencyChart() {
        const ctx = document.getElementById('efficiencyChart');
        if (!ctx) return;

        this.charts.efficiency = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Eficiencia Operativa (%)',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: '#e2e8f0'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: '#e2e8f0'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#10b981',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `Eficiencia: ${context.parsed.y}%`;
                            }
                        }
                    }
                }
            }
        });    
    }

    /**
     * Actualiza el gráfico de estados según el período seleccionado
     */
    async updateStatusChart() {
        const period = document.getElementById('statusPeriod')?.value || '7d';
        try {
            const response = await fetch(`/api/statistics/status?period=${period}`);
            const data = await response.json();
            
            if (this.charts.status && data.success) {
                this.charts.status.data.datasets[0].data = data.data;
                this.charts.status.update();
            }
        } catch (error) {
            console.error('Error updating status chart:', error);
        }
    }

    /**
     * Actualiza el gráfico de productividad según el período seleccionado
     */
    async updateProductivityChart() {
        const period = document.getElementById('productivityPeriod')?.value || '7d';
        try {
            const response = await fetch(`/api/statistics/productivity?period=${period}`);
            const data = await response.json();
            
            if (this.charts.productivity && data.success) {
                this.charts.productivity.data.labels = data.labels || [];
                this.charts.productivity.data.datasets[0].data = data.data || [];
                this.charts.productivity.update();
            }
        } catch (error) {
            console.error('Error updating productivity chart:', error);
        }
    }

    /**
     * Carga todos los datos
     */
    async loadAllData() {
        await Promise.all([
            this.loadKPIs(),
            this.loadChartData(),
            this.loadMetrics(),
            this.loadTotesTable(),
            this.loadMovementsTable()
        ]);
    }

    /**
     * Carga los KPIs principales
     */
    async loadKPIs() {
        try {
            const response = await fetch('/api/statistics/kpis');
            if (!response.ok) throw new Error('Error cargando KPIs');
            
            const data = await response.json();
            this.updateKPIs(data);
        } catch (error) {
            console.error('Error cargando KPIs:', error);
            // Datos de ejemplo para desarrollo
            this.updateKPIs({
                totalTotes: { value: 1247, trend: 5.2 },
                operationalEfficiency: { value: 87.5, trend: 2.1 },
                avgResponseTime: { value: 4.2, trend: -0.8 },
                objectiveCompliance: { value: 92.3, trend: 1.5 }
            });
        }
    }

    /**
     * Actualiza los KPIs en la interfaz
     */
    updateKPIs(data) {
        const elements = {
            totalTotes: document.getElementById('totalTotes'),
            operationalEfficiency: document.getElementById('operationalEfficiency'),
            avgResponseTime: document.getElementById('avgResponseTime'),
            objectiveCompliance: document.getElementById('objectiveCompliance')
        };

        const trends = {
            totalTotesTrend: document.getElementById('totalTotesTrend'),
            efficiencyTrend: document.getElementById('efficiencyTrend'),
            responseTimeTrend: document.getElementById('responseTimeTrend'),
            complianceTrend: document.getElementById('complianceTrend')
        };

        // Actualizar valores
        if (elements.totalTotes) elements.totalTotes.textContent = data.totalTotes.value.toLocaleString();
        if (elements.operationalEfficiency) elements.operationalEfficiency.textContent = data.operationalEfficiency.value + '%';
        if (elements.avgResponseTime) elements.avgResponseTime.textContent = data.avgResponseTime.value + ' min';
        if (elements.objectiveCompliance) elements.objectiveCompliance.textContent = data.objectiveCompliance.value + '%';

        // Actualizar tendencias
        if (trends.totalTotesTrend) {
            trends.totalTotesTrend.textContent = (data.totalTotes.trend > 0 ? '+' : '') + data.totalTotes.trend + '%';
            trends.totalTotesTrend.className = `kpi-trend ${data.totalTotes.trend > 0 ? 'positive' : 'negative'}`;
        }
        
        if (trends.efficiencyTrend) {
            trends.efficiencyTrend.textContent = (data.operationalEfficiency.trend > 0 ? '+' : '') + data.operationalEfficiency.trend + '%';
            trends.efficiencyTrend.className = `kpi-trend ${data.operationalEfficiency.trend > 0 ? 'positive' : 'negative'}`;
        }
        
        if (trends.responseTimeTrend) {
            trends.responseTimeTrend.textContent = (data.avgResponseTime.trend > 0 ? '+' : '') + data.avgResponseTime.trend + '%';
            trends.responseTimeTrend.className = `kpi-trend ${data.avgResponseTime.trend < 0 ? 'positive' : 'negative'}`;
        }
        
        if (trends.complianceTrend) {
            trends.complianceTrend.textContent = (data.objectiveCompliance.trend > 0 ? '+' : '') + data.objectiveCompliance.trend + '%';
            trends.complianceTrend.className = `kpi-trend ${data.objectiveCompliance.trend > 0 ? 'positive' : 'negative'}`;
        }
    }

    /**
     * Carga datos para los gráficos
     */
    async loadChartData() {
        try {
            const response = await fetch('/api/statistics/charts');
            if (!response.ok) throw new Error('Error cargando datos de gráficos');
            
            const data = await response.json();
            this.updateCharts(data);
        } catch (error) {
            console.error('Error cargando datos de gráficos:', error);
            // Datos de ejemplo para desarrollo
            this.updateCharts({
                status: [45, 12, 8, 67],
                productivity: {
                    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                    data: [42, 38, 51, 47, 55, 33, 28]
                },
                efficiency: {
                    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                    data: [82, 78, 89, 92, 87, 85]
                }
            });
        }
    }

    /**
     * Actualiza todos los gráficos
     */
    updateCharts(data) {
        // Actualizar gráfico de estados
        if (this.charts.status && data.status) {
            this.charts.status.data.datasets[0].data = data.status;
            this.charts.status.update();
        }

        // Actualizar gráfico de productividad
        if (this.charts.productivity && data.productivity) {
            this.charts.productivity.data.labels = data.productivity.labels;
            this.charts.productivity.data.datasets[0].data = data.productivity.data;
            this.charts.productivity.update();
        }

        // Actualizar gráfico de eficiencia
        if (this.charts.efficiency && data.efficiency) {
            this.charts.efficiency.data.labels = data.efficiency.labels;
            this.charts.efficiency.data.datasets[0].data = data.efficiency.data;
            this.charts.efficiency.update();
        }
    }

    /**
     * Carga las métricas detalladas
     */
    async loadMetrics() {
        try {
            const response = await fetch('/api/statistics/metrics');
            if (!response.ok) throw new Error('Error cargando métricas');
            
            const data = await response.json();
            this.updateMetrics(data);
        } catch (error) {
            console.error('Error cargando métricas:', error);
            // Datos de ejemplo para desarrollo
            this.updateMetrics({
                states: { active: 45, inactive: 12, maintenance: 8, processed: 67 },
                responseTimes: { average: 4.2, min: 1.8, max: 12.5, target: 5.0 },
                productivity: { topOperator: 'Juan P.', teamAverage: 45.2, personal: 52.1, vsTarget: 15.3 }
            });
        }
    }

    /**
     * Actualiza las métricas en la interfaz
     */
    updateMetrics(data) {
        // Estados actuales
        const stateElements = {
            activeTotes: document.getElementById('activeTotes'),
            inactiveTotes: document.getElementById('inactiveTotes'),
            maintenanceTotes: document.getElementById('maintenanceTotes'),
            totesHoy: document.getElementById('totesHoy')
        };

        // Procesar datos del servidor o usar datos de ejemplo
        let states = { active: 0, inactive: 0, maintenance: 0, processed: 0 };
        if (data.totesByStatus) {
            data.totesByStatus.forEach(item => {
                switch(item.Estado.toLowerCase()) {
                    case 'activo': states.active = item.cantidad; break;
                    case 'inactivo': states.inactive = item.cantidad; break;
                    case 'mantenimiento': states.maintenance = item.cantidad; break;
                    default: states.processed += item.cantidad; break;
                }
            });
        } else if (data.states) {
            states = data.states;
        }

        if (stateElements.activeTotes) stateElements.activeTotes.textContent = states.active;
        if (stateElements.inactiveTotes) stateElements.inactiveTotes.textContent = states.inactive;
        if (stateElements.maintenanceTotes) stateElements.maintenanceTotes.textContent = states.maintenance;
        if (stateElements.totesHoy) stateElements.totesHoy.textContent = states.processed;

        // Tiempos de respuesta
        const timeElements = {
            avgGeneralTime: document.getElementById('avgGeneralTime'),
            minResponseTime: document.getElementById('minResponseTime'),
            maxResponseTime: document.getElementById('maxResponseTime'),
            targetTime: document.getElementById('targetTime')
        };

        // Usar datos del servidor o valores por defecto
        let responseTimes = { average: 15, min: 5, max: 45, target: 30 };
        if (data.responseTimes) {
            responseTimes = data.responseTimes;
        }

        if (timeElements.avgGeneralTime) timeElements.avgGeneralTime.textContent = responseTimes.average + ' min';
        if (timeElements.minResponseTime) timeElements.minResponseTime.textContent = responseTimes.min + ' min';
        if (timeElements.maxResponseTime) timeElements.maxResponseTime.textContent = responseTimes.max + ' min';
        if (timeElements.targetTime) timeElements.targetTime.textContent = '≤ ' + responseTimes.target + ' min';

        // Productividad comparativa
        const prodElements = {
            topOperator: document.getElementById('topOperator'),
            teamAverage: document.getElementById('teamAverage'),
            myProductivity: document.getElementById('myProductivity'),
            vsTarget: document.getElementById('vsTarget')
        };

        // Procesar datos de productividad del servidor o usar valores por defecto
        let productivity = { topOperator: 'N/A', teamAverage: 0, personal: 0, vsTarget: 0 };
        if (data.dailyProductivity && data.dailyProductivity.length > 0) {
            const maxProductivity = Math.max(...data.dailyProductivity.map(p => p.cantidad));
            const avgProductivity = data.dailyProductivity.reduce((sum, p) => sum + p.cantidad, 0) / data.dailyProductivity.length;
            productivity = {
                topOperator: data.dailyProductivity.find(p => p.cantidad === maxProductivity)?.Operador || 'N/A',
                teamAverage: Math.round(avgProductivity),
                personal: data.dailyProductivity[0]?.cantidad || 0,
                vsTarget: Math.round(((data.dailyProductivity[0]?.cantidad || 0) / 100 - 1) * 100)
            };
        } else if (data.productivity) {
            productivity = data.productivity;
        }

        if (prodElements.topOperator) prodElements.topOperator.textContent = productivity.topOperator;
        if (prodElements.teamAverage) prodElements.teamAverage.textContent = productivity.teamAverage + ' totes/día';
        if (prodElements.myProductivity) prodElements.myProductivity.textContent = productivity.personal + ' totes/día';
        if (prodElements.vsTarget) prodElements.vsTarget.textContent = (productivity.vsTarget >= 0 ? '+' : '') + productivity.vsTarget + '%';

        // Actualizar indicadores de cumplimiento
        this.updateComplianceIndicators({ responseTimes, productivity, states });
    }

    /**
     * Actualiza los indicadores de cumplimiento de objetivos
     * @param {Object} data - Datos de las métricas
     * @private
     */
    updateComplianceIndicators(data) {
        try {
            const complianceData = [
                {
                    id: 'efficiency-compliance',
                    title: 'Eficiencia Operativa',
                    icon: '⚡',
                    value: data.responseTimes.average,
                    target: data.responseTimes.target,
                    unit: ' min',
                    inverse: true // Menor es mejor
                },
                {
                    id: 'productivity-compliance',
                    title: 'Productividad Personal',
                    icon: '📈',
                    value: data.productivity.personal,
                    target: data.productivity.teamAverage,
                    unit: ' totes/día'
                },
                {
                    id: 'states-compliance',
                    title: 'Estados Activos',
                    icon: '🎯',
                    value: data.states.active,
                    target: data.states.active + data.states.inactive,
                    unit: ' totes'
                }
            ];

            complianceData.forEach(item => {
                this.renderComplianceIndicator(item);
            });

        } catch (error) {
            console.error('Error actualizando indicadores de cumplimiento:', error);
        }
    }

    /**
     * Renderiza un indicador de cumplimiento individual
     * @param {Object} data - Datos del indicador
     * @private
     */
    renderComplianceIndicator(data) {
        const container = document.getElementById('compliance-indicators');
        if (!container) return;

        // Calcular porcentaje de cumplimiento
        let percentage;
        if (data.inverse) {
            // Para métricas donde menor es mejor (ej: tiempo de respuesta)
            percentage = Math.max(0, Math.min(100, (data.target / data.value) * 100));
        } else {
            // Para métricas donde mayor es mejor
            percentage = Math.max(0, Math.min(100, (data.value / data.target) * 100));
        }

        // Determinar estado de cumplimiento
        let status, statusText;
        if (percentage >= 95) {
            status = 'excellent';
            statusText = 'Excelente';
        } else if (percentage >= 80) {
            status = 'good';
            statusText = 'Bueno';
        } else if (percentage >= 60) {
            status = 'warning';
            statusText = 'Atención';
        } else {
            status = 'critical';
            statusText = 'Crítico';
        }

        // Crear HTML del indicador
        const indicatorHTML = `
            <div class="compliance-indicator ${status}" id="${data.id}">
                <div class="compliance-header">
                    <div class="compliance-title">
                        <span>${data.icon}</span>
                        ${data.title}
                    </div>
                    <span class="compliance-status ${status}">${statusText}</span>
                </div>
                <div class="compliance-progress">
                    <div class="compliance-progress-bar ${status}" style="width: ${percentage}%"></div>
                </div>
                <div class="compliance-details">
                    <span>Actual: <strong>${data.value}${data.unit}</strong></span>
                    <span>Objetivo: <strong>${data.target}${data.unit}</strong></span>
                    <span>Cumplimiento: <strong>${percentage.toFixed(1)}%</strong></span>
                </div>
            </div>
        `;

        // Buscar si ya existe el indicador
        const existingIndicator = document.getElementById(data.id);
        if (existingIndicator) {
            existingIndicator.outerHTML = indicatorHTML;
        } else {
            container.insertAdjacentHTML('beforeend', indicatorHTML);
        }

        // Mostrar alerta si el estado es crítico
        if (status === 'critical') {
            this.showAlert(`⚠️ ${data.title}: Rendimiento por debajo del objetivo (${percentage.toFixed(1)}%)`, 'error');
        }
    }

    /**
     * Muestra una alerta temporal
     * @param {string} message - Mensaje de la alerta
     * @param {string} type - Tipo de alerta ('success', 'info', 'error')
     * @private
     */
    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alert-container') || this.createAlertContainer();
        
        const alertId = 'alert-' + Date.now();
        const alertHTML = `
            <div class="alert alert-${type}" id="${alertId}">
                <span>${this.getAlertIcon(type)}</span>
                <span>${message}</span>
            </div>
        `;
        
        alertContainer.insertAdjacentHTML('afterbegin', alertHTML);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                alertElement.style.animation = 'slideOutUp 0.3s ease-in';
                setTimeout(() => alertElement.remove(), 300);
            }
        }, 5000);
    }

    /**
     * Crea el contenedor de alertas si no existe
     * @returns {HTMLElement} Contenedor de alertas
     * @private
     */
    createAlertContainer() {
        const container = document.createElement('div');
        container.id = 'alert-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        return container;
    }

    /**
     * Obtiene el icono apropiado para el tipo de alerta
     * @param {string} type - Tipo de alerta
     * @returns {string} Icono de la alerta
     * @private
     */
    getAlertIcon(type) {
        const icons = {
            success: '✅',
            info: 'ℹ️',
            error: '❌'
        };
        return icons[type] || icons.info;
    }

    /**
     * Carga la tabla de totes
     */
    async loadTotesTable() {
        // Reutilizar la funcionalidad existente del TotesTableManager
        if (window.totesTableManager) {
            await window.totesTableManager.loadTotes();
        }
    }

    /**
     * Carga la tabla de movimientos
     */
    async loadMovementsTable() {
        // Reutilizar la funcionalidad existente
        if (typeof refreshMovements === 'function') {
            refreshMovements();
        }
    }

    /**
     * Actualiza todos los datos
     */
    async refreshAllData() {
        this.showMessage('Actualizando datos...', 'info');
        try {
            await this.loadAllData();
            this.showMessage('Datos actualizados correctamente', 'success');
        } catch (error) {
            console.error('Error actualizando datos:', error);
            this.showMessage('Error al actualizar los datos', 'error');
        }
    }

    /**
     * Exporta el reporte
     */
    async exportReport() {
        try {
            this.showMessage('Generando reporte...', 'info');
            const response = await fetch('/api/statistics/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format: 'pdf', includeCharts: true })
            });

            if (!response.ok) throw new Error('Error generando reporte');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte-estadisticas-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.showMessage('Reporte exportado correctamente', 'success');
        } catch (error) {
            console.error('Error exportando reporte:', error);
            this.showMessage('Error al exportar el reporte', 'error');
        }
    }

    /**
     * Inicia la actualización automática
     */
    startAutoRefresh() {
        // Actualizar cada 5 minutos
        this.refreshInterval = setInterval(() => {
            this.loadKPIs();
            this.loadChartData();
            this.loadMetrics();
        }, 300000);
    }

    /**
     * Detiene la actualización automática
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Muestra un mensaje al usuario
     */
    showMessage(message, type = 'info') {
        const container = document.getElementById('message-container');
        if (!container) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;

        container.appendChild(messageDiv);

        // Remover el mensaje después de 5 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
}

// Funciones globales para compatibilidad
function switchTab(tabName) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Desactivar todos los botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar el tab seleccionado
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Activar el botón correspondiente
    const selectedBtn = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
}

function updateEfficiencyChart(period) {
    // Actualizar botones activos
    document.querySelectorAll('.chart-controls .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[onclick="updateEfficiencyChart('${period}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Actualizar datos del gráfico según el período
    if (window.statisticsManager && window.statisticsManager.charts.efficiency) {
        let labels, data;
        
        switch (period) {
            case 'hourly':
                labels = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
                data = [78, 82, 85, 88, 92, 89, 94, 91, 87, 85, 83, 80];
                break;
            case 'weekly':
                labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
                data = [85, 88, 92, 87];
                break;
            default: // daily
                labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                data = [82, 78, 89, 92, 87, 85, 79];
        }
        
        window.statisticsManager.charts.efficiency.data.labels = labels;
        window.statisticsManager.charts.efficiency.data.datasets[0].data = data;
        window.statisticsManager.charts.efficiency.update();
    }
}

function refreshAllData() {
    if (window.statisticsManager) {
        window.statisticsManager.refreshAllData();
    }
}

function exportReport() {
    if (window.statisticsManager) {
        window.statisticsManager.exportReport();
    }
}

function refreshTotesTable() {
    if (window.totesTableManager) {
        window.totesTableManager.loadTotes();
    }
}

function exportTotesTable() {
    // Implementar exportación de tabla de totes
    console.log('Exportando tabla de totes...');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.statisticsManager = new StatisticsManager();
});

// Limpiar al salir de la página
window.addEventListener('beforeunload', () => {
    if (window.statisticsManager) {
        window.statisticsManager.stopAutoRefresh();
    }
});