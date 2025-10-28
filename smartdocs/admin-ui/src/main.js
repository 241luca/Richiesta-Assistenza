console.log('[SmartDocs] Script loaded!');

// Use global API constants from HTML
const API_BASE = window.API_BASE || 'http://localhost:3500/api';
const API_HEALTH = window.API_HEALTH || 'http://localhost:3500/health';

// Debug helper
function debugLog(message) {
    console.log('[SmartDocs Admin]', message);
    const banner = document.getElementById('debug-banner');
    const debugMessage = document.getElementById('debug-message');
    if (banner && debugMessage) {
        banner.classList.remove('hidden');
        debugMessage.textContent = message;
    }
}

class SmartDocsAdmin {
    constructor() {
        this.currentPage = 'dashboard';
        this.init();
    }

    init() {
        this.render();
        this.loadData();
        
        // Auto-refresh every 10 seconds
        setInterval(() => {
            if (this.currentPage === 'dashboard') {
                this.loadData();
            }
        }, 10000);
    }

    async loadData() {
        try {
            debugLog('Loading data from API...');
            console.log('Fetching from:', API_HEALTH, API_BASE);
            
            const [health, jobs, containers] = await Promise.all([
                fetch(API_HEALTH).then(r => {
                    debugLog(`Health check: ${r.status}`);
                    console.log('Health check response:', r.status);
                    return r.json();
                }),
                fetch(`${API_BASE}/sync/jobs?limit=10`).then(r => {
                    debugLog(`Jobs fetch: ${r.status}`);
                    console.log('Jobs response:', r.status);
                    return r.json();
                }).catch(err => {
                    console.error('Jobs error:', err);
                    debugLog(`Jobs error: ${err.message}`);
                    return { success: false, data: [] };
                }),
                fetch(`${API_BASE}/container-instances`).then(r => {
                    debugLog(`Containers fetch: ${r.status}`);
                    console.log('Containers response:', r.status);
                    return r.json();
                }).catch(err => {
                    console.error('Containers error:', err);
                    debugLog(`Containers error: ${err.message}`);
                    return { success: false, data: [] };
                })
            ]);

            debugLog('Data loaded successfully');
            console.log('Data loaded:', { health, jobs, containers });
            this.data = { health, jobs, containers };
            this.renderContent();
        } catch (error) {
            console.error('Failed to load data:', error);
            debugLog(`FATAL ERROR: ${error.message}`);
            this.showError('Failed to connect to SmartDocs API. Make sure it\'s running on port 3500.');
        }
    }

    navigate(page) {
        this.currentPage = page;
        this.render();
        if (page === 'dashboard') this.loadData();
        if (page === 'keys') this.loadKeys();
        if (page === 'jobs') this.loadJobs();
        if (page === 'containers') this.loadContainers();
        if (page === 'system') this.renderContent(); // System uses existing data
    }

    async loadKeys() {
        // Placeholder - implementare lettura chiavi da env/config
        this.keys = {
            openai: localStorage.getItem('openai_key') || '',
            encryption: localStorage.getItem('encryption_key') || ''
        };
        this.renderContent();
    }

    async saveKey(type, value) {
        localStorage.setItem(`${type}_key`, value);
        alert(`${type.toUpperCase()} key saved!`);
    }

    async loadJobs() {
        try {
            const response = await fetch(`${API_BASE}/sync/jobs?limit=50`);
            const data = await response.json();
            this.jobs = data.data || [];
            this.renderContent();
        } catch (error) {
            console.error('Failed to load jobs:', error);
        }
    }

