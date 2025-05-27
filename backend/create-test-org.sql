-- Criar organização de teste
INSERT INTO "Organization" (
  id,
  name,
  domain,
  "webhookSecret",
  "apiKey",
  "emailSettings",
  "createdAt",
  "updatedAt"
) VALUES (
  'test-org',
  'Organização de Teste',
  'teste.recoverymail.com',
  'test-webhook-secret-123',
  'test-api-key-123',
  '{"replyTo": "suporte@teste.com", "includeUnsubscribe": true}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verificar se foi criada
SELECT id, name, domain FROM "Organization" WHERE id = 'test-org'; 