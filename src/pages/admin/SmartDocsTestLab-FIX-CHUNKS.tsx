// AGGIUNTA NUOVO STATO PER CHUNKS
interface ChunkDetail {
  id: string;
  document_id: string;
  container_id: string;
  chunk_text: string;
  chunk_index: number;
  embedding_id?: string;
  tokens_count: number;
  metadata?: Record<string, any>;
  created_at: string;
}

// AGGIUNGERE QUESTO STATO NEL COMPONENTE (insieme agli altri stati)
const [chunks, setChunks] = useState<ChunkDetail[]>([]);
const [embeddingsData, setEmbeddingsData] = useState<any>(null);

// AGGIUNGERE QUESTA FUNZIONE PER CARICARE I CHUNKS
const loadContainerChunks = async (containerId: string) => {
  if (!containerId) return;
  
  try {
    const response = await fetch(`http://localhost:3500/api/chunks/container/${containerId}`);
    if (response.ok) {
      const data = await response.json();
      setChunks(data.success ? data.data : []);
    }
  } catch (error) {
    console.error("Failed to load chunks:", error);
  }
};

// AGGIUNGERE QUESTA FUNZIONE PER CARICARE I DETTAGLI EMBEDDINGS
const loadContainerEmbeddings = async (containerId: string) => {
  if (!containerId) return;
  
  try {
    const response = await fetch(`http://localhost:3500/api/embeddings/container/${containerId}`);
    if (response.ok) {
      const data = await response.json();
      setEmbeddingsData(data.success ? data.data : null);
    }
  } catch (error) {
    console.error("Failed to load embeddings:", error);
  }
};

// MODIFICARE USEEFFECT QUANDO SI APRE MODALE CHUNKS
useEffect(() => {
  if (showChunksModal && syncContainerId) {
    loadContainerChunks(syncContainerId);
  }
}, [showChunksModal, syncContainerId]);

// MODIFICARE USEEFFECT QUANDO SI APRE MODALE EMBEDDINGS
useEffect(() => {
  if (showEmbeddingsModal && syncContainerId) {
    loadContainerEmbeddings(syncContainerId);
  }
}, [showEmbeddingsModal, syncContainerId]);

// SOSTITUIRE LA MODALE PER I CHUNKS CON QUESTA:
{/* Modal per Chunks */}
<DetailModal
  isOpen={showChunksModal}
  onClose={() => setShowChunksModal(false)}
  title={`🧩 Chunks Dettaglio (${chunks.length})`}
>
  <div className="space-y-3">
    {chunks.length === 0 ? (
      <div className="text-center py-8 text-gray-500">
        <CubeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Nessun chunk trovato</p>
      </div>
    ) : (
      <>
        <div className="bg-purple-50 rounded-lg p-4 mb-4">
          <div className="text-2xl font-bold text-purple-600">{chunks.length}</div>
          <div className="text-sm text-gray-600">Totale chunks nel container</div>
        </div>
        
        <div className="max-h-96 overflow-y-auto space-y-3">
          {chunks.map((chunk, idx) => (
            <div key={chunk.id} className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">Chunk #{chunk.chunk_index}</h4>
                  <p className="text-xs text-gray-500 mt-1">ID: {chunk.id.substring(0, 20)}...</p>
                </div>
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                  {chunk.tokens_count} tokens
                </span>
              </div>
              
              <div className="bg-white rounded p-3 mb-2">
                <p className="text-sm text-gray-700 line-clamp-4">
                  {chunk.chunk_text}
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white rounded p-2">
                  <div className="text-gray-600">Doc ID</div>
                  <div className="font-mono text-gray-800 truncate">{chunk.document_id.substring(0, 12)}</div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-gray-600">Embedding</div>
                  <div className="font-mono text-gray-800">{chunk.embedding_id ? '✅' : '❌'}</div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-gray-600">Data</div>
                  <div className="font-mono text-gray-800">{new Date(chunk.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
</DetailModal>

// SOSTITUIRE LA MODALE PER GLI EMBEDDINGS CON QUESTA:
{/* Modal per Embeddings */}
<DetailModal
  isOpen={showEmbeddingsModal}
  onClose={() => setShowEmbeddingsModal(false)}
  title={`🔮 Embeddings Dettaglio`}
>
  <div className="space-y-3">
    {!embeddingsData ? (
      <div className="text-center py-8 text-gray-500">
        <CircleStackIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Dati embeddings non disponibili</p>
      </div>
    ) : (
      <>
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-semibold mb-3">📊 Statistiche Embeddings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Totale Embeddings:</div>
              <div className="text-2xl font-bold text-green-600">
                {embeddingsData.total_count || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Modello Embedding:</div>
              <div className="text-sm font-medium text-gray-900">
                {embeddingsData.model || "N/A"}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <h5 className="font-semibold mb-3">📈 Dimensioni</h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Dimensione Vettore:</div>
              <div className="text-lg font-bold text-blue-600">
                {embeddingsData.vector_dimension || "N/A"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Storage Size:</div>
              <div className="text-lg font-bold text-blue-600">
                {formatBytes(embeddingsData.storage_size_bytes || 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <h5 className="font-semibold mb-2">💡 Info Tecniche</h5>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Rappresentazioni vettoriali 384-3072 dimensioni</li>
            <li>• Utilizzo: ricerca semantica e similarità</li>
            <li>• Generati durante il processing dei documenti</li>
            <li>• Memorizzati in database vettoriale</li>
          </ul>
        </div>

        {embeddingsData.by_model && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-semibold mb-2">🔍 Per Modello</h5>
            <div className="space-y-2">
              {Object.entries(embeddingsData.by_model).map(([model, count]: [string, any]) => (
                <div key={model} className="flex justify-between py-1">
                  <span className="text-sm text-gray-600">{model}:</span>
                  <span className="text-sm font-medium">{count} embeddings</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    )}
  </div>
</DetailModal>
