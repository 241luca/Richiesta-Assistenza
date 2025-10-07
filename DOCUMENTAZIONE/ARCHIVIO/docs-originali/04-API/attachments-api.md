# API Attachments - Documentazione

## Panoramica
Il sistema di gestione allegati permette di caricare, visualizzare, scaricare ed eliminare file associati alle richieste di assistenza.

## Limiti
- **Dimensione massima file**: 10MB
- **Numero massimo file per richiesta**: 5
- **Tipi file supportati**: JPG, PNG, GIF, PDF, DOC, DOCX

## Endpoints

### 1. Upload Allegati Multipli
**POST** `/api/requests/:id/attachments`

Carica uno o più file per una richiesta specifica.

#### Headers
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

#### Form Data
- `files`: Array di file (max 5)
- `descriptions`: Array JSON di descrizioni opzionali

#### Esempio con cURL
```bash
curl -X POST http://localhost:3200/api/requests/{requestId}/attachments \
  -H "Authorization: Bearer {token}" \
  -F "files=@foto1.jpg" \
  -F "files=@documento.pdf" \
  -F 'descriptions=["Foto del problema","Documentazione tecnica"]'
```

#### Esempio con JavaScript
```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);
formData.append('descriptions', JSON.stringify(['Desc 1', 'Desc 2']));

const response = await fetch('/api/requests/123/attachments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

#### Response Success (201)
```json
{
  "success": true,
  "message": "2 file caricati con successo",
  "data": [
    {
      "id": "uuid-1",
      "fileName": "attachment-1234567890-uuid.jpg",
      "originalName": "foto1.jpg",
      "filePath": "attachments/attachment-1234567890-uuid.jpg",
      "fileType": "image/jpeg",
      "fileSize": 245632,
      "thumbnailPath": "thumbnails/thumb-attachment-1234567890-uuid.jpg",
      "description": "Foto del problema",
      "requestId": "request-uuid",
      "uploadedById": "user-uuid",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Error Responses
- **400 Bad Request**: File troppo grande, tipo non supportato, troppi file
- **403 Forbidden**: Utente non autorizzato
- **404 Not Found**: Richiesta non trovata

---

### 2. Ottieni Allegati di una Richiesta
**GET** `/api/requests/:id/attachments`

Recupera tutti gli allegati di una richiesta.

#### Headers
```
Authorization: Bearer {token}
```

#### Response Success (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "fileName": "attachment-1234567890-uuid.jpg",
      "originalName": "foto1.jpg",
      "filePath": "attachments/attachment-1234567890-uuid.jpg",
      "fileType": "image/jpeg",
      "fileSize": 245632,
      "thumbnailPath": "thumbnails/thumb-attachment-1234567890-uuid.jpg",
      "description": "Foto del problema",
      "uploadedBy": {
        "id": "user-uuid",
        "firstName": "Mario",
        "lastName": "Rossi",
        "email": "mario@example.com"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

---

### 3. Download Allegato
**GET** `/api/attachments/:id/download`

Scarica un file allegato.

#### Headers
```
Authorization: Bearer {token}
```

#### Response
- **200 OK**: File binario con headers appropriati
  - `Content-Type`: MIME type del file
  - `Content-Disposition`: attachment; filename="nome-originale.ext"
  - `Content-Length`: Dimensione file in bytes

#### Esempio JavaScript
```javascript
const response = await fetch('/api/attachments/123/download', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'filename.pdf';
a.click();
```

---

### 4. Ottieni Thumbnail
**GET** `/api/attachments/:id/thumbnail`

Ottiene la thumbnail di un'immagine (200x200px).

#### Headers
```
Authorization: Bearer {token}
```

#### Response
- **200 OK**: Immagine JPEG compressa
- **404 Not Found**: Thumbnail non disponibile (file non è un'immagine)

---

### 5. Elimina Allegato
**DELETE** `/api/attachments/:id`

Elimina un allegato dal sistema.

#### Headers
```
Authorization: Bearer {token}
```

#### Response Success (200)
```json
{
  "success": true,
  "message": "Allegato eliminato con successo"
}
```

#### Error Responses
- **403 Forbidden**: Non hai i permessi per eliminare questo file
- **404 Not Found**: Allegato non trovato

---

### 6. Statistiche Storage (Admin Only)
**GET** `/api/storage/stats`

Ottiene statistiche sull'utilizzo dello storage.

#### Headers
```
Authorization: Bearer {token}
```

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "totalFiles": 156,
    "totalSizeBytes": 52428800,
    "totalSizeMB": "50.00",
    "byType": [
      {
        "type": "image/jpeg",
        "count": 89,
        "sizeBytes": 31457280,
        "sizeMB": "30.00"
      },
      {
        "type": "application/pdf",
        "count": 67,
        "sizeBytes": 20971520,
        "sizeMB": "20.00"
      }
    ]
  }
}
```

---

## Processing Immagini

Le immagini caricate vengono automaticamente processate:

1. **Resize principale**: Max 1920x1080px, mantenendo aspect ratio
2. **Compressione**: JPEG quality 85%, progressive encoding
3. **Thumbnail**: 200x200px, crop center, JPEG quality 80%

## Sicurezza

- **Autenticazione**: Tutti gli endpoint richiedono JWT token valido
- **Autorizzazione**: 
  - Upload: Solo cliente e professionista assegnato
  - View/Download: Cliente, professionista assegnato, admin
  - Delete: Chi ha uploadato, cliente, professionista assegnato
- **Validazione**: Controllo MIME type e estensione file
- **Sanitizzazione**: Nomi file generati con UUID per evitare collisioni

## Rate Limiting

- Upload: Max 10 richieste per 15 minuti per IP
- Download: Max 100 richieste per 15 minuti per IP

## Best Practices

1. **Compressione lato client**: Comprimi immagini prima dell'upload per velocizzare
2. **Progress tracking**: Usa `onUploadProgress` per mostrare avanzamento
3. **Retry logic**: Implementa retry automatico per errori di rete
4. **Lazy loading**: Carica thumbnail prima, poi immagini full su richiesta
5. **Caching**: Cache thumbnail lato client per 24 ore
