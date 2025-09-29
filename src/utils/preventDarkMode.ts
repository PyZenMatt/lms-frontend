/**
 * Prevents dark mode activation by ensuring the 'dark' class is never added to the HTML element
 * This enforces the single OpenPython theme regardless of browser preferences
 */
export function preventDarkMode() {
  // Remove dark class if it exists
  document.documentElement.classList.remove('dark');
  
  // Create a MutationObserver to watch for any attempts to add the dark class
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target as HTMLElement;
        if (target === document.documentElement && target.classList.contains('dark')) {
          target.classList.remove('dark');
          console.debug('[OpenPython Theme] Prevented dark mode activation - using single theme');
        }
      }
    });
  });
  
  // Start observing the document element for class changes
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
  
  return observer;
}

/**
 * Initialize theme protection on page load
 */
export function initThemeProtection() {
  // Run immediately
  preventDarkMode();
  
  // Also run when DOM is loaded (if called before DOM ready)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preventDarkMode);
  }
}