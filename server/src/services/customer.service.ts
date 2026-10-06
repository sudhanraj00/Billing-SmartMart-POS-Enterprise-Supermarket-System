import { prisma } from '../config/prisma';

export class CustomerService {
  static async searchCustomers(query?: string) {
    const where: any = { isActive: true };
    if (query && query.trim().length > 0) {
      const q = query.trim();
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
      ];
    }
    return prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 25,
    });
  }

  static async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            grandTotal: true,
            paymentStatus: true,
            status: true,
          },
          orderBy: { invoiceDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw { statusCode: 404, message: 'Customer not found', isOperational: true };
    }

    return customer;
  }

  static async createCustomer(data: any) {
    const phone = data.phone.trim();
    const existing = await prisma.customer.findUnique({ where: { phone } });
    if (existing) {
      throw { statusCode: 400, message: 'Customer with this phone number already exists', isOperational: true };
    }

    return prisma.customer.create({
      data: {
        name: data.name.trim(),
        phone,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        gstin: data.gstin?.trim() || null,
        creditLimit: data.creditLimit || 5000,
      },
    });
  }

  static async updateCustomer(id: string, data: any) {
    return prisma.customer.update({
      where: { id },
      data,
    });
  }
}
