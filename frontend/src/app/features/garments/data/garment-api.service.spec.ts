import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { GarmentApi } from './garment-api.service';
import { GarmentDto } from './garment.models';

const dto: GarmentDto = {
  id: 1,
  name: 'White Tee',
  category: 'top',
  color_hex: '#ffffff',
  color_name: 'White',
  brand: null,
  purchase_date: null,
  purchase_price: '25.00',
  image_url: null,
  source_url: null,
  notes: null,
  occasion: 'casual',
  material: null,
  sub_type: 't-shirt',
  created_at: '2026-06-10T12:00:00Z',
};

describe('GarmentApi', () => {
  let api: GarmentApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GarmentApi, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(GarmentApi);
    http = TestBed.inject(HttpTestingController);
  });

  it('lists garments with optional category filtering and maps the response', async () => {
    const response = firstValueFrom(api.list('top'));

    const req = http.expectOne((request) =>
      request.url === '/api/garments' && request.params.get('category') === 'top',
    );
    expect(req.request.method).toBe('GET');
    req.flush([dto]);

    await expect(response).resolves.toEqual([
      expect.objectContaining({ id: 1, name: 'White Tee', purchasePrice: 25 }),
    ]);
    http.verify();
  });

  it('creates garments with the backend snake_case payload', async () => {
    const response = firstValueFrom(
      api.create({
        name: 'Wool Coat',
        category: 'outerwear',
        purchasePrice: 350,
        subType: 'coat',
      }),
    );

    const req = http.expectOne('/api/garments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Wool Coat',
      category: 'outerwear',
      purchase_price: '350',
      sub_type: 'coat',
    });
    req.flush({ ...dto, id: 2, name: 'Wool Coat', category: 'outerwear' });

    await expect(response).resolves.toMatchObject({ id: 2, name: 'Wool Coat' });
    http.verify();
  });
});
