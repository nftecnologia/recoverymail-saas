"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  RefreshCw,
  Info,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function EmailSettingsPage() {
  const [domain, setDomain] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "failed" | null>(null);

  const handleVerifyDomain = async () => {
    if (!domain) {
      toast.error("Por favor, insira seu domínio");
      return;
    }

    setIsVerifying(true);
    toast.info("Verificando configuração DNS...");

    // Simula verificação
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationStatus("verified");
      toast.success("Domínio verificado com sucesso!");
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Configuração de Email</h1>
                <p className="mt-1 text-lg text-white/80">
                  Configure seu domínio para enviar emails personalizados
                </p>
              </div>
            </div>
          </div>
          <Sparkles className="absolute right-8 top-8 h-8 w-8 text-white/20" />
        </div>

        {/* Benefits Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
            <CardHeader>
              <Shield className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle className="text-lg">Maior Confiabilidade</CardTitle>
              <CardDescription>
                Emails enviados do seu próprio domínio têm maior taxa de entrega
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
            <CardHeader>
              <Zap className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Configuração Simples</CardTitle>
              <CardDescription>
                Apenas 1 registro DNS para configurar em menos de 5 minutos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg">
            <CardHeader>
              <Globe className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle className="text-lg">Marca Profissional</CardTitle>
              <CardDescription>
                Seus clientes veem emails vindos do seu domínio
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Configuration Tabs */}
        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="setup">Configurar Domínio</TabsTrigger>
            <TabsTrigger value="status">Status Atual</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-6">
            {/* Step 1: Enter Domain */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                    1
                  </div>
                  <CardTitle>Digite seu domínio</CardTitle>
                </div>
                <CardDescription>
                  Vamos criar um subdomínio para envio de emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Seu domínio principal</Label>
                  <div className="flex gap-2">
                    <Input
                      id="domain"
                      placeholder="exemplo.com.br"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleVerifyDomain}
                      disabled={!domain || isVerifying}
                    >
                      {isVerifying ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Verificando
                        </>
                      ) : (
                        "Verificar"
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Seus emails serão enviados de: <strong>noreply@email.{domain || "seudominio.com"}</strong>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: DNS Configuration */}
            {domain && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                      2
                    </div>
                    <CardTitle>Configure o DNS</CardTitle>
                  </div>
                  <CardDescription>
                    Adicione este registro no painel DNS do seu domínio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-600">
                        <div>Tipo</div>
                        <div>Nome</div>
                        <div>Valor</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 items-center">
                        <Badge variant="secondary">CNAME</Badge>
                        <div className="font-mono text-sm">email</div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-white px-2 py-1 rounded">inboxrecovery.com</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard("inboxrecovery.com")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Onde configurar:</strong> Acesse o painel de controle do seu domínio 
                      (Registro.br, GoDaddy, Cloudflare, etc) e adicione este registro CNAME.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Verification Status */}
            {verificationStatus && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                      3
                    </div>
                    <CardTitle>Status da Verificação</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {verificationStatus === "verified" ? (
                    <div className="flex items-center gap-3 text-green-600">
                      <CheckCircle2 className="h-6 w-6" />
                      <div>
                        <p className="font-medium">Domínio verificado com sucesso!</p>
                        <p className="text-sm text-gray-600">
                          Você já pode começar a enviar emails de noreply@email.{domain}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-red-600">
                      <XCircle className="h-6 w-6" />
                      <div>
                        <p className="font-medium">Verificação falhou</p>
                        <p className="text-sm text-gray-600">
                          Verifique se o registro CNAME foi adicionado corretamente
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Status Atual</CardTitle>
                <CardDescription>
                  Configuração de envio de emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium">Modo de Envio</p>
                    <p className="text-sm text-gray-600">Serviço Gerenciado (Recovery Mail)</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium">Domínio de Envio</p>
                    <p className="text-sm text-gray-600">noreply@inboxrecovery.com</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Padrão</Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium">Taxa de Entrega</p>
                    <p className="text-sm text-gray-600">Últimos 30 dias</p>
                  </div>
                  <span className="text-2xl font-bold text-green-600">98.5%</span>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Você está usando nosso domínio verificado. Para personalizar, 
                    configure seu próprio domínio na aba "Configurar Domínio".
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 