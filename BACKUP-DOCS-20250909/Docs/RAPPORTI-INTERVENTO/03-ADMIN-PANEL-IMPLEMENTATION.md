# 📋 FASE 3 - ADMIN PANEL IMPLEMENTATION

## OBIETTIVO
Creare l'interfaccia amministrativa completa per la gestione del sistema rapporti di intervento.

## DURATA STIMATA: 24 ore

---

## 📁 STRUTTURA FILE DA CREARE

```
src/
├── pages/
│   └── admin/
│       └── reports/
│           ├── index.tsx                 # Dashboard admin rapporti
│           ├── config.tsx                # Configurazione globale
│           ├── field-types.tsx           # Gestione tipi campo
│           ├── statuses.tsx              # Gestione stati
│           ├── intervention-types.tsx    # Gestione tipi intervento
│           ├── templates/
│           │   ├── index.tsx            # Lista template
│           │   ├── editor.tsx           # Editor drag-drop template
│           │   └── preview.tsx          # Anteprima template
│           └── materials/
│               ├── index.tsx            # Gestione materiali
│               └── import.tsx           # Import CSV materiali
│
└── components/
    └── admin/
        └── reports/
            ├── ConfigForm.tsx             # Form configurazione
            ├── FieldTypeManager.tsx       # Gestione tipi campo
            ├── StatusBadge.tsx           # Badge stato
            ├── TemplateBuilder/
            │   ├── index.tsx             # Builder principale
            │   ├── FieldPalette.tsx     # Palette campi trascinabili
            │   ├── DropZone.tsx         # Zona drop
            │   ├── FieldCard.tsx        # Card campo nel builder
            │   └── FieldConfig.tsx      # Configurazione campo
            ├── MaterialsTable.tsx        # Tabella materiali
            └── ImportWizard.tsx          # Wizard import dati
```

---

## STEP 3.1 - DASHBOARD ADMIN RAPPORTI (4 ore)

### Creare `src/pages/admin/reports/index.tsx`:

```tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Settings, 
  Database, 
  Layout, 
  Package,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/api';

export default function AdminReportsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Query statistiche
  const { data: stats } = useQuery({
    queryKey: ['admin', 'reports', 'stats'],
    queryFn: () => apiRequest('/api/intervention-reports/stats')
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Gestione Sistema Rapporti
        </h1>
        <p className="text-gray-600">
          Configurazione e amministrazione del sistema rapporti di intervento
        </p>
      </div>

      {/* Cards statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rapporti Totali
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReports || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.reportsThisMonth || 0} questo mese
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Template Attivi
            </CardTitle>
            <Layout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeTemplates || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.customTemplates || 0} personalizzati
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Materiali Database
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMaterials || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.materialsUsedToday || 0} utilizzati oggi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tempo Medio
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgCompletionTime || '2.5'}h</div>
            <p className="text-xs text-muted-foreground">
              Per completare un rapporto
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs navigazione */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="config">Configurazione</TabsTrigger>
          <TabsTrigger value="templates">Template</TabsTrigger>
          <TabsTrigger value="materials">Materiali</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/admin/reports/config">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configurazione Globale
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Impostazioni generali del sistema rapporti, numerazione, PDF, notifiche
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/admin/reports/field-types">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Tipi di Campo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Gestisci i tipi di campo disponibili per i template
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/admin/reports/statuses">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Stati Rapporto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Configura gli stati e il workflow dei rapporti
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/admin/reports/intervention-types">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Tipi Intervento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Definisci le tipologie di intervento disponibili
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/admin/reports/templates">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    Template Rapporti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Crea e gestisci i template per i rapporti di intervento
                  </p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/admin/reports/materials">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Database Materiali
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Gestisci il catalogo materiali e prezzi
                  </p>
                </CardContent>
              </Link>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config">
          <ConfigurationPanel />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesPanel />
        </TabsContent>

        <TabsContent value="materials">
          <MaterialsPanel />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## STEP 3.2 - EDITOR DRAG-DROP TEMPLATE (8 ore)

### Creare `src/components/admin/reports/TemplateBuilder/index.tsx`:

```tsx
import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import FieldPalette from './FieldPalette';
import FieldCard from './FieldCard';
import FieldConfig from './FieldConfig';
import { Save, Eye, Undo, Redo, Plus } from 'lucide-react';

interface Field {
  id: string;
  code: string;
  label: string;
  fieldTypeId: string;
  fieldType?: any;
  sectionCode?: string;
  displayOrder: number;
  columnSpan: number;
  isRequired: boolean;
  config?: any;
}

interface Section {
  code: string;
  name: string;
  fields: Field[];
}

