# MODIFICHE DA APPLICARE A RegisterProfessionalPageV2.tsx

## 1. AGGIUNGERE DENOMINAZIONE/RAGIONE SOCIALE PER DITTA INDIVIDUALE

Nella sezione Step 3 - Dati Fiscali, aggiungere anche per ditta individuale:

```tsx
{/* Denominazione/Ragione Sociale (per ditta individuale E società) */}
{(registrationType === 'individual' || registrationType === 'company') && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {registrationType === 'individual' 
        ? 'Denominazione (es: Mario Rossi - Idraulico)' 
        : 'Ragione Sociale'} 
      <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      value={formData.businessName}
      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
      className={`w-full px-4 py-2 border rounded-lg ${
        errors.businessName ? 'border-red-500' : 'border-gray-300'
      }`}
      placeholder={registrationType === 'individual' 
        ? 'Mario Rossi - Servizi Idraulici' 
        : 'Mario Rossi S.r.l.'}
    />
    {errors.businessName && <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>}
  </div>
)}
```

## 2. VALIDAZIONE DENOMINAZIONE PER DITTA INDIVIDUALE

Aggiornare validateStep case 3:

```tsx
case 3: // Dati fiscali (per ditta individuale e società)
  if (registrationType === 'individual') {
    // Ditta individuale: richiede denominazione e P.IVA
    if (!formData.businessName.trim()) newErrors.businessName = 'Denominazione richiesta';
    if (!formData.vatNumber.trim()) newErrors.vatNumber = 'Partita IVA richiesta';
    // ... resto validazioni
  } else if (registrationType === 'company') {
    // Società: richiede ragione sociale
    if (!formData.businessName.trim()) newErrors.businessName = 'Ragione sociale richiesta';
    // ... resto validazioni
  }
  break;
```

## 3. AUTOCOMPLETAMENTO INDIRIZZI

### Step 2 - Indirizzo Personale con Autocompletamento:

```tsx
{/* Indirizzo Personale */}
<div>
  <h3 className="font-medium mb-3">📍 Indirizzo di Residenza</h3>
  
  {googleMapsLoaded ? (
    <AddressAutocomplete
      value={formData.personalAddress}
      onChange={(value) => setFormData({...formData, personalAddress: value})}
      onAddressSelect={(components) => {
        setFormData({
          ...formData,
          personalAddress: components.street,
          personalCity: components.city,
          personalProvince: components.province,
          personalPostalCode: components.postalCode
        });
      }}
      label="Indirizzo completo"
      placeholder="Inizia a digitare l'indirizzo..."
      required
      error={errors.personalAddress}
    />
  ) : (
    // Input manuale se Google Maps non è caricato
    <input
      type="text"
      value={formData.personalAddress}
      onChange={(e) => setFormData({...formData, personalAddress: e.target.value})}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
      placeholder="Via/Piazza e numero civico"
    />
  )}
  
  <div className="grid grid-cols-3 gap-3 mt-3">
    <input
      type="text"
      value={formData.personalCity}
      onChange={(e) => setFormData({...formData, personalCity: e.target.value})}
      className={`px-4 py-2 border rounded-lg ${
        errors.personalCity ? 'border-red-500' : 'border-gray-300'
      }`}
      placeholder="Città *"
    />
    <input
      type="text"
      value={formData.personalProvince}
      onChange={(e) => setFormData({...formData, personalProvince: e.target.value.toUpperCase()})}
      className={`px-4 py-2 border rounded-lg ${
        errors.personalProvince ? 'border-red-500' : 'border-gray-300'
      }`}
      placeholder="Prov *"
      maxLength={2}
    />
    <input
      type="text"
      value={formData.personalPostalCode}
      onChange={(e) => setFormData({...formData, personalPostalCode: e.target.value})}
      className="px-4 py-2 border border-gray-300 rounded-lg"
      placeholder="CAP"
      maxLength={5}
    />
  </div>
</div>
```

### Step 3 - Sede Attività/Legale con Autocompletamento:

