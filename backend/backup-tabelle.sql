-- Backup delle 4 tabelle critiche prima della migrazione Prisma
-- Data: $(date)

-- FooterLink
CREATE TEMP TABLE backup_FooterLink AS SELECT * FROM "FooterLink";

-- FooterSection  
CREATE TEMP TABLE backup_FooterSection AS SELECT * FROM "FooterSection";

-- module_settings
CREATE TEMP TABLE backup_module_settings AS SELECT * FROM module_settings;

-- system_modules
CREATE TEMP TABLE backup_system_modules AS SELECT * FROM system_modules;
