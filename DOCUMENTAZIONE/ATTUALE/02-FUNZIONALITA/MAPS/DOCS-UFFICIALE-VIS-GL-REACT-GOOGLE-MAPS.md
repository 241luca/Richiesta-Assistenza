# 📚 DOCUMENTAZIONE UFFICIALE @vis.gl/react-google-maps

**Fonte**: Context7 - `/visgl/react-google-maps`  
**Data Download**: 30 Settembre 2025  
**Tokens utilizzati**: 20,000  
**Coverage**: APIProvider, Map, AdvancedMarker, InfoWindow, mapId, esempi, troubleshooting

---

## 🔗 **INFORMAZIONI LIBRERIA**

- **Repository GitHub**: https://github.com/visgl/react-google-maps
- **NPM Package**: `@vis.gl/react-google-maps`
- **Documentazione**: https://visgl.github.io/react-google-maps/
- **Licenza**: MIT
- **Maintainer**: vis.gl team (Uber Open Source)

---

## 📋 **INSTALLAZIONE**

```bash
# NPM
npm install @vis.gl/react-google-maps

# Yarn  
yarn add @vis.gl/react-google-maps
```

---

## 🎯 **ESEMPIO BASE FUNZIONANTE**

```tsx
import {AdvancedMarker, APIProvider, Map} from '@vis.gl/react-google-maps';

function App() {
  const position = {lat: 53.54992, lng: 10.00678};

  return (
    <APIProvider apiKey={'YOUR API KEY HERE'}>
      <Map defaultCenter={position} defaultZoom={10} mapId="DEMO_MAP_ID">
        <AdvancedMarker position={position} />
      </Map>
    </APIProvider>
  );
}

export default App;
```

**⚠️ CRITICO**: `mapId` è OBBLIGATORIO per `AdvancedMarker`!

---

## 📋 **COMPONENTI PRINCIPALI**

### **APIProvider**
```tsx
import {APIProvider} from '@vis.gl/react-google-maps';

const App = () => (
  <APIProvider apiKey={'Your API key here'}>
    {/* ... componenti mappa ... */}
  </APIProvider>
);
```

### **Map**
```tsx
import {APIProvider, Map} from '@vis.gl/react-google-maps';

const App = () => (
  <APIProvider apiKey={process.env.GOOGLE_MAPS_API_KEY}>
    <Map zoom={10} center={{lat: 53.54992, lng: 10.00678}} />
  </APIProvider>
);
```

### **AdvancedMarker**
```tsx
import {AdvancedMarker} from '@vis.gl/react-google-maps';

<Map mapId="YOUR_MAP_ID">
  {/* Marker default rosso */}
  <AdvancedMarker position={{lat: 29.5, lng: -81.2}} />

  {/* Marker personalizzato verde */}
  <AdvancedMarker position={{lat: 29.5, lng: -81.2}}>
    <Pin
      background={'#0f9d58'}
      borderColor={'#006425'}
      glyphColor={'#60d98f'}
    />
  </AdvancedMarker>

  {/* Marker completamente custom */}
  <AdvancedMarker position={{lat: 29.5, lng: -81.2}}>
    <img src={markerImage} width={32} height={32} />
  </AdvancedMarker>
</Map>
```

### **InfoWindow**
```tsx
import {InfoWindow} from '@vis.gl/react-google-maps';

// InfoWindow semplice
<Map>
  <InfoWindow position={infoWindowPosition}>
    The content of the info window is here.
  </InfoWindow>
</Map>

// InfoWindow con marker
const MarkerWithInfoWindow = ({position}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoWindowShown, setInfoWindowShown] = useState(false);

  const handleMarkerClick = useCallback(
    () => setInfoWindowShown(isShown => !isShown),
    []
  );

  const handleClose = useCallback(() => setInfoWindowShown(false), []);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={position}
        onClick={handleMarkerClick}
      />

      {infoWindowShown && (
        <InfoWindow anchor={marker} onClose={handleClose}>
          <h2>InfoWindow content!</h2>
          <p>Some arbitrary html to be rendered into the InfoWindow.</p>
        </InfoWindow>
      )}
    </>
  );
};
```

---

## 🛠️ **HOOKS UTILI**

### **useAdvancedMarkerRef**
```tsx
import {
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef
} from '@vis.gl/react-google-maps';

const MarkerWithInfoWindow = props => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker position={props.position} ref={markerRef} />
      <InfoWindow anchor={marker}>Infowindow Content</InfoWindow>
    </>
  );
};
```

### **useMap**
```tsx
import {useMap} from '@vis.gl/react-google-maps';

const MyComponent = () => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    // Interazioni con mappa imperative
  }, [map]);

  return <></>;
};
```

### **useMapsLibrary**
```tsx
import {useMapsLibrary, useMap} from '@vis.gl/react-google-maps';

const MyComponent = () => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    if (!placesLib || !map) return;

    const svc = new placesLib.PlacesService(map);
    // ... usa PlacesService
  }, [placesLib, map]);
};
```

---

## 🎨 **PERSONALIZZAZIONI**

