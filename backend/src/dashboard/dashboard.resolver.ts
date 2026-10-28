import { Query, Resolver } from '@nestjs/graphql';
import { Injectable, Module } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { Roles } from '../auth/auth.decorators';
import { DashboardStats } from './dashboard.types';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async stats(): Promise<DashboardStats> {
    // Catalogue is small; aggregate in memory (low stock compares two columns, which Prisma can't filter on).
    const products = await this.prisma.product.findMany({ orderBy: { updatedAt: 'desc' } });
    const byCat = new Map<string, { productCount: number; stock: number; value: number }>();
    let units = 0;
    let value = 0;
    for (const p of products) {
      const c = byCat.get(p.category) ?? { productCount: 0, stock: 0, value: 0 };
      c.productCount += 1;
      c.stock += p.stock;
      c.value += p.stock * p.price;
      byCat.set(p.category, c);
      units += p.stock;
      value += p.stock * p.price;
    }
    const low = products.filter((p) => p.stock <= p.reorderLevel);
    return {
      totalProducts: products.length,
      totalCategories: byCat.size,
      totalUnitsInStock: units,
      inventoryValue: Math.round(value * 100) / 100,
      lowStockCount: low.length,
      categoryBreakdown: [...byCat.entries()]
        .map(([category, s]) => ({ category, ...s, value: Math.round(s.value * 100) / 100 }))
        .sort((a, b) => b.value - a.value),
      lowStockProducts: low.sort((a, b) => a.stock - b.stock).slice(0, 5),
      recentUpdates: products.slice(0, 5),
    };
  }
}

@Resolver()
export class DashboardResolver {
  constructor(private dashboard: DashboardService) {}

  @Roles(Role.MANAGER)
  @Query(() => DashboardStats)
  dashboardStats() {
    return this.dashboard.stats();
  }
}

@Module({ providers: [DashboardService, DashboardResolver] })
export class DashboardModule {}
