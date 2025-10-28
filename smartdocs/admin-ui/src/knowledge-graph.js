/**
 * knowledge-graph.js
 * 
 * Interactive Knowledge Graph Visualization
 * Using Vis.js Network for enterprise-grade graph rendering
 * 
 * @version 1.0.0
 */

const API_BASE = 'http://localhost:3500/api';

// Global variables
let network = null;
let allNodes = [];
let allEdges = [];
let currentDocumentId = null;
let graphData = null;

// Color mapping for entity types
const entityColors = {
    COMPONENT: '#3b82f6',  // blue
    TASK: '#10b981',       // green
    CONCEPT: '#f59e0b',    // yellow
    PROCESS: '#8b5cf6',    // purple
    ROLE: '#ec4899',       // pink
    OTHER: '#6b7280'       // gray
};

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[KG] Initializing Knowledge Graph Viewer');
    
    // Initialize network
    initializeNetwork();
    
    // Load documents
    loadDocuments();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('[KG] Initialization complete');
});

// =============================================================================
// NETWORK INITIALIZATION
// =============================================================================

function initializeNetwork() {
    const container = document.getElementById('network-canvas');
    
    const data = {
        nodes: new vis.DataSet([]),
        edges: new vis.DataSet([])
    };
    
    const options = {
        nodes: {
            shape: 'dot',
            size: 16,
            font: {
                size: 14,
                face: 'Arial',
                color: '#333'
            },
            borderWidth: 2,
            borderWidthSelected: 4,
            shadow: {
                enabled: true,
                color: 'rgba(0,0,0,0.2)',
                size: 10,
                x: 2,
                y: 2
            },
            scaling: {
                min: 10,
                max: 40,
                label: {
                    enabled: true,
                    min: 12,
                    max: 20
                }
            }
        },
        edges: {
            width: 2,
            color: {
                color: '#848484',
                highlight: '#3b82f6',
                hover: '#3b82f6',
                opacity: 0.7
            },
            smooth: {
                type: 'dynamic',
                roundness: 0.5
            },
            arrows: {
                to: {
                    enabled: true,
                    scaleFactor: 0.5
                }
            },
            font: {
                size: 11,
                align: 'middle',
                color: '#666',
                strokeWidth: 0
            },
            selectionWidth: 3
        },
        physics: {
            enabled: true,
            barnesHut: {
                gravitationalConstant: -8000,
                centralGravity: 0.3,
                springLength: 95,
                springConstant: 0.04,
                damping: 0.09,
                avoidOverlap: 0.5
            },
            maxVelocity: 50,
            solver: 'barnesHut',
            timestep: 0.35,
            stabilization: {
                iterations: 150,
                updateInterval: 25
            }
        },
        interaction: {
            hover: true,
            tooltipDelay: 200,
            navigationButtons: true,
            keyboard: true,
            zoomView: true,
            dragView: true
        },
        layout: {
            improvedLayout: true,
            randomSeed: 42
        }
    };
    
    network = new vis.Network(container, data, options);
    
    // Event handlers
    network.on('click', onNodeClick);
    network.on('doubleClick', onNodeDoubleClick);
    network.on('hoverNode', onNodeHover);
    network.on('blurNode', onNodeBlur);
    network.on('stabilizationIterationsDone', () => {
        console.log('[KG] Network stabilized');
        network.setOptions({ physics: { enabled: false } });
    });
    
    console.log('[KG] Network initialized');
}

// =============================================================================
// DATA LOADING
// =============================================================================

async function loadDocuments() {
    try {
        console.log('[KG] Loading documents...');
        
        const response = await fetch(`${API_BASE}/documents`);
        const data = await response.json();
        
        const select = document.getElementById('document-select');
        select.innerHTML = '<option value="">Seleziona un documento...</option>';
        
        if (data.success && data.data && data.data.length > 0) {
            data.data.forEach(doc => {
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = doc.title || `Document ${doc.id.substring(0, 8)}`;
                select.appendChild(option);
            });
            
            console.log(`[KG] Loaded ${data.data.length} documents`);
        } else {
            select.innerHTML = '<option value="">Nessun documento disponibile</option>';
        }
        
    } catch (error) {
        console.error('[KG] Error loading documents:', error);
        const select = document.getElementById('document-select');
        select.innerHTML = '<option value="">Errore caricamento documenti</option>';
    }
}

