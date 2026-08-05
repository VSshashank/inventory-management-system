import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { InventoryListComponent } from './inventory-list.component';

/** Matches the shape the API returns for `GET /api/items`. */
const itemsResponse = {
  data: [
    {
      id: 1,
      sku: 'ELEC-001',
      name: 'Wireless Mouse',
      description: null,
      categoryId: 1,
      unitId: 1,
      currentStock: 37,
      lowStockThreshold: 10,
      isActive: true,
      createdAt: '2026-07-01T00:00:00.000Z',
      category: { id: 1, name: 'Electronics' },
      unit: { id: 1, name: 'Piece', abbreviation: 'pcs' },
    },
    {
      id: 2,
      sku: 'OFF-002',
      name: 'Printer Ink (Black)',
      description: null,
      categoryId: 2,
      unitId: 1,
      currentStock: 2,
      lowStockThreshold: 3,
      isActive: true,
      createdAt: '2026-07-01T00:00:00.000Z',
      category: { id: 2, name: 'Office Supplies' },
      unit: { id: 1, name: 'Piece', abbreviation: 'pcs' },
    },
  ],
  pagination: { page: 1, pageSize: 100, total: 2, totalPages: 1 },
};

/** Reference-data endpoints (categories, units) return a bare list. */
const emptyListResponse = { data: [] };

/**
 * The page loads its item list plus reference data on init, and the search /
 * filter controls can fire a further list request. Answer whatever is pending
 * with the right envelope for that endpoint.
 */
function flushInitialRequests(httpMock: HttpTestingController): void {
  for (const request of httpMock.match((req) => req.url.startsWith(environment.apiBaseUrl))) {
    request.flush(request.request.url.includes('/items') ? itemsResponse : emptyListResponse);
  }
}


describe('InventoryListComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify({ ignoreCancelled: true });
  });

  it('renders the items returned by the API', async () => {
    const fixture = TestBed.createComponent(InventoryListComponent);
    fixture.detectChanges();

    flushInitialRequests(httpMock);

    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Wireless Mouse');
    expect(text).toContain('ELEC-001');
    expect(text).toContain('Printer Ink (Black)');
  });

  it('labels stock status with text as well as colour', async () => {
    const fixture = TestBed.createComponent(InventoryListComponent);
    fixture.detectChanges();

    flushInitialRequests(httpMock);

    await fixture.whenStable();
    fixture.detectChanges();

    // Status must not rely on colour alone — the ink item is below its
    // threshold and has to say so in words for non-colour-perceiving users.
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.toLowerCase()).toContain('low');
  });
});
