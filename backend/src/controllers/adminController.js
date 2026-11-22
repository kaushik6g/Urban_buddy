const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { APPROVAL_POINTS } = require('../utils/points');
const { mapComplaint } = require('./complaintController');
const { generateUniqueCommunityCode } = require('../utils/community');

const ADMIN_ALLOWED_STATUS = ['Approved', 'In Progress', 'Resolved', 'Rejected'];

async function communityComplaints(adminId) {
  const { data: admin, error } = await supabase.from('users')
    .select('community_id').eq('id', adminId).eq('role', 'admin').maybeSingle();
  if (error) throw error;
  if (!admin?.community_id) throw new ApiError(403, 'Community administrator required');
  return { query: supabase.from('complaints').select('*, users!inner(name,email,community_id)')
    .eq('users.community_id', admin.community_id) };
}

const getAllComplaints = asyncHandler(async (req, res, next) => {
  const { query } = await communityComplaints(req.user.id);
  const { data, error } = await query
    .order('created_at', { ascending: false });

  if (error) {
    return next(new ApiError(500, error.message));
  }

  return res.status(200).json({
    success: true,
    data: await Promise.all(data.map(async (item) => ({
      ...await mapComplaint(item),
      createdByUser: item.users
        ? {
            name: item.users.name,
            email: item.users.email,
          }
        : null,
    }))),
  });
});

function reviewComplaint(decision) {
  return asyncHandler(async (req, res, next) => {
    const { query } = await communityComplaints(req.user.id);
    const { data: complaint, error } = await query.eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!complaint) return next(new ApiError(404, 'Complaint not found'));

    const status = decision || req.body.status;
    const note = String(decision === 'Rejected' ? req.body.note || '' : req.body.progressNote || '').trim();
    if (!ADMIN_ALLOWED_STATUS.includes(status) || ((!decision || decision === 'Rejected') && !note)) {
      return next(new ApiError(400, 'Valid status and review comment required'));
    }
    const eligible = decision ? complaint.status === 'Pending'
      : complaint.status !== 'Pending' && complaint.status !== 'Rejected';
    if (!eligible) return next(new ApiError(400, 'This decision is unavailable for the current status'));

    const result = await supabase.rpc('review_community_complaint', {
      p_admin: req.user.id, p_report: complaint.id, p_expected: complaint.status,
      p_status: status, p_note: note,
    }).maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return next(new ApiError(409, 'Complaint changed. Refresh before reviewing.'));
    const message = decision === 'Approved' ? `Complaint approved. ${APPROVAL_POINTS} points awarded.`
      : decision === 'Rejected' ? 'Complaint rejected' : 'Complaint status updated';
    return res.json({ success: true, message, data: await mapComplaint(result.data) });
  });
}

const approveComplaint = reviewComplaint('Approved');
const rejectComplaint = reviewComplaint('Rejected');
const updateComplaintStatus = reviewComplaint();

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
