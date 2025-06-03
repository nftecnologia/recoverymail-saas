"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  BarChart3,
  Activity,
  FileText,
  Webhook,
  ChevronRight,
  Sparkles,
  Building,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Eventos", href: "/events", icon: Webhook },
  { name: "Emails", href: "/emails", icon: Mail },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Métricas", href: "/metrics", icon: BarChart3 },
  { name: "Organizações", href: "/organizations", icon: Building },
  { name: "Configurações", href: "/settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-white shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Inbox Recovery</h2>
                <p className="text-xs text-gray-500">Sistema de Recuperação</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1 hover:bg-gray-100 lg:hidden"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600",
                      !isActive && "group-hover:scale-110"
                    )}
                  />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-white/70" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Pro Badge */}
          <div className="mx-3 mb-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-purple-900">Pro Plan</span>
            </div>
            <p className="mt-1 text-xs text-purple-700">
              Todos os recursos desbloqueados
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-purple-200">
              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
            </div>
            <p className="mt-1 text-xs text-purple-700">750/1000 emails</p>
          </div>

          {/* User section */}
          <div className="border-t p-3">
            <div className="flex items-center gap-3 rounded-xl p-3 hover:bg-gray-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-300">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Admin</p>
                <p className="text-xs text-gray-500">admin@inboxrecovery.com</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-white/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900 lg:hidden">
              Inbox Recovery
            </h1>
            
            {/* Quick stats */}
            <div className="hidden items-center gap-6 lg:flex">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">Sistema operacional</span>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="text-sm">
                <span className="text-gray-600">Modo: </span>
                <span className="font-medium text-blue-600">Demonstração</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
} 