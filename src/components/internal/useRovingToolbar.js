import React from 'react';

function itemKey(item) {
  return item?.getAttribute?.('data-lk-toolbar-key') ?? null;
}

const PRESENTATIONAL_ROLES = new Set(['none', 'presentation']);

function isOwnedToolbarItem(toolbar, item) {
  if (!toolbar || !item || !toolbar.contains(item)) return false;

  let ancestor = item.parentElement;
  while (ancestor && ancestor !== toolbar) {
    const role = ancestor.getAttribute('role')?.trim().toLowerCase();
    if (role && !PRESENTATIONAL_ROLES.has(role)) return false;
    ancestor = ancestor.parentElement;
  }

  return ancestor === toolbar;
}

function shouldRestoreLostFocus(toolbar, focusWithin, lostFocusedItem) {
  if (!toolbar || !lostFocusedItem) return false;
  const ownerDocument = toolbar.ownerDocument;
  const activeElement = ownerDocument.activeElement;
  return focusWithin
    || activeElement === ownerDocument.body
    || activeElement === ownerDocument.documentElement;
}

/**
 * Private keyboard engine for LDS toolbars.
 *
 * `includeAriaDisabled` deliberately separates focusability from activation:
 * EditorToolbar keeps unavailable modes discoverable, while ViewerToolbar
 * skips unavailable commands.
 */
