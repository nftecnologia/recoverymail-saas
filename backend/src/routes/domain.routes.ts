import { Router } from 'express';
import { DnsVerificationService } from '../services/dns-verification.service';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { EmailSettings } from '../types/email-config.types';

const router = Router();

// Verificar domínio
router.post('/verify', async (req, res): Promise<void> => {
  try {
    const { domain } = req.body;
    const organizationId = req.headers['x-organization-id'] as string;

    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    // Verificar DNS
    const verification = await DnsVerificationService.verifyDomain(domain);

    // Salvar no banco se verificado
    if (verification.status === 'VERIFIED') {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId }
      });

      const currentSettings = (organization?.emailSettings as unknown as EmailSettings) || {
        provider: 'MANAGED'
      };

      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          emailSettings: {
            ...currentSettings,
            managed: {
              ...currentSettings.managed,
              customDomain: verification
            }
          } as any
        }
      });
    }

    res.json(verification);
  } catch (error) {
    logger.error('Error verifying domain:', error);
    res.status(500).json({ error: 'Failed to verify domain' });
  }
});

// Obter registros DNS necessários
router.get('/dns-records/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const { useSubdomain = true } = req.query;

    const records = DnsVerificationService.generateDnsRecords(
      domain, 
      useSubdomain === 'true'
    );

    res.json({ domain, records });
  } catch (error) {
    logger.error('Error generating DNS records:', error);
    res.status(500).json({ error: 'Failed to generate DNS records' });
  }
});

// Obter status atual do domínio
router.get('/status', async (req, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { emailSettings: true }
    });

    const settings = organization?.emailSettings as unknown as EmailSettings;
    const customDomain = settings?.managed?.customDomain;

    res.json({
      hasCustomDomain: !!customDomain,
      domain: customDomain?.domain,
      status: customDomain?.status,
      verifiedAt: customDomain?.verifiedAt,
      records: customDomain?.records
    });
  } catch (error) {
    logger.error('Error getting domain status:', error);
    res.status(500).json({ error: 'Failed to get domain status' });
  }
});

export default router; 