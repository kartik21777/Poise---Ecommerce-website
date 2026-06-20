export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w-]+/g, '')    // Remove all non-word chars
    .replace(/--+/g, '-');      // Replace multiple - with single -
};

export const generateUniqueSlug = async (model: any, baseSlug: string, excludeId?: string): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;
  const query: any = { slug };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  while (await model.findOne(query)) {
    slug = `${baseSlug}-${counter}`;
    query.slug = slug;
    counter++;
  }

  return slug;
};

