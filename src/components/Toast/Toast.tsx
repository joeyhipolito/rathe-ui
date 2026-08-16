import * as React from "react";
import { createPortal } from "react-dom";
import "./Toast.css";

export type ToastVariant = "info" | "success" | "warning" | "danger";

export type ToastPlacement =
  | "top-right"
  | "top-center"
  | "bottom-right"
  | "bottom-center";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Milliseconds. 0 or Infinity pins the toast until it is dismissed. Ignored for `danger`. */
  duration?: number;
  action?: { label: string; onClick: () => void };
  closeLabel?: string;
}

export interface ToastRecord extends ToastOptions {
  id: string;
}

export interface ToastHandle {
  (options: ToastOptions): string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = React.createContext<ToastHandle | null>(null);

export function useToast(): ToastHandle {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast() must be called inside a <ToastProvider>.");
  }
  return context;
}

export interface ToastProviderProps {
  children?: React.ReactNode;
  /** Default auto-dismiss in ms. Long enough to read two lines without rushing a scorekeeper. */
  duration?: number;
  /** Cap on visible toasts. Overflow evicts the oldest non-danger toast. */
  max?: number;
  placement?: ToastPlacement;
  /** Escape hatch for tests and for apps that already own a body-level portal root. */
  container?: HTMLElement | null;
}

const VARIANT_LABEL: Record<ToastVariant, string> = {
  info: "Information",
  success: "Success",
  warning: "Warning",
  danger: "Error",
};

export function ToastProvider({
  children,
  duration = 6000,
  max = 4,
  placement = "top-right",
  container,
}: ToastProviderProps): React.JSX.Element {
  const [toasts, setToasts] = React.useState<ToastRecord[]>([]);
  const [portalNode, setPortalNode] = React.useState<HTMLElement | null>(container ?? null);
  const nextId = React.useRef(0);

  React.useEffect(() => {
    setPortalNode(container ?? document.body);
  }, [container]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const dismissAll = React.useCallback(() => setToasts([]), []);

  const toast = React.useMemo<ToastHandle>(() => {
    const push = (options: ToastOptions): string => {
      nextId.current += 1;
      const id = `rathe-toast-${nextId.current}`;
      setToasts((current) => {
        const next = [...current, { ...options, id }];
        if (next.length <= max) return next;
        // Never evict a danger toast to make room: it is the one message that
        // has no timer and is the one a scorekeeper most needs to have read.
        const evictAt = next.findIndex((entry) => entry.variant !== "danger");
        return evictAt === -1 ? next : next.filter((_, index) => index !== evictAt);
      });
      return id;
    };

    return Object.assign(push, { dismiss, dismissAll });
  }, [max, dismiss, dismissAll]);

  const polite = toasts.filter((entry) => entry.variant !== "danger");
  const assertive = toasts.filter((entry) => entry.variant === "danger");

  const regions = (
    <div className={`rathe rathe-toast-region rathe-toast-region--${placement}`}>
      {/*
        Two containers, both mounted from the start and never swapped. A live
        region's politeness is read when the region is announced, so a single
        container that flipped between polite and assertive would announce the
        old politeness; and content injected at the same moment its live region
        is created is not announced at all by most screen readers.
      */}
      <div
        className="rathe-toast-region__live"
        role="alert"
        aria-live="assertive"
        aria-atomic="false"
        aria-label="Errors"
      >
        {assertive.map((entry) => (
          <ToastItem key={entry.id} toast={entry} onDismiss={dismiss} defaultDuration={duration} />
        ))}
      </div>
      <div
        className="rathe-toast-region__live"
        role="status"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Notifications"
      >
        {polite.map((entry) => (
          <ToastItem key={entry.id} toast={entry} onDismiss={dismiss} defaultDuration={duration} />
        ))}
      </div>
    </div>
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {portalNode ? createPortal(regions, portalNode) : null}
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
  defaultDuration: number;
}

function ToastItem({ toast, onDismiss, defaultDuration }: ToastItemProps): React.JSX.Element {
  const variant: ToastVariant = toast.variant ?? "info";
  // A danger toast reports something that went wrong mid-event. It stays until
  // someone acknowledges it.
  const duration = variant === "danger" ? 0 : (toast.duration ?? defaultDuration);

  const remaining = React.useRef(duration);
  const startedAt = React.useRef(0);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const onDismissRef = React.useRef(onDismiss);
  React.useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const clear = React.useCallback(() => {
    if (timer.current === null) return;
    clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const resume = React.useCallback(() => {
    if (!Number.isFinite(duration) || duration <= 0) return;
    if (timer.current !== null || remaining.current <= 0) return;
    startedAt.current = Date.now();
    timer.current = setTimeout(() => {
      timer.current = null;
      onDismissRef.current(toast.id);
    }, remaining.current);
  }, [duration, toast.id]);

  // WCAG 2.2 "Enough Time": a pointer resting on the toast or focus landing
  // inside it means someone is reading or about to act, so the countdown
  // stops and picks up where it left off rather than restarting.
  const pause = React.useCallback(() => {
    if (timer.current === null) return;
    clear();
    remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
  }, [clear]);

  React.useEffect(() => {
    resume();
    return clear;
  }, [resume, clear]);

  const classes = ["rathe-toast", `rathe-toast--${variant}`].join(" ");

  return (
    <div
      className={classes}
      data-rathe-toast-id={toast.id}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <span className="rathe-sr-only">{VARIANT_LABEL[variant]}:</span>
      <div className="rathe-toast__text">
        <p className="rathe-toast__title">{toast.title}</p>
        {toast.description ? (
          <p className="rathe-toast__description">{toast.description}</p>
        ) : null}
      </div>
      {toast.action ? (
        <button
          type="button"
          className="rathe-toast__action"
          onClick={() => {
            toast.action?.onClick();
            onDismissRef.current(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      ) : null}
      <button
        type="button"
        className="rathe-toast__close"
        aria-label={toast.closeLabel ?? `Dismiss: ${toast.title}`}
        onClick={() => onDismissRef.current(toast.id)}
      >
        <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="14" height="14">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
