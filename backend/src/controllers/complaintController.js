const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { uploadImages } = require('../services/storageService');

const PUBLIC_STATUSES = ['Approved', 'In Progress', 'Resolved'];

const mapComplaint = (item) => ({
  id: item.id,
  title: item.title,
  description: item.description,
  imageUrl: item.image_url,
  imageUrls: Array.isArray(item.image_urls) ? item.image_urls : item.image_url ? [item.image_url] : [],
  rejectNote: item.admin_note || '',
  progressNote: item.progress_note || '',
  category: item.category,
  location: {
    latitude: item.latitude,
    longitude: item.longitude,
    address: item.address || '',
  },
  status: item.status,
  createdBy: item.created_by,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const createComplaint = asyncHandler(async (req, res, next) => {
  const { title, description, category, latitude, longitude, address } = req.body;

  const { data: duplicate, error: duplicateError } = await supabase
    .from('complaints')
    .select('id')
    .eq('created_by', req.user.id)
    .eq('title', title)
    .eq('category', category)
    .in('status', ['Pending', 'Approved', 'In Progress'])
    .maybeSingle();

  if (duplicateError) {
    return next(new ApiError(500, duplicateError.message));
  }

  if (duplicate) {
    return next(new ApiError(409, 'Similar complaint already exists and is under review'));
  }

  const filesFromField = Array.isArray(req.files)
    ? req.files
    : [
        ...(req.files?.images || []),
        ...(req.files?.image || []),
      ];
  const imageUrls = await uploadImages(filesFromField);
  const primaryImageUrl = imageUrls[0] || '';

  const { data, error } = await supabase
    .from('complaints')
    .insert({
      title,
      description,
      image_url: primaryImageUrl,
      image_urls: imageUrls,
      category,
      latitude: Number(latitude),
      longitude: Number(longitude),
      address: address || '',
      created_by: req.user.id,
      status: 'Pending',
    })
    .select('*')
    .single();

  if (error) {
    return next(new ApiError(500, error.message));
  }

  return res.status(201).json({
    success: true,
    message: 'Complaint submitted and awaiting review',
    data: mapComplaint(data),
  });
});

const getPublicComplaints = asyncHandler(async (req, res, next) => {
  const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
  const limit = Number(req.query.limit) > 0 ? Math.min(Number(req.query.limit), 50) : 10;
  const offset = (page - 1) * limit;

  const category = req.query.category || null;
  const requestedStatus = req.query.status || null;
  const statuses = requestedStatus && PUBLIC_STATUSES.includes(requestedStatus)
    ? [requestedStatus]
    : PUBLIC_STATUSES;

  let query = supabase
    .from('complaints')
    .select('*', { count: 'exact' })
    .in('status', statuses)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, count, error } = await query;

  if (error) {
    return next(new ApiError(500, error.message));
  }

  return res.status(200).json({
    success: true,
    data: data.map(mapComplaint),
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
});

const getMyComplaints = asyncHandler(async (req, res, next) => {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('created_by', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return next(new ApiError(500, error.message));
  }

  return res.status(200).json({
    success: true,
    data: data.map(mapComplaint),
  });
});

module.exports = {
  createComplaint,
  getPublicComplaints,
  getMyComplaints,
  mapComplaint,
};
