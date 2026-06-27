import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
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

        <div
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-faint"
        >
          <ui-icon name="settings" [size]="18" />
          Settings
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
  protected readonly drawerOpen = signal(false);

  protected readonly nav: NavItem[] = [
    { label: 'Dashboard', path: '/', icon: 'dashboard', exact: true },
    { label: 'Items', path: '/items', icon: 'shirt', exact: false },
    { label: 'Outfits', path: '/outfits', icon: 'layers', exact: false },
    { label: 'AI Stylist', path: '/ai', icon: 'sparkles', exact: false },
  ];
}
