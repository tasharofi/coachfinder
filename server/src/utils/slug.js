const generateSlug = (name) => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

const ensureUniqueSlug = async (prisma, baseSlug) => {
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.user.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
    return slug;
};

module.exports = { generateSlug, ensureUniqueSlug };
