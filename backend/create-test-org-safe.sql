-- Primeiro, vamos verificar se já existe alguma organização
SELECT id, name, domain, "apiKey", "webhookSecret" 
FROM "Organization" 
LIMIT 5;

-- Se não existir nenhuma organização com id 'test-org', criar uma
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Organization" WHERE id = 'test-org') THEN
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
      'sk_test_' || substr(md5(random()::text), 1, 32), -- API key única
      '{"replyTo": "suporte@teste.com", "includeUnsubscribe": true}',
      NOW(),
      NOW()
    );
    RAISE NOTICE 'Organização test-org criada com sucesso!';
  ELSE
    RAISE NOTICE 'Organização test-org já existe!';
  END IF;
END $$;

-- Mostrar a organização criada/existente
SELECT id, name, domain, "webhookSecret", "apiKey" 
FROM "Organization" 
WHERE id = 'test-org'; 