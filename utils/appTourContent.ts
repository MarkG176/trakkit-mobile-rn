import {
  MOBILE_COMPONENTS,
  type MobileComponent,
} from '@/data/mobileComponentsCatalog';
import type { IoniconName } from '@/components/navigation/TabIcon';

/** Primary tab destinations shown on the Navigation tour step. */
export const APP_TOUR_NAV_CODES = [
  'CRM-0089',
  'CRM-0099',
  'CRM-0098',
  'CRM-0097',
  'CRM-0093',
  'CRM-0100',
] as const;

/** Page shells to hide when the matching action is already listed. */
const PAGE_SHELL_WHEN_ACTION: Record<string, string> = {
  'CRM-0094': 'CRM-0034',
  'CRM-0095': 'CRM-0034G',
};

const NAV_ICONS: Record<string, IoniconName> = {
  'CRM-0089': 'home-outline',
  'CRM-0099': 'document-text-outline',
  'CRM-0098': 'storefront-outline',
  'CRM-0097': 'clipboard-outline',
  'CRM-0093': 'cube-outline',
  'CRM-0100': 'ellipsis-horizontal-circle-outline',
};

const TOOL_ICONS: Record<string, IoniconName> = {
  'CRM-0010': 'log-in-outline',
  'CRM-0026': 'camera-outline',
  'CRM-0034': 'cart-outline',
  'CRM-0034G': 'gift-outline',
  'CRM-0096': 'chatbubble-ellipses-outline',
  'CRM-0030': 'people-outline',
  'CRM-0019': 'moon-outline',
  'CRM-0020': 'checkmark-done-outline',
  'CRM-0021': 'sunny-outline',
  'CRM-0022': 'layers-outline',
  'CRM-0023': 'clipboard-outline',
  'CRM-0024': 'leaf-outline',
  'CRM-0025': 'pricetag-outline',
  'CRM-0098A': 'location-outline',
  'CRM-0098L': 'add-circle-outline',
  'CRM-0090': 'person-outline',
  'CRM-0091': 'pulse-outline',
  'CRM-0092': 'list-outline',
  'CRM-0101': 'settings-outline',
  'CRM-0105': 'time-outline',
  'CRM-0106': 'receipt-outline',
  'CRM-0107': 'gift-outline',
  'CRM-0108': 'clipboard-outline',
  'CRM-0109': 'help-circle-outline',
  'CRM-0110': 'headset-outline',
};

export type AppTourItem = {
  code: string;
  name: string;
  description: string;
  icon: IoniconName;
};

function toTourItem(component: MobileComponent): AppTourItem {
  return {
    code: component.code,
    name: component.name,
    description: component.description,
    icon: NAV_ICONS[component.code] ?? TOOL_ICONS[component.code] ?? 'apps-outline',
  };
}

export function buildAppTourNavItems(isEnabled: (code: string) => boolean): AppTourItem[] {
  return APP_TOUR_NAV_CODES.map((code) => MOBILE_COMPONENTS.find((c) => c.code === code))
    .filter((c): c is MobileComponent => c != null && isEnabled(c.code))
    .map(toTourItem);
}

/**
 * Enabled agent-actions plus agent-pages not already covered by the nav step
 * or redundant page shells.
 */
export function buildAppTourToolItems(isEnabled: (code: string) => boolean): AppTourItem[] {
  const navSet = new Set<string>(APP_TOUR_NAV_CODES);

  return MOBILE_COMPONENTS.filter((c) => {
    if (!isEnabled(c.code)) return false;
    if (c.group !== 'agent-action' && c.group !== 'agent-page') return false;
    if (navSet.has(c.code)) return false;

    const requiredAction = PAGE_SHELL_WHEN_ACTION[c.code];
    if (requiredAction && isEnabled(requiredAction)) return false;

    return true;
  }).map(toTourItem);
}

/** Compact Help list: nav destinations + tools, same dedupe rules. */
export function buildAppTourAvailableItems(isEnabled: (code: string) => boolean): AppTourItem[] {
  return [...buildAppTourNavItems(isEnabled), ...buildAppTourToolItems(isEnabled)];
}