export function useRovingToolbar({
  itemSelector,
  orientation = 'vertical',
  preferredKey,
  includeAriaDisabled = false,
  stopPropagation = false,
  onKeyDown,
  onFocusCapture,
}) {
  const toolbarRef = React.useRef(null);
  const lastFocusedItemRef = React.useRef(null);
  const lastFocusedKeyRef = React.useRef(null);
  const lastFocusedIndexRef = React.useRef(-1);
  const focusWithinRef = React.useRef(false);
  const containerFallbackFocusedRef = React.useRef(false);

  const toolbarItems = (includeUnavailable = false) => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return [];

    return Array.from(toolbar.querySelectorAll(itemSelector)).filter((item) => {
      if (!isOwnedToolbarItem(toolbar, item)) return false;
      if (includeUnavailable) return true;
      if (item.disabled) return false;
      return includeAriaDisabled || item.getAttribute('aria-disabled') !== 'true';
    });
  };

  const syncTabStops = (requestedItem, restoreLostFocus = false) => {
    const toolbar = toolbarRef.current;
    const allItems = toolbarItems(true);
    const focusableItems = toolbarItems();
    const ownerDocument = toolbar?.ownerDocument;
    const activeElement = ownerDocument?.activeElement;

    if (focusableItems.length === 0) {
      allItems.forEach((item) => { item.tabIndex = -1; });
      lastFocusedItemRef.current = null;
      lastFocusedKeyRef.current = null;
      lastFocusedIndexRef.current = -1;
      if (restoreLostFocus && toolbar?.tabIndex >= 0 && activeElement !== toolbar) {
        toolbar.focus({ preventScroll: true });
        containerFallbackFocusedRef.current = toolbar.ownerDocument.activeElement === toolbar;
      } else {
        containerFallbackFocusedRef.current = activeElement === toolbar;
      }
      return;
    }

    const containerHasFocus = activeElement === toolbar;
    const documentHasFocusFallback = activeElement === ownerDocument?.body
      || activeElement === ownerDocument?.documentElement;
    const restoreContainerFallback = containerFallbackFocusedRef.current
      && (containerHasFocus || documentHasFocusFallback);
    const activeItem = focusableItems.includes(activeElement)
      ? activeElement
      : null;
    const unavailableActiveIndex = activeItem ? -1 : allItems.indexOf(activeElement);
    const availabilityFallback = unavailableActiveIndex < 0
      ? null
      : allItems
          .slice(unavailableActiveIndex + 1)
          .find((item) => focusableItems.includes(item))
        ?? allItems
          .slice(0, unavailableActiveIndex)
          .reverse()
          .find((item) => focusableItems.includes(item));
    const lostFocusIndex = Math.min(lastFocusedIndexRef.current, allItems.length - 1);
    const lostFocusFallback = !restoreLostFocus || unavailableActiveIndex >= 0 || lostFocusIndex < 0
      ? null
      : allItems
          .slice(lostFocusIndex)
          .find((item) => focusableItems.includes(item))
        ?? allItems
          .slice(0, lostFocusIndex)
          .reverse()
          .find((item) => focusableItems.includes(item));
    const rememberedItem = focusableItems.includes(lastFocusedItemRef.current)
      ? lastFocusedItemRef.current
      : focusableItems.find((item) => itemKey(item) === lastFocusedKeyRef.current);
    const preferredItem = preferredKey == null
      ? null
      : focusableItems.find((item) => itemKey(item) === String(preferredKey));
    const existingTabStop = focusableItems.find((item) => item.tabIndex === 0);
    const nextTabStop = focusableItems.includes(requestedItem)
      ? requestedItem
      : activeItem ?? availabilityFallback ?? lostFocusFallback ?? rememberedItem ?? preferredItem ?? existingTabStop ?? focusableItems[0];

    allItems.forEach((item) => {
      item.tabIndex = item === nextTabStop ? 0 : -1;
    });
    lastFocusedItemRef.current = nextTabStop;
    lastFocusedKeyRef.current = itemKey(nextTabStop);
    lastFocusedIndexRef.current = allItems.indexOf(nextTabStop);
    if ((restoreContainerFallback || unavailableActiveIndex >= 0 || restoreLostFocus) && activeElement !== nextTabStop) {
      nextTabStop.focus({ preventScroll: true });
    }
    containerFallbackFocusedRef.current = false;
  };

  // Child order and availability can change either with the toolbar render or
  // inside a self-managed descendant. Keep both paths on the same tab-stop
  // synchroniser so autonomous child updates cannot create a second Tab stop.
  React.useLayoutEffect(() => {
    const lostFocusedItem = !!lastFocusedItemRef.current
      && !toolbarItems().includes(lastFocusedItemRef.current);
    syncTabStops(undefined, shouldRestoreLostFocus(toolbarRef.current, focusWithinRef.current, lostFocusedItem));

    const toolbar = toolbarRef.current;
    const Observer = toolbar?.ownerDocument?.defaultView?.MutationObserver;
    if (!toolbar || !Observer) return undefined;

    const ownerDocument = toolbar.ownerDocument;
    const handleDocumentFocusIn = (event) => {
      const focusWithin = toolbar.contains(event.target);
      focusWithinRef.current = focusWithin;
      containerFallbackFocusedRef.current = focusWithin && event.target === toolbar;
    };
    const handleDocumentPointerDown = (event) => {
      if (!toolbar.contains(event.target)) {
        focusWithinRef.current = false;
        containerFallbackFocusedRef.current = false;
      }
    };
    ownerDocument.addEventListener('focusin', handleDocumentFocusIn, true);
    ownerDocument.addEventListener('pointerdown', handleDocumentPointerDown, true);

    const observer = new Observer((mutations) => {
      const lastFocusedItem = lastFocusedItemRef.current;
      const lostFocusedItem = !!lastFocusedItem && mutations.some((mutation) => {
        if (mutation.type === 'attributes') {
          return mutation.target === lastFocusedItem && !toolbarItems().includes(lastFocusedItem);
        }
        return Array.from(mutation.removedNodes).some((node) => (
          node === lastFocusedItem || node.contains?.(lastFocusedItem)
        ));
      });
      syncTabStops(undefined, shouldRestoreLostFocus(toolbar, focusWithinRef.current, lostFocusedItem));
    });
    observer.observe(toolbar, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'aria-disabled', 'data-lk-toolbar-key'],
    });
    return () => {
      observer.disconnect();
      ownerDocument.removeEventListener('focusin', handleDocumentFocusIn, true);
      ownerDocument.removeEventListener('pointerdown', handleDocumentPointerDown, true);
    };
  });

  const handleFocusCapture = (event) => {
    onFocusCapture?.(event);
    if (event.defaultPrevented) return;

    if (event.target === toolbarRef.current) {
      focusWithinRef.current = true;
      containerFallbackFocusedRef.current = true;
      return;
    }

    const item = event.target.closest?.(itemSelector);
    if (!isOwnedToolbarItem(toolbarRef.current, item)) return;
    if (!toolbarItems().includes(item)) return;

    lastFocusedItemRef.current = item;
    lastFocusedKeyRef.current = itemKey(item);
    focusWithinRef.current = true;
    containerFallbackFocusedRef.current = false;
    syncTabStops(item);
  };

  const handleKeyDown = (event) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const toolbar = toolbarRef.current;
    const items = toolbarItems();
    const item = event.target.closest?.(itemSelector);
    const currentIndex = items.indexOf(item);
    if (currentIndex < 0 || !isOwnedToolbarItem(toolbar, item)) return;

    const previousKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    let nextIndex;

    if (event.key === previousKey) nextIndex = (currentIndex - 1 + items.length) % items.length;
    if (event.key === nextKey) nextIndex = (currentIndex + 1) % items.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = items.length - 1;
    if (nextIndex === undefined) return;

    event.preventDefault();
    if (stopPropagation) event.stopPropagation();
    const nextItem = items[nextIndex];
    lastFocusedItemRef.current = nextItem;
    lastFocusedKeyRef.current = itemKey(nextItem);
    syncTabStops(nextItem);
    nextItem.focus();
  };

  return {
    toolbarRef,
    handleFocusCapture,
    handleKeyDown,
  };
}
