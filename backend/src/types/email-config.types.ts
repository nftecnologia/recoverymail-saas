export enum EmailProvider {
  RESEND = 'RESEND',
  SENDGRID = 'SENDGRID',
  SMTP = 'SMTP',
  MANAGED = 'MANAGED' // Nosso serviço gerenciado
}

export enum DomainVerificationStatus {
  PENDING = 'PENDING',
  VERIFYING = 'VERIFYING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED'
}

export interface DomainVerification {
  domain: string;
  status: DomainVerificationStatus;
  records: {
    spf: {
      type: 'TXT';
      name: '@';
      value: string;
      verified: boolean;
    };
    dkim: {
      type: 'CNAME';
      name: string;
      value: string;
      verified: boolean;
    };
    dmarc?: {
      type: 'TXT';
      name: '_dmarc';
      value: string;
      verified: boolean;
    };
  };
  verifiedAt?: Date;
  lastCheckedAt?: Date;
}

export interface EmailSettings {
  provider: EmailProvider;
  
  // Para MANAGED (nosso serviço)
  managed?: {
    fromName: string;
    fromEmail?: string; // Opcional, podemos gerar
    replyTo?: string;
    customDomain?: DomainVerification;
  };
  
  // Para RESEND/SENDGRID (API própria do cliente)
  api?: {
    provider: 'RESEND' | 'SENDGRID';
    apiKey: string;
    fromEmail: string;
    fromName: string;
    domainId?: string; // ID do domínio verificado no provider
  };
  
  // Para SMTP customizado
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    fromEmail: string;
    fromName: string;
  };
  
  // Configurações gerais
  dailyLimit?: number;
  monthlyLimit?: number;
  currentUsage?: {
    daily: number;
    monthly: number;
    lastReset: Date;
  };
} 