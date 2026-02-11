import { getTodayScanCount } from './storage';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

export interface SubscriptionState {
  isPremium: boolean;
  isLoading: boolean;
  platform: 'web' | 'ios' | 'android';
  products: any[];
  activeSubscription: any | null;
}

export const PRODUCT_IDS = {
  MONTHLY: 'goutguard_monthly_499',
  ANNUAL: 'goutguard_annual_2999',
};

export const FREE_SCAN_LIMIT = 3;

const PREMIUM_CACHE_KEY = 'goutguard_premium_status';

// ---------------------------------------------------------------------------
// Platform detection
// ---------------------------------------------------------------------------

export function isNativePlatform(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!(window as any).Capacitor?.isNativePlatform()
  );
}

function getPlatform(): 'web' | 'ios' | 'android' {
  if (!isNativePlatform()) return 'web';
  const platform = (window as any).Capacitor?.getPlatform?.() as string | undefined;
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  return 'web';
}

// ---------------------------------------------------------------------------
// localStorage helpers for premium cache
// ---------------------------------------------------------------------------

function getCachedPremium(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(PREMIUM_CACHE_KEY) === 'true';
  } catch {
    return false;
  }
}

function setCachedPremium(value: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PREMIUM_CACHE_KEY, value ? 'true' : 'false');
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Native Purchases helpers
// ---------------------------------------------------------------------------

async function getNativePurchases(): Promise<any | null> {
  try {
    const mod: any = await import('@capgo/native-purchases');
    return mod.Purchases ?? mod.NativePurchases ?? mod.default ?? mod;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize the native purchases SDK.
 * Should be called once on app load.
 */
export async function initializePurchases(): Promise<void> {
  if (!isNativePlatform()) return;

  const Purchases = await getNativePurchases();
  if (!Purchases) return;

  try {
    const platform = getPlatform();
    const apiKey =
      platform === 'ios'
        ? process.env.NEXT_PUBLIC_RC_IOS_KEY ?? ''
        : process.env.NEXT_PUBLIC_RC_ANDROID_KEY ?? '';

    if (!apiKey) return;

    await Purchases.configure({ apiKey });
  } catch {
    // SDK not available or configuration failed – continue silently
  }
}

/**
 * Fetch available subscription products from the store.
 */
export async function getProducts(): Promise<any[]> {
  if (!isNativePlatform()) return [];

  const Purchases = await getNativePurchases();
  if (!Purchases) return [];

  try {
    const { products } = await Purchases.getProducts({
      productIdentifiers: [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL],
    });
    return products ?? [];
  } catch {
    return [];
  }
}

/**
 * Purchase a product by its identifier.
 * Returns true on success, false on failure / cancellation.
 */
export async function purchaseProduct(productId: string): Promise<boolean> {
  if (!isNativePlatform()) return false;

  const Purchases = await getNativePurchases();
  if (!Purchases) return false;

  try {
    const { customerInfo } = await Purchases.purchaseProduct({
      productIdentifier: productId,
    });

    const premium =
      customerInfo?.entitlements?.active?.['premium'] !== undefined;
    setCachedPremium(premium);
    return premium;
  } catch {
    return false;
  }
}

/**
 * Restore previously purchased subscriptions.
 * Returns true if the user has an active premium entitlement.
 */
export async function restorePurchases(): Promise<boolean> {
  if (!isNativePlatform()) return false;

  const Purchases = await getNativePurchases();
  if (!Purchases) return false;

  try {
    const { customerInfo } = await Purchases.restorePurchases();
    const premium =
      customerInfo?.entitlements?.active?.['premium'] !== undefined;
    setCachedPremium(premium);
    return premium;
  } catch {
    return false;
  }
}

/**
 * Check whether the user currently has an active premium subscription.
 * Falls back to the localStorage cache when not on a native platform.
 */
export async function checkPremiumStatus(): Promise<boolean> {
  if (!isNativePlatform()) {
    return getCachedPremium();
  }

  const Purchases = await getNativePurchases();
  if (!Purchases) return getCachedPremium();

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    const premium =
      customerInfo?.entitlements?.active?.['premium'] !== undefined;
    setCachedPremium(premium);
    return premium;
  } catch {
    return getCachedPremium();
  }
}

/**
 * Determine whether the user is allowed to perform a scan.
 * Premium users can scan unlimited; free users are capped at FREE_SCAN_LIMIT per day.
 */
export function canScan(): boolean {
  if (getCachedPremium()) return true;
  return getTodayScanCount() < FREE_SCAN_LIMIT;
}

/**
 * Format a product's price for display.
 * Falls back to the raw priceString or a placeholder.
 */
export function formatPrice(product: any): string {
  if (!product) return '';
  if (product.priceString) return product.priceString;
  if (typeof product.price === 'number') {
    const currency = product.currencyCode ?? 'USD';
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(product.price);
    } catch {
      return `$${product.price.toFixed(2)}`;
    }
  }
  return '';
}
