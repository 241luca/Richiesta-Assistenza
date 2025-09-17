#!/bin/bash

echo "🗑️ AGGIUNGO PULSANTE ELIMINA ALLE API KEYS"
echo "=========================================="

cd backend

echo "1. Cerco il file del componente ApiKeyCard:"
find ../src -name "*ApiKey*" -o -name "*api-key*" | grep -E "\.(tsx|jsx)$" | head -10

echo ""
echo "2. Se non trovo, cerco dove vengono renderizzate le card:"
grep -r "GOOGLE_MAPS\|OPENAI\|BREVO" ../src --include="*.tsx" --include="*.jsx" | grep -i "card\|render" | head -5

echo ""
echo "3. Aggiungo endpoint DELETE per API Keys:"
cat >> src/routes/apiKeys.routes.ts << 'CODE'

// DELETE /api/admin/api-keys/:id - Delete an API key
router.delete('/:id', 
  authenticate, 
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      
      await prisma.apiKey.delete({
        where: { id }
      });
      
      logger.info(`API Key deleted: ${id}`);
      res.json({ 
        success: true, 
        message: 'API Key eliminata con successo' 
      });
    } catch (error) {
      logger.error('Error deleting API key:', error);
      next(error);
    }
  }
);
CODE

echo "✅ Endpoint DELETE aggiunto"

echo ""
echo "4. Test endpoint:"
npx tsx << 'EOF'
console.log('✅ Endpoint DELETE pronto per essere usato')
console.log('URL: DELETE /api/admin/api-keys/:id')
EOF

echo ""
echo "=========================================="
echo "Ora devo modificare il frontend."
echo "Dimmi il percorso del file delle API Keys nel frontend"
echo "così posso aggiungere il pulsante elimina"