    async loadContainers() {
        try {
            const response = await fetch(`${API_BASE}/container-instances`);
            const data = await response.json();
            this.containers = data.data || [];
            this.renderContent();
        } catch (error) {
            console.error('Failed to load containers:', error);
        }
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen flex">
                <!-- Sidebar -->
                <div class="w-64 bg-gradient-to-b from-blue-600 to-purple-600 text-white shadow-xl">
                    <div class="p-6">
                        <h1 class="text-2xl font-bold flex items-center gap-2">
                            <i class="fas fa-brain"></i>
                            SmartDocs
                        </h1>
                        <p class="text-sm text-blue-100 mt-1">Admin Panel</p>
                    </div>
                    
                    <nav class="mt-6">
                        ${this.renderMenuItem('dashboard', 'Dashboard', 'fa-home')}
                        ${this.renderMenuItem('keys', 'API Keys', 'fa-key')}
                        ${this.renderMenuItem('containers', 'Containers', 'fa-box')}
                        ${this.renderMenuItem('jobs', 'Sync Jobs', 'fa-sync')}
                        ${this.renderMenuItem('system', 'System Status', 'fa-server')}
                        
                        <!-- Knowledge Graph Link -->
                        <div class="mt-4 border-t border-white/20 pt-4">
                            <a href="/knowledge-graph.html" 
                               class="w-full text-left px-6 py-3 flex items-center gap-3 transition-colors hover:bg-white/10 text-white no-underline">
                                <i class="fas fa-project-diagram w-5"></i>
                                <span>Knowledge Graph</span>
                                <span class="ml-auto px-2 py-1 bg-green-500 text-white text-xs rounded-full font-bold">NEW</span>
                            </a>
                        </div>
                    </nav>
                </div>

                <!-- Main Content -->
                <div class="flex-1">
                    <!-- Header -->
                    <div class="bg-white shadow-sm border-b border-gray-200">
                        <div class="px-6 py-4 flex items-center justify-between">
                            <h2 class="text-2xl font-bold text-gray-800">
                                ${this.getPageTitle()}
                            </h2>
                            <div class="flex items-center gap-4">
                                <span class="text-sm text-gray-600">
                                    <i class="fas fa-clock"></i>
                                    ${new Date().toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Page Content -->
                    <div id="content" class="p-6">
                        ${this.renderLoadingState()}
                    </div>
                </div>
            </div>
        `;
    }

    renderMenuItem(page, label, icon) {
        const isActive = this.currentPage === page;
        return `
            <button 
                onclick="app.navigate('${page}')"
                class="w-full text-left px-6 py-3 flex items-center gap-3 transition-colors ${
                    isActive 
                        ? 'bg-white/20 border-l-4 border-white' 
                        : 'hover:bg-white/10'
                }"
            >
                <i class="fas ${icon} w-5"></i>
                <span>${label}</span>
            </button>
        `;
    }

    getPageTitle() {
        const titles = {
            dashboard: 'Dashboard',
            keys: 'API Keys Management',
            containers: 'Container Management',
            jobs: 'Sync Jobs Monitor',
            system: 'System Status'
        };
        return titles[this.currentPage] || 'Dashboard';
    }

    renderLoadingState() {
        return `
            <div class="flex items-center justify-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i>
                <span class="ml-4 text-gray-600">Loading data from SmartDocs API (port 3500)...</span>
            </div>
        `;
    }

    showError(message) {
        const content = document.getElementById('content');
        if (!content) return;
        content.innerHTML = `
            <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-triangle text-red-500 text-3xl mr-4"></i>
                    <div>
                        <h3 class="text-lg font-semibold text-red-800">Connection Error</h3>
                        <p class="text-red-700 mt-2">${message}</p>
                        <div class="mt-4 space-y-2">
                            <p class="text-sm text-red-600">Please check:</p>
                            <ul class="text-sm text-red-600 list-disc list-inside ml-4">
                                <li>SmartDocs API is running: <code class="bg-red-100 px-2 py-1 rounded">npm run dev</code></li>
                                <li>API is accessible at: <a href="http://localhost:3500/health" target="_blank" class="underline">http://localhost:3500/health</a></li>
                                <li>CORS is properly configured</li>
                            </ul>
                        </div>
                        <button 
                            onclick="app.loadData()" 
                            class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            <i class="fas fa-sync mr-2"></i>Retry
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderContent() {
        const content = document.getElementById('content');
        if (!content) return;

        switch (this.currentPage) {
            case 'dashboard':
                content.innerHTML = this.renderDashboard();
                break;
            case 'keys':
                content.innerHTML = this.renderKeys();
                break;
            case 'jobs':
                content.innerHTML = this.renderJobs();
                break;
            case 'containers':
                content.innerHTML = this.renderContainers();
                break;
            case 'system':
                content.innerHTML = this.renderSystem();
                break;
        }
    }

    renderDashboard() {
        if (!this.data) return this.renderLoadingState();

        const { health, jobs, containers } = this.data;
        const services = health?.services || {};

        return `
            <!-- Service Status Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                ${this.renderServiceCard('API', services.api, 'fa-server', 'blue')}
                ${this.renderServiceCard('Database', services.database, 'fa-database', 'green')}
                ${this.renderServiceCard('Redis', services.redis, 'fa-memory', 'red')}
                ${this.renderServiceCard('Vector DB', services.vector, 'fa-brain', 'purple')}
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">Total Containers</p>
                            <p class="text-3xl font-bold text-gray-900">${containers?.data?.length || 0}</p>
                        </div>
                        <i class="fas fa-box text-4xl text-blue-500"></i>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">Sync Jobs</p>
                            <p class="text-3xl font-bold text-gray-900">${jobs?.data?.length || 0}</p>
                        </div>
                        <i class="fas fa-sync text-4xl text-green-500"></i>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">System Health</p>
                            <p class="text-3xl font-bold ${services.api === 'healthy' ? 'text-green-600' : 'text-red-600'}">
                                ${services.api === 'healthy' ? '✓' : '✗'}
                            </p>
                        </div>
                        <i class="fas fa-heartbeat text-4xl text-red-500"></i>
                    </div>
                </div>
            </div>

            <!-- Recent Jobs -->
            <div class="mt-8 bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-semibold">Recent Sync Jobs</h3>
                </div>
                <div class="p-6">
                    ${this.renderJobsTable(jobs?.data?.slice(0, 5) || [])}
                </div>
            </div>
        `;
    }

    renderServiceCard(name, status, icon, color) {
        const isHealthy = status === 'healthy';
        const colors = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            red: 'bg-red-100 text-red-600',
            purple: 'bg-purple-100 text-purple-600'
        };

        return `
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-full ${colors[color]} flex items-center justify-center">
                            <i class="fas ${icon} text-xl"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900">${name}</h3>
                            <p class="text-sm text-gray-600">${isHealthy ? 'Operational' : 'Down'}</p>
                        </div>
                    </div>
                    <div class="w-3 h-3 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}"></div>
                </div>
            </div>
        `;
    }

