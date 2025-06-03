"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Building,
  Users,
  Settings,
  Key,
  Shield,
  Mail,
  BarChart3,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  UserPlus,
  Crown,
  AlertTriangle,
  CheckCircle,
  ExternalLink
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Organization {
  id: string;
  name: string;
  apiKey: string;
  webhookSecret: string;
  webhookUrl: string;
  plan: string;
  role: string;
  permissions: string[];
  joinedAt: string;
  stats: {
    totalEvents: number;
    totalEmails: number;
  };
}

const roleLabels: Record<string, string> = {
  'OWNER': 'Proprietário',
  'ADMIN': 'Administrador',
  'MEMBER': 'Membro',
  'VIEWER': 'Visualizador'
};

const roleBadgeColors: Record<string, string> = {
  'OWNER': 'bg-purple-100 text-purple-800',
  'ADMIN': 'bg-blue-100 text-blue-800',
  'MEMBER': 'bg-green-100 text-green-800',
  'VIEWER': 'bg-gray-100 text-gray-800'
};

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgDetails, setOrgDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [orgName, setOrgName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const response = await api.getOrganizations();
      setOrganizations(response.organizations);
    } catch (error) {
      toast.error('Erro ao carregar organizações');
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrgDetails = async (orgId: string) => {
    try {
      const response = await api.getOrganization(orgId);
      setOrgDetails(response);
      setOrgName(response.organization.name);
      setWebhookUrl(response.organization.webhookUrl || '');
    } catch (error) {
      toast.error('Erro ao carregar detalhes da organização');
      console.error('Error loading org details:', error);
    }
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para área de transferência`);
  };

  const handleRegenerateKey = async (keyType: 'apiKey' | 'webhookSecret') => {
    if (!selectedOrg) return;
    
    try {
      const response = await api.regenerateKeys(selectedOrg.id, keyType);
      toast.success(response.message);
      
      // Atualizar a organização selecionada
      if (keyType === 'apiKey' && response.apiKey) {
        setSelectedOrg(prev => prev ? { ...prev, apiKey: response.apiKey! } : null);
      } else if (keyType === 'webhookSecret' && response.webhookSecret) {
        setSelectedOrg(prev => prev ? { ...prev, webhookSecret: response.webhookSecret! } : null);
      }
      
      // Recarregar lista
      loadOrganizations();
    } catch (error) {
      toast.error('Erro ao regenerar chave');
      console.error('Error regenerating key:', error);
    }
  };

  const handleUpdateOrg = async () => {
    if (!selectedOrg) return;
    
    try {
      await api.updateOrganization(selectedOrg.id, {
        name: orgName,
        webhookUrl: webhookUrl
      });
      toast.success('Organização atualizada com sucesso');
      loadOrganizations();
      loadOrgDetails(selectedOrg.id);
    } catch (error) {
      toast.error('Erro ao atualizar organização');
      console.error('Error updating organization:', error);
    }
  };

  const handleInviteUser = async () => {
    if (!selectedOrg || !inviteEmail) return;
    
    try {
      await api.inviteUser(selectedOrg.id, inviteEmail, inviteRole);
      toast.success('Usuário convidado com sucesso');
      setInviteEmail('');
      loadOrgDetails(selectedOrg.id);
    } catch (error) {
      toast.error('Erro ao convidar usuário');
      console.error('Error inviting user:', error);
    }
  };

  const canManageOrg = (org: Organization) => {
    return ['OWNER', 'ADMIN'].includes(org.role);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Organizações</h1>
            <p className="text-muted-foreground">
              Gerencie suas organizações e configurações
            </p>
          </div>
          <Button onClick={loadOrganizations} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <Card key={org.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <Badge className={roleBadgeColors[org.role]}>
                      {org.role === 'OWNER' && <Crown className="h-3 w-3 mr-1" />}
                      {roleLabels[org.role]}
                    </Badge>
                  </div>
                  <Badge variant="outline">{org.plan}</Badge>
                </div>
                <CardTitle className="text-lg">{org.name}</CardTitle>
                <CardDescription>
                  Membro desde {new Date(org.joinedAt).toLocaleDateString('pt-BR')}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span>{org.stats.totalEvents} eventos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{org.stats.totalEmails} emails</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedOrg(org);
                            loadOrgDetails(org.id);
                          }}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Gerenciar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            {selectedOrg?.name}
                          </DialogTitle>
                          <DialogDescription>
                            Gerencie as configurações da organização
                          </DialogDescription>
                        </DialogHeader>

                        {orgDetails && (
                          <div className="space-y-6">
                            {/* Organization Settings */}
                            {canManageOrg(selectedOrg!) && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">Configurações Gerais</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div>
                                    <Label htmlFor="orgName">Nome da Organização</Label>
                                    <Input
                                      id="orgName"
                                      value={orgName}
                                      onChange={(e) => setOrgName(e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="webhookUrl">URL do Webhook</Label>
                                    <Input
                                      id="webhookUrl"
                                      value={webhookUrl}
                                      onChange={(e) => setWebhookUrl(e.target.value)}
                                      placeholder="https://sua-api.com/webhook"
                                    />
                                  </div>
                                  <Button onClick={handleUpdateOrg}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Salvar Alterações
                                  </Button>
                                </CardContent>
                              </Card>
                            )}

                            {/* API Keys */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Key className="h-4 w-4" />
                                  Chaves de API
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {/* API Key */}
                                <div>
                                  <Label>API Key</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type={showApiKey ? "text" : "password"}
                                      value={selectedOrg?.apiKey || ''}
                                      readOnly
                                      className="font-mono text-sm"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setShowApiKey(!showApiKey)}
                                    >
                                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCopyToClipboard(selectedOrg?.apiKey || '', 'API Key')}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  {canManageOrg(selectedOrg!) && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="mt-2"
                                      onClick={() => handleRegenerateKey('apiKey')}
                                    >
                                      <AlertTriangle className="h-4 w-4 mr-1" />
                                      Regenerar API Key
                                    </Button>
                                  )}
                                </div>

                                {/* Webhook Secret */}
                                <div>
                                  <Label>Webhook Secret</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type={showWebhookSecret ? "text" : "password"}
                                      value={selectedOrg?.webhookSecret || ''}
                                      readOnly
                                      className="font-mono text-sm"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                                    >
                                      {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCopyToClipboard(selectedOrg?.webhookSecret || '', 'Webhook Secret')}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  {canManageOrg(selectedOrg!) && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="mt-2"
                                      onClick={() => handleRegenerateKey('webhookSecret')}
                                    >
                                      <AlertTriangle className="h-4 w-4 mr-1" />
                                      Regenerar Webhook Secret
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>

                            {/* Team Members */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Membros da Equipe ({orgDetails.organization.users.length})
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {/* Invite User */}
                                {canManageOrg(selectedOrg!) && (
                                  <div className="border rounded-lg p-4">
                                    <Label>Convidar Usuário</Label>
                                    <div className="flex gap-2 mt-2">
                                      <Input
                                        placeholder="email@exemplo.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                      />
                                      <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        className="px-3 py-2 border rounded-md"
                                      >
                                        <option value="MEMBER">Membro</option>
                                        <option value="ADMIN">Administrador</option>
                                      </select>
                                      <Button onClick={handleInviteUser}>
                                        <UserPlus className="h-4 w-4 mr-1" />
                                        Convidar
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {/* Members List */}
                                <div className="space-y-2">
                                  {orgDetails.organization.users.map((member: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                          <span className="text-sm font-medium text-blue-600">
                                            {member.user.name.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <div>
                                          <div className="font-medium">{member.user.name}</div>
                                          <div className="text-sm text-muted-foreground">{member.user.email}</div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge className={roleBadgeColors[member.role]}>
                                          {member.role === 'OWNER' && <Crown className="h-3 w-3 mr-1" />}
                                          {roleLabels[member.role]}
                                        </Badge>
                                        {member.user.isActive ? (
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>

                            {/* Organization Stats */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">Estatísticas</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                  <div>
                                    <div className="text-2xl font-bold">{orgDetails.organization.stats.totalEvents}</div>
                                    <div className="text-sm text-muted-foreground">Total de Eventos</div>
                                  </div>
                                  <div>
                                    <div className="text-2xl font-bold">{orgDetails.organization.stats.totalEmails}</div>
                                    <div className="text-sm text-muted-foreground">Emails Enviados</div>
                                  </div>
                                  <div>
                                    <div className="text-2xl font-bold">{orgDetails.organization.stats.totalUsers}</div>
                                    <div className="text-sm text-muted-foreground">Membros</div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`/dashboard?org=${org.id}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {!loading && organizations.length === 0 && (
          <Card className="p-8 text-center">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma organização encontrada</h3>
            <p className="text-muted-foreground">
              Você ainda não faz parte de nenhuma organização.
            </p>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando organizações...</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}