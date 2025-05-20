import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AQueries } from 'src/classes/abstracts/AQuery.abstract';
import { IResponseFindAll } from 'src/interfaces/common/response.interface';
import { CacheService } from 'src/share/cache/cache.service';
import { generateCacheKeyAll } from 'src/utils/generateCacheKey';
import { getPaginationParams } from 'src/utils/getPaginationParams ';
import { Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import { UsersService } from '../users/users.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductEntity } from './entities/product.entity';
import { TTranslations } from 'src/types/translations.type';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly ttl = 300;

  constructor(
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>,
    private userService: UsersService,
    private categoryService: CategoriesService,
    private readonly cacheService: CacheService,
  ) {}

  async create(payload: CreateProductDto, userActiveId: string): Promise<ProductEntity> {
    const { name_vi, name_en, price, category, subCategory } = payload;

    //
    const creator = await this.userService.validateUser(userActiveId);

    // exists
    const isExistName = await this.productRepository.existsBy({ name_vi, name_en });
    if (isExistName) {
      throw new ConflictException('Name already exists');
    }

    //
    const newProduct = this.productRepository.create({
      name_vi,
      name_en,
      price,
      createdBy: creator,
    });

    //
    if (category) {
      const _category = await this.categoryService.findOneById(category);
      if (!_category) {
        throw new NotFoundException(`Category with ID ${category} not found`);
      }
      newProduct.category = _category;
    }

    //
    if (subCategory) {
      const _subCategory = await this.categoryService.findOneById(subCategory);
      if (!_subCategory) {
        throw new NotFoundException(`SubCategory with ID ${category} not found`);
      }
      newProduct.subCategory = _subCategory;
    }

    return await this.productRepository.save(newProduct);
  }

  async findAll(
    lang: TTranslations,
    queries: AQueries,
    userActiveId: string,
  ): Promise<IResponseFindAll<ProductEntity>> {
    const { limit, page, q } = queries;
    const { skip, take } = getPaginationParams(page, limit);
    const queryBuilder = this.productRepository.createQueryBuilder('product');

    //
    await this.userService.validateUser(userActiveId);

    // cache (many cache/products)
    const cacheKey = generateCacheKeyAll('products', userActiveId, +page, +limit, q);
    const cachedData = await this.cacheService.getCache<IResponseFindAll<ProductEntity>>(cacheKey);
    this.logger.debug('GET - in cache');
    if (cachedData) return cachedData;

    //
    queryBuilder.select([
      'product.id',
      `product.name_${lang} AS name`,
      'product.price',
      'product.stock',
      `product.slug_${lang} AS slug`,
      'product.createdAt',
      'product.updatedAt',
    ]);

    queryBuilder.leftJoinAndSelect('product.createdBy', 'createdBy');
    queryBuilder.leftJoinAndSelect('product.updatedBy', 'updatedBy');
    queryBuilder.leftJoinAndSelect('product.likes', 'likes');
    queryBuilder.leftJoinAndSelect('product.category', 'category');
    queryBuilder.leftJoinAndSelect('product.subCategory', 'subCategory');

    if (q) {
      queryBuilder.where(`product.name_${lang} LIKE :q`, {
        q: `%${q.replace(/[%_]/g, '\\$&')}%`,
      });
    }

    queryBuilder.orderBy('product.createdAt', 'DESC');
    queryBuilder.skip(skip).take(take);
    const [items, totalItems] = await queryBuilder.getManyAndCount();

    //
    try {
      await this.cacheService.setCache(cacheKey, { items, totalItems }, this.ttl);
      await this.cacheService.addToKeyList(`products:${userActiveId}`, cacheKey, this.ttl + 60);
    } catch (error) {
      throw new InternalServerErrorException('Could not cache, please try again later.');
    }

    //
    return { items, totalItems };
  }

  async findOneById(id: string, lang: TTranslations = 'vi') {
    const qb = this.productRepository.createQueryBuilder('product');

    qb.select([
      'product.id',
      'product.price',
      'product.stock',
      `product.name_${lang} AS name`,
      `product.slug_${lang} AS slug`,
      'product.createdAt',
      'product.updatedAt',
    ]);

    qb.leftJoinAndSelect('product.createdBy', 'createdBy');
    qb.leftJoinAndSelect('product.updatedBy', 'updatedBy');
    qb.leftJoinAndSelect('product.category', 'category');
    qb.leftJoinAndSelect('product.subCategory', 'subCategory');
    qb.where('category.id = :id', { id });

    const product = await qb.getRawOne();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, payload: UpdateProductDto, userActiveId: string) {
    const { name_vi, name_en, price, category, subCategory } = payload;

    //
    const editor = await this.userService.validateUser(userActiveId);

    // exist
    const product = await this.productRepository.findOne({ where: { id }, relations: ['parent', 'children'] });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    //
    if (name_vi && product.name_vi !== name_vi) {
      const isExistName = await this.productRepository.existsBy({
        name_vi,
      });
      if (isExistName) {
        throw new ConflictException('Vietnamese name already exists');
      }
    }

    if (name_en && product.name_en !== name_en) {
      const isExistName = await this.productRepository.existsBy({
        name_en,
      });
      if (isExistName) {
        throw new ConflictException('English name already exists');
      }
    }

    product.name_vi = name_vi || product.name_vi;
    product.name_en = name_en || product.name_en;
    product.price = price || product.price;
    product.updatedBy = editor;

    //
    if (category !== undefined) {
      if (category === null) {
        product.category = null;
      } else {
        const _category = await this.categoryService.findOneById(category);
        if (!_category) {
          throw new NotFoundException('Category not found');
        }

        product.category = _category;
      }
    }

    //
    if (subCategory !== undefined) {
      if (subCategory === null) {
        product.subCategory = null;
      } else {
        const _subCategory = await this.categoryService.findOneById(subCategory);
        if (!_subCategory) {
          throw new NotFoundException('Category not found');
        }

        product.subCategory = _subCategory;
      }
    }

    const saveProduct = await this.productRepository.save(product);

    //
    try {
      await this.cacheService.deleteCacheByPattern(`users:${userActiveId}`);
    } catch (error) {
      throw new InternalServerErrorException('Unable to clear cache, please try again later.');
    }

    return saveProduct;
  }

  async remove(id: string, userActiveId: string) {
    //
    const exists = await this.productRepository.exists({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Product not found');
    }

    //
    await this.productRepository.delete(id);

    //
    try {
      await this.cacheService.deleteCacheByPattern(`products:${userActiveId}`);
      return true;
    } catch (error) {
      throw new InternalServerErrorException('Unable to clear cache, please try again later.');
    }
  }

  async toggleLike(
    productId: string,
    userId: string,
  ): Promise<{ action: 'liked' | 'unliked'; product: ProductEntity }> {
    //
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['likes'],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    //
    const user = await this.userService.validateUser(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasLiked = product.likes?.some((u) => u.id === userId);
    product.likes = product.likes || [];

    if (hasLiked) {
      // Unlike: Remove user from likes
      product.likes = product.likes.filter((u) => u.id !== userId);
    } else {
      // Like: Add user to likes
      product.likes.push(user);
    }

    try {
      await this.productRepository.save(product);
      // Clear cache to reflect updated likes
      await this.cacheService.deleteCacheByPattern(`products:${userId}`);
      return {
        action: hasLiked ? 'unliked' : 'liked',
        product,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Could not ${hasLiked ? 'remove' : 'add'} like, please try again later.`);
    }
  }
}