async function loadGraph() {
    const select = document.getElementById('document-select');
    const documentId = select.value;
    
    if (!documentId) {
        alert('Seleziona un documento prima');
        return;
    }
    
    currentDocumentId = documentId;
    const selectedOption = select.options[select.selectedIndex];
    document.getElementById('current-doc-title').textContent = selectedOption.textContent;
    
    showLoading(true);
    
    try {
        console.log(`[KG] Loading graph for document: ${documentId}`);
        
        const minImportance = parseFloat(document.getElementById('importance-slider').value) / 100;
        
        const response = await fetch(
            `${API_BASE}/knowledge-graph/graph/${documentId}?min_importance=${minImportance}&max_nodes=100`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to load graph');
        }
        
        graphData = result.data;
        console.log('[KG] Graph data loaded:', graphData);
        
        renderGraph(graphData);
        updateStatistics(graphData);
        
    } catch (error) {
        console.error('[KG] Error loading graph:', error);
        alert(`Errore caricamento grafo: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// =============================================================================
// GRAPH RENDERING
// =============================================================================

function renderGraph(data) {
    const { nodes, edges } = data;
    
    console.log(`[KG] Rendering graph: ${nodes.length} nodes, ${edges.length} edges`);
    
    // Prepare nodes for Vis.js
    const visNodes = nodes.map(node => ({
        id: node.id,
        label: node.name,
        title: createNodeTooltip(node),
        color: {
            background: entityColors[node.type] || entityColors.OTHER,
            border: darkenColor(entityColors[node.type] || entityColors.OTHER),
            highlight: {
                background: lightenColor(entityColors[node.type] || entityColors.OTHER),
                border: entityColors[node.type] || entityColors.OTHER
            }
        },
        value: node.importance * 30,  // Size based on importance
        font: {
            size: 12 + (node.importance * 8),  // Font size based on importance
            color: '#ffffff'
        },
        // Store full data
        entityData: node
    }));
    
    // Prepare edges for Vis.js
    const visEdges = edges.map(edge => ({
        id: edge.id,
        from: edge.entity1_id,
        to: edge.entity2_id,
        label: formatRelationType(edge.relationship_type),
        title: `${edge.relationship_type} (strength: ${edge.strength.toFixed(2)})`,
        width: edge.strength * 4,  // Width based on strength
        value: edge.strength,
        color: {
            opacity: 0.6 + (edge.strength * 0.4)
        },
        // Store full data
        edgeData: edge
    }));
    
    allNodes = visNodes;
    allEdges = visEdges;
    
    // Update network
    network.setData({
        nodes: new vis.DataSet(visNodes),
        edges: new vis.DataSet(visEdges)
    });
    
    // Fit the graph
    setTimeout(() => {
        network.fit({
            animation: {
                duration: 1000,
                easingFunction: 'easeInOutQuad'
            }
        });
    }, 500);
    
    console.log('[KG] Graph rendered successfully');
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

function onNodeClick(params) {
    if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = allNodes.find(n => n.id === nodeId);
        
        if (node && node.entityData) {
            showEntityDetails(node.entityData);
        }
    }
}

function onNodeDoubleClick(params) {
    if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        
        // Focus on this node and its neighbors
        network.selectNodes([nodeId]);
        const connectedNodes = network.getConnectedNodes(nodeId);
        
        // Highlight connected nodes
        network.setSelection({
            nodes: [nodeId, ...connectedNodes],
            edges: network.getConnectedEdges(nodeId)
        });
        
        // Zoom to selection
        network.focus(nodeId, {
            scale: 1.5,
            animation: {
                duration: 800,
                easingFunction: 'easeInOutQuad'
            }
        });
    }
}

function onNodeHover(params) {
    document.getElementById('network-canvas').style.cursor = 'pointer';
}

function onNodeBlur(params) {
    document.getElementById('network-canvas').style.cursor = 'default';
}

// =============================================================================
// UI FUNCTIONS
// =============================================================================

function showEntityDetails(entity) {
    const detailsDiv = document.getElementById('entity-details');
    
    const html = `
        <div class="space-y-4">
            <div>
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-semibold text-lg">${escapeHtml(entity.name)}</h4>
                    <span class="entity-badge entity-${entity.type}">${entity.type}</span>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <div class="text-xs text-gray-600">Importanza</div>
                    <div class="flex items-center gap-2 mt-1">
                        <div class="flex-1 bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${entity.importance * 100}%"></div>
                        </div>
                        <span class="text-sm font-semibold">${(entity.importance * 100).toFixed(0)}%</span>
                    </div>
                </div>
                <div>
                    <div class="text-xs text-gray-600">Confidenza</div>
                    <div class="flex items-center gap-2 mt-1">
                        <div class="flex-1 bg-gray-200 rounded-full h-2">
                            <div class="bg-green-600 h-2 rounded-full" style="width: ${entity.confidence * 100}%"></div>
                        </div>
                        <span class="text-sm font-semibold">${(entity.confidence * 100).toFixed(0)}%</span>
                    </div>
                </div>
            </div>
            
            <div>
                <div class="text-xs text-gray-600 mb-1">Frequenza</div>
                <div class="text-2xl font-bold text-gray-800">${entity.frequency} occorrenze</div>
            </div>
            
            ${entity.aliases && entity.aliases.length > 0 ? `
                <div>
                    <div class="text-xs text-gray-600 mb-1">Sinonimi</div>
                    <div class="flex flex-wrap gap-1">
                        ${entity.aliases.map(alias => `
                            <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">${escapeHtml(alias)}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="pt-4 border-t">
                <button onclick="exploreEntity('${entity.id}')" 
                    class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                    <i class="fas fa-network-wired"></i>
                    Esplora Relazioni
                </button>
            </div>
        </div>
    `;
    
    detailsDiv.innerHTML = html;
}

function updateStatistics(data) {
    const { nodes, edges, metadata } = data;
    
    document.getElementById('stats-row').classList.remove('hidden');
    document.getElementById('stat-entities').textContent = nodes.length;
    document.getElementById('stat-relationships').textContent = edges.length;
    
    const avgImportance = nodes.reduce((sum, n) => sum + n.importance, 0) / nodes.length;
    document.getElementById('stat-importance').textContent = avgImportance.toFixed(2);
    
    const uniqueTypes = new Set(nodes.map(n => n.type)).size;
    document.getElementById('stat-types').textContent = uniqueTypes;
}

function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

function setupEventListeners() {
    // Importance slider
    const slider = document.getElementById('importance-slider');
    slider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value) / 100;
        document.getElementById('importance-value').textContent = value.toFixed(2);
    });
    
    // Enter key on document select
    document.getElementById('document-select').addEventListener('change', () => {
        const btn = document.getElementById('load-graph-btn');
        if (document.getElementById('document-select').value) {
            btn.classList.add('animate-pulse');
            setTimeout(() => btn.classList.remove('animate-pulse'), 2000);
        }
    });
}

// =============================================================================
// FILTER FUNCTIONS
// =============================================================================

function filterByType(type) {
    if (!graphData) {
        alert('Carica prima un grafo');
        return;
    }
    
    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('filter-btn-active', 'ring-2', 'ring-blue-500');
    });
    event.target.classList.add('filter-btn-active', 'ring-2', 'ring-blue-500');
    
    let filteredNodes;
    if (type === 'all') {
        filteredNodes = allNodes;
    } else {
        filteredNodes = allNodes.filter(n => n.entityData.type === type);
    }
    
    // Get edges that connect filtered nodes
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = allEdges.filter(e => 
        filteredNodeIds.has(e.from) && filteredNodeIds.has(e.to)
    );
    
    network.setData({
        nodes: new vis.DataSet(filteredNodes),
        edges: new vis.DataSet(filteredEdges)
    });
    
    network.fit({ animation: { duration: 800 } });
    
    console.log(`[KG] Filtered to type: ${type} (${filteredNodes.length} nodes, ${filteredEdges.length} edges)`);
}

async function exploreEntity(entityId) {
    try {
        const response = await fetch(`${API_BASE}/knowledge-graph/entity/${entityId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            const { entity, relationships } = result.data;
            
            console.log('[KG] Entity relationships:', relationships);
            
            // Highlight this entity and its connections
            const connectedNodeIds = relationships.map(r => 
                r.entity1_id === entityId ? r.entity2_id : r.entity1_id
            );
            
            network.selectNodes([entityId, ...connectedNodeIds]);
            
            // Zoom to selection
            network.fit({
                nodes: [entityId, ...connectedNodeIds],
                animation: {
                    duration: 1000,
                    easingFunction: 'easeInOutQuad'
                }
            });
        }
        
    } catch (error) {
        console.error('[KG] Error exploring entity:', error);
        alert('Errore durante l\'esplorazione dell\'entità');
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function resetZoom() {
    network.fit({ animation: { duration: 800 } });
}

function createNodeTooltip(node) {
    return `
        <b>${escapeHtml(node.name)}</b><br>
        Tipo: ${node.type}<br>
        Importanza: ${(node.importance * 100).toFixed(0)}%<br>
        Frequenza: ${node.frequency}
    `;
}

function formatRelationType(type) {
    const mapping = {
        'part_of': 'parte di',
        'requires': 'richiede',
        'causes': 'causa',
        'contains': 'contiene',
        'similar_to': 'simile a',
        'related_to': 'correlato a',
        'associated_with': 'associato a'
    };
    return mapping[type] || type;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function darkenColor(color) {
    // Simple darken by reducing RGB values
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lightenColor(color) {
    // Simple lighten by increasing RGB values
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + 40);
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + 40);
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + 40);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

console.log('[KG] Knowledge Graph module loaded');
