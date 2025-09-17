-- Script per creare utenti di test nel database
-- Rimozione multi-tenancy completata - Gennaio 2025

-- Password hashata per "admin123" e "password123"
-- Hash generato con bcrypt rounds=12

-- Inserisci Super Admin
INSERT INTO "User" (
    id, email, username, password, 
    "firstName", "lastName", "fullName",
    role, phone, address, city, province, "postalCode",
    "emailVerified", "createdAt", "updatedAt"
) VALUES (
    '58757c4c-6987-4106-93f8-1c741dd77cb7',
    'admin@assistenza.it',
    'admin',
    '$2b$12$7z5P7K1O.Mz1xyBz1jUKqOQfDxlJhKRmR3V.AcJKzQGzRhBvL2hWS', -- admin123
    'Super',
    'Admin',
    'Super Admin',
    'SUPER_ADMIN',
    '0123456789',
    'Via Admin 1',
    'Roma',
    'RM',
    '00100',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Inserisci Cliente di test (Luigi Bianchi)
INSERT INTO "User" (
    id, email, username, password,
    "firstName", "lastName", "fullName",
    role, phone, address, city, province, "postalCode",
    "emailVerified", "createdAt", "updatedAt"
) VALUES (
    '7f3b1234-6987-4106-93f8-1c741dd77cb7',
    'luigi.bianchi@example.com',
    'luigi.bianchi',
    '$2b$12$N/ZJQqG5KcLi9Rz9gKyqI.2DQyLwPy2rL0YqK8FJdJ5jnHQ9SHQSG', -- password123
    'Luigi',
    'Bianchi',
    'Luigi Bianchi',
    'CLIENT',
    '3331234567',
    'Via Roma 45',
    'Milano',
    'MI',
    '20100',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Inserisci Professionista di test (Mario Rossi)
INSERT INTO "User" (
    id, email, username, password,
    "firstName", "lastName", "fullName",
    role, phone, address, city, province, "postalCode",
    profession, "emailVerified", "createdAt", "updatedAt"
) VALUES (
    '8c4d5678-6987-4106-93f8-1c741dd77cb7',
    'mario.rossi@example.com',
    'mario.rossi',
    '$2b$12$N/ZJQqG5KcLi9Rz9gKyqI.2DQyLwPy2rL0YqK8FJdJ5jnHQ9SHQSG', -- password123
    'Mario',
    'Rossi',
    'Mario Rossi',
    'PROFESSIONAL',
    '3339876543',
    'Via Milano 78',
    'Roma',
    'RM',
    '00100',
    'Idraulico',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Inserisci Staff di test
INSERT INTO "User" (
    id, email, username, password,
    "firstName", "lastName", "fullName",
    role, phone, address, city, province, "postalCode",
    "emailVerified", "createdAt", "updatedAt"
) VALUES (
    '9e5f6789-6987-4106-93f8-1c741dd77cb7',
    'staff@assistenza.it',
    'staff',
    '$2b$12$N/ZJQqG5KcLi9Rz9gKyqI.2DQyLwPy2rL0YqK8FJdJ5jnHQ9SHQSG', -- password123
    'Staff',
    'Assistenza',
    'Staff Assistenza',
    'ADMIN',
    '0987654321',
    'Via Staff 10',
    'Milano',
    'MI',
    '20100',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Crea alcune categorie di base
INSERT INTO "Category" (id, name, slug, description, color, "isActive", "displayOrder", "createdAt", "updatedAt")
VALUES 
    ('cat-1', 'Idraulica', 'idraulica', 'Servizi idraulici', '#3B82F6', true, 1, NOW(), NOW()),
    ('cat-2', 'Elettricista', 'elettricista', 'Servizi elettrici', '#10B981', true, 2, NOW(), NOW()),
    ('cat-3', 'Condizionamento', 'condizionamento', 'Climatizzazione e riscaldamento', '#F59E0B', true, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
