-- Verificar se já existe
SELECT id, name, domain, "apiKey" FROM "Organization" WHERE id = 'test-org';

-- Criar organização de teste (se não existir)
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
  'test-api-key-' || gen_random_uuid(), -- API key única
  '{"replyTo": "suporte@teste.com", "includeUnsubscribe": true}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  "updatedAt" = NOW();

-- Verificar o resultado
SELECT id, name, domain, "apiKey", "webhookSecret" FROM "Organization" WHERE id = 'test-org'; 