import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_BASE } from '../../../core/api';
import {
  ActivityPoint,
  ActivityPointDto,
  CategorySpending,
  CategorySpendingDto,
  ColorUsage,
  ColorUsageDto,
  GarmentUsage,
  GarmentUsageDto,
  SpendingPoint,
  SpendingPointDto,
  Summary,
  SummaryDto,
  toActivityPoint,
  toCategorySpending,
  toColorUsage,
  toGarmentUsage,
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

  summary(range?: DateRange): Observable<Summary> {
    return this.http
      .get<SummaryDto>(`${this.base}/summary`, { params: rangeParams(range) })
      .pipe(map(toSummary));
  }

  spendingByCategory(range?: DateRange): Observable<CategorySpending[]> {
    return this.http
      .get<CategorySpendingDto[]>(`${this.base}/spending-by-category`, {
        params: rangeParams(range),
      })
      .pipe(map((d) => d.map(toCategorySpending)));
  }

  colors(): Observable<ColorUsage[]> {
    return this.http
      .get<ColorUsageDto[]>(`${this.base}/colors`)
      .pipe(map((d) => d.map(toColorUsage)));
  }

  mostWorn(limit = 5, range?: DateRange): Observable<GarmentUsage[]> {
    return this.http
      .get<GarmentUsageDto[]>(`${this.base}/most-worn`, {
        params: rangeParams(range).set('limit', limit),
      })
      .pipe(map((d) => d.map(toGarmentUsage)));
  }

  mostWashed(limit = 5, range?: DateRange): Observable<GarmentUsage[]> {
    return this.http
      .get<GarmentUsageDto[]>(`${this.base}/most-washed`, {
        params: rangeParams(range).set('limit', limit),
      })
      .pipe(map((d) => d.map(toGarmentUsage)));
  }

  spendingOverTime(period: Period, range?: DateRange): Observable<SpendingPoint[]> {
    return this.http
      .get<SpendingPointDto[]>(`${this.base}/spending-over-time`, {
        params: rangeParams(range).set('period', period),
      })
      .pipe(map((d) => d.map(toSpendingPoint)));
  }

  activityOverTime(period: Period, range?: DateRange): Observable<ActivityPoint[]> {
    return this.http
      .get<ActivityPointDto[]>(`${this.base}/activity-over-time`, {
        params: rangeParams(range).set('period', period),
      })
      .pipe(map((d) => d.map(toActivityPoint)));
  }
}
