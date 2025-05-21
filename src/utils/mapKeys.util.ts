interface IRelation {
  key: string;
  keyPairs: Array<[string, string]>;
}

export function mapKeys<T extends Record<string, any>>({
  items,
  keyPairs = [],
  relations = [],
}: {
  items?: T[] | T;
  keyPairs: Array<[string, string]>;
  relations?: IRelation[];
}): T[] | T {
  const keyMap: Record<string, string> = Object.fromEntries(keyPairs);

  // Chuyển đổi relations thành map để tìm kiếm nhanh hơn
  const relationsMap = new Map<string, Array<[string, string]>>();
  relations.forEach((relation) => {
    relationsMap.set(relation.key, relation.keyPairs);
  });

  // Hàm đệ quy để ánh xạ một item và các relation của nó
  const mapSingleItem = (item: any): any => {
    if (!item || typeof item !== 'object') {
      return item;
    }

    // Nếu là mảng, map từng phần tử trong mảng
    if (Array.isArray(item)) {
      return item.map((subItem) => mapSingleItem(subItem));
    }

    const mappedItem: Record<string, any> = {};

    // Xử lý các key ở cấp hiện tại
    for (const key in item) {
      const newKey = keyMap[key] || key;
      let value = item[key];

      // Kiểm tra nếu key này là một relation đã được định nghĩa
      if (relationsMap.has(key) && value && typeof value === 'object') {
        // Lấy keyPairs cho relation này
        const relationKeyPairs = relationsMap.get(key) || [];

        // Áp dụng mapping cho relation (đệ quy)
        // Nếu là mảng các relation (như 'likes' trong ví dụ)
        if (Array.isArray(value)) {
          value = value.map((item) =>
            mapKeys({
              items: item,
              keyPairs: relationKeyPairs,
              relations, // Truyền toàn bộ relations để xử lý các relation lồng nhau nếu có
            }),
          );
        } else {
          // Nếu là một đối tượng relation đơn
          value = mapKeys({
            items: value,
            keyPairs: relationKeyPairs,
            relations, // Truyền toàn bộ relations để xử lý các relation lồng nhau nếu có
          });
        }
      }

      mappedItem[newKey] = value;
    }

    return mappedItem;
  };

  // Kiểm tra nếu items là mảng
  if (Array.isArray(items)) {
    return items.map((item) => mapSingleItem(item));
  }

  // Nếu items là một đối tượng đơn, xử lý như một item
  if (items && typeof items === 'object') {
    return mapSingleItem(items);
  }

  // Nếu items là undefined, trả về mảng rỗng
  return [];
}
