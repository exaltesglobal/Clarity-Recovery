import { NativeModule, requireOptionalNativeModule } from 'expo';

export interface PauseUi {
  title: string;
  body: string;
  breathe: string;
  leave: string;
  support: string;
  notNow: string;
  continue: string;
  reasonsTitle: string;
  reasons: string[];
  rtl: boolean;
  colors: Record<'bg' | 'card' | 'text' | 'muted' | 'primary' | 'onPrimary' | 'accent' | 'danger' | 'onDanger', string>;
}

declare class ClarityGuardModule extends NativeModule<Record<string, never>> {
  isDnsFilterActive(): boolean;
  /** Shows the system VPN consent dialog when needed; resolves true once the filter is running. */
  startDnsFilter(): Promise<boolean>;
  stopDnsFilter(): void;
  openVpnSettings(): void;
  isPauseServiceEnabled(): boolean;
  openAccessibilitySettings(): void;
  /** ui: translated texts (use %APP% for the app name), theme colours, reasons and rtl for the overlay. */
  setPauseConfig(enabled: boolean, packages: string[], ui: PauseUi): void;
  /** Opens this app's system App info page (for Android 13+ "Allow restricted settings"). */
  openAppSettings(): void;
  isIgnoringBatteryOptimizations(): boolean;
  openBatteryOptimizationSettings(): void;
  /** Asks the launcher to pin an SOS shortcut; false when the launcher doesn't support it. */
  requestSosShortcut(label: string): boolean;
  /** Lower-case device maker, e.g. "xiaomi". */
  deviceMaker(): string;
  /** Opens the maker's Autostart or background pop-up permission screen, falling back to App info. */
  openOemSetting(which: 'autostart' | 'popups'): boolean;
  allowApp(packageName: string, minutes: number): void;
  openApp(packageName: string): boolean;
  installedApps(packages: string[]): string[];
  appLabel(packageName: string): string | null;
}

/** Android only. Null on iOS, web and in Expo Go, which can't load custom native code. */
export default requireOptionalNativeModule<ClarityGuardModule>('ClarityGuard');
