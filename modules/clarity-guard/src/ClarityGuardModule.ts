import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class ClarityGuardModule extends NativeModule<Record<string, never>> {
  isDnsFilterActive(): boolean;
  /** Shows the system VPN consent dialog when needed; resolves true once the filter is running. */
  startDnsFilter(): Promise<boolean>;
  stopDnsFilter(): void;
  openVpnSettings(): void;
  isPauseServiceEnabled(): boolean;
  openAccessibilitySettings(): void;
  setPauseConfig(enabled: boolean, packages: string[]): void;
  allowApp(packageName: string, minutes: number): void;
  openApp(packageName: string): boolean;
  installedApps(packages: string[]): string[];
  appLabel(packageName: string): string | null;
}

/** Android only. Null on iOS, web and in Expo Go, which can't load custom native code. */
export default requireOptionalNativeModule<ClarityGuardModule>('ClarityGuard');
