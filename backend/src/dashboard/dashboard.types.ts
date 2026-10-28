import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ProductModel } from '../products/products.types';

@ObjectType()
export class CategoryStat {
  @Field() category: string;
  @Field(() => Int) productCount: number;
  @Field(() => Int) stock: number;
  @Field(() => Float) value: number;
}

@ObjectType()
export class DashboardStats {
  @Field(() => Int) totalProducts: number;
  @Field(() => Int) totalCategories: number;
  @Field(() => Int) totalUnitsInStock: number;
  @Field(() => Float) inventoryValue: number;
  @Field(() => Int) lowStockCount: number;
  @Field(() => [CategoryStat]) categoryBreakdown: CategoryStat[];
  @Field(() => [ProductModel]) lowStockProducts: ProductModel[];
  @Field(() => [ProductModel]) recentUpdates: ProductModel[];
}
