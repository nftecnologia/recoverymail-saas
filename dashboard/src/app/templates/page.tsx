"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Eye,
  Save,
  RotateCcw,
  Palette,
  Type,
  Image,
  Link
} from "lucide-react";
import { useState } from "react";

const eventTypes = [
  { value: "ABANDONED_CART", label: "Carrinho Abandonado", attempts: 3 },
  { value: "PIX_EXPIRED", label: "PIX Expirado", attempts: 2 },
  { value: "BANK_SLIP_EXPIRED", label: "Boleto Expirado", attempts: 3 },
  { value: "SALE_REFUSED", label: "Venda Recusada", attempts: 2 },
  { value: "SALE_APPROVED", label: "Venda Aprovada", attempts: 1 },
];

export default function TemplatesPage() {
  const [selectedEvent, setSelectedEvent] = useState("ABANDONED_CART");
  const [selectedAttempt, setSelectedAttempt] = useState(1);
  
  // Configurações de personalização
  const [customization, setCustomization] = useState({
    logoUrl: "https://example.com/logo.png",
    primaryColor: "#3B82F6",
    secondaryColor: "#8B5CF6",
    companyName: "Recovery Mail",
    supportEmail: "suporte@recoverymail.com",
    whatsappNumber: "11999999999",
    facebookUrl: "https://facebook.com/recoverymail",
    instagramUrl: "https://instagram.com/recoverymail",
    footerText: "© 2025 Recovery Mail. Todos os direitos reservados.",
  });

  const handleSave = () => {
    // Aqui salvaria as configurações via API
    console.log("Salvando configurações:", customization);
  };

  const variables = [
    { name: "{{customer.name}}", description: "Nome do cliente" },
    { name: "{{product.name}}", description: "Nome do produto" },
    { name: "{{total_price}}", description: "Valor total" },
    { name: "{{checkout_url}}", description: "Link de recuperação" },
    { name: "{{company.name}}", description: "Nome da sua empresa" },
    { name: "{{support.email}}", description: "Email de suporte" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Templates de Email
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Personalize a aparência dos seus emails
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrão
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Configurações */}
          <div className="lg:col-span-1 space-y-4">
            {/* Seletor de Template */}
            <Card>
              <CardHeader>
                <CardTitle>Selecionar Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tipo de Evento</label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => {
                      setSelectedEvent(e.target.value);
                      setSelectedAttempt(1);
                    }}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                  >
                    {eventTypes.map((event) => (
                      <option key={event.value} value={event.value}>
                        {event.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Tentativa</label>
                  <div className="mt-1 flex gap-2">
                    {Array.from({ 
                      length: eventTypes.find(e => e.value === selectedEvent)?.attempts || 1 
                    }).map((_, i) => (
                      <Button
                        key={i + 1}
                        variant={selectedAttempt === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedAttempt(i + 1)}
                      >
                        {i + 1}ª
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personalização */}
            <Card>
              <CardHeader>
                <CardTitle>Personalização</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="brand">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="brand">Marca</TabsTrigger>
                    <TabsTrigger value="social">Social</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="brand" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium flex items-center">
                        <Image className="h-4 w-4 mr-2" />
                        URL do Logo
                      </label>
                      <input
                        type="url"
                        value={customization.logoUrl}
                        onChange={(e) => setCustomization({...customization, logoUrl: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="https://..."
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium flex items-center">
                        <Palette className="h-4 w-4 mr-2" />
                        Cor Primária
                      </label>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="color"
                          value={customization.primaryColor}
                          onChange={(e) => setCustomization({...customization, primaryColor: e.target.value})}
                          className="h-10 w-20"
                        />
                        <input
                          type="text"
                          value={customization.primaryColor}
                          onChange={(e) => setCustomization({...customization, primaryColor: e.target.value})}
                          className="flex-1 px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium flex items-center">
                        <Type className="h-4 w-4 mr-2" />
                        Nome da Empresa
                      </label>
                      <input
                        type="text"
                        value={customization.companyName}
                        onChange={(e) => setCustomization({...customization, companyName: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Email de Suporte</label>
                      <input
                        type="email"
                        value={customization.supportEmail}
                        onChange={(e) => setCustomization({...customization, supportEmail: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="social" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">WhatsApp</label>
                      <input
                        type="tel"
                        value={customization.whatsappNumber}
                        onChange={(e) => setCustomization({...customization, whatsappNumber: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="11999999999"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium flex items-center">
                        <Link className="h-4 w-4 mr-2" />
                        Facebook
                      </label>
                      <input
                        type="url"
                        value={customization.facebookUrl}
                        onChange={(e) => setCustomization({...customization, facebookUrl: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium flex items-center">
                        <Link className="h-4 w-4 mr-2" />
                        Instagram
                      </label>
                      <input
                        type="url"
                        value={customization.instagramUrl}
                        onChange={(e) => setCustomization({...customization, instagramUrl: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Texto do Rodapé</label>
                      <textarea
                        value={customization.footerText}
                        onChange={(e) => setCustomization({...customization, footerText: e.target.value})}
                        className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                        rows={2}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Variáveis Disponíveis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Variáveis Disponíveis</CardTitle>
                <CardDescription>
                  Use estas variáveis nos templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {variables.map((variable) => (
                    <div key={variable.name} className="flex justify-between text-sm">
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        {variable.name}
                      </code>
                      <span className="text-gray-500">{variable.description}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </span>
                  <Badge variant="outline">
                    {selectedEvent.replace(/_/g, ' ')} - Tentativa {selectedAttempt}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">De: {customization.companyName}</p>
                        <p className="text-sm text-gray-500">Para: cliente@exemplo.com</p>
                      </div>
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="mt-2 font-medium">
                      Assunto: 🛒 Você esqueceu alguns itens no seu carrinho
                    </p>
                  </div>
                  
                  <div className="bg-white p-8">
                    {/* Email Preview */}
                    <div className="max-w-2xl mx-auto">
                      <div className="text-center mb-8">
                        <div 
                          className="inline-block h-16 w-32 rounded"
                          style={{ backgroundColor: customization.primaryColor }}
                        />
                        <p className="mt-2 text-sm text-gray-500">{customization.companyName}</p>
                      </div>
                      
                      <h1 className="text-2xl font-bold mb-4">
                        Olá, João!
                      </h1>
                      
                      <p className="text-gray-700 mb-6">
                        Notamos que você deixou alguns itens incríveis no seu carrinho. 
                        Que tal finalizar sua compra agora?
                      </p>
                      
                      <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h3 className="font-medium mb-3">Seus itens:</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Curso de Marketing Digital</span>
                            <span className="font-medium">R$ 297,00</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center mb-8">
                        <a
                          href="#"
                          className="inline-block px-8 py-3 rounded-lg text-white font-medium"
                          style={{ backgroundColor: customization.primaryColor }}
                        >
                          Finalizar Compra
                        </a>
                      </div>
                      
                      <div className="border-t pt-6 text-center text-sm text-gray-500">
                        <p className="mb-2">Precisa de ajuda? Entre em contato:</p>
                        <p>{customization.supportEmail}</p>
                        <p className="mt-4">{customization.footerText}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 