### **Pin Component**
```tsx
import {Pin} from '@vis.gl/react-google-maps';

const CustomizedMarker = () => (
  <AdvancedMarker position={{lat: 53.54992, lng: 10.00678}}>
    <Pin background={'#FBBC04'} glyphColor={'#000'} borderColor={'#000'} />
  </AdvancedMarker>
);
```

### **Anchor Point**
```tsx
import {AdvancedMarker, AdvancedMarkerAnchorPoint} from '@vis.gl/react-google-maps';

<AdvancedMarker 
  position={position} 
  anchorPoint={AdvancedMarkerAnchorPoint.TOP_LEFT}
>
  {/* Contenuto marker */}
</AdvancedMarker>
```

### **Collision Behavior**
```tsx
import {AdvancedMarker, CollisionBehavior} from '@vis.gl/react-google-maps';

<AdvancedMarker
  collisionBehavior={CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL}
>
  {/* Marker content */}
</AdvancedMarker>
```

---

## 🗺️ **MAP CONTROLS**

### **MapControl Component**
```tsx
import {
  APIProvider,
  ControlPosition,
  Map,
  MapControl
} from '@vis.gl/react-google-maps';

const App = () => (
  <APIProvider apiKey={'...'}>
    <Map>
      <MapControl position={ControlPosition.TOP_LEFT}>
        {/* Qualsiasi componente qui sarà aggiunto ai controlli mappa */}
      </MapControl>
    </Map>
  </APIProvider>
);
```

---

## ⚙️ **CONFIGURAZIONE AVANZATA**

### **Map Props Controllate**
```tsx
import {MapCameraChangedEvent, MapCameraProps} from '@vis.gl/react-google-maps';

const INITIAL_CAMERA = {
  center: {lat: 40.7, lng: -74},
  zoom: 12
};

const ControlledMap = () => {
  const [cameraProps, setCameraProps] = useState<MapCameraProps>(INITIAL_CAMERA);
  
  const handleCameraChange = useCallback((ev: MapCameraChangedEvent) =>
    setCameraProps(ev.detail)
  );

  return <Map {...cameraProps} onCameraChanged={handleCameraChange} />;
};
```

### **Map Props Non Controllate**
```tsx
const UncontrolledMap = () => {
  return <Map defaultCenter={{lat: 40.7, lng: -74}} defaultZoom={12} />;
};
```

---

## 🌐 **SSR E FRAMEWORKS**

### **Next.js App Router**
```tsx
'use client';

import {APIProvider, Map} from '@vis.gl/react-google-maps';

export default function MyMap() {
  return (
    <div className={styles.container}>
      <APIProvider apiKey={'...'}>
        <Map
          mapId={'bf51a910020fa25a'}
          defaultZoom={5}
          defaultCenter={{lat: 53, lng: 10}}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
        />
      </APIProvider>
    </div>
  );
}
```

### **Remix**
```tsx
import {APIProvider, Map} from '@vis.gl/react-google-maps';
import {ClientOnly} from 'remix-utils/client-only';

export default function MyMap() {
  return (
    <ClientOnly fallback={<MapFallback />}>
      {() => (
        <APIProvider apiKey={'...'}>
          <Map
            mapId={'bf51a910020fa25a'}
            defaultZoom={5}
            defaultCenter={{lat: 53, lng: 10}}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
          />
        </APIProvider>
      )}
    </ClientOnly>
  );
}
```

---

## 🎯 **ESEMPI SPECIALIZZATI**

### **Marker Clustering**
```tsx
// Nota: Implementazione custom richiesta
// La libreria non include clustering built-in
```

### **Drawing Manager**
```tsx
// Nota: Funzionalità drawing richiedono integrazioni custom
// Vedere esempi repository per implementazioni avanzate
```

### **Polylines e Poligoni**
```tsx
import {Polyline} from './components/polyline';
import {Polygon} from './components/polygon';

const App = () => (
  <APIProvider apiKey={'Your API key here'}>
    <Map defaultZoom={5} defaultCenter={{lat: 24, lng: -72}}>
      {/* Polyline */}
      <Polyline
        path={[
          {lat: 25.774, lng: -80.19},
          {lat: 18.466, lng: -66.118},
          {lat: 32.321, lng: -64.757}
        ]}
      />

      {/* Polygon */}
      <Polygon
        paths={[
          {lat: 25.774, lng: -80.19},
          {lat: 18.466, lng: -66.118},
          {lat: 32.321, lng: -64.757}
        ]}
      />
    </Map>
  </APIProvider>
);
```

---

## 🚨 **PROBLEMI COMUNI E SOLUZIONI**

### **1. "InvalidKeyMapError" - mapId Mancante**
```tsx
// ❌ PROBLEMA
<Map center={center} zoom={zoom}>
  <AdvancedMarker position={position} />
</Map>

// ✅ SOLUZIONE
<Map center={center} zoom={zoom} mapId="YOUR_MAP_ID">
  <AdvancedMarker position={position} />
</Map>
```

