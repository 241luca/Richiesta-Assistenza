import { Router } from 'express';
import { prisma } from '../config/database';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/debug/find-professionals - Trova quali categorie hanno professionisti
router.get('/find-professionals', async (req, res) => {
  try {
    logger.info('[DEBUG] Finding categories with professionals...');
    
    // Query diretta per trovare quali categorie hanno professionisti
    // Convertendo COUNT a integer per evitare problemi con BigInt
    const categoriesWithProfessionals = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.name as category_name,
        CAST(COUNT(DISTINCT pus."userId") AS INTEGER) as professional_count
      FROM "Category" c
      INNER JOIN "Subcategory" s ON s."categoryId" = c.id
      INNER JOIN "ProfessionalUserSubcategory" pus ON pus."subcategoryId" = s.id
      WHERE c."isActive" = true
      GROUP BY c.id, c.name
      ORDER BY c.name
    `;
    
    // Query per vedere tutti i professionisti e le loro sottocategorie
    const professionalDetails = await prisma.$queryRaw`
      SELECT 
        u.id as user_id,
        u."fullName" as professional_name,
        s.name as subcategory_name,
        c.name as category_name
      FROM "User" u
      INNER JOIN "ProfessionalUserSubcategory" pus ON pus."userId" = u.id
      INNER JOIN "Subcategory" s ON s.id = pus."subcategoryId"
      INNER JOIN "Category" c ON c.id = s."categoryId"
      WHERE u.role = 'PROFESSIONAL'
      ORDER BY c.name, s.name, u."fullName"
    `;
    
    // Convertiamo manualmente eventuali BigInt in number
    const categoriesFormatted = (categoriesWithProfessionals as any[]).map(cat => ({
      ...cat,
      professional_count: Number(cat.professional_count)
    }));
    
    return res.json({
      success: true,
      categoriesWithProfessionals: categoriesFormatted,
      professionalDetails,
      summary: {
        totalCategoriesWithProfessionals: categoriesFormatted.length,
        totalProfessionalAssignments: (professionalDetails as any[]).length
      }
    });
    
  } catch (error: any) {
    logger.error('[DEBUG] Error finding professionals:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Check if Subcategory table exists and has correct columns'
    });
  }
});

// GET /api/debug/table-check - Verifica l'esistenza delle tabelle
router.get('/table-check', async (req, res) => {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (
        table_name LIKE '%ategory%' 
        OR table_name LIKE '%rofessional%'
        OR table_name LIKE '%ubcategory%'
      )
      ORDER BY table_name
    `;
    
    return res.json({
      success: true,
      tables,
      message: 'List of relevant tables in database'
    });
    
  } catch (error: any) {
    logger.error('[DEBUG] Error checking tables:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/debug/simple-check - Verifica semplice senza join complessi
router.get('/simple-check', async (req, res) => {
  try {
    logger.info('[DEBUG] Simple check...');
    
    // 1. Vediamo tutte le categorie
    const categories = await prisma.$queryRaw`
      SELECT id, name FROM "Category" WHERE "isActive" = true ORDER BY name
    `;
    
    // 2. Vediamo tutte le sottocategorie
    const subcategories = await prisma.$queryRaw`
      SELECT id, name, "categoryId" FROM "Subcategory" WHERE "isActive" = true LIMIT 20
    `;
    
    // 3. Vediamo i link professionista-sottocategoria
    const links = await prisma.$queryRaw`
      SELECT "userId", "subcategoryId" FROM "ProfessionalUserSubcategory" LIMIT 20
    `;
    
    // 4. Vediamo i professionisti
    const professionals = await prisma.$queryRaw`
      SELECT id, "fullName", role FROM "User" WHERE role = 'PROFESSIONAL'
    `;
    
    return res.json({
      success: true,
      data: {
        categories: categories,
        subcategoriesCount: (subcategories as any[]).length,
        subcategoriesSample: subcategories,
        linksCount: (links as any[]).length,
        linksSample: links,
        professionals: professionals
      }
    });
    
  } catch (error: any) {
    logger.error('[DEBUG] Error in simple check:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
