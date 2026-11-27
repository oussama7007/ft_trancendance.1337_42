import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { InterestRequest } from '../chat/entities/interest-request.entity.js';
import { Listing } from '../listings/listing.entity.js';
import type { AnalyticsRange } from './dto/analytics-query.dto.js';
import { ListingView } from './listing-view.entity.js';

const DAY_MS = 86400000; // 24h b milliseconds
const RANGE_DAYS: Record<AnalyticsRange, number> = { '7d': 7, '30d': 30, '90d': 90 };
const TOP_LISTINGS_LIMIT = 5;

type Period = { start: Date; end: Date };
type Translated = { ar: string; fr: string; en: string };

export interface AnalyticsSummary {
  views: number;
  contacts: number;
  searches: number;
  activeListings: number;
}

export interface AnalyticsDashboard {
  summary: AnalyticsSummary;
  previous: AnalyticsSummary;
  daily: { date: string; views: number }[];
  topListings: { id: number; title: Translated; city: Translated; views: number }[];
}

type TopListingRow = {
  id: number;
  titleAr: string;
  titleFr: string;
  titleEn: string;
  cityAr: string;
  cityFr: string;
  cityEn: string;
  views: number;
};

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Listing) private readonly listings: Repository<Listing>,
    @InjectRepository(ListingView) private readonly views: Repository<ListingView>,
    @InjectRepository(InterestRequest) private readonly interestRequests: Repository<InterestRequest>,
  ) {}

  // Saves one view per user, per listing, per 24h. The owner is never counted.
  async recordView(listingId: number, viewerId: number): Promise<void> {
    const listing = await this.listings.findOne({
      where: { id: listingId },
      select: { id: true, ownerId: true },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    if (listing.ownerId === viewerId) {
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      // Requests from the same user on the same listing wait here one after
      // the other, so 100 requests sent at once still save a single view.
      await manager.query('SELECT pg_advisory_xact_lock($1, $2)', [listingId, viewerId]);

      const alreadyCounted = await manager.exists(ListingView, {
        where: { listingId, viewerId, createdAt: MoreThan(new Date(Date.now() - DAY_MS)) },
      });
      if (!alreadyCounted) {
        await manager.insert(ListingView, { listingId, viewerId });
      }
    });
  }

  // The period is the last N days counted in UTC days, today included.
  // "previous" is the N days just before it, so the page can show the change.
  async getDashboard(ownerId: number, range: AnalyticsRange): Promise<AnalyticsDashboard> {
    const days = RANGE_DAYS[range];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const current: Period = {
      start: new Date(today.getTime() - (days - 1) * DAY_MS),
      end: new Date(today.getTime() + DAY_MS),
    };
    const previous: Period = {
      start: new Date(current.start.getTime() - days * DAY_MS),
      end: current.start,
    };

    // Listings have no creation date, so both periods use today's count.
    const activeListings = await this.listings.count({ where: { ownerId } });

    const [summary, previousSummary, daily, topListings] = await Promise.all([
      this.summarize(ownerId, current, activeListings),
      this.summarize(ownerId, previous, activeListings),
      this.dailyViews(ownerId, current, days),
      this.topListings(ownerId, current),
    ]);

    return { summary, previous: previousSummary, daily, topListings };
  }

  private async summarize(
    ownerId: number,
    period: Period,
    activeListings: number,
  ): Promise<AnalyticsSummary> {
    const [views, contacts] = await Promise.all([
      this.views
        .createQueryBuilder('listingView')
        .innerJoin('listingView.listing', 'listing')
        .where('listing.ownerId = :ownerId', { ownerId })
        .andWhere('listingView.createdAt >= :start AND listingView.createdAt < :end', period)
        .getCount(),
      this.interestRequests
        .createQueryBuilder('request')
        .where('request.ownerId = :ownerId', { ownerId })
        .andWhere('request.createdAt >= :start AND request.createdAt < :end', period)
        .getCount(),
    ]);

    // Impressions were dropped, so searches stay at 0 for now.
    return { views, contacts, searches: 0, activeListings };
  }

  // One entry per day, oldest first. Days without views get 0.
  private async dailyViews(ownerId: number, period: Period, days: number) {
    const rows: { date: string; views: number }[] = await this.dataSource.query(
      `SELECT to_char(v."createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS "date",
              COUNT(*)::int AS "views"
         FROM "listing_views" v
         JOIN "listing" l ON l."id" = v."listingId"
        WHERE l."ownerId" = $1 AND v."createdAt" >= $2 AND v."createdAt" < $3
        GROUP BY 1`,
      [ownerId, period.start, period.end],
    );
    const viewsByDate = new Map(rows.map((row) => [row.date, row.views]));

    return Array.from({ length: days }, (_, index) => {
      const date = new Date(period.start.getTime() + index * DAY_MS).toISOString().slice(0, 10);
      return { date, views: viewsByDate.get(date) ?? 0 };
    });
  }

  private async topListings(ownerId: number, period: Period) {
    const rows: TopListingRow[] = await this.dataSource.query(
      `SELECT l."id", l."titleAr", l."titleFr", l."titleEn", l."cityAr", l."cityFr", l."cityEn",
              COUNT(v."id")::int AS "views"
         FROM "listing" l
         LEFT JOIN "listing_views" v
           ON v."listingId" = l."id" AND v."createdAt" >= $2 AND v."createdAt" < $3
        WHERE l."ownerId" = $1
        GROUP BY l."id"
        ORDER BY "views" DESC, l."id" ASC
        LIMIT $4`,
      [ownerId, period.start, period.end, TOP_LISTINGS_LIMIT],
    );

    return rows.map((row) => ({
      id: row.id,
      title: { ar: row.titleAr, fr: row.titleFr, en: row.titleEn },
      city: { ar: row.cityAr, fr: row.cityFr, en: row.cityEn },
      views: row.views,
    }));
  }
}