export default function TemplateBuilder({ template, onSave }: any) {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Gestione drag & drop
  const onDragEnd = useCallback((result: any) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    // Se viene dalla palette, aggiungi nuovo campo
    if (source.droppableId === 'field-palette') {
      const fieldType = getFieldTypeById(draggableId);
      const newField: Field = {
        id: `field-${Date.now()}`,
        code: `field_${Date.now()}`,
        label: fieldType.name,
        fieldTypeId: fieldType.id,
        fieldType: fieldType,
        sectionCode: destination.droppableId,
        displayOrder: destination.index * 10,
        columnSpan: 12,
        isRequired: false
      };

      setSections(prev => {
        const newSections = [...prev];
        const sectionIndex = newSections.findIndex(s => s.code === destination.droppableId);
        if (sectionIndex >= 0) {
          newSections[sectionIndex].fields.splice(destination.index, 0, newField);
        }
        return newSections;
      });
      
      setIsDirty(true);
      addToHistory();
      return;
    }

    // Movimento tra sezioni
    if (source.droppableId !== destination.droppableId) {
      setSections(prev => {
        const newSections = [...prev];
        const sourceSection = newSections.find(s => s.code === source.droppableId);
        const destSection = newSections.find(s => s.code === destination.droppableId);
        
        if (sourceSection && destSection) {
          const [removed] = sourceSection.fields.splice(source.index, 1);
          removed.sectionCode = destination.droppableId;
          destSection.fields.splice(destination.index, 0, removed);
        }
        
        return newSections;
      });
      
      setIsDirty(true);
      addToHistory();
    }
    // Riordino nella stessa sezione
    else {
      setSections(prev => {
        const newSections = [...prev];
        const section = newSections.find(s => s.code === source.droppableId);
        
        if (section) {
          const [removed] = section.fields.splice(source.index, 1);
          section.fields.splice(destination.index, 0, removed);
        }
        
        return newSections;
      });
      
      setIsDirty(true);
      addToHistory();
    }
  }, []);

  // Gestione history
  const addToHistory = () => {
    const newHistory = [...history.slice(0, historyIndex + 1), sections];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSections(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSections(history[historyIndex + 1]);
    }
  };

  // Salvataggio
  const handleSave = async () => {
    try {
      const fields = sections.flatMap((section, sectionIndex) => 
        section.fields.map((field, fieldIndex) => ({
          ...field,
          sectionCode: section.code,
          displayOrder: (sectionIndex * 1000) + (fieldIndex * 10)
        }))
      );

      await onSave({
        ...template,
        fields
      });

      setIsDirty(false);
      toast.success('Template salvato con successo');
    } catch (error) {
      toast.error('Errore nel salvataggio del template');
    }
  };

  // Configurazione campo
  const handleFieldUpdate = (fieldId: string, updates: Partial<Field>) => {
    setSections(prev => {
      const newSections = [...prev];
      for (const section of newSections) {
        const field = section.fields.find(f => f.id === fieldId);
        if (field) {
          Object.assign(field, updates);
          break;
        }
      }
      return newSections;
    });
    setIsDirty(true);
    addToHistory();
  };

  const handleFieldDelete = (fieldId: string) => {
    setSections(prev => {
      const newSections = [...prev];
      for (const section of newSections) {
        const index = section.fields.findIndex(f => f.id === fieldId);
        if (index >= 0) {
          section.fields.splice(index, 1);
          break;
        }
      }
      return newSections;
    });
    setIsDirty(true);
    addToHistory();
  };

  return (
    <div className="flex h-[calc(100vh-200px)]">
      <DragDropContext onDragEnd={onDragEnd}>
        {/* Palette campi */}
        <div className="w-64 border-r bg-gray-50 p-4">
          <h3 className="font-semibold mb-4">Campi Disponibili</h3>
          <FieldPalette />
        </div>

        {/* Area builder */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-4 flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={undo}
                disabled={historyIndex <= 0}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Anteprima
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!isDirty}
              >
                <Save className="h-4 w-4 mr-2" />
                Salva Template
              </Button>
            </div>
          </div>

          {/* Sezioni */}
          {sections.map(section => (
            <Card key={section.code} className="mb-4 p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold">{section.name}</h4>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Droppable droppableId={section.code}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[100px] rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                    }`}
                  >
                    {section.fields.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        Trascina qui i campi
                      </div>
                    )}
                    
                    <div className="grid grid-cols-12 gap-2 p-2">
                      {section.fields.map((field, index) => (
                        <Draggable
                          key={field.id}
                          draggableId={field.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={{
                                ...provided.draggableProps.style,
                                gridColumn: `span ${field.columnSpan}`
                              }}
                            >
                              <FieldCard
                                field={field}
                                isDragging={snapshot.isDragging}
                                dragHandleProps={provided.dragHandleProps}
                                onEdit={() => setSelectedField(field)}
                                onDelete={() => handleFieldDelete(field.id)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </Card>
          ))}
        </div>

        {/* Pannello configurazione */}
        {selectedField && (
          <div className="w-96 border-l bg-white p-4">
            <FieldConfig
              field={selectedField}
              onUpdate={(updates) => handleFieldUpdate(selectedField.id, updates)}
              onClose={() => setSelectedField(null)}
            />
          </div>
        )}
      </DragDropContext>
    </div>
  );
}

// Helper function
function getFieldTypeById(id: string): any {
  // Implementare recupero tipo campo
  return {};
}
```

---

## STEP 3.3 - GESTIONE MATERIALI (4 ore)

### Creare `src/pages/admin/reports/materials/index.tsx`:

```tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Plus, 
  Upload, 
  Download, 
  Search,
  Edit,
  Trash,
  Package,
  Euro,
  Barcode
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import MaterialForm from '@/components/admin/reports/MaterialForm';
import ImportMaterialsDialog from '@/components/admin/reports/ImportMaterialsDialog';

export default function MaterialsManagement() {
  const [search, setSearch] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  
  const queryClient = useQueryClient();

  // Query materiali
  const { data: materials, isLoading } = useQuery({
    queryKey: ['admin', 'materials', search],
    queryFn: () => apiRequest('/api/intervention-reports/materials', {
      params: { search }
    })
  });

  // Mutation eliminazione
  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/intervention-reports/materials/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'materials']);
      toast.success('Materiale eliminato');
    }
  });

  // Colonne tabella
  const columns = [
    {
      accessorKey: 'code',
      header: 'Codice',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Barcode className="h-4 w-4 text-gray-400" />
          <span className="font-mono">{row.original.code}</span>
        </div>
      )
    },
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.description && (
            <div className="text-sm text-gray-500">
              {row.original.description}
            </div>
          )}
        </div>
      )
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-400" />
          <span>{row.original.category}</span>
          {row.original.subcategory && (
            <span className="text-gray-400">/ {row.original.subcategory}</span>
          )}
        </div>
      )
    },
    {
      accessorKey: 'unit',
      header: 'Unità',
    },
    {
      accessorKey: 'defaultPrice',
      header: 'Prezzo',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1">
          <Euro className="h-3 w-3 text-gray-400" />
          <span className="font-medium">
            {row.original.defaultPrice?.toFixed(2) || '-'}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'vatRate',
      header: 'IVA',
      cell: ({ row }: any) => (
        <span>{row.original.vatRate}%</span>
      )
    },
    {
      accessorKey: 'stockQuantity',
      header: 'Stock',
      cell: ({ row }: any) => {
        const stock = row.original.stockQuantity;
        const min = row.original.stockMin;
        const isLow = stock !== null && min !== null && stock <= min;
        
        return (
          <span className={isLow ? 'text-red-600 font-medium' : ''}>
            {stock ?? '-'}
          </span>
        );
      }
    },
    {
      id: 'actions',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedMaterial(row.original);
              setShowForm(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('Eliminare questo materiale?')) {
                deleteMutation.mutate(row.original.id);
              }
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  // Export CSV
  const handleExport = async () => {
    try {
      const response = await apiRequest('/api/intervention-reports/materials/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `materiali-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Export completato');
    } catch (error) {
      toast.error('Errore durante l\'export');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Database Materiali
        </h1>
        <p className="text-gray-600">
          Gestione catalogo materiali e prezzi
        </p>
      </div>

      {/* Toolbar */}
      <Card className="mb-6 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca per codice, nome, categoria..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowImport(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importa
            </Button>
            
            <Button
              variant="outline"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Esporta
            </Button>
            
            <Button
              onClick={() => {
                setSelectedMaterial(null);
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Materiale
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabella materiali */}
      <Card>
        <DataTable
          columns={columns}
          data={materials?.data || []}
          loading={isLoading}
        />
      </Card>

      {/* Dialog form */}
      {showForm && (
        <MaterialForm
          material={selectedMaterial}
          onClose={() => {
            setShowForm(false);
            setSelectedMaterial(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedMaterial(null);
            queryClient.invalidateQueries(['admin', 'materials']);
          }}
        />
      )}

      {/* Dialog import */}
      {showImport && (
        <ImportMaterialsDialog
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            queryClient.invalidateQueries(['admin', 'materials']);
          }}
        />
      )}
    </div>
  );
}
```

---

## ✅ CHECKLIST COMPLETAMENTO FASE 3

### Pagine Admin
- [ ] Dashboard rapporti creata
- [ ] Pagina configurazione globale
- [ ] Gestione tipi campo
- [ ] Gestione stati rapporto
- [ ] Gestione tipi intervento
- [ ] Lista template
- [ ] Editor template drag-drop
- [ ] Gestione materiali
- [ ] Import/Export materiali

### Componenti
- [ ] ConfigForm
- [ ] FieldTypeManager
- [ ] StatusBadge
- [ ] TemplateBuilder completo
- [ ] MaterialsTable
- [ ] ImportWizard

### Funzionalità
- [ ] CRUD configurazione
- [ ] CRUD tipi campo
- [ ] CRUD stati
- [ ] CRUD tipi intervento
- [ ] Editor drag-drop funzionante
- [ ] Import CSV materiali
- [ ] Export dati

### Testing
- [ ] Test editor template
- [ ] Test import/export
- [ ] Test validazioni form
- [ ] Test permessi admin

---

## 📝 NOTE PER FASE SUCCESSIVA

La Fase 4 (Area Professionista) potrà iniziare con:
- Admin panel completo
- Template configurabili
- Database materiali popolato

Passare a: `04-PROFESSIONAL-AREA-IMPLEMENTATION.md`
