import * as React from "react";
import "./Dialog.css";

export type DialogSize = "sm" | "md" | "lg";

export interface DialogProps
  extends Omit<
    React.ComponentPropsWithoutRef<"dialog">,
    "open" | "onClose" | "title" | "children"
  > {
  /** Controlled visibility. The element stays mounted when closed. */
  open: boolean;
  /**
   * Called for every close path — the close button, a backdrop click, and Esc.
   * The caller owns `open`, so nothing closes without going through here.
   */
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  /** Turn off for destructive confirmations, where a stray click must not discard the decision. */
  closeOnBackdrop?: boolean;
  /** Nominate the element that receives focus on open, e.g. "Cancel" on a delete confirmation. */
  initialFocusRef?: React.RefObject<HTMLElement>;
  size?: DialogSize;
  closeLabel?: string;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "[contenteditable]:not([contenteditable='false'])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function firstFocusable(root: HTMLElement | null): HTMLElement | null {
  if (!root) return null;
  const candidates = root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  for (const candidate of candidates) {
    if (candidate.getAttribute("aria-hidden") === "true") continue;
    return candidate;
  }
  return null;
}

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as React.MutableRefObject<T | null>).current = value;
}

export const Dialog = React.forwardRef<HTMLDialogElement, DialogProps>(
  function Dialog(
    {
      open,
      onClose,
      title,
      description,
      footer,
      children,
      closeOnBackdrop = true,
      initialFocusRef,
      size = "md",
      closeLabel = "Close dialog",
      className,
      ...rest
    },
    forwardedRef,
  ) {
    const dialogRef = React.useRef<HTMLDialogElement | null>(null);
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);
    const restoreFocusRef = React.useRef<HTMLElement | null>(null);

    // Read through a ref so identity changes in the caller's handler never
    // re-run the open/close effect, which would re-fire showModal().
    const onCloseRef = React.useRef(onClose);
    React.useEffect(() => {
      onCloseRef.current = onClose;
    }, [onClose]);

    const reactId = React.useId();
    const titleId = `${reactId}-title`;
    const descriptionId = `${reactId}-description`;

    const setRefs = React.useCallback(
      (node: HTMLDialogElement | null) => {
        dialogRef.current = node;
        assignRef(forwardedRef, node);
      },
      [forwardedRef],
    );

    React.useEffect(() => {
      const node = dialogRef.current;
      if (!node || !open) return;

      restoreFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (!node.open) node.showModal();

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Preference order: the caller's nomination, then the first focusable in
      // the body/footer, then the close button. Landing on "Close" by default
      // is a poor first stop for a confirmation, so it is the fallback and not
      // the first hit even though it comes first in the DOM.
      const target =
        initialFocusRef?.current ??
        firstFocusable(contentRef.current) ??
        closeButtonRef.current ??
        node;
      target.focus();

      return () => {
        if (node.open) node.close();
        document.body.style.overflow = previousOverflow;
        restoreFocusRef.current?.focus();
        restoreFocusRef.current = null;
      };
    }, [open, initialFocusRef]);

    React.useEffect(() => {
      const node = dialogRef.current;
      if (!node || !open) return;

      const handleCancel = (event: Event) => {
        // Esc would otherwise close the element behind React's back and leave
        // `open` true. Cancel the native close and re-enter through onClose.
        event.preventDefault();
        onCloseRef.current();
      };

      node.addEventListener("cancel", handleCancel);
      return () => node.removeEventListener("cancel", handleCancel);
    }, [open]);

    const handleClick = (event: React.MouseEvent<HTMLDialogElement>) => {
      rest.onClick?.(event);
      if (event.defaultPrevented || !closeOnBackdrop) return;
      // ::backdrop is not an element, so a backdrop click reports the dialog
      // itself as the target. The dialog has no padding and the panel fills
      // it, so nothing else can produce this target.
      if (event.target === dialogRef.current) onCloseRef.current();
    };

    const classes = ["rathe", "rathe-dialog", `rathe-dialog--${size}`, className]
      .filter(Boolean)
      .join(" ");

    return (
      <dialog
        {...rest}
        ref={setRefs}
        className={classes}
        role="dialog"
        aria-modal="true"
        aria-labelledby={rest["aria-labelledby"] ?? titleId}
        aria-describedby={
          rest["aria-describedby"] ?? (description ? descriptionId : undefined)
        }
        onClick={handleClick}
      >
        <div className="rathe-dialog__panel">
          <header className="rathe-dialog__header">
            <h2 className="rathe-dialog__title" id={titleId}>
              {title}
            </h2>
            <button
              type="button"
              ref={closeButtonRef}
              className="rathe-dialog__close"
              aria-label={closeLabel}
              onClick={() => onCloseRef.current()}
            >
              <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="16" height="16">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </header>

          <div className="rathe-dialog__content" ref={contentRef}>
            {description ? (
              <p className="rathe-dialog__description" id={descriptionId}>
                {description}
              </p>
            ) : null}
            {children ? <div className="rathe-dialog__body">{children}</div> : null}
            {footer ? <div className="rathe-dialog__footer">{footer}</div> : null}
          </div>
        </div>
      </dialog>
    );
  },
);
