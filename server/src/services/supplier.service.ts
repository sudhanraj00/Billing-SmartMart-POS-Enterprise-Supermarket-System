import { prisma } from '../config/prisma';

export class SupplierService {
  static async getSuppliers() {
    return prisma.supplier.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: { where: { isDeleted: false } }, purchases: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async createSupplier(data: any) {
    return prisma.supplier.create({ data });
  }

  static async updateSupplier(id: string, data: any) {
    return prisma.supplier.update({
      where: { id },
      data,
    });
  }
}
