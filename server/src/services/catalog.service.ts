import { prisma } from '../config/prisma';

export class CatalogService {
  // Categories
  static async getCategories() {
    return prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: { where: { isDeleted: false } } },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async createCategory(data: any) {
    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name: data.name }, { code: data.code }],
      },
    });
    if (existing) {
      throw { statusCode: 400, message: 'Category with this name or code already exists', isOperational: true };
    }
    return prisma.category.create({ data });
  }

  static async updateCategory(id: string, data: any) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  // Brands
  static async getBrands() {
    return prisma.brand.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: { where: { isDeleted: false } } },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async createBrand(data: any) {
    const existing = await prisma.brand.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw { statusCode: 400, message: 'Brand with this name already exists', isOperational: true };
    }
    return prisma.brand.create({ data });
  }

  static async updateBrand(id: string, data: any) {
    return prisma.brand.update({
      where: { id },
      data,
    });
  }
}
