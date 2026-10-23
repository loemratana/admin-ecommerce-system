import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

type TableActionMenuProps = {
  children: ReactNode;
  ariaLabel?: string;
  widthClassName?: string;
};

export default function TableActionMenu({ children, ariaLabel = "Open row actions", widthClassName = "w-48" }: TableActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !portalMenuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const toggleMenu = () => {
    if (!open && triggerRef.current) {
      const bounds = triggerRef.current.getBoundingClientRect();
      setMenuPosition({ top: bounds.bottom + 6, right: window.innerWidth - bounds.right });
    }
    setOpen((current) => !current);
  };

  return (
    <div ref={menuRef} className="relative flex justify-end">
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={toggleMenu}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && createPortal(
        <div ref={portalMenuRef} onClick={() => setOpen(false)} style={{ top: menuPosition.top, right: menuPosition.right }} className={`fixed z-[100] ${widthClassName} overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-300/30`}>
          {children}
        </div>,
        document.body,
      )}
    </div>
  );
}
