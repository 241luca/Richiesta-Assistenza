import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { TextArea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import {
  Plus,
  Edit2,
  Trash2,
  Power,
  Loader2,
  Save,
  X
} from 'lucide-react';
import api from '../../services/api';

interface ContainerCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  group_name?: string;
  sort_order: number;
  is_active: boolean;
}

export default function ContainerCategoryManager() {
  const [categories, setCategories] = useState<ContainerCategory[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'categories' | 'groups'>('categories');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [showNewGroup, setShowNewGroup] = useState(false);

  // Filtri categorie
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Validazione slug
  const validateSlug = (slug: string): string | null => {
    if (!slug || slug.trim() === '') {
      return 'Il codice non può essere vuoto';
    }
    if (/\s/.test(slug)) {
      return 'Il codice non può contenere spazi. Usa trattini (-) o underscore (_)';
    }
    if (!/^[a-z0-9-_]+$/.test(slug)) {
      return 'Il codice deve contenere solo lettere minuscole, numeri, trattini (-) e underscore (_)';
    }
    return null;
  };

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    icon: '',
    color: '',
    group_name: '',
    sort_order: 0,
    is_active: true
  });

  const [groupFormData, setGroupFormData] = useState({
    code: '',
    name: '',
    description: '',
    icon: '',
    color: '',
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    loadCategories();
    loadGroups();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('http://localhost:3500/api/container-categories?includeInactive=true');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await api.get('http://localhost:3500/api/container-category-groups?includeInactive=true');
      if (response.data.success) {
        setGroups(response.data.data);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreate = async () => {
    if (!formData.code || !formData.name) {
      setError('Codice e nome sono obbligatori');
      return;
    }

    // Valida slug
    const slugError = validateSlug(formData.code);
    if (slugError) {
      setError(slugError);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('http://localhost:3500/api/container-categories', formData);
      
      if (response.data.success) {
        await loadCategories();
        resetForm();
        setShowNew(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    // Valida slug se è stato modificato
    if (formData.code) {
      const slugError = validateSlug(formData.code);
      if (slugError) {
        setError(slugError);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`http://localhost:3500/api/container-categories/${id}`, formData);
      
      if (response.data.success) {
        await loadCategories();
        setEditingId(null);
        resetForm();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Vuoi eliminare la categoria "${name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await api.delete(`http://localhost:3500/api/container-categories/${id}`);
      await loadCategories();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.post(`http://localhost:3500/api/container-categories/${id}/toggle`);
      await loadCategories();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (category: ContainerCategory) => {
    setFormData({
      code: category.code,
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '',
      group_name: category.group_name || '',
      sort_order: category.sort_order,
      is_active: category.is_active
    });
    setEditingId(category.id);
    setShowNew(false);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      icon: '',
      color: '',
      group_name: '',
      sort_order: 0,
      is_active: true
    });
  };

  const resetGroupForm = () => {
    setGroupFormData({
      code: '',
      name: '',
      description: '',
      icon: '',
      color: '',
      sort_order: 0,
      is_active: true
    });
  };

  // CRUD Gruppi
  const handleCreateGroup = async () => {
    if (!groupFormData.code || !groupFormData.name) {
      setError('Codice e nome sono obbligatori');
      return;
    }

    // Valida slug
    const slugError = validateSlug(groupFormData.code);
    if (slugError) {
      setError(slugError);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('http://localhost:3500/api/container-category-groups', groupFormData);
      
      if (response.data.success) {
        await loadGroups();
        await loadCategories(); // Reload per aggiornare select
        resetGroupForm();
        setShowNewGroup(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async (id: string) => {
    // Valida slug se è stato modificato
    if (groupFormData.code) {
      const slugError = validateSlug(groupFormData.code);
      if (slugError) {
        setError(slugError);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`http://localhost:3500/api/container-category-groups/${id}`, groupFormData);
      
      if (response.data.success) {
        await loadGroups();
        await loadCategories();
        setEditingGroupId(null);
        resetGroupForm();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (!confirm(`Vuoi eliminare il gruppo "${name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await api.delete(`http://localhost:3500/api/container-category-groups/${id}`);
      await loadGroups();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGroupActive = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.post(`http://localhost:3500/api/container-category-groups/${id}/toggle`);
      await loadGroups();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditGroup = (group: any) => {
    setGroupFormData({
      code: group.code,
      name: group.name,
      description: group.description || '',
      icon: group.icon || '',
      color: group.color || '',
      sort_order: group.sort_order,
      is_active: group.is_active
    });
    setEditingGroupId(group.id);
    setShowNewGroup(false);
  };

  const groupedCategories = categories.reduce((acc, cat) => {
    const group = cat.group_name || 'Altro';
    if (!acc[group]) acc[group] = [];
    acc[group].push(cat);
    return acc;
  }, {} as Record<string, ContainerCategory[]>);

  // Applica filtri
  const filteredCategories = categories.filter(cat => {
    // Filtro gruppo
    if (filterGroup !== 'all' && cat.group_name !== filterGroup) {
      return false;
    }
    // Filtro stato
    if (filterStatus === 'active' && !cat.is_active) {
      return false;
    }
    if (filterStatus === 'inactive' && cat.is_active) {
      return false;
    }
    return true;
  });

  // Raggruppa categorie filtrate
  const filteredGroupedCategories = filteredCategories.reduce((acc, cat) => {
    const group = cat.group_name || 'Altro';
    if (!acc[group]) acc[group] = [];
    acc[group].push(cat);
    return acc;
  }, {} as Record<string, ContainerCategory[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestione Categorie e Gruppi</CardTitle>
              <CardDescription>
                Gestisci le categorie e i gruppi per organizzare i container
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'categories' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('categories')}
              >
                Categorie
              </Button>
              <Button
                variant={activeTab === 'groups' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('groups')}
              >
                Gruppi
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Tab Categorie */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Filtri */}
              <div className="flex gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="filter-group">Filtra per Gruppo</Label>
                  <select
                    id="filter-group"
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md min-w-[200px]"
                  >
                    <option value="all">Tutti i gruppi</option>
                    {groups.filter(g => g.is_active).map(group => (
                      <option key={group.id} value={group.code}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filter-status">Filtra per Stato</Label>
                  <select
                    id="filter-status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md min-w-[150px]"
                  >
                    <option value="all">Tutti</option>
                    <option value="active">Solo Attivi</option>
                    <option value="inactive">Solo Disattivi</option>
                  </select>
                </div>
                
                <div className="flex-1"></div>
                
                <Button onClick={() => { setShowNew(true); setEditingId(null); resetForm(); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuova Categoria
                </Button>
              </div>

          {(showNew || editingId) && (
            <Card className="mb-6 border-2 border-blue-500">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingId ? 'Modifica Categoria' : 'Nuova Categoria'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Codice * (slug)</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="es: client-project"
                      disabled={!!editingId}
                    />
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Solo minuscole, numeri, trattini (-) e underscore (_). No spazi.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="es: Progetto Cliente"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrizione</Label>
                  <TextArea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrizione categoria..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="group_name">Gruppo</Label>
                    <select
                      id="group_name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={formData.group_name}
                      onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                    >
                      <option value="">-- Seleziona --</option>
                      {groups.filter(g => g.is_active).map(group => (
                        <option key={group.id} value={group.code}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      ⚙️ Gestisci i gruppi nel tab "Gruppi"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon">Icona (Heroicons)</Label>
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="es: briefcase"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Colore</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="es: blue, green"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sort_order">Ordine</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="is_active">Stato</Label>
                    <select
                      id="is_active"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={formData.is_active ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    >
                      <option value="true">Attivo</option>
                      <option value="false">Disattivo</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                    disabled={loading}
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvataggio...</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" />Salva</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setShowNew(false); setEditingId(null); resetForm(); }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annulla
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            {Object.entries(filteredGroupedCategories).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nessuna categoria trovata con i filtri selezionati</p>
              </div>
            ) : (
              Object.entries(filteredGroupedCategories).map(([group, cats]) => (
                <div key={group}>
                  <h3 className="text-lg font-semibold mb-3">{group}</h3>
                <div className="grid grid-cols-1 gap-3">
                  {cats.map((cat) => (
                    <div
                      key={cat.id}
                      className={`p-4 border rounded-lg ${!cat.is_active ? 'bg-gray-50 opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{cat.name}</h4>
                            <Badge variant={cat.is_active ? 'success' : 'default'}>
                              {cat.code}
                            </Badge>
                            {!cat.is_active && (
                              <Badge variant="warning">Disattivo</Badge>
                            )}
                          </div>
                          {cat.description && (
                            <p className="text-sm text-muted-foreground">{cat.description}</p>
                          )}
                          <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                            {cat.icon && <span>🎨 {cat.icon}</span>}
                            {cat.color && <span>🎨 {cat.color}</span>}
                            <span>📊 Ordine: {cat.sort_order}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(cat)}
                            disabled={loading}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(cat.id)}
                            disabled={loading}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(cat.id, cat.name)}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              ))
            )}
          </div>
            </div>
          )}

          {/* Tab Gruppi */}
          {activeTab === 'groups' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={() => { setShowNewGroup(true); setEditingGroupId(null); resetGroupForm(); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuovo Gruppo
                </Button>
              </div>

              {(showNewGroup || editingGroupId) && (
                <Card className="border-2 border-blue-500">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {editingGroupId ? 'Modifica Gruppo' : 'Nuovo Gruppo'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="group-code">Codice * (slug)</Label>
                        <Input
                          id="group-code"
                          value={groupFormData.code}
                          onChange={(e) => setGroupFormData({ ...groupFormData, code: e.target.value })}
                          placeholder="es: mio-gruppo"
                          disabled={!!editingGroupId}
                        />
                        <p className="text-xs text-muted-foreground">
                          ⚠️ Solo minuscole, numeri, trattini (-) e underscore (_). No spazi.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="group-name">Nome *</Label>
                        <Input
                          id="group-name"
                          value={groupFormData.name}
                          onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                          placeholder="es: Mio Gruppo"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="group-description">Descrizione</Label>
                      <TextArea
                        id="group-description"
                        value={groupFormData.description}
                        onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                        placeholder="Descrizione gruppo..."
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="group-icon">Icona (Heroicons)</Label>
                        <Input
                          id="group-icon"
                          value={groupFormData.icon}
                          onChange={(e) => setGroupFormData({ ...groupFormData, icon: e.target.value })}
                          placeholder="es: folder"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="group-color">Colore</Label>
                        <Input
                          id="group-color"
                          value={groupFormData.color}
                          onChange={(e) => setGroupFormData({ ...groupFormData, color: e.target.value })}
                          placeholder="es: blue, green"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="group-sort-order">Ordine</Label>
                        <Input
                          id="group-sort-order"
                          type="number"
                          value={groupFormData.sort_order}
                          onChange={(e) => setGroupFormData({ ...groupFormData, sort_order: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="group-active">Stato</Label>
                      <select
                        id="group-active"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={groupFormData.is_active ? 'true' : 'false'}
                        onChange={(e) => setGroupFormData({ ...groupFormData, is_active: e.target.value === 'true' })}
                      >
                        <option value="true">Attivo</option>
                        <option value="false">Disattivo</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => editingGroupId ? handleUpdateGroup(editingGroupId) : handleCreateGroup()}
                        disabled={loading}
                      >
                        {loading ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvataggio...</>
                        ) : (
                          <><Save className="w-4 h-4 mr-2" />Salva</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { setShowNewGroup(false); setEditingGroupId(null); resetGroupForm(); }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Annulla
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {groups.length === 0 ? (
                  <p className="text-muted-foreground">Nessun gruppo disponibile</p>
                ) : (
                  groups.map((group) => (
                    <div
                      key={group.id}
                      className={`p-4 border rounded-lg ${ !group.is_active ? 'bg-gray-50 opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{group.name}</h4>
                            <Badge variant="default">{group.code}</Badge>
                            {!group.is_active && (
                              <Badge variant="warning">Disattivo</Badge>
                            )}
                          </div>
                          {group.description && (
                            <p className="text-sm text-muted-foreground">{group.description}</p>
                          )}
                          <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                            {group.icon && <span>🎨 {group.icon}</span>}
                            {group.color && <span>🎨 {group.color}</span>}
                            <span>📊 Ordine: {group.sort_order}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditGroup(group)}
                            disabled={loading}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleGroupActive(group.id)}
                            disabled={loading}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteGroup(group.id, group.name)}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
