import dns from 'dns/promises';
import { DomainVerification, DomainVerificationStatus } from '../types/email-config.types';

export class DnsVerificationService {
  private static readonly SPF_INCLUDE = 'include:amazonses.com'; // Resend usa Amazon SES
  private static readonly DKIM_SELECTOR = 'resend'; // Selector padrão do Resend
  private static readonly SUBDOMAIN_CNAME = 'inboxrecovery.com';
  private static readonly DMARC_RUA = 'rua=mailto:dmarc@inboxrecovery.com';

  /**
   * Gera os registros DNS necessários para o domínio
   * Baseado na configuração do Resend
   */
  static generateDnsRecords(domain: string, useSubdomain: boolean = false): DomainVerification['records'] {
    if (useSubdomain) {
      // Opção simplificada: apenas um CNAME para subdomínio
      return {
        spf: {
          type: 'TXT',
          name: '@',
          value: 'Não necessário com subdomain delegation',
          verified: true
        },
        dkim: {
          type: 'CNAME',
          name: 'email', // email.clientedomain.com → inboxrecovery.com
          value: this.SUBDOMAIN_CNAME,
          verified: false
        },
        dmarc: {
          type: 'TXT',
          name: '_dmarc',
          value: 'Opcional com subdomain delegation',
          verified: true
        }
      };
    }

    // Configuração completa para domínio próprio
    return {
      spf: {
        type: 'TXT',
        name: '@',
        value: `v=spf1 ${this.SPF_INCLUDE} ~all`,
        verified: false
      },
      dkim: {
        type: 'CNAME',
        name: `${this.DKIM_SELECTOR}._domainkey`,
        value: `${this.DKIM_SELECTOR}._domainkey.${domain}.domains.resend.com`,
        verified: false
      },
      dmarc: {
        type: 'TXT',
        name: '_dmarc',
        value: `v=DMARC1; p=none; ${this.DMARC_RUA}`,
        verified: false
      }
    };
  }

  /**
   * Verifica se os registros DNS estão configurados corretamente
   */
  static async verifyDomain(domain: string): Promise<DomainVerification> {
    const records = this.generateDnsRecords(domain);
    let allVerified = true;

    try {
      // Verificar SPF
      try {
        const txtRecords = await dns.resolveTxt(domain);
        const spfRecord = txtRecords
          .flat()
          .find(record => record.includes('v=spf1') && record.includes(this.SPF_INCLUDE));
        
        records.spf.verified = !!spfRecord;
        if (!spfRecord) allVerified = false;
      } catch (error) {
        records.spf.verified = false;
        allVerified = false;
      }

      // Verificar DKIM
      try {
        const cnameRecords = await dns.resolveCname(`recovery._domainkey.${domain}`);
        records.dkim.verified = cnameRecords.includes(DnsVerificationService.SUBDOMAIN_CNAME);
        if (!records.dkim.verified) allVerified = false;
      } catch (error) {
        records.dkim.verified = false;
        allVerified = false;
      }

      // Verificar DMARC (opcional)
      if (records.dmarc) {
        try {
          const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`);
          const dmarcRecord = dmarcRecords
            .flat()
            .find(record => record.includes('v=DMARC1'));
          
          records.dmarc.verified = !!dmarcRecord;
          // DMARC é opcional, não afeta allVerified
        } catch (error) {
          records.dmarc.verified = false;
        }
      }

      const result: DomainVerification = {
        domain,
        status: allVerified ? DomainVerificationStatus.VERIFIED : DomainVerificationStatus.FAILED,
        records,
        lastCheckedAt: new Date()
      };
      
      if (allVerified) {
        result.verifiedAt = new Date();
      }
      
      return result;
    } catch (error) {
      return {
        domain,
        status: DomainVerificationStatus.FAILED,
        records,
        lastCheckedAt: new Date()
      };
    }
  }

  /**
   * Verifica se um domínio já está verificado e atualiza se necessário
   */
  static async checkDomainStatus(verification: DomainVerification): Promise<DomainVerification> {
    // Se já está verificado e foi checado recentemente (< 24h), retorna sem verificar
    if (
      verification.status === DomainVerificationStatus.VERIFIED &&
      verification.lastCheckedAt &&
      Date.now() - verification.lastCheckedAt.getTime() < 24 * 60 * 60 * 1000
    ) {
      return verification;
    }

    // Caso contrário, verifica novamente
    return this.verifyDomain(verification.domain);
  }
} 