import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { gqlError } from '../common/errors';
import { ProductInput, ProductsQueryInput } from './products.types';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async list(q: ProductsQueryInput = {}) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 10;
    const search = q.search?.trim();
    const where: Prisma.ProductWhereInput = {
      ...(q.category ? { category: q.category } : {}),
      ...(search
        ? { OR: [{ name: { contains: search } }, { sku: { contains: search } }, { category: { contains: search } }] }
        : {}),
    };
    const orderBy = { [q.sortBy ?? 'updatedAt']: q.sortDir ?? 'desc' } as Prisma.ProductOrderByWithRelationInput;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.product.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async categories() {
    const rows = await this.prisma.product.findMany({ distinct: ['category'], select: { category: true }, orderBy: { category: 'asc' } });
    return rows.map((r) => r.category);
  }

  async get(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw gqlError('Product not found.', 'NOT_FOUND');
    return p;
  }

  private async assertSkuFree(sku: string, exceptId?: string) {
    const clash = await this.prisma.product.findUnique({ where: { sku } });
    if (clash && clash.id !== exceptId) {
      throw gqlError('Please fix the highlighted fields.', 'BAD_USER_INPUT', { fields: { sku: 'This SKU is already in use.' } });
    }
  }

  private data(input: ProductInput, userId: string) {
    return { ...input, description: input.description?.trim() || null, updatedById: userId };
  }

  async create(input: ProductInput, userId: string) {
    await this.assertSkuFree(input.sku);
    return this.prisma.product.create({ data: this.data(input, userId) });
  }

  async update(id: string, input: ProductInput, userId: string) {
    await this.get(id);
    await this.assertSkuFree(input.sku, id);
    return this.prisma.product.update({ where: { id }, data: this.data(input, userId) });
  }
}
