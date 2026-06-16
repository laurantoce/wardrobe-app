import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_BASE } from '../../../core/api';
import {
  CategorySpending,
  CategorySpendingDto,
  ColorUsage,
  ColorUsageDto,
  MaterialCount,
  SpendingPoint,
  SpendingPointDto,
  Summary,
  SummaryDto,
  toCategorySpending,
  toColorUsage,
  toSpendingPoint,
  toSummary,
} from './stats.models';

export interface DateRange {
  start: string | null;
  end: string | null;
}

export type Period = 'day' | 'week' | 'month' | 'year';

function rangeParams(range?: DateRange): HttpParams {
  let p = new HttpParams();
  if (range?.start) p = p.set('start', range.start);
  if (range?.end) p = p.set('end', range.end);
  return p;
}

@Injectable({ providedIn: 'root' })
export class StatsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/stats`;

  /** Wardrobe snapshot — always reflects current state, no date filter. */
  summary(): Observable<Summary> {
    return this.http.get<SummaryDto>(`${this.base}/summary`).pipe(map(toSummary));
  }

  /** Color distribution across all garments — no date filter. */
  colors(): Observable<ColorUsage[]> {
    return this.http
      .get<ColorUsageDto[]>(`${this.base}/colors`)
      .pipe(map((d) => d.map(toColorUsage)));
  }

  /** Material distribution across all garments — no date filter. */
  materials(): Observable<MaterialCount[]> {
    return this.http.get<MaterialCount[]>(`${this.base}/materials`);
  }

  spendingByCategory(range?: DateRange): Observable<CategorySpending[]> {
    return this.http
      .get<CategorySpendingDto[]>(`${this.base}/spending-by-category`, {
        params: rangeParams(range),
      })
      .pipe(map((d) => d.map(toCategorySpending)));
  }

  spendingOverTime(period: Period, range?: DateRange): Observable<SpendingPoint[]> {
    return this.http
      .get<SpendingPointDto[]>(`${this.base}/spending-over-time`, {
        params: rangeParams(range).set('period', period),
      })
      .pipe(map((d) => d.map(toSpendingPoint)));
  }
}
