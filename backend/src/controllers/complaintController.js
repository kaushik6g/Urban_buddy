const fs = require('node:fs/promises');
const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { uploadImages, signedPhoto } = require('../services/storageService');

const PUBLIC_STATUSES = ['Approved', 'In Progress', 'Resolved'];

const mapComplaint = async (item) => {
  const paths = item.image_urls?.length ? item.image_urls : [item.image_url].filter(Boolean);
  const photos = await Promise.all(paths.map(signedPhoto));
  return {
  id: item.id,
  title: item.title,
  description: item.description,
  earnedPoints: item.earned_points,
  imageUrl: photos[0] || null,
  imageUrls: photos.filter(Boolean),
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
  };
};

const createComplaint = asyncHandler(async (req, res, next) => {
  const { title, description, category, latitude, longitude, address } = req.body;

  const filesFromField = Array.isArray(req.files)
    ? req.files
    : [
        ...(req.files?.images || []),
        ...(req.files?.image || []),
      ];
  const duplicateMessage = 'You already have an open complaint with this title and category at this location.';
  const { data: duplicate, error: duplicateError } = await supabase.rpc('has_active_complaint', {
    p_reporter: req.user.id, p_title: title, p_category: category,
    p_latitude: Number(latitude), p_longitude: Number(longitude),
  });
  if (duplicateError || duplicate) {
    await Promise.allSettled(filesFromField.map(file => fs.unlink(file.path)));
    if (duplicateError) return next(new ApiError(500, duplicateError.message));
    return next(new ApiError(409, duplicateMessage));
  }

  const rollbackUploads = [];
  const imageUrls = await uploadImages(filesFromField, rollbackUploads);
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
    if (error.code === '23505' && error.message?.includes('complaints_one_active_report')) {
      await Promise.allSettled(rollbackUploads.map(remove => remove()));
      return next(new ApiError(409, duplicateMessage));
    }
    return next(new ApiError(500, error.message));
  }

  return res.status(201).json({
    success: true,
    message: 'Complaint submitted and awaiting review',
    data: await mapComplaint(data),
  });
});

const parsePositiveInteger = (value, fallback) => {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const getPublicComplaints = asyncHandler(async (req, res, next) => {
  const page = parsePositiveInteger(req.query.page, 1);
  const limit = Math.min(parsePositiveInteger(req.query.limit, 10), 50);
  const offset = (page - 1) * limit;

  if (!Number.isSafeInteger(offset + limit)) {
    return next(new ApiError(400, 'Page is too large'));
  }

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
    data: await Promise.all(data.map(mapComplaint)),
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
});

const getMyComplaints = asyncHandler(async (req, res, next) => {
  const summary = req.query.view === 'summary';
  const columns = summary ? 'id,title,status,category,created_at,admin_note,progress_note' : '*';
  const { data, error } = await supabase
    .from('complaints')
    .select(columns)
    .eq('created_by', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return next(new ApiError(500, error.message));
  }

  return res.status(200).json({
    success: true,
    data: summary ? data.map(item => ({
      id: item.id,
      title: item.title,
      status: item.status,
      category: item.category,
      createdAt: item.created_at,
      rejectNote: item.admin_note || '',
      progressNote: item.progress_note || '',
    })) : await Promise.all(data.map(mapComplaint)),
  });
});

const deleteComplaint = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) {
    return next(new ApiError(400, 'Invalid complaint ID'));
  }

  const { data, error } = await supabase.rpc('archive_complaint', {
    p_id: id,
    p_owner: req.user.id,
  });

  if (error) return next(new ApiError(500, 'Could not delete complaint'));
  if (!data) return next(new ApiError(404, 'Complaint not found'));

  return res.status(204).end();
});

const getDeletedComplaints = asyncHandler(async (req, res, next) => {
  const { data, error } = await supabase
    .from('deleted_complaints')
    .select('id, title, deleted_at')
    .eq('created_by', req.user.id)
    .order('deleted_at', { ascending: false });
  if (error) return next(new ApiError(500, 'Could not load deleted complaints'));
  return res.json({ success: true, data });
});

module.exports = {
  getDeletedComplaints,
  deleteComplaint,
  createComplaint,
  getPublicComplaints,
  getMyComplaints,
  mapComplaint,
};
