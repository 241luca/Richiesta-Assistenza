// Configuration
const API_BASE_URL = 'http://localhost:3500';

// Service configurations
const SERVICES = {
    'openai': {
        name: 'OpenAI',
        description: 'ChatGPT, GPT-4, Embeddings',
        icon: 'fa-robot',
        color: 'purple',
        testable: true,
        metadata: false
    },
    'anthropic': {
        name: 'Anthropic Claude',
        description: 'Claude AI models',
        icon: 'fa-brain',
        color: 'orange',
        testable: true,
        metadata: false
    },
    'azure_openai': {
        name: 'Azure OpenAI',
        description: 'Azure OpenAI Service',
        icon: 'fa-cloud',
        color: 'blue',
        testable: false,
        metadata: true
    },
    'ollama': {
        name: 'Ollama',
        description: 'Local LLM models',
        icon: 'fa-server',
        color: 'gray',
        testable: false,
        metadata: true
    },
    'qdrant': {
        name: 'Qdrant',
        description: 'Vector database',
        icon: 'fa-database',
        color: 'indigo',
        testable: true,
        metadata: true
    },
    'minio': {
        name: 'MinIO',
        description: 'S3-compatible storage',
        icon: 'fa-box',
        color: 'red',
        testable: false,
        metadata: true
    },
    'aws_s3': {
        name: 'AWS S3',
        description: 'Amazon S3 storage',
        icon: 'fa-aws',
        color: 'yellow',
        testable: false,
        metadata: true
    }
};

// State
let apiKeys = [];
let currentService = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadApiKeys();
});

// Load API Keys
async function loadApiKeys() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/api-keys?includeInactive=true`);
        const data = await response.json();
        
        if (data.success) {
            apiKeys = data.data;
            renderApiKeys();
        } else {
            showAlert('Error loading API keys', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Failed to connect to SmartDocs API', 'error');
    }
}

// Render API Keys Grid
function renderApiKeys() {
    const grid = document.getElementById('apiKeysGrid');
    grid.innerHTML = '';

    Object.entries(SERVICES).forEach(([service, config]) => {
        const apiKey = apiKeys.find(k => k.service === service);
        const isConfigured = apiKey && apiKey.key_value && !apiKey.key_value.includes('***');
        const isActive = apiKey?.is_active || false;

        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition';
        
        card.innerHTML = `
            <div class="p-6">
                <!-- Header -->
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-${config.color}-100 rounded-lg flex items-center justify-center mr-3">
                            <i class="fas ${config.icon} text-${config.color}-600 text-xl"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900">${config.name}</h3>
                            <p class="text-sm text-gray-500">${config.description}</p>
                        </div>
                    </div>
                    ${isConfigured ? `
                        <span class="px-2 py-1 text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} rounded-full">
                            ${isActive ? '<i class="fas fa-check mr-1"></i>Active' : 'Inactive'}
                        </span>
                    ` : ''}
                </div>

                <!-- Status -->
                <div class="mb-4">
                    ${isConfigured ? `
                        <div class="flex items-center text-sm text-gray-600">
                            <i class="fas fa-key mr-2 text-green-600"></i>
                            <span class="font-mono">${apiKey.key_value}</span>
                        </div>
                        ${apiKey.last_validated_at ? `
                            <div class="flex items-center text-xs text-gray-500 mt-1">
                                <i class="fas fa-clock mr-1"></i>
                                Last validated: ${new Date(apiKey.last_validated_at).toLocaleString()}
                            </div>
                        ` : ''}
                    ` : `
                        <div class="flex items-center text-sm text-gray-500">
                            <i class="fas fa-exclamation-triangle mr-2 text-yellow-600"></i>
                            Not configured
                        </div>
                    `}
                </div>

                <!-- Actions -->
                <div class="flex gap-2">
                    <button onclick="openConfigureModal('${service}')" 
                        class="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        <i class="fas ${isConfigured ? 'fa-edit' : 'fa-plus'} mr-1"></i>
                        ${isConfigured ? 'Edit' : 'Configure'}
                    </button>
                    
                    ${config.testable && isConfigured ? `
                        <button onclick="testApiKey('${service}')" 
                            class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                            <i class="fas fa-vial"></i>
                        </button>
                    ` : ''}
                    
                    ${isConfigured ? `
                        <button onclick="toggleApiKey('${service}')" 
                            class="px-4 py-2 text-sm ${isActive ? 'bg-gray-200 text-gray-700' : 'bg-green-600 text-white'} rounded-lg hover:opacity-80 transition">
                            <i class="fas fa-${isActive ? 'pause' : 'play'}"></i>
                        </button>
                        <button onclick="deleteApiKey('${service}')" 
                            class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Open Configure Modal
function openConfigureModal(service) {
    currentService = service;
    const config = SERVICES[service];
    const apiKey = apiKeys.find(k => k.service === service);

    document.getElementById('modalTitle').textContent = `Configure ${config.name}`;
    document.getElementById('formService').value = service;
    document.getElementById('formServiceName').value = config.name;
    document.getElementById('formKeyValue').value = apiKey?.key_value || '';
    document.getElementById('formDescription').value = apiKey?.description || '';
    document.getElementById('formIsActive').checked = apiKey?.is_active !== false;
    
    // Show/hide metadata section
    const metadataSection = document.getElementById('metadataSection');
    if (config.metadata) {
        metadataSection.classList.remove('hidden');
        const metadata = apiKey?.metadata || {};
        document.getElementById('formMetadata').value = JSON.stringify(metadata, null, 2);
    } else {
        metadataSection.classList.add('hidden');
    }

    document.getElementById('modal').classList.remove('hidden');
}

// Close Modal
function closeModal() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('apiKeyForm').reset();
    currentService = null;
}

// Toggle Password Visibility
function togglePasswordVisibility() {
    const input = document.getElementById('formKeyValue');
    const icon = document.getElementById('eyeIcon');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Save API Key
async function saveApiKey(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const service = formData.get('service');
    const config = SERVICES[service];
    
    let metadata = {};
    if (config.metadata) {
        try {
            const metadataStr = formData.get('metadata');
            if (metadataStr) {
                metadata = JSON.parse(metadataStr);
            }
        } catch (error) {
            showAlert('Invalid JSON in metadata field', 'error');
            return;
        }
    }

    const data = {
        service,
        name: config.name,
        key_value: formData.get('key_value'),
        description: formData.get('description'),
        is_active: formData.get('is_active') === 'on',
        metadata
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/api-keys`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            showAlert(`${config.name} API key saved successfully!`, 'success');
            closeModal();
            loadApiKeys();
        } else {
            showAlert(result.error || 'Failed to save API key', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Failed to save API key', 'error');
    }
}