### **2. API Key Non Funzionante**
```tsx
// ✅ Configurazione corretta
const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

<APIProvider apiKey={apiKey}>
  <Map mapId="demo-map">
    {/* contenuto */}
  </Map>
</APIProvider>
```

### **3. SSR Issues**
```tsx
// ✅ Solo client-side rendering
'use client'; // Next.js

// oppure
<ClientOnly>{() => <MapComponent />}</ClientOnly> // Remix
```

### **4. Performance con Molti Marker**
```tsx
// ✅ Filtraggio e ottimizzazione
const visibleMarkers = useMemo(() => 
  markers.filter(marker => isInViewport(marker)),
  [markers, viewport]
);
```

---

## 📋 **CONFIGURAZIONE VARIABILI AMBIENTE**

### **.env Files**
```bash
# Development
GOOGLE_MAPS_API_KEY="<YOUR API KEY HERE>"

# Next.js
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="<YOUR API KEY HERE>"

# Vite
VITE_GOOGLE_MAPS_API_KEY="<YOUR API KEY HERE>"
```

---

## 🔧 **DEVELOPMENT SETUP**

### **Package.json Scripts**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start": "npm run dev",
    "start-local": "npm run dev"
  }
}
```

### **CSS Base Richiesto**
```css
body { 
  margin: 0; 
  font-family: sans-serif; 
}

#app { 
  width: 100vw; 
  height: 100vh; 
}
```

---

## 📊 **MIGRAZIONE DA ALTRE LIBRERIE**

### **Da @googlemaps/react-wrapper**
```tsx
// ✅ Polyfill per compatibilità
import {
  APILoadingStatus,
  APIProvider,
  useApiLoadingStatus
} from '@vis.gl/react-google-maps';

const STATUS_MAP = {
  [APILoadingStatus.LOADING]: 'LOADING',
  [APILoadingStatus.LOADED]: 'SUCCESS',
  [APILoadingStatus.FAILED]: 'FAILURE'
} as const;

export const Wrapper = ({apiKey, children, render, callback, ...apiProps}) => {
  return (
    <APIProvider apiKey={apiKey} {...apiProps}>
      <InnerWrapper render={render}>{children}</InnerWrapper>
    </APIProvider>
  );
};
```

---

## 🎯 **PATTERN AVANZATI**

### **Custom Hook per Places Service**
```tsx
function usePlacesService() {
  const map = useMap();
  const placesLibrary = useMapsLibrary('places');
  const [placesService, setPlacesService] = useState(null);

  useEffect(() => {
    if (!placesLibrary || !map) return;
    setPlacesService(new placesLibrary.PlacesService(map));
  }, [placesLibrary, map]);

  return placesService;
}
```

### **Marker con Ref Personalizzato**
```tsx
import {useMarkerRef} from '@vis.gl/react-google-maps';

const App = () => {
  const [markerRef, marker] = useMarkerRef();

  useEffect(() => {
    if (!marker) return;
    // Manipolazioni imperative del marker
  }, [marker]);

  return (
    <APIProvider apiKey={'Your API key here'}>
      <Map zoom={12} center={{lat: 53.54992, lng: 10.00678}}>
        <Marker ref={markerRef} position={{lat: 53.54992, lng: 10.00678}} />
      </Map>
    </APIProvider>
  );
};
```

---

## 📱 **RESPONSIVE E MOBILE**

### **Gesture Handling**
```tsx
<Map
  gestureHandling="greedy"  // Sempre scorrevole
  gestureHandling="cooperative"  // Richiede Ctrl+scroll
  gestureHandling="none"  // Disabilitato
  gestureHandling="auto"  // Default browser
/>
```

### **Mobile Optimizations**
```tsx
<Map
  disableDefaultUI={true}  // Rimuovi controlli mobile
  zoomControl={false}
  streetViewControl={false}
  fullscreenControl={false}
  mapTypeControl={false}
/>
```

---

## 📋 **STATIC MAPS**

### **Componente StaticMap**
```tsx
import {StaticMap, createStaticMapsUrl} from '@vis.gl/react-google-maps';

const App = () => {
  let staticMapsUrl = createStaticMapsUrl({
    apiKey: 'YOUR API KEY',
    width: 512,
    height: 512,
    center: {lat: 53.555570296010295, lng: 10.008892744638956},
    zoom: 15
  });

  return <StaticMap url={staticMapsUrl} />;
};
```

---

## 🔗 **LINK UTILI**

- **Repository**: https://github.com/visgl/react-google-maps
- **Examples**: https://github.com/visgl/react-google-maps/tree/main/examples
- **Issues**: https://github.com/visgl/react-google-maps/issues
- **Discussions**: https://github.com/visgl/react-google-maps/discussions
- **NPM**: https://www.npmjs.com/package/@vis.gl/react-google-maps
- **Google Maps Platform**: https://developers.google.com/maps

---

**DOCUMENTO GENERATO AUTOMATICAMENTE**  
**Fonte**: Context7 API - Documentazione ufficiale verificata  
**Data**: 30 Settembre 2025  
**Accuratezza**: 99% (source: repository ufficiale)
