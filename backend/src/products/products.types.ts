import { Field, Float, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import {
  IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

@ObjectType('Product')
export class ProductModel {
  @Field(() => ID) id: string;
  @Field() name: string;
  @Field() sku: string;
  @Field() category: string;
  @Field() unit: string;
  @Field(() => Float) price: number;
  @Field(() => Int) stock: number;
  @Field(() => Int) reorderLevel: number;
  @Field(() => String, { nullable: true }) description?: string | null;
  @Field() createdAt: Date;
  @Field() updatedAt: Date;
}

@ObjectType()
export class ProductPage {
  @Field(() => [ProductModel]) items: ProductModel[];
  @Field(() => Int) total: number;
  @Field(() => Int) page: number;
  @Field(() => Int) pageSize: number;
}

@InputType()
export class ProductInput {
  @Field() @Transform(trim)
  @IsString() @MinLength(2, { message: 'Name must be at least 2 characters.' }) @MaxLength(120)
  name: string;

  @Field() @Transform(trim)
  @Matches(/^[A-Za-z0-9][A-Za-z0-9_-]{1,39}$/, { message: 'SKU: 2-40 letters, numbers, "-" or "_".' })
  sku: string;

  @Field() @Transform(trim)
  @IsString() @MinLength(2, { message: 'Category is required.' }) @MaxLength(60)
  category: string;

  @Field() @Transform(trim)
  @IsString() @MinLength(1, { message: 'Unit is required (e.g. kg, ton, bushel).' }) @MaxLength(20)
  unit: string;

  @Field(() => Float)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Price must be a number with up to 2 decimals.' })
  @Min(0, { message: 'Price cannot be negative.' }) @Max(100_000_000)
  price: number;

  @Field(() => Int)
  @IsInt({ message: 'Stock must be a whole number.' }) @Min(0, { message: 'Stock cannot be negative.' }) @Max(1_000_000_000)
  stock: number;

  @Field(() => Int)
  @IsInt({ message: 'Reorder level must be a whole number.' }) @Min(0, { message: 'Reorder level cannot be negative.' }) @Max(1_000_000_000)
  reorderLevel: number;

  @Field(() => String, { nullable: true }) @IsOptional() @Transform(trim)
  @IsString() @MaxLength(500, { message: 'Description is limited to 500 characters.' })
  description?: string | null;
}

@InputType()
export class ProductsQueryInput {
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() @MaxLength(100) search?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() @MaxLength(60) category?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsIn(['name', 'category', 'price', 'stock', 'updatedAt'])
  sortBy?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsIn(['asc', 'desc']) sortDir?: string;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) page?: number;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) @Max(100) pageSize?: number;
}
