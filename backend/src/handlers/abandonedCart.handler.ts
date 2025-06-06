import { Job } from 'bullmq';
import { logger } from '../utils/logger';
import { sendEmail } from '../services/email.service';
import { prisma } from '../config/database';
import { EmailJobData } from '../services/trigger.service';

export async function processAbandonedCart(job: Job<EmailJobData>): Promise<void> {
  const { eventId, organizationId, payload, attemptNumber } = job.data;
  const event = payload as any;

  logger.info('Processing abandoned cart email', {
    eventId,
    attemptNumber,
    checkoutId: event.checkout_id,
    customerEmail: event.customer.email,
  });

  // Buscar informações da organização
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, domain: true },
  });

  if (!organization) {
    throw new Error(`Organization not found: ${organizationId}`);
  }

  // Calcular valores para desconto (terceiro email)
  let discountedPrice = event.total_price;
  let savingsAmount = 'R$ 0,00';
  
  if (attemptNumber === 3) {
    // Extrair valor numérico do preço total
    const priceValue = parseFloat(
      event.total_price.replace('R$', '').replace('.', '').replace(',', '.')
    );
    const discountValue = priceValue * 0.9; // 10% de desconto
    const savings = priceValue - discountValue;
    
    // Formatar valores de volta para moeda brasileira
    discountedPrice = `R$ ${discountValue.toFixed(2).replace('.', ',')}`;
    savingsAmount = `R$ ${savings.toFixed(2).replace('.', ',')}`;
  }

  // Determinar qual email enviar baseado no attemptNumber
  let subject: string;
  let templateName: string;
  
  switch (attemptNumber) {
    case 1:
      subject = 'Você esqueceu alguns itens no seu carrinho 🛒';
      templateName = 'abandoned-cart-reminder';
      break;
    case 2:
      subject = 'Seus produtos favoritos estão esperando por você!';
      templateName = 'abandoned-cart-urgency';
      break;
    case 3:
      subject = '🎁 Desconto especial para finalizar sua compra!';
      templateName = 'abandoned-cart-discount';
      break;
    default:
      throw new Error(`Invalid attempt number: ${attemptNumber}`);
  }

  // Preparar dados do template
  const templateData = {
    customerName: event.customer.name.split(' ')[0], // Primeiro nome
    customerEmail: event.customer.email,
    checkoutUrl: event.checkout_url,
    totalPrice: event.total_price,
    products: event.products,
    organizationName: organization.name,
    domain: organization.domain || 'inboxrecovery.com',
    // Dados específicos para o template de desconto
    discountedPrice,
    savingsAmount,
  };

  try {
    // Enviar email
    const emailId = await sendEmail({
      to: event.customer.email,
      subject,
      template: templateName,
      data: templateData,
      organizationId,
      eventId,
      attemptNumber,
    });

    logger.info('Abandoned cart email sent successfully', {
      eventId,
      attemptNumber,
      emailId,
    });
  } catch (error) {
    logger.error('Failed to send abandoned cart email', {
      eventId,
      attemptNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
} 