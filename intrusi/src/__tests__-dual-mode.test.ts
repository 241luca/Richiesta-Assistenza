/**
 * Test base per sistema AI Duale
 * Verifica funzionamento detection, KB selection e sanitization
 */

import { dualModeDetector } from '../services/dual-mode-detector.service';
import { dualKBService } from '../services/dual-kb.service';
import { responseSanitizer } from '../services/response-sanitizer.service';
import { DetectionMode } from '../types/professional-whatsapp.types';
import { prisma } from '../lib/prisma';

describe('Dual Mode Detection System', () => {
  const testInstanceId = 'test-instance-123';
  const testWhatsappId = 'test-whatsapp-id';
  const testSubcategoryId = 'test-subcategory-id';

  describe('Detection Service', () => {
    test('Professional number should be detected correctly', async () => {
      // Setup: aggiungi numero come professional
      const professionalNumber = '+393331234567';
      await dualModeDetector.addProfessionalNumber(testInstanceId, professionalNumber);

      // Test detection
      const result = await dualModeDetector.detectSenderType(professionalNumber, testInstanceId);

      // Verifica
      expect(result.mode).toBe(DetectionMode.PROFESSIONAL);
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.reason).toContain('professional');
    });

    test('Unknown number should default to CLIENT mode', async () => {
      const unknownNumber = '+393339999999';

      const result = await dualModeDetector.detectSenderType(unknownNumber, testInstanceId);

      expect(result.mode).toBe(DetectionMode.CLIENT);
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.reason).toContain('Unknown sender');
    });

    test('Override detection should work', async () => {
      const phoneNumber = '+393335555555';
      
      // Prima detection
      const initialResult = await dualModeDetector.detectSenderType(phoneNumber, testInstanceId);
      expect(initialResult.mode).toBe(DetectionMode.CLIENT);

      // Override
      await dualModeDetector.recordDetectionOverride({
        whatsappId: testWhatsappId,
        phoneNumber,
        originalDetection: DetectionMode.CLIENT,
        overriddenTo: DetectionMode.PROFESSIONAL,
        overriddenBy: 'test-user',
        reason: 'Test override',
        shouldLearnFrom: true
      });

      // Verifica override applicato
      const overriddenResult = await dualModeDetector.detectSenderType(phoneNumber, testInstanceId);
      expect(overriddenResult.mode).toBe(DetectionMode.PROFESSIONAL);
      expect(overriddenResult.reason).toContain('override');
    });
  });

  describe('Response Sanitizer', () => {
    test('Client mode should remove sensitive information', () => {
      const originalText = `
        Il costo del servizio è €100 (netto).
        Margine: 35%
        Fornitore: ABC Supplies
        COD-INT-12345
        Il prezzo al pubblico è €135.
      `;

      const sanitized = responseSanitizer.sanitizeResponse(originalText, DetectionMode.CLIENT);

      // Verifica rimozione info sensibili
      expect(sanitized).not.toContain('(netto)');
      expect(sanitized).not.toContain('Margine');
      expect(sanitized).not.toContain('Fornitore');
      expect(sanitized).not.toContain('COD-INT');
      expect(sanitized).toContain('€ 135'); // Prezzo pubblico mantenuto
    });

    test('Professional mode should keep all information', () => {
      const originalText = `
        Il costo del servizio è €100 (netto).
        Margine: 35%
        Fornitore: ABC Supplies
        COD-INT-12345
      `;

      const sanitized = responseSanitizer.sanitizeResponse(originalText, DetectionMode.PROFESSIONAL);

      // Verifica che tutto sia mantenuto
      expect(sanitized).toBe(originalText);
    });

    test('Price conversion should work correctly', () => {
      const textWithNetPrice = 'Il costo è €100 netto';
      
      const sanitized = responseSanitizer.sanitizeResponse(textWithNetPrice, DetectionMode.CLIENT);
      
      // 100 * 1.35 = 135
      expect(sanitized).toContain('€ 135');
      expect(sanitized).not.toContain('netto');
    });

    test('Should detect sensitive information', () => {
      const sensitiveText = 'Margine: 30% sul prodotto';
      const cleanText = 'Il prodotto è disponibile';

      expect(responseSanitizer.containsSensitiveInfo(sensitiveText)).toBe(true);
      expect(responseSanitizer.containsSensitiveInfo(cleanText)).toBe(false);
    });
  });

  describe('Dual KB Service', () => {
    test('Should return different KB for different modes', async () => {
      // Mock data
      const mockProfessionalKB = {
        technicalInfo: {
          standards: 'ISO 9001',
          tools: 'Professional tools list',
          suppliers: 'Supplier contacts'
        },
        pricing: {
          netCost: 100,
          margin: 35
        }
      };

      const mockClientKB = {
        services: 'Available services',
        warranty: '2 years warranty',
        pricing: {
          publicPrice: 135
        }
      };

      // Test Professional mode
      const professionalKB = await dualKBService.getKBForMode(
        DetectionMode.PROFESSIONAL,
        testWhatsappId,
        testSubcategoryId
      );

      // Test Client mode
      const clientKB = await dualKBService.getKBForMode(
        DetectionMode.CLIENT,
        testWhatsappId,
        testSubcategoryId
      );

      // Verifica che le KB siano diverse
      expect(professionalKB).not.toEqual(clientKB);
    });

    test('KB sanitization should remove sensitive fields', () => {
      const originalKB = {
        services: 'Installation service',
        netPrice: 100,
        margin: 35,
        supplierCode: 'SUP-123',
        publicInfo: 'Available Monday to Friday'
      };

      const sanitized = dualKBService.sanitizeKBForClient(originalKB);

      expect(sanitized.services).toBe('Installation service');
      expect(sanitized.publicInfo).toBe('Available Monday to Friday');
      expect(sanitized.netPrice).toBeUndefined();
      expect(sanitized.margin).toBeUndefined();
      expect(sanitized.supplierCode).toBeUndefined();
    });
  });

  describe('Integration Flow', () => {
    test('Complete flow: Detection → KB Selection → Sanitization', async () => {
      // 1. Simulate incoming message from client
      const clientNumber = '+393337777777';
      const messageText = 'Quanto costa il servizio?';

      // 2. Detect sender type
      const detection = await dualModeDetector.detectSenderType(clientNumber, testInstanceId);
      expect(detection.mode).toBe(DetectionMode.CLIENT);

      // 3. Get appropriate KB
      const kb = await dualKBService.getKBForMode(
        detection.mode,
        testWhatsappId,
        testSubcategoryId
      );

      // 4. Generate mock AI response (in realtà questo verrebbe da OpenAI)
      const mockAIResponse = `
        Il servizio di installazione ha un costo di €100 (netto).
        Margine applicato: 35%
        Il prezzo finale per lei è €135.
        Fornitore: TechSupplies SRL
      `;

      // 5. Sanitize response based on mode
      const finalResponse = responseSanitizer.sanitizeResponse(mockAIResponse, detection.mode);

      // 6. Verify sanitization for client
      expect(finalResponse).not.toContain('(netto)');
      expect(finalResponse).not.toContain('Margine');
      expect(finalResponse).not.toContain('TechSupplies');
      expect(finalResponse).toContain('€ 135'); // Solo prezzo pubblico
    });

    test('Complete flow for Professional', async () => {
      // 1. Simulate incoming message from professional
      const professionalNumber = '+393332222222';
      await dualModeDetector.addProfessionalNumber(testInstanceId, professionalNumber);
      
      const messageText = 'Quali sono i margini su questo servizio?';

      // 2. Detect sender type
      const detection = await dualModeDetector.detectSenderType(professionalNumber, testInstanceId);
      expect(detection.mode).toBe(DetectionMode.PROFESSIONAL);

      // 3. Get appropriate KB
      const kb = await dualKBService.getKBForMode(
        detection.mode,
        testWhatsappId,
        testSubcategoryId
      );

      // 4. Generate mock AI response
      const mockAIResponse = `
        Il servizio di installazione ha un costo netto di €100.
        Margine consigliato: 35%
        Prezzo al pubblico: €135
        Fornitore principale: TechSupplies SRL (sconto volume 10% oltre 10 pezzi)
        Codice interno: COD-INT-INST-001
      `;

      // 5. Sanitize response (no sanitization for professional)
      const finalResponse = responseSanitizer.sanitizeResponse(mockAIResponse, detection.mode);

      // 6. Verify all info preserved for professional
      expect(finalResponse).toBe(mockAIResponse);
      expect(finalResponse).toContain('costo netto');
      expect(finalResponse).toContain('Margine');
      expect(finalResponse).toContain('TechSupplies');
      expect(finalResponse).toContain('COD-INT');
    });
  });
});

// Helper function per cleanup dopo i test
afterAll(async () => {
  // Cleanup test data if needed
  await prisma.$disconnect();
});
