# Documentazione Fix Upload File - Chrome Mac

## Problema Riscontrato

### Sintomo
Il pulsante per caricare file non funzionava su Chrome con macOS. Cliccando sul pulsante "Seleziona File" o "Aggiungi File", il dialog di selezione file non si apriva.

### Browser Affetti
- ❌ Chrome su macOS (tutte le versioni)
- ✅ Safari su macOS (funzionava)
- ✅ Firefox (funzionava)

### Causa Tecnica
Chrome su macOS ha un bug noto con gli elementi `<label>` che puntano a input file nascosti tramite l'attributo `htmlFor`. Il click event non viene propagato correttamente all'input file nascosto.

## Soluzione Implementata

### Approccio: React useRef Hook

Invece di usare un `<label>` HTML che punta all'input file, utilizziamo:
1. Un `useRef` di React per mantenere un riferimento all'input file
2. Un `<button>` standard con `onClick` handler
3. Il click handler chiama programmaticamente `.click()` sull'input tramite il ref

### Codice Prima (Non Funzionante su Chrome Mac)

```tsx
// ❌ NON FUNZIONA su Chrome Mac
<label
  htmlFor="file-upload-input"
  className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
>
  Seleziona File
</label>
<input
  id="file-upload-input"
  type="file"
  className="hidden"
  multiple
  onChange={handleFileSelect}
/>
```

### Codice Dopo (Funzionante Ovunque)

```tsx
// ✅ FUNZIONA su tutti i browser
import { useRef } from 'react';

function Component() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Seleziona File
      </button>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={handleFileSelect}
      />
    </>
  );
}
```

## File Modificati

### 1. `/src/pages/NewRequestPage.tsx`
- Aggiunto `useRef` import da React
- Creato `fileInputRef` con `useRef<HTMLInputElement>(null)`
- Sostituito `<label>` con `<button>` + onClick handler
- Aggiunto `ref={fileInputRef}` all'input file

### 2. `/src/pages/RequestDetailPage.tsx`
- Stesso approccio di NewRequestPage
- Mantenuta consistenza nell'implementazione

### 3. `/backend/src/services/file.service.ts`
- Aggiunta gestione caso array vuoto per attachments
- Previene errore Prisma quando non ci sono allegati

## Test di Compatibilità

| Browser | Sistema | Stato | Note |
|---------|---------|-------|------|
| Chrome | macOS | ✅ FUNZIONA | Fix principale per questo caso |
| Safari | macOS | ✅ FUNZIONA | Già funzionava prima |
| Firefox | macOS | ✅ FUNZIONA | Già funzionava prima |
| Chrome | Windows | ✅ FUNZIONA | Già funzionava prima |
| Edge | Windows | ✅ FUNZIONA | Già funzionava prima |

## Drag & Drop

Il sistema di drag & drop NON è stato modificato e continua a funzionare in parallelo:
- Gli utenti possono trascinare file nell'area dedicata
- Oppure cliccare sul pulsante per selezionare file
- Entrambi i metodi sono disponibili e funzionanti

## Best Practice per Futuri Upload File

### ✅ DA FARE
```tsx
// Usa sempre useRef per input file nascosti
const fileInputRef = useRef<HTMLInputElement>(null);

// Usa button con onClick
<button onClick={() => fileInputRef.current?.click()}>
  Upload
</button>

// Input nascosto con ref
<input ref={fileInputRef} type="file" className="hidden" />
```

### ❌ DA EVITARE
```tsx
// NON usare label con htmlFor per input file nascosti
<label htmlFor="file-input">Upload</label>
<input id="file-input" type="file" className="hidden" />

// NON usare document.getElementById
document.getElementById('file-input').click();
```

## Riferimenti

- [Chrome Bug Report](https://bugs.chromium.org/p/chromium/issues/detail?id=1247685)
- [React useRef Documentation](https://react.dev/reference/react/useRef)
- [MDN File Input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file)

## Conclusione

Il fix con `useRef` è la soluzione più affidabile e cross-browser per gestire input file nascosti in React. Questo approccio:
- ✅ Funziona su tutti i browser
- ✅ È più "React-friendly" 
- ✅ Evita manipolazione diretta del DOM
- ✅ È più manutenibile e testabile
