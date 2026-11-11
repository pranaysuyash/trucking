import React, { useState, useEffect, useRef } from 'react';
import { CANONICAL_PRODUCTS, resolveProductUrl } from './registry';
import type { ProductId } from './types';

export interface CommandItem {
  id: string;
  category: 'Products' | 'Actions' | 'Personas' | 'Entities';
  title: string;
  subtitle: string;
  icon: string;
  badge?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPersona?: (roleKey: string) => void;
  onSelectProduct?: (productId: ProductId) => void;
}

export function buildCommandCatalog({
  onSelectPersona, onSelectProduct, openUrl = (url: string) => { window.open(url, '_blank'); },
}: {
  onSelectPersona?: (roleKey: string) => void;
  onSelectProduct?: (productId: ProductId) => void;
  openUrl?: (url: string) => void;
} = {}): CommandItem[] {
  // Construct item catalog
  return [
    // 1. Products
    ...CANONICAL_PRODUCTS.map((prod) => ({
      id: `prod-${prod.id}`,
      category: 'Products' as const,
      title: prod.name,
      subtitle: [prod.shortName, `Port ${prod.port}`, prod.pricingTier?.tierName].filter(Boolean).join(' · '),
      icon: prod.icon || '🚛',
      badge: `Port ${prod.port}`,
      onSelect: () => {
        if (onSelectProduct) {
          onSelectProduct(prod.id);
        } else {
          openUrl(resolveProductUrl(prod));
        }
      },
    })),

    // 2. Operational Actions
    {
      id: 'act-cargo-solve',
      category: 'Actions',
      title: 'Pack 3D Cargo Load & Check Axle Distribution',
      subtitle: 'Plan cargo geometry and review estimated axle distribution.',
      icon: '📦',
      badge: 'P01 Cargo Fit',
      onSelect: () => {
        const prod = CANONICAL_PRODUCTS.find((p) => p.id === 'product-01-cargo-fit');
        if (prod) openUrl(resolveProductUrl(prod));
      },
    },
    {
      id: 'act-carrier-audit',
      category: 'Actions',
      title: 'Audit Carrier Safety & Chameleon Fraud Risk',
      subtitle: 'Review carrier identity, coverage information, and risk signals.',
      icon: '🛡️',
      badge: 'P08 Carrier Trust',
      onSelect: () => {
        const prod = CANONICAL_PRODUCTS.find((p) => p.id === 'product-08-carrier-trust');
        if (prod) openUrl(resolveProductUrl(prod));
      },
    },
    {
      id: 'act-rate-con',
      category: 'Actions',
      title: 'Calculate Freight Rate & Prepare Estimate',
      subtitle: 'Carrier cost waterfall, EIA diesel index pegging, and operating ratio speedometer',
      icon: '💵',
      badge: 'P02 Pricing',
      onSelect: () => {
        const prod = CANONICAL_PRODUCTS.find((p) => p.id === 'product-02-freight-pricing');
        if (prod) openUrl(resolveProductUrl(prod));
      },
    },
    {
      id: 'act-hos-sim',
      category: 'Actions',
      title: 'Plan Driver Hours & Route',
      subtitle: 'Review duty intervals and planned corridor rest stops.',
      icon: '⏱️',
      badge: 'P03 HOS',
      onSelect: () => {
        const prod = CANONICAL_PRODUCTS.find((p) => p.id === 'product-03-hos-planner');
        if (prod) openUrl(resolveProductUrl(prod));
      },
    },
    {
      id: 'act-telematics-tele',
      category: 'Actions',
      title: 'Inspect Fleet & Reefer Telemetry',
      subtitle: 'Review available temperature, sensor and diagnostic information.',
      icon: '📡',
      badge: 'P05 Telematics',
      onSelect: () => {
        const prod = CANONICAL_PRODUCTS.find((p) => p.id === 'product-05-fleet-telematics');
        if (prod) openUrl(resolveProductUrl(prod));
      },
    },
    {
      id: 'act-warehouse-putaway',
      category: 'Actions',
      title: 'Allocate Inbound Warehouse Putaway & Staging',
      subtitle: 'Multi-constraint rack beam limits, HazMat zoning, and EPCIS scan audit',
      icon: '🏭',
      badge: 'P06 Warehouse',
      onSelect: () => {
        const prod = CANONICAL_PRODUCTS.find((p) => p.id === 'product-06-warehouse-space-flow');
        if (prod) openUrl(resolveProductUrl(prod));
      },
    },
    {
      id: 'act-command-center',
      category: 'Actions',
      title: 'Open Top-Level Unified Freight Command Center',
      subtitle: 'End-to-end 5-stage lifecycle stepper bringing all tools under one pane of glass',
      icon: '🎛️',
      badge: 'P00 Portal',
      onSelect: () => {
        const prod = CANONICAL_PRODUCTS.find((p) => p.id === 'command-center-portal');
        if (prod) openUrl(resolveProductUrl(prod));
      },
    },

    // 3. Persona Presets
    {
      id: 'per-owner-op',
      category: 'Personas',
      title: 'Switch Profile: Solo Owner-Operator',
      subtitle: 'Pre-licenses Cargo Fit + HOS Planner. Clean single-truck workflow.',
      icon: '🚛',
      badge: 'Persona Preset',
      onSelect: () => onSelectPersona?.('owner_operator'),
    },
    {
      id: 'per-broker-disp',
      category: 'Personas',
      title: 'Switch Profile: Freight Broker & Tactical Dispatcher',
      subtitle: 'Pre-licenses Pricing HUD + Carrier Safety. High-volume load margin focus.',
      icon: '💼',
      badge: 'Persona Preset',
      onSelect: () => onSelectPersona?.('dispatcher'),
    },
    {
      id: 'per-safety-tele',
      category: 'Personas',
      title: 'Switch Profile: Safety & Telematics Officer',
      subtitle: 'Pre-licenses Telematics HUD + HOS Compliance + Safety Auditor.',
      icon: '🛡️',
      badge: 'Persona Preset',
      onSelect: () => onSelectPersona?.('safety_officer'),
    },
    {
      id: 'per-enterprise',
      category: 'Personas',
      title: 'Switch Profile: Enterprise Fleet Admin',
      subtitle: 'Select the enterprise fleet profile.',
      icon: '🏢',
      badge: 'Persona Preset',
      onSelect: () => onSelectPersona?.('enterprise_admin'),
    },

    // 4. Entity review shortcuts
    {
      id: 'ent-carrier-apex',
      category: 'Actions',
      title: 'Review carrier records',
      subtitle: 'Open Carrier Trust and select a carrier to review available information.',
      icon: '✅',
      badge: 'P08 Carrier Trust',
      onSelect: () => {
        const prod = CANONICAL_PRODUCTS.find((p) => p.id === 'product-08-carrier-trust');
        if (prod) openUrl(resolveProductUrl(prod));
      },
    },
    {
      id: 'ent-carrier-veloce',
      category: 'Actions',
      title: 'Review carrier risk',
      subtitle: 'Open Carrier Trust and select a carrier to review risk signals.',
      icon: '⛔',
      badge: 'P08 Carrier Trust',
      onSelect: () => {
        const prod = CANONICAL_PRODUCTS.find((p) => p.id === 'product-08-carrier-trust');
        if (prod) openUrl(resolveProductUrl(prod));
      },
    },
    {
      id: 'ent-trailer-everest',
      category: 'Actions',
      title: 'Review vehicle equipment',
      subtitle: 'Open Asset Studio and select the equipment to review.',
      icon: '❄️',
      badge: 'P04 Asset Studio',
      onSelect: () => {
        const prod = CANONICAL_PRODUCTS.find((p) => p.id === 'product-04-asset-studio');
        if (prod) openUrl(resolveProductUrl(prod));
      },
    },
  ];

}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectPersona,
  onSelectProduct,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allItems = buildCommandCatalog({ onSelectPersona, onSelectProduct });

  // Filtering
  const filteredItems = allItems.filter((item) => {
    if (!query.trim()) return true;
    const cleanQ = query.toLowerCase().trim();
    return (
      item.title.toLowerCase().includes(cleanQ) ||
      item.subtitle.toLowerCase().includes(cleanQ) ||
      item.category.toLowerCase().includes(cleanQ) ||
      (item.badge && item.badge.toLowerCase().includes(cleanQ))
    );
  });

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Auto scroll active item into view
  useEffect(() => {
    const listEl = listRef.current;
    if (listEl) {
      const activeEl = listEl.querySelector('.cmd-item-active') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="cmd-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Universal Command Palette">
      <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-header">
          <span className="cmd-search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Search products, actions, or profiles... (e.g. 'Carrier', 'Warehouse', 'Owner')"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="cmd-esc-kbd" onClick={onClose}>ESC</kbd>
        </div>

        <div className="cmd-results" ref={listRef}>
          {filteredItems.length === 0 ? (
            <div className="cmd-empty">
              <span>No matching products, actions, or entities found for &quot;{query}&quot;</span>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isActive = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`cmd-item ${isActive ? 'cmd-item-active' : ''}`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => {
                    item.onSelect();
                    onClose();
                  }}
                >
                  <span className="cmd-item-icon">{item.icon}</span>
                  <div className="cmd-item-content">
                    <div className="cmd-item-row">
                      <span className="cmd-item-title">{item.title}</span>
                      {item.badge && <span className="cmd-item-badge">{item.badge}</span>}
                    </div>
                    <span className="cmd-item-subtitle">{item.subtitle}</span>
                  </div>
                  {isActive && <span className="cmd-item-enter">↵</span>}
                </div>
              );
            })
          )}
        </div>

        <div className="cmd-footer">
          <div className="cmd-footer-hints">
            <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
            <span><kbd>↵</kbd> to select</span>
            <span><kbd>ESC</kbd> to dismiss</span>
          </div>
          <span className="cmd-footer-tag">TRUCKING UNIFIED PLATFORM</span>
        </div>
      </div>
    </div>
  );
};