    renderKeys() {
        return `
            <div class="max-w-2xl">
                <div class="bg-white rounded-lg shadow p-6 space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <i class="fas fa-brain mr-2"></i>OpenAI API Key
                        </label>
                        <div class="flex gap-2">
                            <input 
                                type="password" 
                                id="openai_key"
                                value="${this.keys?.openai || ''}"
                                placeholder="sk-..."
                                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button 
                                onclick="app.saveKey('openai', document.getElementById('openai_key').value)"
                                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <i class="fas fa-save mr-2"></i>Save
                            </button>
                        </div>
                        <p class="mt-2 text-sm text-gray-600">
                            Required for generating embeddings and AI features
                        </p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <i class="fas fa-lock mr-2"></i>Encryption Key
                        </label>
                        <div class="flex gap-2">
                            <input 
                                type="password" 
                                id="encryption_key"
                                value="${this.keys?.encryption || ''}"
                                placeholder="Enter encryption key..."
                                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button 
                                onclick="app.saveKey('encryption', document.getElementById('encryption_key').value)"
                                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <i class="fas fa-save mr-2"></i>Save
                            </button>
                        </div>
                        <p class="mt-2 text-sm text-gray-600">
                            Used for encrypting sensitive data at rest
                        </p>
                    </div>

                    <div class="pt-4 border-t border-gray-200">
                        <button 
                            onclick="app.testConnection()"
                            class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <i class="fas fa-plug mr-2"></i>Test Connection
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderJobs() {
        if (!this.jobs) return this.renderLoadingState();

        return `
            <div class="bg-white rounded-lg shadow">
                ${this.renderJobsTable(this.jobs)}
            </div>
        `;
    }

    renderJobsTable(jobs) {
        if (!jobs || jobs.length === 0) {
            return `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-4"></i>
                    <p>No sync jobs found</p>
                </div>
            `;
        }

        return `
            <table class="w-full">
                <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chunks</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    ${jobs.map(job => `
                        <tr>
                            <td class="px-6 py-4">
                                ${this.renderJobStatus(job.status)}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-900">${job.entity_id}</td>
                            <td class="px-6 py-4 text-sm text-gray-600">${job.entity_type}</td>
                            <td class="px-6 py-4 text-sm text-gray-600">${new Date(job.created_at).toLocaleString()}</td>
                            <td class="px-6 py-4 text-sm text-gray-600">${job.chunks_created || 0}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderJobStatus(status) {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800'
        };

        return `
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}">
                ${status}
            </span>
        `;
    }

    renderContainers() {
        if (!this.containers) return this.renderLoadingState();

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${this.containers.map(container => `
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-start justify-between mb-4">
                            <div>
                                <h3 class="font-semibold text-lg text-gray-900">${container.name}</h3>
                                <p class="text-sm text-gray-600 mt-1">${container.description || 'No description'}</p>
                            </div>
                            <i class="fas fa-box text-2xl text-blue-500"></i>
                        </div>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Status:</span>
                                <span class="font-semibold text-green-600">Active</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Created:</span>
                                <span class="text-gray-900">${new Date(container.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderSystem() {
        if (!this.data) return this.renderLoadingState();

        const { health } = this.data;

        return `
            <div class="space-y-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold mb-4">Service Health</h3>
                    <pre class="bg-gray-50 p-4 rounded-lg overflow-auto">${JSON.stringify(health, null, 2)}</pre>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold mb-4">Docker Commands</h3>
                    <div class="space-y-4">
                        ${this.renderCommandCard('Start All Services', 'docker-compose up -d', 'fa-play', 'green')}
                        ${this.renderCommandCard('Stop All Services', 'docker-compose down', 'fa-stop', 'red')}
                        ${this.renderCommandCard('View Logs', 'docker-compose logs -f', 'fa-file-alt', 'blue')}
                        ${this.renderCommandCard('Restart Services', 'docker-compose restart', 'fa-sync', 'yellow')}
                    </div>
                </div>
            </div>
        `;
    }

    renderCommandCard(title, command, icon, color) {
        const colors = {
            green: 'bg-green-50 text-green-700',
            red: 'bg-red-50 text-red-700',
            blue: 'bg-blue-50 text-blue-700',
            yellow: 'bg-yellow-50 text-yellow-700'
        };

        return `
            <div class="flex items-center gap-4 p-4 ${colors[color]} rounded-lg">
                <i class="fas ${icon} text-xl"></i>
                <div class="flex-1">
                    <p class="font-semibold">${title}</p>
                    <code class="text-sm">${command}</code>
                </div>
            </div>
        `;
    }

    async testConnection() {
        try {
            console.log('Testing connection to:', API_HEALTH);
            const response = await fetch(API_HEALTH);
            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);
            alert(data.services?.api === 'healthy' ? '✓ Connection successful!' : '✗ API is not healthy!');
        } catch (error) {
            console.error('Connection test failed:', error);
            alert('✗ Connection failed: ' + error.message + '\n\nMake sure SmartDocs API is running on port 3500');
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        debugLog(`API Base: ${API_BASE}, Health: ${API_HEALTH}`);
        window.app = new SmartDocsAdmin();
    });
} else {
    debugLog(`API Base: ${API_BASE}, Health: ${API_HEALTH}`);
    window.app = new SmartDocsAdmin();
}
