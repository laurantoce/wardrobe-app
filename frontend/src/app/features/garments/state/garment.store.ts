import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiError } from '../../../core/error.interceptor';
import { GarmentApi } from '../data/garment-api.service';
import { Garment, GarmentInput } from '../data/garment.models';

@Injectable({ providedIn: 'root' })
export class GarmentStore {
  private readonly api = inject(GarmentApi);

  readonly entities = signal<Garment[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly category = signal<string | null>(null);

  readonly count = computed(() => this.entities().length);
  readonly totalValue = computed(() =>
    this.entities().reduce((sum, g) => sum + (g.purchasePrice ?? 0), 0),
  );

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const items = await firstValueFrom(this.api.list(this.category() ?? undefined));
      this.entities.set(items);
      this.loading.set(false);
    } catch (e) {
      this.loading.set(false);
      this.error.set((e as ApiError).message);
    }
  }

  setCategory(category: string | null): Promise<void> {
    this.category.set(category);
    return this.load();
  }

  async add(input: GarmentInput): Promise<Garment> {
    const created = await firstValueFrom(this.api.create(input));
    this.entities.update((items) => [...items, created]);
    return created;
  }

  async update(id: number, patch: Partial<GarmentInput>): Promise<void> {
    const updated = await firstValueFrom(this.api.update(id, patch));
    this.entities.update((items) => items.map((item) => item.id === id ? updated : item));
  }

  async remove(id: number): Promise<void> {
    await firstValueFrom(this.api.remove(id));
    this.entities.update((items) => items.filter((item) => item.id !== id));
  }
}