// Test API Key
async function testApiKey(service) {
    const config = SERVICES[service];
    
    showAlert(`Testing ${config.name} API key...`, 'info');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/api-keys/${service}/test`, {
            method: 'POST'
        });

        const result = await response.json();
        
        if (result.success) {
            showAlert(`✅ ${config.name}: ${result.message}`, 'success');
            loadApiKeys(); // Refresh to update last_validated_at
        } else {
            showAlert(`❌ ${config.name}: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Failed to test API key', 'error');
    }
}

// Toggle API Key Active Status
async function toggleApiKey(service) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/api-keys/${service}/toggle`, {
            method: 'POST'
        });

        const result = await response.json();
        
        if (result.success) {
            showAlert(result.message, 'success');
            loadApiKeys();
        } else {
            showAlert(result.error || 'Failed to toggle API key', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Failed to toggle API key', 'error');
    }
}

// Delete API Key
async function deleteApiKey(service) {
    const config = SERVICES[service];
    
    if (!confirm(`Are you sure you want to delete ${config.name} API key?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/api-keys/${service}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        
        if (result.success) {
            showAlert(`${config.name} API key deleted`, 'success');
            loadApiKeys();
        } else {
            showAlert(result.error || 'Failed to delete API key', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Failed to delete API key', 'error');
    }
}

// Show Alert
function showAlert(message, type = 'info') {
    const alertArea = document.getElementById('alertArea');
    
    const colors = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const alert = document.createElement('div');
    alert.className = `${colors[type]} border rounded-lg p-4 mb-4 flex items-center justify-between`;
    alert.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${icons[type]} mr-3"></i>
            <span>${message}</span>
        </div>
        <button onclick="this.parentElement.remove()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    alertArea.appendChild(alert);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}
