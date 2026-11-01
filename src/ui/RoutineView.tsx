import React, { useState } from 'react';
import { UserSkinProfile } from '../agents/profiler.ts';
import { parseIngredients } from '../engine/parser.ts';
import { matchIngredients } from '../engine/matcher.ts';
import { 
  ShieldAlert, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Layers
} from 'lucide-react';

export interface RoutineItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  ingredientsText: string;
  addedAt: string;
}

interface RoutineViewProps {
  routine: RoutineItem[];
  onRemoveItem: (id: string) => void;
  onAddItem: (item: RoutineItem) => void;
  profile: UserSkinProfile;
}

export const RoutineView: React.FC<RoutineViewProps> = ({
  routine,
  onRemoveItem,
  onAddItem,
  profile,
}) => {
  // Aggregate all ingredients in routine to evaluate multi-product cross conflicts
  const combinedIngredientsText = routine.map((r) => r.ingredientsText).join(', ');
  const parsed = parseIngredients(combinedIngredientsText);
  const matched = matchIngredients(parsed.ingredients, profile);

  const [newProdName, setNewProdName] = useState('');
  const [newProdIngredients, setNewProdIngredients] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleCreateCustom = () => {
    if (!newProdName.trim() || !newProdIngredients.trim()) return;
    onAddItem({
      id: `custom_${Date.now()}`,
      name: newProdName.trim(),
      brand: 'Custom',
      category: 'Treatment',
      ingredientsText: newProdIngredients.trim(),
      addedAt: new Date().toISOString(),
    });
    setNewProdName('');
    setNewProdIngredients('');
    setShowAddForm(false);
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>
          My Skincare Routine
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '14px' }}>
          Real-time conflict detection across all formulas applied together.
        </p>
      </header>

      {/* Cross-Product Conflict Detection Warning */}
      {matched.conflicts.length > 0 ? (
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          borderRadius: '16px',
          padding: '18px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F43F5E', fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>
            <ShieldAlert size={20} />
            Routine Stacking Conflict Detected
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {matched.conflicts.map((c, i) => (
              <div key={i} style={{ fontSize: '13px', color: '#FDA4AF', lineHeight: '1.4' }}>
                <strong>{c.ingredientA}</strong> + <strong>{c.ingredientB}</strong>: {c.warning}
                <div style={{ color: '#FDE68A', marginTop: '4px', fontWeight: 600 }}>
                  Recommendation: {c.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : routine.length > 0 ? (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '14px',
          padding: '14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#10B981',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          <CheckCircle2 size={18} />
          <span>No ingredient stacking conflicts detected across active routine items.</span>
        </div>
      ) : null}

      {/* Routine Products List */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>
            Active Routine Items ({routine.length})
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              background: '#1F2B42',
              color: '#818CF8',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Plus size={14} /> Add Product
          </button>
        </div>

        {/* Add custom product form */}
        {showAddForm && (
          <div style={{
            background: '#161F30',
            borderRadius: '14px',
            padding: '16px',
            border: '1px solid #334155',
            marginBottom: '16px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>Add to Routine</h3>
            <input
              type="text"
              placeholder="Product Name e.g. Night Retinol Serum"
              value={newProdName}
              onChange={(e) => setNewProdName(e.target.value)}
              style={{
                width: '100%',
                background: '#0F172A',
                color: '#FFFFFF',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '13px',
                marginBottom: '10px',
              }}
            />
            <textarea
              rows={3}
              placeholder="Ingredients e.g. Aqua, Retinol, Glycerin..."
              value={newProdIngredients}
              onChange={(e) => setNewProdIngredients(e.target.value)}
              style={{
                width: '100%',
                background: '#0F172A',
                color: '#FFFFFF',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '13px',
                marginBottom: '10px',
              }}
            />
            <button
              onClick={handleCreateCustom}
              style={{
                background: '#4F46E5',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Save to Routine
            </button>
          </div>
        )}

        {routine.length === 0 ? (
          <div style={{
            background: '#161F30',
            borderRadius: '16px',
            padding: '32px 20px',
            textAlign: 'center',
            border: '1px dashed #334155',
            color: '#94A3B8',
          }}>
            <Layers size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <div style={{ fontWeight: 600, fontSize: '15px', color: '#CBD5E1', marginBottom: '4px' }}>
              Your routine is currently empty
            </div>
            <p style={{ fontSize: '13px' }}>
              Use "Check a Product" to inspect formulas and add safe fits here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {routine.map((item) => (
              <div
                key={item.id}
                style={{
                  background: '#161F30',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  border: '1px solid #2D3A54',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#818CF8', fontWeight: 600 }}>
                    {item.category}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                    {item.brand}
                  </div>
                </div>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  aria-label={`Remove ${item.name} from routine`}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
