import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SmartMart POS database seed...');

  // 1. Clean existing records in safe order
  await prisma.auditLog.deleteMany();
  await prisma.returnItem.deleteMany();
  await prisma.return.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.heldSale.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.productBatch.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.cashierShift.deleteMany();
  await prisma.taxSetting.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Store Profile
  const store = await prisma.store.create({
    data: {
      name: 'SmartMart Supermarket',
      legalName: 'SmartMart Retail Enterprises Pvt. Ltd.',
      address: '124, Commercial Boulevard, Central Market',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      phone: '+91 98765 43210',
      email: 'contact@smartmart.com',
      gstin: '29ABCDE1234F1Z5',
      currencySymbol: '₹',
      currencyCode: 'INR',
      invoicePrefix: 'SM-',
      receiptHeader: 'SmartMart Supermarket\nFresh & Quality Groceries Everyday',
      receiptFooter: 'Thank you for shopping with us!\nExchange within 7 days with original receipt.\nCustomer Support: support@smartmart.com',
      pricingMode: 'INCLUSIVE',
      allowNegativeStock: false,
      maxCashierDiscount: 10.0,
    },
  });

  // 3. Seed Users
  const passwordHash = await bcrypt.hash('Password@123', 10);
  const managerPinHash = await bcrypt.hash('1234', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@smartmart.com',
      passwordHash,
      fullName: 'Vikram Sharma (Admin)',
      phone: '+91 98765 00001',
      role: 'ADMIN',
      managerPin: managerPinHash,
      isActive: true,
    },
  });

  const cashierUser = await prisma.user.create({
    data: {
      email: 'cashier@smartmart.com',
      passwordHash,
      fullName: 'Anita Roy (Cashier)',
      phone: '+91 98765 00002',
      role: 'CASHIER',
      isActive: true,
    },
  });

  const inventoryUser = await prisma.user.create({
    data: {
      email: 'inventory@smartmart.com',
      passwordHash,
      fullName: 'Rajesh Nair (Inventory)',
      phone: '+91 98765 00003',
      role: 'INVENTORY_MANAGER',
      isActive: true,
    },
  });

  console.log('✅ Created users: Admin, Cashier, Inventory Manager');

  // 4. Seed Tax Settings
  await prisma.taxSetting.createMany({
    data: [
      { name: 'Exempt 0%', code: 'GST_0', rate: 0.0, cgstRate: 0.0, sgstRate: 0.0, igstRate: 0.0, isDefault: false },
      { name: 'GST 5%', code: 'GST_5', rate: 5.0, cgstRate: 2.5, sgstRate: 2.5, igstRate: 5.0, isDefault: true },
      { name: 'GST 12%', code: 'GST_12', rate: 12.0, cgstRate: 6.0, sgstRate: 6.0, igstRate: 12.0, isDefault: false },
      { name: 'GST 18%', code: 'GST_18', rate: 18.0, cgstRate: 9.0, sgstRate: 9.0, igstRate: 18.0, isDefault: false },
      { name: 'GST 28%', code: 'GST_28', rate: 28.0, cgstRate: 14.0, sgstRate: 14.0, igstRate: 28.0, isDefault: false },
    ],
  });

  // 5. Seed Categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Groceries & Staples', code: 'GROC', description: 'Flour, rice, grains, oil, salt, spices' } }),
    prisma.category.create({ data: { name: 'Dairy & Eggs', code: 'DAIR', description: 'Milk, butter, curd, cheese, paneer, eggs' } }),
    prisma.category.create({ data: { name: 'Beverages', code: 'BEV', description: 'Juices, soft drinks, tea, coffee, mineral water' } }),
    prisma.category.create({ data: { name: 'Snacks & Packaged Food', code: 'SNK', description: 'Chips, biscuits, instant noodles, chocolates' } }),
    prisma.category.create({ data: { name: 'Personal Care', code: 'PERS', description: 'Soaps, shampoo, toothpaste, skin care' } }),
    prisma.category.create({ data: { name: 'Household & Cleaning', code: 'HOUS', description: 'Detergents, floor cleaners, dishwash liquids' } }),
  ]);

  const catMap = Object.fromEntries(categories.map((c) => [c.code, c.id]));

  // 6. Seed Brands
  const brands = await Promise.all([
    prisma.brand.create({ data: { name: 'Fortune', description: 'Edible oils & kitchen staples' } }),
    prisma.brand.create({ data: { name: 'Tata', description: 'Salt, tea, pulses' } }),
    prisma.brand.create({ data: { name: 'Amul', description: 'The Taste of India dairy products' } }),
    prisma.brand.create({ data: { name: 'Britannia', description: 'Biscuits, bread, dairy' } }),
    prisma.brand.create({ data: { name: 'Parle', description: 'Biscuits, snacks & confectionery' } }),
    prisma.brand.create({ data: { name: 'Nestle Maggi', description: 'Instant noodles, seasonings, sauces' } }),
    prisma.brand.create({ data: { name: 'Colgate', description: 'Oral hygiene products' } }),
    prisma.brand.create({ data: { name: 'Dettol', description: 'Antiseptic soaps & handwashes' } }),
    prisma.brand.create({ data: { name: 'Surf Excel', description: 'Laundry care & detergents' } }),
    prisma.brand.create({ data: { name: 'Tropicana', description: 'Fruit juices & nectar' } }),
    prisma.brand.create({ data: { name: 'Aashirvaad', description: 'Whole wheat atta & organic staples' } }),
    prisma.brand.create({ data: { name: 'Cadbury', description: 'Chocolates & confectionery' } }),
  ]);

  const brandMap = Object.fromEntries(brands.map((b) => [b.name, b.id]));

  // 7. Seed Suppliers
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Apex FMCG Distributors',
        contactPerson: 'Suresh Menon',
        phone: '+91 94441 23456',
        email: 'orders@apexfmcg.com',
        address: 'Plot 45, Industrial Logistics Park, Bangalore',
        gstin: '29AABCA1111A1Z1',
        paymentTermsDays: 30,
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Karnataka Fresh Dairy Coop',
        contactPerson: 'Gopal Gowda',
        phone: '+91 94442 34567',
        email: 'sales@kfdairy.org',
        address: 'Dairy Circle, Bannerghatta Road, Bangalore',
        gstin: '29AABCK2222B1Z2',
        paymentTermsDays: 15,
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Metro Wholesale Supply Ltd',
        contactPerson: 'Karan Mehra',
        phone: '+91 94443 45678',
        email: 'support@metrowholesale.in',
        address: 'Warehouse Hub 8, Peenya Industrial Area, Bangalore',
        gstin: '29AABCM3333C1Z3',
        paymentTermsDays: 45,
      },
    }),
  ]);

  const supApex = suppliers[0].id;
  const supDairy = suppliers[1].id;
  const supMetro = suppliers[2].id;

  // 8. Seed 32 Realistic Products across 6 categories
  const productDefinitions = [
    // Groceries (GROC)
    {
      name: 'Aashirvaad Shudh Chakki Atta 5kg',
      barcode: '8901030383792',
      sku: 'GROC-ATT-001',
      cat: 'GROC',
      brand: 'Aashirvaad',
      supplier: supApex,
      unit: 'PACKET',
      cost: 210.0,
      selling: 255.0,
      tax: 0.0,
      stock: 45.0,
      minStock: 10.0,
      mfg: '2026-08-01',
      exp: '2027-02-01',
    },
    {
      name: 'Fortune Sunlite Refined Sunflower Oil 1L',
      barcode: '8906007280145',
      sku: 'GROC-OIL-002',
      cat: 'GROC',
      brand: 'Fortune',
      supplier: supApex,
      unit: 'PACKET',
      cost: 115.0,
      selling: 142.0,
      tax: 5.0,
      stock: 80.0,
      minStock: 20.0,
      mfg: '2026-07-15',
      exp: '2027-04-15',
    },
    {
      name: 'Tata Salt Vacuum Evaporated 1kg',
      barcode: '8901030018151',
      sku: 'GROC-SLT-003',
      cat: 'GROC',
      brand: 'Tata',
      supplier: supMetro,
      unit: 'PACKET',
      cost: 21.0,
      selling: 28.0,
      tax: 0.0,
      stock: 120.0,
      minStock: 25.0,
      mfg: '2026-06-10',
      exp: '2028-06-10',
    },
    {
      name: 'Tata Sampann Unpolished Toor Dal 1kg',
      barcode: '8901030582911',
      sku: 'GROC-DAL-004',
      cat: 'GROC',
      brand: 'Tata',
      supplier: supMetro,
      unit: 'PACKET',
      cost: 145.0,
      selling: 180.0,
      tax: 0.0,
      stock: 50.0,
      minStock: 15.0,
      mfg: '2026-08-10',
      exp: '2027-08-10',
    },
    {
      name: 'Madhur Pure & Hygienic Sugar 1kg',
      barcode: '8906014410108',
      sku: 'GROC-SUG-005',
      cat: 'GROC',
      brand: 'Fortune',
      supplier: supApex,
      unit: 'PACKET',
      cost: 42.0,
      selling: 54.0,
      tax: 5.0,
      stock: 65.0,
      minStock: 20.0,
      mfg: '2026-09-01',
      exp: '2027-09-01',
    },
    {
      name: 'Daawat Rozana Gold Basmati Rice 5kg',
      barcode: '8901537002011',
      sku: 'GROC-RIC-006',
      cat: 'GROC',
      brand: 'Fortune',
      supplier: supMetro,
      unit: 'PACKET',
      cost: 380.0,
      selling: 465.0,
      tax: 0.0,
      stock: 35.0,
      minStock: 10.0,
      mfg: '2026-05-20',
      exp: '2028-05-20',
    },

    // Dairy & Eggs (DAIR)
    {
      name: 'Amul Taaza Homogenised Toned Milk 1L',
      barcode: '8901262010054',
      sku: 'DAIR-MLK-007',
      cat: 'DAIR',
      brand: 'Amul',
      supplier: supDairy,
      unit: 'PACKET',
      cost: 58.0,
      selling: 72.0,
      tax: 0.0,
      stock: 60.0,
      minStock: 15.0,
      mfg: '2026-10-01',
      exp: '2026-12-30',
    },
    {
      name: 'Amul Butter Pasteurised 500g',
      barcode: '8901262010122',
      sku: 'DAIR-BUT-008',
      cat: 'DAIR',
      brand: 'Amul',
      supplier: supDairy,
      unit: 'PACKET',
      cost: 235.0,
      selling: 275.0,
      tax: 12.0,
      stock: 40.0,
      minStock: 10.0,
      mfg: '2026-09-15',
      exp: '2027-03-15',
    },
    {
      name: 'Amul Processed Cheese Slices 200g (10 slices)',
      barcode: '8901262020214',
      sku: 'DAIR-CHS-009',
      cat: 'DAIR',
      brand: 'Amul',
      supplier: supDairy,
      unit: 'PACKET',
      cost: 118.0,
      selling: 145.0,
      tax: 12.0,
      stock: 28.0,
      minStock: 8.0,
      mfg: '2026-08-25',
      exp: '2027-02-25',
    },
    {
      name: 'Amul Fresh Malai Paneer 200g',
      barcode: '8901262030114',
      sku: 'DAIR-PAN-010',
      cat: 'DAIR',
      brand: 'Amul',
      supplier: supDairy,
      unit: 'PACKET',
      cost: 72.0,
      selling: 92.0,
      tax: 5.0,
      stock: 22.0,
      minStock: 10.0,
      mfg: '2026-09-28',
      exp: '2026-10-28',
    },
    {
      name: 'Farm Fresh White Table Eggs (Pack of 12)',
      barcode: '8906002190012',
      sku: 'DAIR-EGG-011',
      cat: 'DAIR',
      brand: 'Amul',
      supplier: supDairy,
      unit: 'BOX',
      cost: 78.0,
      selling: 99.0,
      tax: 0.0,
      stock: 5.0, // Low stock demo!
      minStock: 12.0,
      mfg: '2026-10-02',
      exp: '2026-10-20',
    },

    // Beverages (BEV)
    {
      name: 'Tata Tea Premium 500g',
      barcode: '8901030001016',
      sku: 'BEV-TEA-012',
      cat: 'BEV',
      brand: 'Tata',
      supplier: supMetro,
      unit: 'PACKET',
      cost: 215.0,
      selling: 260.0,
      tax: 5.0,
      stock: 45.0,
      minStock: 12.0,
      mfg: '2026-07-01',
      exp: '2027-07-01',
    },
    {
      name: 'Nescafe Classic Instant Coffee Jar 100g',
      barcode: '8901058000404',
      sku: 'BEV-COF-013',
      cat: 'BEV',
      brand: 'Nestle Maggi',
      supplier: supMetro,
      unit: 'PIECE',
      cost: 290.0,
      selling: 360.0,
      tax: 18.0,
      stock: 30.0,
      minStock: 8.0,
      mfg: '2026-06-01',
      exp: '2028-06-01',
    },
    {
      name: 'Tropicana 100% Real Orange Juice 1L',
      barcode: '8902080001019',
      sku: 'BEV-JUC-014',
      cat: 'BEV',
      brand: 'Tropicana',
      supplier: supApex,
      unit: 'PACKET',
      cost: 95.0,
      selling: 130.0,
      tax: 12.0,
      stock: 24.0,
      minStock: 10.0,
      mfg: '2026-09-01',
      exp: '2027-03-01',
    },
    {
      name: 'Coca Cola Original Taste Bottle 750ml',
      barcode: '8901764012019',
      sku: 'BEV-SOD-015',
      cat: 'BEV',
      brand: 'Tropicana',
      supplier: supApex,
      unit: 'PIECE',
      cost: 32.0,
      selling: 45.0,
      tax: 28.0,
      stock: 65.0,
      minStock: 20.0,
      mfg: '2026-08-15',
      exp: '2027-02-15',
    },
    {
      name: 'Kinley Packaged Drinking Water 1L',
      barcode: '8901764031010',
      sku: 'BEV-WTR-016',
      cat: 'BEV',
      brand: 'Tata',
      supplier: supApex,
      unit: 'PIECE',
      cost: 12.0,
      selling: 20.0,
      tax: 18.0,
      stock: 150.0,
      minStock: 30.0,
      mfg: '2026-09-10',
      exp: '2027-03-10',
    },

    // Snacks & Packaged Food (SNK)
    {
      name: 'Maggi 2-Minute Masala Instant Noodles 280g (Pack of 4)',
      barcode: '8901058852461',
      sku: 'SNK-MAG-017',
      cat: 'SNK',
      brand: 'Nestle Maggi',
      supplier: supApex,
      unit: 'PACKET',
      cost: 48.0,
      selling: 60.0,
      tax: 12.0,
      stock: 90.0,
      minStock: 20.0,
      mfg: '2026-08-01',
      exp: '2027-04-01',
    },
    {
      name: 'Parle-G Original Gluco Biscuits 250g',
      barcode: '8901719101010',
      sku: 'SNK-PRL-018',
      cat: 'SNK',
      brand: 'Parle',
      supplier: supMetro,
      unit: 'PACKET',
      cost: 20.0,
      selling: 25.0,
      tax: 5.0,
      stock: 110.0,
      minStock: 25.0,
      mfg: '2026-09-05',
      exp: '2027-03-05',
    },
    {
      name: 'Britannia Good Day Butter Cookies 200g',
      barcode: '8901063012015',
      sku: 'SNK-BRT-019',
      cat: 'SNK',
      brand: 'Britannia',
      supplier: supMetro,
      unit: 'PACKET',
      cost: 35.0,
      selling: 45.0,
      tax: 12.0,
      stock: 75.0,
      minStock: 15.0,
      mfg: '2026-08-20',
      exp: '2027-02-20',
    },
    {
      name: 'Lays India\'s Magic Masala Potato Chips 50g',
      barcode: '8901491101859',
      sku: 'SNK-LAY-020',
      cat: 'SNK',
      brand: 'Parle',
      supplier: supApex,
      unit: 'PACKET',
      cost: 15.0,
      selling: 20.0,
      tax: 12.0,
      stock: 85.0,
      minStock: 20.0,
      mfg: '2026-09-12',
      exp: '2027-01-12',
    },
    {
      name: 'Cadbury Dairy Milk Silk Chocolate Bar 60g',
      barcode: '8901233024888',
      sku: 'SNK-CAD-021',
      cat: 'SNK',
      brand: 'Cadbury',
      supplier: supMetro,
      unit: 'PIECE',
      cost: 65.0,
      selling: 85.0,
      tax: 18.0,
      stock: 55.0,
      minStock: 15.0,
      mfg: '2026-07-20',
      exp: '2027-07-20',
    },
    {
      name: 'Haldiram\'s Nagpur Roasted Salted Peanuts 200g',
      barcode: '8904063200115',
      sku: 'SNK-HLD-022',
      cat: 'SNK',
      brand: 'Parle',
      supplier: supMetro,
      unit: 'PACKET',
      cost: 45.0,
      selling: 60.0,
      tax: 12.0,
      stock: 40.0,
      minStock: 10.0,
      mfg: '2026-08-10',
      exp: '2027-02-10',
    },

    // Personal Care (PERS)
    {
      name: 'Colgate Strong Teeth Dental Cream Toothpaste 200g',
      barcode: '8901314010520',
      sku: 'PERS-COL-023',
      cat: 'PERS',
      brand: 'Colgate',
      supplier: supMetro,
      unit: 'PIECE',
      cost: 95.0,
      selling: 125.0,
      tax: 18.0,
      stock: 60.0,
      minStock: 15.0,
      mfg: '2026-06-15',
      exp: '2028-06-15',
    },
    {
      name: 'Dettol Original Germ Protection Bathing Soap (Pack of 4x125g)',
      barcode: '8901396001011',
      sku: 'PERS-DET-024',
      cat: 'PERS',
      brand: 'Dettol',
      supplier: supMetro,
      unit: 'PACKET',
      cost: 165.0,
      selling: 215.0,
      tax: 18.0,
      stock: 48.0,
      minStock: 12.0,
      mfg: '2026-07-01',
      exp: '2028-07-01',
    },
    {
      name: 'Dettol Liquid Handwash Refill Pouch 675ml',
      barcode: '8901396120101',
      sku: 'PERS-DHW-025',
      cat: 'PERS',
      brand: 'Dettol',
      supplier: supMetro,
      unit: 'PACKET',
      cost: 88.0,
      selling: 119.0,
      tax: 18.0,
      stock: 35.0,
      minStock: 10.0,
      mfg: '2026-08-01',
      exp: '2028-08-01',
    },
    {
      name: 'Head & Shoulders Anti-Dandruff Shampoo Cool Menthol 340ml',
      barcode: '8901314502018',
      sku: 'PERS-HNS-026',
      cat: 'PERS',
      brand: 'Colgate',
      supplier: supMetro,
      unit: 'PIECE',
      cost: 245.0,
      selling: 320.0,
      tax: 18.0,
      stock: 25.0,
      minStock: 8.0,
      mfg: '2026-05-10',
      exp: '2028-05-10',
    },
    {
      name: 'Vaseline Intensive Care Deep Moisture Body Lotion 200ml',
      barcode: '8901030612014',
      sku: 'PERS-VAS-027',
      cat: 'PERS',
      brand: 'Dettol',
      supplier: supMetro,
      unit: 'PIECE',
      cost: 175.0,
      selling: 235.0,
      tax: 18.0,
      stock: 3.0, // Low stock demo!
      minStock: 10.0,
      mfg: '2026-06-01',
      exp: '2028-06-01',
    },

    // Household & Cleaning (HOUS)
    {
      name: 'Surf Excel Easy Wash Detergent Powder 1kg',
      barcode: '8901030025012',
      sku: 'HOUS-SRF-028',
      cat: 'HOUS',
      brand: 'Surf Excel',
      supplier: supApex,
      unit: 'PACKET',
      cost: 118.0,
      selling: 152.0,
      tax: 18.0,
      stock: 55.0,
      minStock: 15.0,
      mfg: '2026-08-01',
      exp: '2028-08-01',
    },
    {
      name: 'Surf Excel Matic Top Load Liquid Detergent 1L',
      barcode: '8901030701011',
      sku: 'HOUS-SML-029',
      cat: 'HOUS',
      brand: 'Surf Excel',
      supplier: supApex,
      unit: 'PIECE',
      cost: 195.0,
      selling: 250.0,
      tax: 18.0,
      stock: 30.0,
      minStock: 8.0,
      mfg: '2026-07-15',
      exp: '2028-07-15',
    },
    {
      name: 'Vim Dishwash Gel Lemon 750ml Bottle',
      barcode: '8901030510112',
      sku: 'HOUS-VIM-030',
      cat: 'HOUS',
      brand: 'Surf Excel',
      supplier: supApex,
      unit: 'PIECE',
      cost: 135.0,
      selling: 175.0,
      tax: 18.0,
      stock: 45.0,
      minStock: 12.0,
      mfg: '2026-08-10',
      exp: '2028-08-10',
    },
    {
      name: 'Lizol Disinfectant Surface Floor Cleaner Citrus 1L',
      barcode: '8901396301011',
      sku: 'HOUS-LIZ-031',
      cat: 'HOUS',
      brand: 'Dettol',
      supplier: supApex,
      unit: 'PIECE',
      cost: 170.0,
      selling: 220.0,
      tax: 18.0,
      stock: 40.0,
      minStock: 10.0,
      mfg: '2026-07-20',
      exp: '2028-07-20',
    },
    {
      name: 'FreshWrap Aluminium Food Foil 9m',
      barcode: '8906001010091',
      sku: 'HOUS-FOL-032',
      cat: 'HOUS',
      brand: 'Tata',
      supplier: supMetro,
      unit: 'BOX',
      cost: 85.0,
      selling: 110.0,
      tax: 18.0,
      stock: 0.0, // Out of stock demo!
      minStock: 10.0,
      mfg: '2026-04-10',
      exp: '2029-04-10',
    },
  ];

  for (const p of productDefinitions) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        barcode: p.barcode,
        sku: p.sku,
        unitType: p.unit,
        sellingPrice: p.selling,
        costPrice: p.cost,
        taxRate: p.tax,
        currentStock: p.stock,
        minStockLevel: p.minStock,
        categoryId: catMap[p.cat],
        brandId: brandMap[p.brand],
        supplierId: p.supplier,
        mfgDate: p.mfg ? new Date(p.mfg) : null,
        expiryDate: p.exp ? new Date(p.exp) : null,
      },
    });

    // Record Initial Stock Movement
    if (p.stock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          previousQuantity: 0.0,
          quantityChanged: p.stock,
          newQuantity: p.stock,
          movementType: 'INITIAL',
          reason: 'Initial store stock onboarding',
          referenceType: 'ONBOARDING',
          userId: adminUser.id,
        },
      });
    }
  }

  console.log('✅ Seeded 32 realistic supermarket products & stock movements');

  // 9. Seed Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Ramesh Kumar',
      phone: '9876543211',
      email: 'ramesh.k@gmail.com',
      address: 'Flat 302, Green Glen Apartments, Bellandur, Bangalore',
      outstandingBalance: 0.0,
      creditLimit: 5000.0,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Priya Sharma',
      phone: '9876543222',
      email: 'priya.sharma@outlook.com',
      address: 'Villa 14, Palm Meadows, Whitefield, Bangalore',
      outstandingBalance: 250.0,
      creditLimit: 10000.0,
    },
  });

  await prisma.customer.create({
    data: {
      name: 'Mohammed Ali',
      phone: '9876543233',
      email: 'ali.m@yahoo.com',
      address: '77, 4th Cross, Indiranagar, Bangalore',
      outstandingBalance: 0.0,
      creditLimit: 3000.0,
    },
  });

  console.log('✅ Seeded customers');

  // 10. Seed Cashier Shift (active for cashierUser)
  const activeShift = await prisma.cashierShift.create({
    data: {
      cashierId: cashierUser.id,
      openingCash: 2000.0,
      expectedCash: 2000.0,
      status: 'OPEN',
      notes: 'Morning shift opening float verified',
    },
  });

  // 11. Seed a Sample Completed Invoice
  const sampleProduct1 = await prisma.product.findFirst({ where: { barcode: '8901030383792' } }); // Atta
  const sampleProduct2 = await prisma.product.findFirst({ where: { barcode: '8906007280145' } }); // Oil

  if (sampleProduct1 && sampleProduct2) {
    const inv = await prisma.invoice.create({
      data: {
        invoiceNumber: 'SM-20261005-0001',
        cashierId: cashierUser.id,
        customerId: customer1.id,
        customerName: customer1.name,
        customerPhone: customer1.phone,
        subtotal: 397.0,
        itemDiscountTotal: 0.0,
        invoiceDiscountTotal: 0.0,
        discountTotal: 0.0,
        taxTotal: 6.76, // 5% on 142 is approx 6.76 inclusive
        cgstTotal: 3.38,
        sgstTotal: 3.38,
        igstTotal: 0.0,
        roundOff: 0.0,
        grandTotal: 397.0,
        amountPaid: 400.0,
        balanceDue: 0.0,
        changeReturned: 3.0,
        paymentStatus: 'PAID',
        pricingMode: 'INCLUSIVE',
        status: 'COMPLETED',
        items: {
          create: [
            {
              productId: sampleProduct1.id,
              productName: sampleProduct1.name,
              sku: sampleProduct1.sku,
              barcode: sampleProduct1.barcode,
              quantity: 1,
              unitPrice: sampleProduct1.sellingPrice,
              costPrice: sampleProduct1.costPrice,
              taxRate: sampleProduct1.taxRate,
              taxAmount: 0.0,
              lineTotal: 255.0,
            },
            {
              productId: sampleProduct2.id,
              productName: sampleProduct2.name,
              sku: sampleProduct2.sku,
              barcode: sampleProduct2.barcode,
              quantity: 1,
              unitPrice: sampleProduct2.sellingPrice,
              costPrice: sampleProduct2.costPrice,
              taxRate: sampleProduct2.taxRate,
              taxAmount: 6.76,
              cgstAmount: 3.38,
              sgstAmount: 3.38,
              lineTotal: 142.0,
            },
          ],
        },
        payments: {
          create: [
            {
              amount: 397.0,
              paymentMethod: 'CASH',
              notes: 'Cash received 400, change returned 3',
            },
          ],
        },
      },
    });

    // Update active shift cash
    await prisma.cashierShift.update({
      where: { id: activeShift.id },
      data: {
        totalCashSales: 397.0,
        expectedCash: 2397.0,
      },
    });
  }

  console.log('✅ Seeded sample invoice & active shift');
  console.log('🎉 SmartMart POS database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
