"use client";

import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Badge } from "./badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { Filter, X, Search, Calendar, Tag } from "lucide-react";

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface AdvancedFilterProps {
  title: string;
  searchPlaceholder?: string;
  statusOptions?: FilterOption[];
  typeOptions?: FilterOption[];
  onFiltersChange: (filters: {
    search?: string;
    status?: string[];
    type?: string[];
    dateRange?: { from: string; to: string };
  }) => void;
}

export function AdvancedFilter({
  title,
  searchPlaceholder = "Buscar...",
  statusOptions = [],
  typeOptions = [],
  onFiltersChange,
}: AdvancedFilterProps) {
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleApplyFilters = () => {
    onFiltersChange({
      search: search || undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      type: selectedTypes.length > 0 ? selectedTypes : undefined,
      dateRange: dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined,
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedStatuses([]);
    setSelectedTypes([]);
    setDateFrom("");
    setDateTo("");
    onFiltersChange({});
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const hasActiveFilters = search || selectedStatuses.length > 0 || selectedTypes.length > 0 || dateFrom || dateTo;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {title}
          </div>
          {hasActiveFilters && (
            <Badge variant="secondary" className="px-2 py-1">
              {[search, ...selectedStatuses, ...selectedTypes, dateFrom && dateTo ? "data" : ""].filter(Boolean).length} filtros
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick filters */}
        <div className="flex flex-wrap gap-2">
          {/* Status filters */}
          {statusOptions.slice(0, 3).map((option) => (
            <Button
              key={option.value}
              variant={selectedStatuses.includes(option.value) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStatus(option.value)}
              className="text-xs"
            >
              {option.label}
              {option.count && (
                <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                  {option.count}
                </Badge>
              )}
            </Button>
          ))}

          {/* Type filters */}
          {typeOptions.slice(0, 2).map((option) => (
            <Button
              key={option.value}
              variant={selectedTypes.includes(option.value) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleType(option.value)}
              className="text-xs"
            >
              {option.label}
              {option.count && (
                <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                  {option.count}
                </Badge>
              )}
            </Button>
          ))}

          {/* Advanced filters dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <Filter className="h-3 w-3 mr-1" />
                Mais filtros
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Filtros Avançados</DialogTitle>
                <DialogDescription>
                  Configure filtros detalhados para sua busca
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* All status options */}
                {statusOptions.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {statusOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={selectedStatuses.includes(option.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleStatus(option.value)}
                          className="text-xs"
                        >
                          {option.label}
                          {option.count && (
                            <span className="ml-1 text-xs opacity-75">({option.count})</span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* All type options */}
                {typeOptions.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Tipo</Label>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {typeOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={selectedTypes.includes(option.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleType(option.value)}
                          className="text-xs"
                        >
                          {option.label}
                          {option.count && (
                            <span className="ml-1 text-xs opacity-75">({option.count})</span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date range */}
                <div>
                  <Label className="text-sm font-medium">Período</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">De</Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateTo" className="text-xs text-muted-foreground">Até</Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button onClick={handleApplyFilters} className="flex-1">
                    Aplicar Filtros
                  </Button>
                  <Button variant="outline" onClick={handleClearFilters}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Applied filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1">
            {search && (
              <Badge variant="secondary" className="px-2 py-1">
                Busca: "{search}"
                <button
                  onClick={() => setSearch("")}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedStatuses.map((status) => (
              <Badge key={status} variant="secondary" className="px-2 py-1">
                {statusOptions.find(o => o.value === status)?.label || status}
                <button
                  onClick={() => toggleStatus(status)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedTypes.map((type) => (
              <Badge key={type} variant="secondary" className="px-2 py-1">
                {typeOptions.find(o => o.value === type)?.label || type}
                <button
                  onClick={() => toggleType(type)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {dateFrom && dateTo && (
              <Badge variant="secondary" className="px-2 py-1">
                {dateFrom} até {dateTo}
                <button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button onClick={handleApplyFilters} className="flex-1">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}