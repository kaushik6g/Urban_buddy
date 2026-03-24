const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { APPROVAL_POINTS } = require('../utils/points');
const { mapComplaint } = require('./complaintController');
const { generateUniqueCommunityCode } = require('../utils/community');

const ADMIN_ALLOWED_STATUS = ['Approved', 'In Progress', 'Resolved'];

const getAllComplaints = asyncHandler(async (_req, res, next) => {
  const { data, error } = await supabase
    .from('complaints')
    .select('*, users(name, email)')
    .order('created_at', { ascending: false });

  if (error) {
    return next(new ApiError(500, error.message));
  }

  return res.status(200).json({
    success: true,
    data: data.map((item) => ({
      ...mapComplaint(item),
      createdByUser: item.users
        ? {
            name: item.users.name,
            email: item.users.email,
          }
        : null,
    })),
  });
});

const updateUserPoints = async (userId, pointsToAdd) => {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, points')
    .eq('id', userId)
    .single();

  if (userError) {
    throw new Error(userError.message);
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ points: (user.points || 0) + pointsToAdd })
    .eq('id', userId);

  if (updateError) {
    throw new Error(updateError.message);
  }
};

const approveComplaint = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const { data: complaint, error: findError } = await supabase
    .from('complaints')
    .select('*')
    .eq('id', id)
    .single();

  if (findError || !complaint) {
    return next(new ApiError(404, 'Complaint not found'));
  }

  if (complaint.status !== 'Pending') {
    return next(new ApiError(400, 'Only pending complaints can be approved'));
  }

  const { data: updated, error: updateError } = await supabase
    .from('complaints')
    .update({ status: 'Approved', reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) {
    return next(new ApiError(500, updateError.message));
  }

  if (complaint.status !== 'Approved') {
    try {
      await updateUserPoints(complaint.created_by, APPROVAL_POINTS);
    } catch (error) {
      return next(new ApiError(500, error.message));
    }
  }

  return res.status(200).json({
    success: true,
    message: `Complaint approved. ${APPROVAL_POINTS} points awarded.`,
    data: mapComplaint(updated),
  });
});

const rejectComplaint = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const note = String(req.body.note || '').trim();

  if (!note) {
    return next(new ApiError(400, 'Reject note is mandatory'));
  }

  const { data: complaint, error: findError } = await supabase
    .from('complaints')
    .select('id, status')
    .eq('id', id)
    .single();

  if (findError || !complaint) {
    return next(new ApiError(404, 'Complaint not found'));
  }

  if (complaint.status !== 'Pending') {
    return next(new ApiError(400, 'Only pending complaints can be rejected'));
  }

  const { data, error } = await supabase
    .from('complaints')
    .update({
      status: 'Rejected',
      admin_note: note,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    return next(new ApiError(404, 'Complaint not found'));
  }

  return res.status(200).json({
    success: true,
    message: 'Complaint rejected',
    data: mapComplaint(data),
  });
});

const updateComplaintStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  const progressNote = String(req.body.progressNote || '').trim();

  if (!ADMIN_ALLOWED_STATUS.includes(status)) {
    return next(new ApiError(400, 'Invalid status value'));
  }

  const { data: existing, error: existingError } = await supabase
    .from('complaints')
    .select('id, status')
    .eq('id', id)
    .single();

  if (existingError || !existing) {
    return next(new ApiError(404, 'Complaint not found'));
  }

  if (existing.status === 'Pending' || existing.status === 'Rejected') {
    return next(new ApiError(400, 'Approve complaint first before updating progress status'));
  }

  const updatePayload = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (progressNote) {
    updatePayload.progress_note = progressNote;
  }

  const { data, error } = await supabase
    .from('complaints')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    return next(new ApiError(404, 'Complaint not found'));
  }

  return res.status(200).json({
    success: true,
    message: 'Complaint status updated',
    data: mapComplaint(data),
  });
});

const getMyCommunity = asyncHandler(async (req, res, next) => {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, community_id')
    .eq('id', req.user.id)
    .single();

  if (userError) {
    return next(new ApiError(500, userError.message));
  }

  if (!user.community_id) {
    return res.status(200).json({
      success: true,
      data: null,
    });
  }

  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select('id, name, code, created_at')
    .eq('id', user.community_id)
    .single();

  if (communityError) {
    return next(new ApiError(500, communityError.message));
  }

  return res.status(200).json({
    success: true,
    data: community,
  });
});

const createOrRefreshCommunityCode = asyncHandler(async (req, res, next) => {
  const requestedName = String(req.body.name || '').trim();

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, community_id, name')
    .eq('id', req.user.id)
    .single();

  if (userError) {
    return next(new ApiError(500, userError.message));
  }

  const newCode = await generateUniqueCommunityCode();

  if (!user.community_id) {
    const { data: createdCommunity, error: createError } = await supabase
      .from('communities')
      .insert({
        name: requestedName || `${user.name}'s Community`,
        code: newCode,
        created_by: user.id,
      })
      .select('id, name, code, created_at')
      .single();

    if (createError) {
      return next(new ApiError(500, createError.message));
    }

    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ community_id: createdCommunity.id })
      .eq('id', user.id);

    if (userUpdateError) {
      return next(new ApiError(500, userUpdateError.message));
    }

    return res.status(201).json({
      success: true,
      message: 'Community code created successfully',
      data: createdCommunity,
    });
  }

  const updates = { code: newCode };
  if (requestedName) {
    updates.name = requestedName;
  }

  const { data: updatedCommunity, error: updateError } = await supabase
    .from('communities')
    .update(updates)
    .eq('id', user.community_id)
    .select('id, name, code, created_at')
    .single();

  if (updateError) {
    return next(new ApiError(500, updateError.message));
  }

  return res.status(200).json({
    success: true,
    message: 'Community code regenerated',
    data: updatedCommunity,
  });
});

module.exports = {
  getAllComplaints,
  approveComplaint,
  rejectComplaint,
  updateComplaintStatus,
  getMyCommunity,
  createOrRefreshCommunityCode,
};
