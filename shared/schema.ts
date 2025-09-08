import { pgTable, serial, varchar, text, timestamp, boolean, integer, real, jsonb } from 'drizzle-orm/pg-core';

// Schema base degli utenti (assumo esista già)
export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  full_name: varchar('full_name', { length: 255 }),
  role: text('role', { enum: ['CLIENT', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN'] }).notNull().default('CLIENT'),
  created_at: timestamp('created_at').notNull().defaultNow()
});
