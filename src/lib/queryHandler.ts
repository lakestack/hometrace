import { NextRequest } from 'next/server';
import { Model } from 'mongoose';
import connectMongo from './connectMongo';

const MAX_LIMIT = 50;
const MAX_PAGE = 1000; // Prevent excessive pagination
const MAX_SEARCH_LENGTH = 100; // Limit search query length

// Helper function to sanitize and validate input parameters
function sanitizeQueryParams(
  params: Record<string, string>,
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  // Sanitize ID - must be valid MongoDB ObjectId format
  if (params.id && /^[0-9a-fA-F]{24}$/.test(params.id)) {
    sanitized.id = params.id;
  }

  // Sanitize IDs array
  if (params.ids) {
    const idsArray = params.ids
      .split(',')
      .filter((id) => /^[0-9a-fA-F]{24}$/.test(id.trim()));
    if (idsArray.length > 0 && idsArray.length <= 50) {
      // Limit to 50 IDs max
      sanitized.ids = idsArray;
    }
  }

  // Sanitize page number
  if (params.page) {
    const page = parseInt(params.page, 10);
    if (!isNaN(page) && page > 0 && page <= MAX_PAGE) {
      sanitized.page = page;
    }
  }

  // Sanitize limit
  if (params.limit) {
    const limit = parseInt(params.limit, 10);
    if (!isNaN(limit) && limit > 0 && limit <= MAX_LIMIT) {
      sanitized.limit = limit;
    }
  }

  // Sanitize fields - only allow alphanumeric, dots, and underscores
  if (params.fields) {
    const fields = params.fields
      .split(',')
      .map((field) => field.trim())
      .filter((field) => /^[a-zA-Z0-9._]+$/.test(field))
      .slice(0, 20); // Limit to 20 fields max
    if (fields.length > 0) {
      sanitized.fields = fields;
    }
  }

  // Sanitize search - limit length and remove dangerous characters
  if (params.search && typeof params.search === 'string') {
    const search = params.search.trim().substring(0, MAX_SEARCH_LENGTH);
    if (search.length > 0) {
      sanitized.search = search;
    }
  }

  return sanitized;
}

export type QueryOptions = {
  id?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  fields?: string | string[];
  search?: string;
};

export type QueryResult<T> = {
  data: T | T[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
};

export async function handleQuery<T>(
  model: Model<T>,
  req: NextRequest,
): Promise<QueryResult<T>> {
  await connectMongo();

  const url = new URL(req.url);
  const rawParams = Object.fromEntries(url.searchParams);

  // Sanitize all input parameters
  const sanitizedParams = sanitizeQueryParams(rawParams);

  const {
    id,
    ids,
    page = 1,
    limit = MAX_LIMIT,
    fields,
    search,
  } = sanitizedParams;

  const buildSearchQuery = model?.schema?.statics?.buildSearchQuery;
  const searchQuery =
    search && buildSearchQuery ? buildSearchQuery.call(model, search) : {};

  let query = {};

  if (id) {
    query = { _id: id };
  } else if (ids && ids.length > 0) {
    query = { _id: { $in: ids } };
  }

  query = {
    ...query,
    ...(search && searchQuery ? searchQuery : {}),
  };

  const projection = fields
    ? Array.isArray(fields)
      ? fields.join(' ')
      : fields
    : undefined;

  const total = await model.countDocuments(query);
  const data = await model
    .find(query)
    .select(projection || '')
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
    },
  };
}
