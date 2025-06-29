import { Resend } from 'resend';
import handlebars from 'handlebars';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { AppError } from '../utils/errors';
import fs from 'fs/promises';
import path from 'path';

// Inicializar Resend
const resend = new Resend(env.RESEND_API_KEY);

// Validar se a API key é real (não é placeholder)
function validateResendKey() {
  if (env.RESEND_API_KEY === 're_placeholder_for_build') {
    throw new AppError('RESEND_API_KEY not configured properly', 500);
  }
}

// Interface para dados de email
export interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  organizationId: string;
  eventId: string;
  attemptNumber: number;
}

// Cache de templates compilados
const templateCache = new Map<string, handlebars.TemplateDelegate>();

// Registrar helpers do Handlebars
handlebars.registerHelper('formatCurrency', (value: string) => {
  return value; // Já vem formatado do webhook
});

handlebars.registerHelper('formatDate', (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
});

handlebars.registerHelper('eq', (a: any, b: any) => a === b);
handlebars.registerHelper('gt', (a: number, b: number) => a > b);

/**
 * Carregar e compilar template
 */
async function loadTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
  // Verificar cache
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!;
  }

  try {
    // Carregar do arquivo
    let templatePath: string;
    
    // No Render, o CWD é /opt/render/project/src/backend
    // e os templates estão em dist/templates/emails
    if (process.env['NODE_ENV'] === 'production') {
      templatePath = path.join(process.cwd(), 'dist', 'templates', 'emails', `${templateName}.hbs`);
    } else {
      // Em desenvolvimento
      templatePath = path.join(process.cwd(), 'src', 'templates', 'emails', `${templateName}.hbs`);
    }

    logger.info('Loading email template', {
      templateName,
      templatePath,
      cwd: process.cwd(),
      nodeEnv: process.env['NODE_ENV']
    });

    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const compiled = handlebars.compile(templateContent);
    templateCache.set(templateName, compiled);
    
    logger.info('Template loaded successfully', { templateName });
    
    return compiled;
  } catch (error) {
    logger.error('Failed to load email template', {
      templateName,
      cwd: process.cwd(),
      nodeEnv: process.env['NODE_ENV'],
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new AppError(`Template not found: ${templateName}`, 404);
  }
}

/**
 * Enviar email via Resend
 */
export async function sendEmail(emailData: EmailData): Promise<string> {
  // Validar se a API key do Resend está configurada
  validateResendKey();
  
  const {
    to,
    subject,
    template,
    data,
    organizationId,
    eventId,
    attemptNumber,
  } = emailData;

  try {
    // Carregar e compilar template
    const compiledTemplate = await loadTemplate(template);
    const html = compiledTemplate(data);

    // Criar versão texto (básica)
    const text = html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Enviar email via Resend
    const { data: resendData, error } = await resend.emails.send({
      from: `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
      text,
      tags: [
        { name: 'organization_id', value: organizationId },
        { name: 'event_id', value: eventId },
        { name: 'attempt_number', value: attemptNumber.toString() },
        { name: 'template', value: template },
      ],
      // Habilitar tracking de cliques e abertura
      headers: {
        'X-Track-Clicks': 'true',
        'X-Track-Opens': 'true',
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!resendData?.id) {
      throw new Error('No email ID returned from Resend');
    }

    // Salvar log de email
    await prisma.emailLog.create({
      data: {
        organizationId,
        eventId,
        emailId: resendData.id,
        to,
        subject,
        template,
        status: 'SENT',
        attemptNumber,
        sentAt: new Date(),
      },
    });

    logger.info('Email sent successfully', {
      emailId: resendData.id,
      to,
      subject,
      template,
      organizationId,
      eventId,
    });

    return resendData.id;
  } catch (error) {
    logger.error('Failed to send email', {
      to,
      subject,
      template,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Salvar log de falha
    await prisma.emailLog.create({
      data: {
        organizationId,
        eventId,
        to,
        subject,
        template,
        status: 'FAILED',
        attemptNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  }
}

/**
 * Obter status de um email
 */
export async function getEmailStatus(emailId: string): Promise<any> {
  try {
    const email = await resend.emails.get(emailId);
    return email;
  } catch (error) {
    logger.error('Failed to get email status', {
      emailId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Limpar cache de templates (útil para desenvolvimento)
 */
export function clearTemplateCache(): void {
  templateCache.clear();
  logger.info('Template cache cleared');
} 