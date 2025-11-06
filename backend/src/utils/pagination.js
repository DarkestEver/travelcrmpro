// Parse pagination parameters from request
const parsePagination = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

// Get sort parameters
const parseSort = (req, defaultSort = '-createdAt') => {
  const sortBy = req.query.sortBy || defaultSort;
  return sortBy;
};

// Get filter parameters
const parseFilters = (req, allowedFields = []) => {
  const filters = {};

  allowedFields.forEach((field) => {
    if (req.query[field]) {
      filters[field] = req.query[field];
    }
  });

  return filters;
};

// Build search query
const buildSearchQuery = (searchTerm, searchFields = []) => {
  if (!searchTerm || searchFields.length === 0) {
    return {};
  }

  return {
    $or: searchFields.map((field) => ({
      [field]: { $regex: searchTerm, $options: 'i' },
    })),
  };
};

module.exports = {
  parsePagination,
  parseSort,
  parseFilters,
  buildSearchQuery,
};
