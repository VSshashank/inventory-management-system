import { DatePipe } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../core/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
  /** `/transactions` would otherwise stay highlighted while on `/transactions/new`. */
  exact?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    DatePipe,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
  ],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav
        class="rail"
        [mode]="isCompact() ? 'over' : 'side'"
        [opened]="!isCompact() || mobileNavOpen()"
        (closedStart)="mobileNavOpen.set(false)"
      >
        <div class="rail-inner">
          <a class="brand" routerLink="/dashboard" (click)="closeMobileNav()">
            <span class="brand-mark" aria-hidden="true">
              <mat-icon>inventory_2</mat-icon>
            </span>
            <span class="brand-name">Inventory</span>
          </a>

          <mat-nav-list class="nav-list">
            @for (item of navItems; track item.route) {
              @if (!item.adminOnly || auth.isAdmin()) {
                <a
                  mat-list-item
                  [routerLink]="item.route"
                  routerLinkActive="active-link"
                  [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                  (click)="closeMobileNav()"
                >
                  <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                  <span matListItemTitle>{{ item.label }}</span>
                </a>
              }
            }
          </mat-nav-list>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="shell-content">
        <mat-toolbar class="topbar">
          <button
            class="mobile-nav-toggle"
            mat-icon-button
            type="button"
            aria-label="Open navigation"
            (click)="mobileNavOpen.set(true)"
          >
            <mat-icon>menu</mat-icon>
          </button>

          <span class="topbar-date">{{ today | date: 'EEEE, d MMMM' }}</span>

          <span class="spacer"></span>

          <div class="account">
            <span class="avatar" aria-hidden="true">{{ initials() }}</span>
            <span class="account-copy">
              <strong>{{ auth.user()?.name }}</strong>
              <small>{{ auth.user()?.role === 'ADMIN' ? 'Administrator' : 'Staff' }}</small>
            </span>
            <button mat-icon-button type="button" aria-label="Sign out" (click)="logout()">
              <mat-icon>logout</mat-icon>
            </button>
          </div>
        </mat-toolbar>

        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .shell {
        min-height: 100dvh;
        background: var(--canvas);
      }

      .rail {
        width: 244px;
        border-right: none;
        background: var(--sidebar);
      }

      .rail-inner {
        display: flex;
        min-height: 100%;
        flex-direction: column;
        padding: 16px 12px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 44px;
        margin-bottom: 20px;
        padding: 0 8px;
        color: var(--sidebar-text);
        text-decoration: none;
      }

      .brand-mark {
        display: grid;
        width: 30px;
        height: 30px;
        flex: 0 0 auto;
        place-items: center;
        border-radius: 7px;
        background: var(--brand);
        color: #ffffff;
      }

      .brand-mark mat-icon {
        width: 18px;
        height: 18px;
        color: #ffffff;
        font-size: 18px;
      }

      .brand-name {
        font-size: 0.9375rem;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      /* Material paints list labels from its own theme tokens, so a plain
         CSS color on the anchor never reaches them. These are the mat-
         prefixed tokens; the mdc- ones are not what the label reads. */
      .nav-list {
        --mat-list-list-item-label-text-color: #c3cad9;
        --mat-list-list-item-leading-icon-color: #c3cad9;
        --mat-list-list-item-hover-label-text-color: #ffffff;
        --mat-list-list-item-hover-leading-icon-color: #ffffff;
        --mat-list-list-item-focus-label-text-color: #ffffff;
        --mat-list-list-item-hover-state-layer-color: transparent;
        --mat-list-list-item-focus-state-layer-color: transparent;
        --mat-list-list-item-label-text-size: 0.875rem;
        --mat-list-list-item-label-text-weight: 500;
        padding: 0;
      }

      .nav-list a[mat-list-item] {
        height: 38px !important;
        margin-bottom: 2px;
        border-radius: var(--radius) !important;
      }

      .nav-list a[mat-list-item] mat-icon {
        width: 19px;
        height: 19px;
        font-size: 19px;
      }

      .nav-list a[mat-list-item]:hover {
        background: var(--sidebar-hover);
      }

      .nav-list a.active-link {
        --mat-list-list-item-label-text-color: #ffffff;
        --mat-list-list-item-leading-icon-color: #93b4fd;
        --mat-list-list-item-label-text-weight: 600;
        background: var(--sidebar-active);
      }

      .topbar {
        position: sticky;
        top: 0;
        z-index: 10;
        min-height: 60px;
        padding: 0 28px;
        border-bottom: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(8px);
        color: var(--ink);
      }

      .topbar-date {
        color: var(--muted);
        font-size: 0.8125rem;
      }

      .mobile-nav-toggle {
        display: none;
        margin-right: 8px;
      }

      .spacer {
        flex: 1;
      }

      .account {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .account-copy {
        display: grid;
        gap: 1px;
        max-width: 170px;
      }

      .account-copy strong {
        overflow: hidden;
        color: var(--ink-strong);
        font-size: 0.8125rem;
        font-weight: 600;
        line-height: 1.3;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .account-copy small {
        color: var(--muted);
        font-size: 0.75rem;
        line-height: 1.3;
      }

      .avatar {
        display: grid;
        width: 32px;
        height: 32px;
        flex: 0 0 auto;
        place-items: center;
        border-radius: 50%;
        background: var(--brand-soft);
        color: var(--brand-deep);
        font-size: 0.75rem;
        font-weight: 600;
      }

      .content {
        min-height: calc(100dvh - 60px);
        padding: 28px 32px 48px;
      }

      @media (max-width: 920px) {
        .rail {
          width: min(80vw, 272px);
          box-shadow: var(--shadow-lg);
        }

        .mobile-nav-toggle {
          display: inline-flex;
        }

        .content {
          padding: 24px 20px 36px;
        }
      }

      @media (max-width: 640px) {
        .topbar {
          padding: 0 12px;
        }

        .topbar-date,
        .account-copy {
          display: none;
        }

        .content {
          padding: 20px 16px 32px;
        }
      }
    `,
  ],
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  readonly mobileNavOpen = signal(false);
  readonly isCompact = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 920px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  readonly initials = computed(() => {
    const name = this.auth.user()?.name?.trim() ?? '';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'IH';
  });
  readonly today = new Date();

  private readonly router = inject(Router);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'space_dashboard', route: '/dashboard' },
    { label: 'Inventory', icon: 'inventory_2', route: '/inventory' },
    { label: 'New transaction', icon: 'add_circle', route: '/transactions/new' },
    { label: 'Transactions', icon: 'receipt_long', route: '/transactions', exact: true },
    { label: 'Reports', icon: 'monitoring', route: '/reports' },
    { label: 'Settings', icon: 'settings', route: '/settings', adminOnly: true },
    { label: 'Users', icon: 'group', route: '/users', adminOnly: true },
  ];

  closeMobileNav(): void {
    if (this.isCompact()) {
      this.mobileNavOpen.set(false);
    }
  }

  logout(): void {
    this.auth.logout().subscribe({
      complete: () => {
        void this.router.navigate(['/login']);
      },
    });
  }
}
