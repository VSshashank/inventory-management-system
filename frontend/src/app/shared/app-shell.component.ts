import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
      <mat-sidenav class="rail" mode="side" opened>
        <div class="brand">
          <span class="brand-mark">IM</span>
          <span>Inventory</span>
        </div>

        <mat-nav-list>
          @for (item of navItems; track item.route) {
            @if (!item.adminOnly || auth.isAdmin()) {
              <a mat-list-item [routerLink]="item.route" routerLinkActive="active-link">
                <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                <span matListItemTitle>{{ item.label }}</span>
              </a>
            }
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar class="topbar">
          <span class="page-title">Inventory Management</span>
          <span class="spacer"></span>
          <span class="user-chip">{{ auth.user()?.name }}</span>
          <button mat-icon-button type="button" aria-label="Log out" (click)="logout()">
            <mat-icon>logout</mat-icon>
          </button>
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
        background: #f6f8fb;
      }

      .rail {
        width: 248px;
        border-right: 1px solid #d9e2ec;
        background: #ffffff;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        height: 64px;
        padding: 0 18px;
        font-weight: 700;
        color: #14213d;
      }

      .brand-mark {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 8px;
        background: #1769aa;
        color: #ffffff;
        font-size: 0.78rem;
        letter-spacing: 0;
      }

      .active-link {
        background: #e8f1fb;
      }

      .topbar {
        position: sticky;
        top: 0;
        z-index: 10;
        border-bottom: 1px solid #d9e2ec;
        background: #ffffff;
        color: #14213d;
      }

      .page-title {
        font-size: 1rem;
        font-weight: 700;
      }

      .spacer {
        flex: 1;
      }

      .user-chip {
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-right: 8px;
        color: #475569;
        font-size: 0.9rem;
      }

      .content {
        padding: 24px;
        min-height: calc(100dvh - 64px);
        box-sizing: border-box;
      }

      @media (max-width: 820px) {
        .rail {
          width: 204px;
        }

        .content {
          padding: 16px;
        }
      }
    `,
  ],
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
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

  logout(): void {
    this.auth.logout().subscribe({
      complete: () => {
        void this.router.navigate(['/login']);
      },
    });
  }
}
