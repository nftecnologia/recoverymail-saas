"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Mail, 
  Edit,
  Eye,
  Save,
  RefreshCw,
  Code,
  FileText,
  Calendar,
  Zap,
  Target,
  ShoppingCart,
  CreditCard,
  XCircle,
  CheckCircle,
  Users,
  ArrowRight,
  Copy,
  Download,
  ExternalLink
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  filename: string;
  eventType: string;
  templateType: string;
  content: string;
  size: number;
  lastModified: string;
}

const eventTypeIcons: Record<string, any> = {
  'ABANDONED_CART': ShoppingCart,
  'BANK_SLIP_EXPIRED': CreditCard,
  'BANK_SLIP_GENERATED': FileText,
  'PIX_EXPIRED': XCircle,
  'PIX_GENERATED': Zap,
  'SALE_APPROVED': CheckCircle,
  'SALE_REFUSED': XCircle,
  'SALE_REFUNDED': RefreshCw,
  'SALE_CHARGEBACK': XCircle,
  'SUBSCRIPTION_CANCELED': Users,
  'SUBSCRIPTION_EXPIRED': Calendar,
  'SUBSCRIPTION_RENEWED': CheckCircle,
};

const eventTypeLabels: Record<string, string> = {
  'ABANDONED_CART': 'Carrinho Abandonado',
  'BANK_SLIP_EXPIRED': 'Boleto Expirado',
  'BANK_SLIP_GENERATED': 'Boleto Gerado',
  'PIX_EXPIRED': 'PIX Expirado',
  'PIX_GENERATED': 'PIX Gerado',
  'SALE_APPROVED': 'Venda Aprovada',
  'SALE_REFUSED': 'Venda Recusada',
  'SALE_REFUNDED': 'Venda Reembolsada',
  'SALE_CHARGEBACK': 'Chargeback',
  'SUBSCRIPTION_CANCELED': 'Assinatura Cancelada',
  'SUBSCRIPTION_EXPIRED': 'Assinatura Expirada',
  'SUBSCRIPTION_RENEWED': 'Assinatura Renovada',
};

