import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Context } from '@nestjs/graphql';
import { ProductsService } from './products.service';
import { ProductInput, ProductModel, ProductPage, ProductsQueryInput } from './products.types';

// No @Roles(): per the challenge matrix, Managers AND Store Keepers may view/add/edit.
// The global AuthGuard still requires a valid session.
@Resolver(() => ProductModel)
export class ProductsResolver {
  constructor(private products: ProductsService) {}

  @Query(() => ProductPage, { name: 'products' })
  productsList(@Args('input', { nullable: true }) input?: ProductsQueryInput) {
    return this.products.list(input ?? {});
  }

  @Query(() => [String])
  productCategories() {
    return this.products.categories();
  }

  @Query(() => ProductModel)
  product(@Args('id', { type: () => ID }) id: string) {
    return this.products.get(id);
  }

  @Mutation(() => ProductModel)
  createProduct(@Args('input') input: ProductInput, @Context() ctx: { req: { user: { id: string } } }) {
    return this.products.create(input, ctx.req.user.id);
  }

  @Mutation(() => ProductModel)
  updateProduct(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: ProductInput,
    @Context() ctx: { req: { user: { id: string } } },
  ) {
    return this.products.update(id, input, ctx.req.user.id);
  }
}
