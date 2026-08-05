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
            <span class="brand-mark" aria-hidden="true">IC</span>
            <span class="brand-copy">
              <strong>Inventory</strong>
              <small>Control system</small>
            </span>
          </a>

          <p class="nav-label">Modules</p>
          <mat-nav-list class="nav-list">
            @for (item of navItems; track item.route) {
              @if (!item.adminOnly || auth.isAdmin()) {
                <a mat-list-item [routerLink]="item.route" routerLinkActive="active-link" (click)="closeMobileNav()">
                  <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                  <span matListItemTitle>{{ item.label }}</span>
                </a>
              }
            }
          </mat-nav-list>

          <div class="rail-footer">
            <span class="connection-dot" aria-hidden="true"></span>
            <span>System online</span>
          </div>
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

          <div class="topbar-context">
            <span class="topbar-kicker">OPERATIONS / CONTROL</span>
            <span class="topbar-title">Inventory management</span>
            <span class="topbar-date">{{ today | date: 'EEEE, MMMM d' }}</span>
          </div>

          <span class="spacer"></span>

          <div class="account">
            <span class="account-copy">
              <strong>{{ auth.user()?.name }}</strong>
              <small>{{ auth.user()?.role === 'ADMIN' ? 'Admin access' : 'Staff access' }}</small>
            </span>
            <span class="avatar" aria-hidden="true">{{ initials() }}</span>
            <button mat-icon-button type="button" aria-label="Log out" (click)="logout()">
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
        width: 232px;
        border-right: 1px solid #111512;
        background: var(--rail);
      }

      .rail-inner {
        display: flex;
        min-height: 100%;
        flex-direction: column;
        padding: 18px 10px 14px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 52px;
        padding: 7px 8px;
        color: var(--rail-text);
        text-decoration: none;
      }

      .brand-mark {
        display: grid;
        width: 32px;
        height: 32px;
        place-items: center;
        background: var(--marker);
        color: var(--rail-strong);
        font-family: var(--font-mono);
        font-size: 0.66rem;
        font-weight: 500;
      }

      .brand-copy {
        display: grid;
        gap: 2px;
      }

      .brand-copy strong {
        font-size: 0.88rem;
        font-weight: 700;
        line-height: 1.2;
      }

      .brand-copy small {
        color: var(--rail-muted);
        font-family: var(--font-mono);
        font-size: 0.62rem;
        line-height: 1.2;
      }

      .account-copy small {
        color: var(--muted);
        font-family: var(--font-mono);
        font-size: 0.62rem;
        line-height: 1.2;
      }

      .nav-label {
        margin: 34px 10px 10px;
        color: var(--rail-muted);
        font-family: var(--font-mono);
        font-size: 0.64rem;
        font-weight: 500;
        line-height: 1.2;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .nav-list {
        padding: 0;
      }

      .nav-list a[mat-list-item] {
        position: relative;
        margin: 1px 0;
        border-radius: 0;
        color: #bdc7bd;
        font-size: 0.82rem;
        font-weight: 600;
      }

      .nav-list a[mat-list-item] mat-icon {
        color: #8f9c90;
      }

      .nav-list a[mat-list-item]:hover {
        background: #2b322b;
        color: var(--rail-text);
      }

      .nav-list a.active-link {
        background: #303a31;
        color: var(--rail-text);
      }

      .nav-list a.active-link::before {
        position: absolute;
        top: 8px;
        bottom: 8px;
        left: 0;
        width: 3px;
        background: var(--marker);
        content: '';
      }

      .nav-list a.active-link mat-icon {
        color: var(--marker);
      }

      .rail-footer {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: auto 8px 2px;
        padding: 14px 2px 2px;
        border-top: 1px solid #3b453c;
        color: var(--rail-muted);
        font-family: var(--font-mono);
        font-size: 0.63rem;
      }

      .connection-dot {
        width: 6px;
        height: 6px;
        background: var(--marker);
      }

      .topbar {
        position: sticky;
        top: 0;
        z-index: 10;
        min-height: 62px;
        padding: 0 32px;
        border-bottom: 1px solid var(--line);
        background: var(--surface);
        color: var(--ink);
      }

      .topbar-context {
        display: grid;
        grid-template-columns: auto auto;
        align-items: baseline;
        column-gap: 10px;
        row-gap: 1px;
      }

      .topbar-kicker {
        grid-column: 1 / -1;
        color: var(--muted);
        font-family: var(--font-mono);
        font-size: 0.62rem;
      }

      .topbar-title {
        color: var(--ink-strong);
        font-size: 0.81rem;
        font-weight: 700;
        line-height: 1.2;
      }

      .topbar-date {
        color: var(--muted);
        font-family: var(--font-mono);
        font-size: 0.62rem;
        line-height: 1.2;
      }

      .mobile-nav-toggle {
        display: none;
        margin-right: 6px;
      }

      .spacer {
        flex: 1;
      }

      .account {
        display: flex;
        align-items: center;
        gap: 9px;
      }

      .account-copy {
        display: grid;
        gap: 2px;
        max-width: 180px;
        text-align: right;
      }

      .account-copy strong {
        overflow: hidden;
        color: var(--ink-strong);
        font-size: 0.75rem;
        font-weight: 700;
        line-height: 1.2;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .avatar {
        display: grid;
        width: 30px;
        height: 30px;
        flex: 0 0 auto;
        place-items: center;
        background: var(--surface-strong);
        color: var(--ink-strong);
        font-family: var(--font-mono);
        font-size: 0.67rem;
        font-weight: 500;
      }

      .content {
        min-height: calc(100dvh - 62px);
        padding: 32px 36px 44px;
      }

      @media (max-width: 920px) {
        .rail {
          width: min(82vw, 280px);
          box-shadow: 12px 0 28px rgba(21, 26, 22, 0.22);
        }

        .mobile-nav-toggle {
          display: inline-flex;
        }

        .content {
          padding: 26px 24px 36px;
        }
      }

      @media (max-width: 640px) {
        .topbar {
          min-height: 60px;
          padding: 0 14px;
        }

        .topbar-date,
        .topbar-kicker,
        .account-copy {
          display: none;
        }

        .content {
          min-height: calc(100dvh - 60px);
          padding: 20px 16px 30px;
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
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Inventory', icon: 'inventory_2', route: '/inventory' },
    { label: 'New Transaction', icon: 'add_circle', route: '/transactions/new' },
    { label: 'Transactions', icon: 'receipt_long', route: '/transactions' },
    { label: 'Reports', icon: 'query_stats', route: '/reports' },
    { label: 'Settings', icon: 'settings', route: '/settings', adminOnly: true },
    { label: 'Users', icon: 'manage_accounts', route: '/users', adminOnly: true },
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
