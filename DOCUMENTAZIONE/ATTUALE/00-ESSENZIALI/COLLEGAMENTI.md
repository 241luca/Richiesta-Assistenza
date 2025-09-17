# 🔗 COLLEGAMENTI AI FILE ESSENZIALI

I file essenziali del progetto sono mantenuti nella root per compatibilità con GitHub e standard di sviluppo.

## 📌 File Essenziali (nella root del progetto)

### ⚠️ [ISTRUZIONI-PROGETTO.md](../../../ISTRUZIONI-PROGETTO.md)
**IL FILE PIÙ IMPORTANTE** - Regole tecniche vincolanti per lo sviluppo
- Pattern obbligatori
- Stack tecnologico
- Best practices
- Errori comuni da evitare

### 📖 [README.md](../../../README.md)
Overview generale del progetto
- Descrizione sistema
- Quick start
- Installazione
- Utilizzo base

### 📝 [CHANGELOG.md](../../../CHANGELOG.md)
Storia delle modifiche e versioni
- Versioni rilasciate
- Modifiche principali
- Bug fix
- Breaking changes

### 🏗️ [ARCHITETTURA-SISTEMA-COMPLETA.md](ARCHITETTURA-SISTEMA-COMPLETA.md)
Architettura dettagliata del sistema (questo è l'unico mantenuto qui)

### ✅ [CHECKLIST-FUNZIONALITA-SISTEMA.md](CHECKLIST-FUNZIONALITA-SISTEMA.md)
Stato attuale di tutte le funzionalità (questo è l'unico mantenuto qui)

---

## 📍 Perché questa struttura?

- **README.md, CHANGELOG.md, ISTRUZIONI-PROGETTO.md** sono nella **root** perché:
  - GitHub li cerca automaticamente lì
  - npm/yarn si aspettano il CHANGELOG nella root
  - Gli sviluppatori si aspettano di trovarli lì
  - Evita duplicazioni e problemi di sincronizzazione

- **ARCHITETTURA e CHECKLIST** sono qui perché:
  - Sono documenti più tecnici e dettagliati
  - Non sono standard di GitHub/npm
  - Fanno parte della documentazione interna

---

## 🎯 Regola d'oro

**Un file, un posto solo!** Meglio un collegamento che una copia duplicata.
