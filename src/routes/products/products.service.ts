import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AQueries } from 'src/classes/abstracts/AQuery.abstract';
import { IResponseFindAll } from 'src/interfaces/common/response.interface';
import { CacheService } from 'src/share/cache/cache.service';
import { TTranslations } from 'src/types/translations.type';
import { generateCacheKeyAll } from 'src/utils/generateCacheKey';
import { getPaginationParams } from 'src/utils/getPaginationParams';
import { mapKeys } from 'src/utils/mapKeys.util';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import { UsersService } from '../users/users.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductEntity } from './entities/product.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly ttl = 180;

  constructor(
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>,
    private userService: UsersService,
    private categoryService: CategoriesService,
    private readonly cacheService: CacheService,
  ) {}

  private buildCategoryQueryBuilder(
    name: string,
    lang: TTranslations,
  ): { queryBuilder: SelectQueryBuilder<ProductEntity>; fields: { name: string; slug: string } } {
    const queryBuilder = this.productRepository.createQueryBuilder(name);

    //
    const fields = {
      name: `name_${lang}`,
      slug: `slug_${lang}`,
    };

    queryBuilder
      .select([
        'product.id',
        `product.name_${lang}`,
        'product.price',
        'product.stock',
        'product.numberLike',
        `product.slug_${lang}`,
        'product.createdAt',
        'product.updatedAt',
      ])
      .leftJoinAndSelect('product.createdBy', 'createdBy')
      .leftJoinAndSelect('product.updatedBy', 'updatedBy')
      .leftJoinAndSelect('product.likes', 'likes');

    //
    queryBuilder
      .leftJoin('product.category', 'category')
      .addSelect(['category.id', `category.name_${lang}`, `category.description_${lang}`, `category.slug_${lang}`]);

    queryBuilder
      .leftJoin('product.subCategory', 'subCategory')
      .addSelect([
        'subCategory.id',
        `subCategory.name_${lang}`,
        `subCategory.description_${lang}`,
        `subCategory.slug_${lang}`,
      ]);

    //
    return { queryBuilder, fields };
  }

  async create(payload: CreateProductDto, userActiveId: string): Promise<ProductEntity> {
    const { name_vi, name_en, price, stock, category, subCategory } = payload;

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
      stock,
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

    //
    try {
      this.logger.debug('DELETE - Cache');
      await this.cacheService.deleteCacheByPattern(`products:${userActiveId}`);
    } catch (error) {
      throw new InternalServerErrorException('Unable to clear cache, please try again later.');
    }

    return await this.productRepository.save(newProduct);
  }

  async findAll(
    lang: TTranslations = 'vi',
    queries: AQueries,
    userActiveId: string,
  ): Promise<IResponseFindAll<ProductEntity>> {
    const { limit, page, q } = queries;
    const { skip, take } = getPaginationParams(page, limit);

    //
    await this.userService.validateUser(userActiveId);

    // cache
    const cacheKey = generateCacheKeyAll('products', userActiveId, +page, +limit, q);
    const cachedData = await this.cacheService.getCache<IResponseFindAll<ProductEntity>>(cacheKey);
    if (cachedData) {
      this.logger.debug('GET - in cache');
      return cachedData;
    }

    //
    const { queryBuilder, fields } = this.buildCategoryQueryBuilder('product', lang);

    if (q) {
      queryBuilder.where(`product.name_${lang} LIKE :q`, {
        q: `%${q.replace(/[%_]/g, '\\$&')}%`,
      });
    }

    queryBuilder.orderBy('product.createdAt', 'DESC');
    queryBuilder.skip(skip).take(take);
    this.logger.debug('GET - in database');
    const [items, totalItems] = await queryBuilder.getManyAndCount();

    //
    const keyPairRelation: Array<[string, string]> = [
      [`name_${lang}`, 'name'],
      [`slug_${lang}`, 'slug'],
      [`description_${lang}`, 'description'],
    ];
    const _items = mapKeys({
      items: items,
      keyPairs: [
        [fields.name, 'name'],
        [fields.slug, 'slug'],
      ],
      relations: [
        {
          key: 'category',
          keyPairs: keyPairRelation,
        },
        {
          key: 'subCategory',
          keyPairs: keyPairRelation,
        },
      ],
    }) as ProductEntity[];

    //
    try {
      await this.cacheService.setCache(cacheKey, { items: _items, totalItems }, this.ttl);
      await this.cacheService.addToKeyList(`products:${userActiveId}`, cacheKey, this.ttl + 60);
    } catch (error) {
      throw new InternalServerErrorException('Could not cache, please try again later.');
    }

    //
    return { items: _items, totalItems };
  }

  async findOneById(id: string, lang: TTranslations = 'vi'): Promise<ProductEntity> {
    const { queryBuilder, fields } = this.buildCategoryQueryBuilder('product', lang);

    //
    queryBuilder.where('product.id = :id', { id });

    const product = await queryBuilder.getOne();

    //
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    //
    const keyPairRelation: Array<[string, string]> = [
      [`name_${lang}`, 'name'],
      [`slug_${lang}`, 'slug'],
      [`description_${lang}`, 'description'],
    ];
    const _item = mapKeys({
      items: product,
      keyPairs: [
        [fields.name, 'name'],
        [fields.slug, 'slug'],
      ],
      relations: [
        {
          key: 'category',
          keyPairs: keyPairRelation,
        },
        {
          key: 'subCategory',
          keyPairs: keyPairRelation,
        },
      ],
    }) as ProductEntity;

    return _item;
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
      this.logger.debug('DELETE - Cache');
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
      this.logger.debug('DELETE - Cache');
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
      product.numberLike = Math.max(0, product.numberLike - 1);
    } else {
      // Like: Add user to likes
      product.likes.push(user);
      product.numberLike = (product.numberLike || 0) + 1;
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
