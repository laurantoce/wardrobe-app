import { describe, expect, it } from 'vitest';

import { GarmentDto, toGarment, toGarmentPayload, toPhotoAnalysis } from './garment.models';

const dto: GarmentDto = {
  id: 12,
  name: 'Linen Shirt',
  category: 'top',
  color_hex: '#ffffff',
  color_name: 'White',
  brand: 'Acme',
  purchase_date: '2026-06-01',
  purchase_price: '89.50',
  image_url: 'http://cdn/shirt.jpg',
  source_url: 'http://shop/item',
  notes: 'Relaxed fit',
  occasion: 'work',
  material: [{ material: 'linen', pct: 100 }],
  sub_type: 'shirt',
  created_at: '2026-06-10T12:00:00Z',
};

describe('garment mappers', () => {
  it('maps backend DTOs to camelCase domain models', () => {
    expect(toGarment(dto)).toEqual({
      id: 12,
      name: 'Linen Shirt',
      category: 'top',
      colorHex: '#ffffff',
      colorName: 'White',
      brand: 'Acme',
      purchaseDate: '2026-06-01',
      purchasePrice: 89.5,
      imageUrl: 'http://cdn/shirt.jpg',
      sourceUrl: 'http://shop/item',
      notes: 'Relaxed fit',
      occasion: 'work',
      material: [{ material: 'linen', pct: 100 }],
      subType: 'shirt',
      createdAt: '2026-06-10T12:00:00Z',
    });
  });

  it('maps form input to backend payload without sending omitted fields', () => {
    expect(
      toGarmentPayload({
        name: 'Black Jeans',
        category: 'bottom',
        colorHex: '',
        purchasePrice: 120,
        material: [],
        subType: '',
      }),
    ).toEqual({
      name: 'Black Jeans',
      category: 'bottom',
      color_hex: null,
      purchase_price: '120',
      material: null,
      sub_type: null,
    });
  });

  it('maps AI photo analysis DTOs and preserves nullable fields', () => {
    expect(
      toPhotoAnalysis({
        image_url: null,
        name: 'Blazer',
        category: 'outerwear',
        sub_type: 'blazer',
        brand: null,
        color_name: 'Navy',
        occasion: 'formal',
        material: [{ material: 'wool', pct: null }],
        purchase_price: '199.99',
        notes: null,
      }),
    ).toMatchObject({
      imageUrl: null,
      subType: 'blazer',
      purchasePrice: 199.99,
      material: [{ material: 'wool', pct: null }],
    });
  });
});
