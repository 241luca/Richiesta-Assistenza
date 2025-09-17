# MODIFICHE SCHEMA PRISMA - Collegamento Professioni-Categorie

## 1. AGGIUNGERE NUOVA TABELLA (dopo model Profession)

```prisma
// Tabella di collegamento tra Professioni e Categorie
// Una professione può lavorare in più categorie
model ProfessionCategory {
  id           String     @id @default(cuid())
  professionId String
  categoryId   String
  description  String?    // Descrizione specifica per questa combinazione
  isDefault    Boolean    @default(false) // Se è la categoria principale per questa professione
  isActive     Boolean    @default(true)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  
  profession   Profession @relation(fields: [professionId], references: [id], onDelete: Cascade)
  category     Category   @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  @@unique([professionId, categoryId]) // Una professione può essere collegata a una categoria solo una volta
  @@index([professionId])
  @@index([categoryId])
  @@index([isActive])
}
```

## 2. MODIFICARE model Profession (aggiungere relazione)

TROVA:
```prisma
model Profession {
  id           String   @id
  name         String   @unique
  slug         String   @unique
  description  String?
  isActive     Boolean  @default(true)
  displayOrder Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime
  users        User[]

  @@index([isActive])
  @@index([slug])
}
```

SOSTITUISCI CON:
```prisma
model Profession {
  id           String   @id
  name         String   @unique
  slug         String   @unique
  description  String?
  isActive     Boolean  @default(true)
  displayOrder Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime
  users        User[]
  categories   ProfessionCategory[]  // NUOVO: relazione con categorie

  @@index([isActive])
  @@index([slug])
}
```

## 3. MODIFICARE model Category (aggiungere relazione)

TROVA:
```prisma
model Category {
  id                         String                       @id
  name                       String
  slug                       String                       @unique
  description                String?
  icon                       String?
  color                      String                       @default("#3B82F6")
  textColor                  String                       @default("#FFFFFF")
  isActive                   Boolean                      @default(true)
  displayOrder               Int                          @default(0)
  createdAt                  DateTime                     @default(now())
  updatedAt                  DateTime
  requests                   AssistanceRequest[]
  depositRules               DepositRule[]
  reportTemplates            InterventionReportTemplate[]
  subcategories              Subcategory[]

  @@index([isActive])
  @@index([slug])
}
```

SOSTITUISCI CON:
```prisma
model Category {
  id                         String                       @id
  name                       String
  slug                       String                       @unique
  description                String?
  icon                       String?
  color                      String                       @default("#3B82F6")
  textColor                  String                       @default("#FFFFFF")
  isActive                   Boolean                      @default(true)
  displayOrder               Int                          @default(0)
  createdAt                  DateTime                     @default(now())
  updatedAt                  DateTime
  requests                   AssistanceRequest[]
  depositRules               DepositRule[]
  reportTemplates            InterventionReportTemplate[]
  subcategories              Subcategory[]
  professions                ProfessionCategory[]         // NUOVO: relazione con professioni

  @@index([isActive])
  @@index([slug])
}
```

## 4. COMANDI DA ESEGUIRE DOPO LE MODIFICHE

```bash
cd backend
npx prisma generate
npx prisma db push
```

## 5. SEED DATA (opzionale - esempio)

```typescript
// In backend/prisma/seed.ts aggiungere:

// Collegamento professioni-categorie di esempio
const professionCategories = [
  { professionId: 'idraulico-id', categoryId: 'impianti-id', isDefault: true },
  { professionId: 'idraulico-id', categoryId: 'riparazioni-id' },
  { professionId: 'elettricista-id', categoryId: 'impianti-elettrici-id', isDefault: true },
  { professionId: 'elettricista-id', categoryId: 'domotica-id' },
  // etc...
];

for (const pc of professionCategories) {
  await prisma.professionCategory.create({
    data: pc
  });
}
```
