import { logger } from '../utils/logger';
import { sendEmail } from '../services/email.service';
import { prisma } from '../config/database';
import { getEmailTemplate } from '../utils/email.templates';
import { EmailJobData } from '../services/trigger.service';

export async function processBankSlipGenerated(data: EmailJobData): Promise<void> {
  const { eventId, organizationId, payload, attemptNumber } = data;
  const event = payload as any;

  logger.info('Processing bank slip generated email', {
    eventId,
    attemptNumber,
    transactionId: event.transaction_id || event.order_id,
    customerEmail: event.customer?.email,
  });

  // Buscar informações da organização
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, domain: true, emailSettings: true },
  });

  if (!organization) {
    throw new Error(`Organization not found: ${organizationId}`);
  }

  // Extrair dados do payload
  const customerEmail = event.customer?.email;
  const customerName = event.customer?.name || 'Cliente';
  
  if (!customerEmail) {
    throw new Error('Customer email not found in payload');
  }

  // Buscar template para esta tentativa
  const template = getEmailTemplate('BANK_SLIP_GENERATED', attemptNumber);
  if (!template) {
    throw new Error(`No template found for BANK_SLIP_GENERATED attempt ${attemptNumber}`);
  }

  // Processar data de vencimento
  const dueDate = event.due_date || event.expiration_date;
  let formattedDueDate = 'não informado';
  let daysUntilDue = 0;
  
  if (dueDate) {
    try {
      const dueDateObj = new Date(dueDate);
      formattedDueDate = dueDateObj.toLocaleDateString('pt-BR');
      daysUntilDue = Math.ceil((dueDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    } catch (e) {
      formattedDueDate = dueDate;
    }
  }

  // Preparar dados do template
  const templateData = {
    customerName: customerName.split(' ')[0], // Primeiro nome
    customerEmail,
    
    // Dados da transação
    transactionId: event.transaction_id || event.order_id || 'N/A',
    orderNumber: event.order_number || event.transaction_id || 'N/A',
    totalPrice: event.total_price || event.amount || 'N/A',
    
    // Dados do boleto
    bankSlipUrl: event.bank_slip_url || event.boleto_url || '#',
    digitableLine: event.digitable_line || event.linha_digitavel || '',
    barcode: event.barcode || event.codigo_barras || '',
    dueDate: formattedDueDate,
    daysUntilDue,
    
    // Estado do vencimento
    isNearExpiry: daysUntilDue <= 2 && daysUntilDue > 0,
    isExpiringSoon: daysUntilDue <= 1 && daysUntilDue > 0,
    hasExpired: daysUntilDue <= 0,
    
    // Produtos
    products: event.products || [],
    productName: event.products?.[0]?.name || event.product_name || 'seu produto',
    
    // URLs importantes
    checkoutUrl: event.checkout_url || '#',
    supportUrl: event.support_url || 'https://suporte.empresa.com',
    paymentUrl: event.payment_url || event.checkout_url || '#',
    
    // Organização
    organizationName: organization.name,
    organizationEmail: (organization.emailSettings as any)?.fromEmail || 'noreply@empresa.com',
    
    // Controle de tentativas
    isFirstAttempt: attemptNumber === 1, // Confirmação
    isReminderEmail: attemptNumber === 2, // Lembrete
    isUrgentEmail: attemptNumber >= 3,   // Urgência
    attemptNumber,
    
    // Instruções específicas por tentativa
    instructionType: attemptNumber === 1 ? 'confirmation' : 
                    attemptNumber === 2 ? 'reminder' : 'urgent',
    
    // Dados de pagamento
    paymentMethod: 'Boleto Bancário',
    paymentDetails: event.payment_details || {},
    
    // Dados adicionais
    utm: event.utm || {},
    
    // Urgência baseada no vencimento
    urgencyLevel: daysUntilDue <= 1 ? 'high' : daysUntilDue <= 3 ? 'medium' : 'low'
  };

  try {
    // Enviar email
    const emailId = await sendEmail({
      to: customerEmail,
      subject: template.subject,
      template: template.templateName,
      data: templateData,
      organizationId,
      eventId,
      attemptNumber,
    });

    logger.info('Bank slip generated email sent successfully', {
      eventId,
      attemptNumber,
      emailId,
      dueDate: formattedDueDate,
      daysUntilDue
    });
  } catch (error) {
    logger.error('Failed to send bank slip generated email', {
      eventId,
      attemptNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
