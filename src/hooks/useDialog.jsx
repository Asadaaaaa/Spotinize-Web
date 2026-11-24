import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertCircle, HelpCircle, CheckCircle2, X } from 'lucide-react';
import Button from '../components/Button.jsx';
import { useLanguage } from './useLanguage.jsx';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const { tx } = useLanguage();
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const closeWith = useCallback((result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
    setDialog(null);
  }, []);

  const showAlert = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        type: 'alert',
        title: options.title || tx('Notice', 'Pemberitahuan'),
        message,
        variant: options.variant || 'info', // 'info' | 'danger' | 'success'
        confirmText: options.confirmText || tx('Got it', 'Mengerti')
      });
    });
  }, [tx]);

  const showConfirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        type: 'confirm',
        title: options.title || tx('Confirmation', 'Konfirmasi'),
        message,
        variant: options.variant || 'warning', // 'warning' | 'danger' | 'info'
        confirmText: options.confirmText || tx('Yes, Continue', 'Ya, Lanjutkan'),
        cancelText: options.cancelText || tx('Cancel', 'Batal')
      });
    });
  }, [tx]);

  const isDanger = dialog?.variant === 'danger';
  const isSuccess = dialog?.variant === 'success';

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {dialog && (
        <div
          className="modal-backdrop"
          onClick={() => closeWith(dialog.type === 'confirm' ? false : undefined)}
          style={{ zIndex: 1200 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '400px',
              width: '100%',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor: isDanger
                    ? 'var(--color-danger-bg)'
                    : isSuccess
                      ? 'var(--color-success-bg)'
                      : 'var(--color-primary-subtle)',
                  color: isDanger
                    ? 'var(--color-danger)'
                    : 'var(--color-primary)'
                }}>
                  {isDanger ? (
                    <AlertCircle size={20} />
                  ) : isSuccess ? (
                    <CheckCircle2 size={20} />
                  ) : dialog.type === 'confirm' ? (
                    <HelpCircle size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-bright)' }}>
                  {dialog.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => closeWith(dialog.type === 'confirm' ? false : undefined)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{
              fontSize: '0.92rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.5,
              margin: 0
            }}>
              {dialog.message}
            </p>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {dialog.type === 'confirm' && (
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => closeWith(false)}
                >
                  {dialog.cancelText}
                </Button>
              )}
              <Button
                variant={isDanger ? 'danger' : 'primary'}
                fullWidth
                onClick={() => closeWith(dialog.type === 'confirm' ? true : undefined)}
              >
                {dialog.confirmText}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return ctx;
}

export default useDialog;
