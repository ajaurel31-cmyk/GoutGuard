import { getTodayScanCount } from './storage';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

export interface SubscriptionState {
  isPremium: boolean;
  isLoading: boolean;
  platform: 'web' | 'ios' | 'android';
  products: any[];
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
// @capgo/native-purchases (StoreKit 2) helpers
// ---------------------------------------------------------------------------

async function getNativePurchases(): Promise<any | null> {
  if (!isNativePlatform()) return null;
  try {
    const mod: any = await import('@capgo/native-purchases');
    return mod.NativePurchases ?? mod.default ?? mod;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API — uses StoreKit 2 via @capgo/native-purchases
// ---------------------------------------------------------------------------

/**
 * Initialize purchases. @capgo/native-purchases does not require a configure()
 * call like RevenueCat — it talks directly to StoreKit 2. This function checks
 * billing support and restores existing purchases on startup.
 */
export async function initializePurchases(): Promise<void> {
  if (!isNativePlatform()) return;

  const NP = await getNativePurchases();
  if (!NP) return;

  try {
    // Check if billing/StoreKit is supported
    const { isBillingSupported } = await NP.isBillingSupported();
    if (!isBillingSupported) return;

    // Auto-restore purchases on startup to sync premium status
    await syncPremiumStatus();
  } catch {
    // StoreKit not available — continue silently
  }
}

/**
 * Fetch available subscription products from the App Store via StoreKit 2.
 */
export async function getProducts(): Promise<any[]> {
  if (!isNativePlatform()) return [];

  const NP = await getNativePurchases();
  if (!NP) return [];

  try {
    const { products } = await NP.getProducts({
      productIdentifiers: [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL],
    });
    return products ?? [];
  } catch {
    return [];
  }
}

/**
 * Purchase a subscription product via StoreKit 2.
 * Returns true on success, false on failure/cancellation.
 */
export async function purchaseProduct(productId: string): Promise<boolean> {
  if (!isNativePlatform()) return false;

  const NP = await getNativePurchases();
  if (!NP) return false;

  try {
    // @capgo/native-purchases purchaseProduct returns a Transaction
    const transaction = await NP.purchaseProduct({
      productIdentifier: productId,
    });

    if (transaction && transaction.productIdentifier) {
      setCachedPremium(true);
      return true;
    }
    return false;
  } catch (error: any) {
    // User cancelled or purchase failed
    console.log('Purchase failed or cancelled:', error?.message);
    return false;
  }
}

/**
 * Restore previously purchased subscriptions via StoreKit 2.
 * Returns true if user has an active subscription.
 */
export async function restorePurchases(): Promise<boolean> {
  if (!isNativePlatform()) return false;

  const NP = await getNativePurchases();
  if (!NP) return false;

  try {
    await NP.restorePurchases();
    // After restore, check active purchases
    return await syncPremiumStatus();
  } catch {
    return false;
  }
}

/**
 * Sync premium status by checking active purchases from StoreKit 2.
 * Updates the localStorage cache.
 */
async function syncPremiumStatus(): Promise<boolean> {
  const NP = await getNativePurchases();
  if (!NP) return getCachedPremium();

  try {
    // getPurchases returns currently active purchases/subscriptions
    const { transactions } = await NP.getPurchases({
      productType: 'subs',
    });

    const hasActiveSub = (transactions ?? []).some(
      (t: any) =>
        t.productIdentifier === PRODUCT_IDS.MONTHLY ||
        t.productIdentifier === PRODUCT_IDS.ANNUAL
    );

    setCachedPremium(hasActiveSub);
    return hasActiveSub;
  } catch {
    return getCachedPremium();
  }
}

/**
 * Check whether the user currently has an active premium subscription.
 * On web, falls back to the localStorage cache.
 */
export async function checkPremiumStatus(): Promise<boolean> {
  if (!isNativePlatform()) {
    return getCachedPremium();
  }
  return await syncPremiumStatus();
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

/**
 * Open the native subscription management page (App Store subscriptions).
 */
export async function manageSubscriptions(): Promise<void> {
  const NP = await getNativePurchases();
  if (!NP) return;

  try {
    await NP.manageSubscriptions();
  } catch {
    // Fallback: open App Store subscription settings URL
    if (typeof window !== 'undefined') {
      window.open('https://apps.apple.com/account/subscriptions', '_blank');
    }
  }
}
