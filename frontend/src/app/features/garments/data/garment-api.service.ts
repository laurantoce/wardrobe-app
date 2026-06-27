import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_BASE } from '../../../core/api';
import {
  Garment,
  GarmentDto,
  GarmentInput,
  GarmentPhotoAnalysis,
  toGarment,
  toGarmentPayload,
  toPhotoAnalysis,
} from './garment.models';

@Injectable({ providedIn: 'root' })
export class GarmentApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/garments`;

  list(category?: string): Observable<Garment[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http
      .get<GarmentDto[]>(this.base, { params })
      .pipe(map((dtos) => dtos.map(toGarment)));
  }

  get(id: number): Observable<Garment> {
    return this.http.get<GarmentDto>(`${this.base}/${id}`).pipe(map(toGarment));
  }

  create(input: GarmentInput): Observable<Garment> {
    return this.http
      .post<GarmentDto>(this.base, toGarmentPayload(input))
      .pipe(map(toGarment));
  }

  update(id: number, patch: Partial<GarmentInput>): Observable<Garment> {
    return this.http
      .patch<GarmentDto>(`${this.base}/${id}`, toGarmentPayload(patch))
      .pipe(map(toGarment));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  analyzePhoto(file: File): Observable<GarmentPhotoAnalysis> {
    const form = new FormData();
    form.append('file', file);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.http
      .post<any>(`${API_BASE}/ai/analyze-garment-photo`, form)
      .pipe(map(toPhotoAnalysis));
  }

  replacePhoto(id: number, file: File): Observable<Garment> {
    const form = new FormData();
    form.append('file', file);
    return this.http.put<GarmentDto>(`${this.base}/${id}/photo`, form).pipe(map(toGarment));
  }

  deletePhoto(id: number): Observable<Garment> {
    return this.http.delete<GarmentDto>(`${this.base}/${id}/photo`).pipe(map(toGarment));
  }
}