```tsx
{/* Sede Attività */}
<div>
  <h3 className="font-medium mb-3">
    🏢 {registrationType === 'individual' ? 'Sede Attività' : 'Sede Legale'}
  </h3>
  
  {registrationType === 'individual' && (
    <div className="mb-3">
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={!formData.hasOperativeAddress}
          onChange={(e) => setFormData({...formData, hasOperativeAddress: !e.target.checked})}
          className="mr-2"
        />
        <span className="text-sm">Uso la mia residenza come sede attività</span>
      </label>
    </div>
  )}
  
  {(registrationType === 'company' || formData.hasOperativeAddress) && (
    <div className="space-y-3">
      {googleMapsLoaded ? (
        <AddressAutocomplete
          value={formData.legalAddress}
          onChange={(value) => setFormData({...formData, legalAddress: value})}
          onAddressSelect={(components) => {
            setFormData({
              ...formData,
              legalAddress: components.street,
              legalCity: components.city,
              legalProvince: components.province,
              legalPostalCode: components.postalCode
            });
          }}
          label={registrationType === 'individual' ? "Indirizzo sede attività" : "Indirizzo sede legale"}
          placeholder="Inizia a digitare l'indirizzo..."
          required
          error={errors.legalAddress}
        />
      ) : (
        <input
          type="text"
          value={formData.legalAddress}
          onChange={(e) => setFormData({...formData, legalAddress: e.target.value})}
          className={`w-full px-4 py-2 border rounded-lg ${
            errors.legalAddress ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Via/Piazza e numero civico"
        />
      )}
      
      <div className="grid grid-cols-3 gap-3">
        <input
          type="text"
          value={formData.legalCity}
          onChange={(e) => setFormData({...formData, legalCity: e.target.value})}
          className={`px-4 py-2 border rounded-lg ${
            errors.legalCity ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Città *"
        />
        <input
          type="text"
          value={formData.legalProvince}
          onChange={(e) => setFormData({...formData, legalProvince: e.target.value.toUpperCase()})}
          className={`px-4 py-2 border rounded-lg ${
            errors.legalProvince ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Prov *"
          maxLength={2}
        />
        <input
          type="text"
          value={formData.legalPostalCode}
          onChange={(e) => setFormData({...formData, legalPostalCode: e.target.value})}
          className={`px-4 py-2 border rounded-lg ${
            errors.legalPostalCode ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="CAP"
          maxLength={5}
        />
      </div>
    </div>
  )}
</div>
```

### Sede Operativa (per società) con Autocompletamento:

```tsx
{formData.hasOperativeAddress && (
  <div className="mt-3 space-y-3">
    {googleMapsLoaded ? (
      <AddressAutocomplete
        value={formData.operativeAddress}
        onChange={(value) => setFormData({...formData, operativeAddress: value})}
        onAddressSelect={(components) => {
          setFormData({
            ...formData,
            operativeAddress: components.street,
            operativeCity: components.city,
            operativeProvince: components.province,
            operativePostalCode: components.postalCode
          });
        }}
        label="Indirizzo sede operativa"
        placeholder="Inizia a digitare l'indirizzo..."
        error={errors.operativeAddress}
      />
    ) : (
      <input
        type="text"
        value={formData.operativeAddress}
        onChange={(e) => setFormData({...formData, operativeAddress: e.target.value})}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        placeholder="Via/Piazza e numero civico"
      />
    )}
    
    <div className="grid grid-cols-3 gap-3">
      <input
        type="text"
        value={formData.operativeCity}
        onChange={(e) => setFormData({...formData, operativeCity: e.target.value})}
        className="px-4 py-2 border border-gray-300 rounded-lg"
        placeholder="Città"
      />
      <input
        type="text"
        value={formData.operativeProvince}
        onChange={(e) => setFormData({...formData, operativeProvince: e.target.value.toUpperCase()})}
        className="px-4 py-2 border border-gray-300 rounded-lg"
        placeholder="Prov"
        maxLength={2}
      />
      <input
        type="text"
        value={formData.operativePostalCode}
        onChange={(e) => setFormData({...formData, operativePostalCode: e.target.value})}
        className="px-4 py-2 border border-gray-300 rounded-lg"
        placeholder="CAP"
        maxLength={5}
      />
    </div>
  </div>
)}
```

## 4. AGGIUNGERE CHIAVE API GOOGLE MAPS

Nel file .env:
```
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## RIEPILOGO MODIFICHE:

1. ✅ Denominazione/Ragione sociale per ditta individuale
2. ✅ Autocompletamento Google Maps per tutti gli indirizzi
3. ✅ Placeholder e label differenziati per tipo
4. ✅ Validazione denominazione per ditta individuale
5. ✅ Fallback manuale se Google Maps non caricato
