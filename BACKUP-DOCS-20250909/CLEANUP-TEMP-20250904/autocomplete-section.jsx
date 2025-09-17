// Sezione da inserire al posto dei campi manuali
// Inserire questa sezione al posto della sezione showAddressFields esistente

{showAddressFields && (
  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
    <h4 className="font-medium text-gray-900">Indirizzo di Lavoro</h4>
    
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="text-sm text-blue-800">
          <strong>Autocompletamento Google:</strong> Digita l'indirizzo e seleziona dai suggerimenti per garantire la massima precisione nelle indicazioni stradali.
        </div>
      </div>
    </div>

    <AddressAutocomplete
      value={{
        address: watch('workAddress') || '',
        city: watch('workCity') || '',
        province: watch('workProvince') || '',
        postalCode: watch('workPostalCode') || ''
      }}
      onChange={(addressData) => {
        setValue('workAddress', addressData.address);
        setValue('workCity', addressData.city);
        setValue('workProvince', addressData.province);
        setValue('workPostalCode', addressData.postalCode);
        
        console.log('Indirizzo lavoro selezionato:', addressData);
      }}
      errors={{
        address: errors.workAddress,
        city: errors.workCity,
        province: errors.workProvince,
        postalCode: errors.workPostalCode
      }}
    />
  </div>
)}
