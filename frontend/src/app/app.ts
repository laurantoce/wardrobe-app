import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';

import { ButtonDirective } from './shared/ui/button.directive';
import { IconComponent, IconName } from './shared/ui/icon.component';

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  exact: boolean;
}

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonDirective, IconComponent],
  template: `
    <div class="flex h-full">
      <!-- Mobile top bar -->
      <header
        class="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 md:hidden"
      >
        <button
          type="button"
          (click)="drawerOpen.set(true)"
          class="rounded-lg p-1.5 text-muted hover:bg-accent-soft hover:text-ink"
          aria-label="Open menu"
        >
          <ui-icon name="menu" [size]="22" />
        </button>
        <span class="text-lg">👕</span>
        <span class="font-semibold tracking-tight">Wardrobe</span>
      </header>

      <!-- Backdrop (mobile only) -->
      @if (drawerOpen()) {
        <div
          class="fixed inset-0 z-40 bg-ink/20 md:hidden"
          (click)="drawerOpen.set(false)"
        ></div>
      }

      <!-- Sidebar: fixed drawer on mobile, static on md+ -->
      <aside
        class="fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col border-r border-line bg-surface px-3 py-5 transition-transform duration-200 md:static md:translate-x-0"
        [class.-translate-x-full]="!drawerOpen()"
      >
        <div class="flex items-center gap-2 px-3 pb-6">
          <span class="text-xl">👕</span>
          <span class="text-base font-semibold tracking-tight">Wardrobe</span>
        </div>

        <nav class="flex flex-1 flex-col gap-1">
          @for (item of nav; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-accent-soft text-accent"
              [routerLinkActiveOptions]="{ exact: item.exact }"
              (click)="drawerOpen.set(false)"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-accent-soft hover:text-ink"
            >
              <ui-icon [name]="item.icon" [size]="18" />
              {{ item.label }}
            </a>
          }
        </nav>

        <div class="border-t border-line pt-3">
          @if (isAuthenticated()) {
            <button
              appBtn
              type="button"
              variant="ghost"
              size="sm"
              class="w-full justify-start"
              (click)="logout()"
            >
              <ui-icon name="log-out" [size]="18" />
              Sign out
            </button>
          } @else {
            <a
              appBtn
              routerLink="/login"
              variant="outline"
              size="sm"
              class="w-full justify-start"
              (click)="drawerOpen.set(false)"
            >
              <ui-icon name="log-in" [size]="18" />
              Sign in
            </a>
          }
        </div>
      </aside>

      <!-- Content -->
      <main class="h-full flex-1 overflow-y-auto pt-14 md:pt-0">
        <div class="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
})
export class App {
  private readonly oidcSecurityService = inject(OidcSecurityService);

  protected readonly drawerOpen = signal(false);
  protected readonly isAuthenticated = toSignal(
    this.oidcSecurityService.isAuthenticated(),
    { initialValue: false },
  );

  protected readonly nav: NavItem[] = [
    { label: 'Dashboard', path: '/', icon: 'dashboard', exact: true },
    { label: 'Items', path: '/items', icon: 'shirt', exact: false },
    { label: 'Outfits', path: '/outfits', icon: 'layers', exact: false },
    { label: 'AI Stylist', path: '/ai', icon: 'sparkles', exact: false },
  ];

  protected logout(): void {
    this.drawerOpen.set(false);
    this.oidcSecurityService.logoff().subscribe();
  }
}
