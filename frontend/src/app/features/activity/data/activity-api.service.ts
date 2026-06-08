import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_BASE } from '../../../core/api';
import {
  toWash,
  toWear,
  Wash,
  WashDto,
  Wear,
  WearDto,
} from './activity.models';

/** Today's date as YYYY-MM-DD in local time. */
export function today(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class ActivityApi {
  private readonly http = inject(HttpClient);
  private readonly wears = `${API_BASE}/wears`;
  private readonly washes = `${API_BASE}/washes`;

  logWear(garmentId: number, wornDate: string = today()): Observable<Wear> {
    return this.http
      .post<WearDto>(this.wears, { garment_id: garmentId, worn_date: wornDate })
      .pipe(map(toWear));
  }

  logWash(
    garmentId: number,
    washedDate: string = today(),
    method = 'machine',
  ): Observable<Wash> {
    return this.http
      .post<WashDto>(this.washes, {
        garment_id: garmentId,
        washed_date: washedDate,
        method,
      })
      .pipe(map(toWash));
  }

  listWears(garmentId: number): Observable<Wear[]> {
    const params = new HttpParams().set('garment_id', garmentId);
    return this.http
      .get<WearDto[]>(this.wears, { params })
      .pipe(map((d) => d.map(toWear)));
  }

  listWashes(garmentId: number): Observable<Wash[]> {
    const params = new HttpParams().set('garment_id', garmentId);
    return this.http
      .get<WashDto[]>(this.washes, { params })
      .pipe(map((d) => d.map(toWash)));
  }

  deleteWear(id: number): Observable<void> {
    return this.http.delete<void>(`${this.wears}/${id}`);
  }

  deleteWash(id: number): Observable<void> {
    return this.http.delete<void>(`${this.washes}/${id}`);
  }
}
