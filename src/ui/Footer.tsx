import React from 'react';
import { AlertTriangle, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      maxWidth: '480px',
      margin: '40px auto 20px',
      padding: '20px 16px',
      borderTop: '1px solid #1F2B42',
      fontSize: '12px',
      color: '#64748B',
      lineHeight: '1.6',
      textAlign: 'center',
    }}>
      {/* Required Not-Medical-Advice Notice */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: '10px',
        padding: '10px 14px',
        color: '#F59E0B',
        fontSize: '12px',
        fontWeight: 600,
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        textAlign: 'left',
      }}>
        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
        <span>
          <strong>Not medical advice.</strong> If you have a skin condition, persistent erythema, or dermatosis, consult a qualified dermatologist.
        </span>
      </div>

      <p style={{ marginBottom: '8px' }}>
        <strong>Guidance Disclaimer:</strong> Ingredient listings indicate composition order but do not state exact concentrations. Verdicts provide probabilistic safety screening, not clinical guarantees.
      </p>

      <p style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <Lock size={12} color="#10B981" />
        <span><strong>Privacy First:</strong> Photos are passed ephemerally via secure S2S proxy and are never saved on the server.</span>
      </p>

      <p style={{ color: '#475569', fontSize: '11px' }}>
        Mirror Moment &copy; 2026. Built with YouCam Skin AI & Apparel Virtual Try-On APIs.
      </p>
    </footer>
  );
};