const templateTypeLabels: Record<string, string> = {
  'reminder': 'Lembrete',
  'urgency': 'Urgência',
  'discount': 'Desconto',
  'renewal': 'Renovação',
  'lastchance': 'Última Chance',
  'confirmation': 'Confirmação',
  'scarcity': 'Escassez',
  'winback': 'Reconquista',
  'notice': 'Aviso',
  'retry': 'Tentar Novamente',
  'support': 'Suporte',
  'qrcode': 'QR Code',
  'notification': 'Notificação',
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [groupedTemplates, setGroupedTemplates] = useState<Record<string, Template[]>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string>('');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<string>('all');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.getTemplates();
      setTemplates(response.templates);
      setGroupedTemplates(response.groupedTemplates);
    } catch (error) {
      toast.error('Erro ao carregar templates');
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = async (template: Template) => {
    setSelectedTemplate(template);
    setEditingTemplate(template.content);
    setIsPreviewMode(false);
  };

  const handlePreview = async () => {
    if (!selectedTemplate) return;
    
    try {
      const response = await api.previewTemplate(selectedTemplate.id);
      setPreviewContent(response.preview);
      setIsPreviewMode(true);
    } catch (error) {
      toast.error('Erro ao gerar preview');
      console.error('Error generating preview:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate || !editingTemplate) return;
    
    try {
      setSaving(true);
      await api.updateTemplate(selectedTemplate.id, editingTemplate);
      toast.success('Template salvo com sucesso!');
      
      // Atualizar template na lista
      setTemplates(prev => prev.map(t => 
        t.id === selectedTemplate.id 
          ? { ...t, content: editingTemplate, lastModified: new Date().toISOString() }
          : t
      ));
      
      // Atualizar template selecionado
      setSelectedTemplate(prev => prev ? { ...prev, content: editingTemplate } : null);
    } catch (error) {
      toast.error('Erro ao salvar template');
      console.error('Error saving template:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyContent = () => {
    if (isPreviewMode && previewContent) {
      navigator.clipboard.writeText(previewContent);
      toast.success('Preview copiado para área de transferência');
    } else if (editingTemplate) {
      navigator.clipboard.writeText(editingTemplate);
      toast.success('Template copiado para área de transferência');
    }
  };

  const getEventTypeColor = (eventType: string) => {
    const colors: Record<string, string> = {
      'ABANDONED_CART': 'orange',
      'BANK_SLIP_EXPIRED': 'red',
      'BANK_SLIP_GENERATED': 'blue',
      'PIX_EXPIRED': 'red',
      'PIX_GENERATED': 'green',
      'SALE_APPROVED': 'green',
      'SALE_REFUSED': 'red',
      'SALE_REFUNDED': 'yellow',
      'SALE_CHARGEBACK': 'red',
      'SUBSCRIPTION_CANCELED': 'orange',
      'SUBSCRIPTION_EXPIRED': 'red',
      'SUBSCRIPTION_RENEWED': 'green',
    };
    return colors[eventType] || 'gray';
  };

  const eventTypes = Object.keys(groupedTemplates);
  const filteredTemplates = selectedEventType === 'all' 
    ? templates 
    : templates.filter(t => t.eventType === selectedEventType);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Templates de Email</h1>
            <p className="text-muted-foreground">
              Gerencie e edite os templates de email para cada evento
            </p>
          </div>
          <Button onClick={loadTemplates} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Filter Tabs */}
        <Tabs value={selectedEventType} onValueChange={setSelectedEventType}>
          <ScrollArea className="w-full">
            <TabsList className="inline-flex h-auto p-1 space-x-1">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Todos ({templates.length})
              </TabsTrigger>
              {eventTypes.map((eventType) => {
                const Icon = eventTypeIcons[eventType] || FileText;
                const count = groupedTemplates[eventType]?.length || 0;
                return (
                  <TabsTrigger 
                    key={eventType} 
                    value={eventType}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {eventTypeLabels[eventType] || eventType} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </ScrollArea>
        </Tabs>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const Icon = eventTypeIcons[template.eventType] || FileText;
            return (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <Badge variant="outline" style={{ 
                        color: `var(--${getEventTypeColor(template.eventType)})`,
                        borderColor: `var(--${getEventTypeColor(template.eventType)})`
                      }}>
                        {eventTypeLabels[template.eventType] || template.eventType}
                      </Badge>
                    </div>
                    <Badge variant="secondary">
                      {templateTypeLabels[template.templateType] || template.templateType}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.filename}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Tamanho: {(template.size / 1024).toFixed(1)}KB</span>
                      <span>
                        {new Date(template.lastModified).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Icon className="h-5 w-5" />
                              {template.name}
                            </DialogTitle>
                            <DialogDescription>
                              Edite o template de email para {eventTypeLabels[template.eventType]}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[70vh]">
                            {/* Editor */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Editor</h3>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handleCopyContent}
                                  >
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copiar
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handlePreview}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Preview
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={saving}
                                  >
                                    {saving ? (
                                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                    ) : (
                                      <Save className="h-4 w-4 mr-1" />
                                    )}
                                    Salvar
                                  </Button>
                                </div>
                              </div>
                              <textarea
                                value={editingTemplate}
                                onChange={(e) => setEditingTemplate(e.target.value)}
                                className="w-full h-full p-4 border rounded-lg font-mono text-sm resize-none"
                                placeholder="Conteúdo do template..."
                              />
                            </div>

                            {/* Preview */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold">
                                  {isPreviewMode ? 'Preview Compilado' : 'Código Original'}
                                </h3>
                                <Badge variant={isPreviewMode ? "default" : "secondary"}>
                                  {isPreviewMode ? 'HTML' : 'Handlebars'}
                                </Badge>
                              </div>
                              <div className="h-full border rounded-lg">
                                {isPreviewMode ? (
                                  <iframe
                                    srcDoc={previewContent}
                                    className="w-full h-full rounded-lg"
                                    title="Email Preview"
                                  />
                                ) : (
                                  <ScrollArea className="h-full">
                                    <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                                      {editingTemplate}
                                    </pre>
                                  </ScrollArea>
                                )}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          handlePreview();
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {!loading && filteredTemplates.length === 0 && (
          <Card className="p-8 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
            <p className="text-muted-foreground">
              {selectedEventType === 'all' 
                ? 'Não há templates disponíveis.' 
                : `Não há templates para ${eventTypeLabels[selectedEventType]}.`}
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}