import type { ProductCategory } from '@/api/product';

/**
 * Maps product categories to appropriate units (bịch, bao, gói, chiếc)
 * Based on Vietnamese product categorization standards
 */
export type ProductUnit = 'bịch' | 'bao' | 'gói' | 'chiếc';

/**
 * Category name patterns mapped to units
 * Uses case-insensitive matching
 */
const categoryUnitMap: Array<{
  patterns: string[];
  unit: ProductUnit;
}> = [
  // Bịch - thường dùng cho hạt giống, vật liệu nhỏ đóng gói
  {
    patterns: [
      'hạt giống',
      'hat giong',
      'seed',
      'giống',
      'giong',
      'hạt',
      'hat',
      'cây giống',
      'cay giong',
      'cây con',
      'cay con',
    ],
    unit: 'bịch',
  },
  // Bao - thường dùng cho phân bón, đất, vật liệu số lượng lớn
  {
    patterns: [
      'phân bón',
      'phan bon',
      'fertilizer',
      'đất',
      'dat',
      'soil',
      'cát',
      'cat',
      'sỏi',
      'soi',
      'vôi',
      'voi',
      'lime',
      'thức ăn',
      'thuc an',
      'feed',
      'nguyên liệu',
      'nguyen lieu',
      'material',
    ],
    unit: 'bao',
  },
  // Gói - thường dùng cho sản phẩm đóng gói nhỏ, thuốc, hóa chất
  {
    patterns: [
      'thuốc',
      'thuoc',
      'medicine',
      'hóa chất',
      'hoa chat',
      'chemical',
      'thuốc bảo vệ',
      'thuoc bao ve',
      'pesticide',
      'thuốc trừ sâu',
      'thuoc tru sau',
      'insecticide',
      'phụ gia',
      'phu gia',
      'additive',
      'chất phụ gia',
      'chat phu gia',
    ],
    unit: 'gói',
  },
  // Chiếc - mặc định cho thiết bị, dụng cụ, máy móc
  {
    patterns: [
      'thiết bị',
      'thiet bi',
      'equipment',
      'dụng cụ',
      'dung cu',
      'tool',
      'máy',
      'may',
      'machine',
      'camera',
      'cảm biến',
      'cam bien',
      'sensor',
      'máy móc',
      'may moc',
      'machinery',
      'thiết bị giám sát',
      'thiet bi giam sat',
      'monitoring',
      'hệ thống',
      'he thong',
      'system',
      'phụ kiện',
      'phu kien',
      'accessory',
      'linh kiện',
      'linh kien',
      'component',
    ],
    unit: 'chiếc',
  },
];

/**
 * Get product unit based on category name
 * @param category - Product category object or category name string
 * @returns Product unit (bịch, bao, gói, chiếc)
 */
export function getProductUnit(category: ProductCategory | string | null | undefined): ProductUnit {
  if (!category) {
    return 'chiếc'; // Default fallback
  }

  // Extract category name
  const categoryName = typeof category === 'string' 
    ? category 
    : category.name || '';

  if (!categoryName) {
    return 'chiếc'; // Default fallback
  }

  // Normalize category name for matching (lowercase, remove accents)
  const normalizedName = categoryName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove Vietnamese accents

  // Find matching pattern
  for (const mapping of categoryUnitMap) {
    for (const pattern of mapping.patterns) {
      if (normalizedName.includes(pattern.toLowerCase())) {
        return mapping.unit;
      }
    }
  }

  // Default fallback
  return 'chiếc';
}

/**
 * Get product unit by category ID
 * Requires categories array to look up category name
 * @param categoryId - Category ID
 * @param categories - Array of all categories
 * @returns Product unit (bịch, bao, gói, chiếc)
 */
export function getProductUnitById(
  categoryId: number | null | undefined,
  categories: ProductCategory[]
): ProductUnit {
  if (!categoryId) {
    return 'chiếc';
  }

  const category = categories.find(cat => cat.id === categoryId);
  return getProductUnit(category);
}
