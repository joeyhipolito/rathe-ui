import * as React from "react";
import "./Tabs.css";

export type TabsActivation = "automatic" | "manual";
export type TabsOrientation = "horizontal" | "vertical";

interface TabsContextValue {
  value: string | null;
  select: (value: string) => void;
  activation: TabsActivation;
  orientation: TabsOrientation;
  tabId: (value: string) => string;
  panelId: (value: string) => string;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error(`<${component}> must be rendered inside <Tabs>.`);
  }
  return context;
}

/** ids have to survive values like "round 4 / table 12", which are legal values but not legal id fragments. */
function slug(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]+/g, "-");
}

const VALUE_ATTR = "data-rathe-tab-value";

export interface TabsProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  /** Controlled selection. Pair with onValueChange. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /**
   * `automatic` selects on focus, which the ARIA APG recommends when panels are
   * cheap to render. Switch to `manual` when a panel fetches or renders
   * something expensive, so arrowing past it does not trigger the work.
   */
  activation?: TabsActivation;
  orientation?: TabsOrientation;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    value: controlledValue,
    defaultValue,
    onValueChange,
    activation = "automatic",
    orientation = "horizontal",
    className,
    children,
    ...rest
  },
  ref,
) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string | null>(
    defaultValue ?? null,
  );
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const select = React.useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const reactId = React.useId();

  const context = React.useMemo<TabsContextValue>(
    () => ({
      value,
      select,
      activation,
      orientation,
      tabId: (tabValue: string) => `${reactId}-tab-${slug(tabValue)}`,
      panelId: (tabValue: string) => `${reactId}-panel-${slug(tabValue)}`,
    }),
    [value, select, activation, orientation, reactId],
  );

  const classes = ["rathe-tabs", `rathe-tabs--${orientation}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <TabsContext.Provider value={context}>
      <div {...rest} ref={ref} className={classes} data-orientation={orientation}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});

export type TabListProps = React.ComponentPropsWithoutRef<"div">;

export const TabList = React.forwardRef<HTMLDivElement, TabListProps>(function TabList(
  { className, onKeyDown, children, ...rest },
  forwardedRef,
) {
  const { value, select, activation, orientation } = useTabsContext("TabList");
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      listRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [forwardedRef],
  );

  // With no defaultValue and no controlled value nothing carries tabIndex 0 and
  // the tablist is unreachable by keyboard, so adopt the first enabled tab.
  React.useEffect(() => {
    if (value !== null) return;
    const first = listRef.current?.querySelector<HTMLElement>('[role="tab"]:not([disabled])');
    const firstValue = first?.getAttribute(VALUE_ATTR);
    if (firstValue) select(firstValue);
  }, [value, select]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const list = listRef.current;
    if (!list) return;

    // Read order from the DOM rather than a registration array: the DOM is the
    // only thing that stays correct when tabs are conditionally rendered.
    const tabs = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])'));
    const current = tabs.indexOf(document.activeElement as HTMLElement);
    if (current === -1) return;

    const last = tabs.length - 1;
    const forwardKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
    const backKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";

    let nextIndex: number;
    switch (event.key) {
      case forwardKey:
        nextIndex = current === last ? 0 : current + 1;
        break;
      case backKey:
        nextIndex = current === 0 ? last : current - 1;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = last;
        break;
      default:
        return;
    }

    const next = tabs[nextIndex];
    if (!next) return;

    event.preventDefault();
    next.focus();
    if (activation === "automatic") {
      const nextValue = next.getAttribute(VALUE_ATTR);
      if (nextValue) select(nextValue);
    }
  };

  const classes = ["rathe-tabs__list", className].filter(Boolean).join(" ");

  return (
    <div
      {...rest}
      ref={setRefs}
      role="tablist"
      aria-orientation={orientation}
      className={classes}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
});

export interface TabProps extends Omit<React.ComponentPropsWithoutRef<"button">, "value"> {
  value: string;
}

export const Tab = React.forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { value, className, onClick, children, ...rest },
  ref,
) {
  const context = useTabsContext("Tab");
  const selected = context.value === value;

  const classes = ["rathe-tabs__tab", selected && "rathe-tabs__tab--selected", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      role="tab"
      id={context.tabId(value)}
      aria-controls={context.panelId(value)}
      aria-selected={selected}
      // Roving tabindex: exactly one tab is in the page tab order, so Tab moves
      // past the whole tablist instead of through every round in the event.
      tabIndex={selected ? 0 : -1}
      className={classes}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        context.select(value);
      }}
      {...{ [VALUE_ATTR]: value }}
    >
      {children}
    </button>
  );
});

export interface TabPanelProps extends React.ComponentPropsWithoutRef<"div"> {
  value: string;
}

export const TabPanel = React.forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel(
  { value, className, children, ...rest },
  ref,
) {
  const context = useTabsContext("TabPanel");
  const selected = context.value === value;

  const classes = ["rathe-tabs__panel", className].filter(Boolean).join(" ");

  return (
    <div
      {...rest}
      ref={ref}
      role="tabpanel"
      id={context.panelId(value)}
      aria-labelledby={context.tabId(value)}
      // Panels stay mounted and hidden rather than unmounting, so every tab's
      // aria-controls keeps pointing at a node that actually exists.
      hidden={!selected}
      // Scrollable regions need a tab stop or keyboard users cannot reach the
      // content; the APG asks for it on the panel itself.
      tabIndex={0}
      className={classes}
    >
      {children}
    </div>
  );
});
