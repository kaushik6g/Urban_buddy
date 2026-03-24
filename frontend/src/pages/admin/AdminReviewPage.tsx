import { useEffect, useState } from 'react';
import { adminApi } from '../../api/services';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import type { Complaint } from '../../types';

const statusOptions = ['Approved', 'Resolved'];
const assetBase = import.meta.env.VITE_API_ASSET_URL || 'http://localhost:5000';

const resolveImageUrl = (imageUrl?: string) => {
  if (!imageUrl) return '';
  const clean = imageUrl.trim().replace(/^['"]|['"]$/g, '');
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  if (clean.startsWith('/')) return `${assetBase}${clean}`;
  return `${assetBase}/${clean}`;
};

const AdminReviewPage = () => {
  const [items, setItems] = useState<Complaint[]>([]);
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [noteErrorById, setNoteErrorById] = useState<Record<string, string>>({});
  const [statusById, setStatusById] = useState<Record<string, string>>({});
  const [updateNoteById, setUpdateNoteById] = useState<Record<string, string>>({});
  const [imageErrorById, setImageErrorById] = useState<Record<string, boolean>>({});
  const [mapErrorById, setMapErrorById] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedPhotoById, setSelectedPhotoById] = useState<Record<string, number>>({});
  const [lightbox, setLightbox] = useState<{ complaintId: string; index: number } | null>(null);

  const load = () => {
    adminApi
      .listComplaints()
      .then((response) => {
        const list = response.data.data;
        setItems(list);
        setStatusById(
          list.reduce((acc: Record<string, string>, item: Complaint) => {
            acc[item.id] = item.status;
            return acc;
          }, {})
        );
        setImageErrorById({});
        setMapErrorById({});
        setSelectedPhotoById({});
      })
      .catch(() => setItems([]));
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    await adminApi.approveComplaint(id);
    load();
  };

  const reject = async (id: string) => {
    const note = String(noteById[id] || '').trim();
    if (!note) {
      setNoteErrorById((prev) => ({
        ...prev,
        [id]: 'Reject note is mandatory',
      }));
      return;
    }

    setNoteErrorById((prev) => ({
      ...prev,
      [id]: '',
    }));
    await adminApi.rejectComplaint(id, note);
    load();
  };

  const updateStatus = async (id: string) => {
    const status = statusById[id] || 'Approved';
    const progressNote = String(updateNoteById[id] || '').trim();
    await adminApi.updateStatus(id, status, progressNote);
    load();
  };

  const photoList = (item: Complaint) => {
    if (item.imageUrls?.length) {
      return item.imageUrls;
    }
    return item.imageUrl ? [item.imageUrl] : [];
  };

  const updateLightboxIndex = (step: number) => {
    if (!lightbox) return;
    const complaint = items.find((entry) => entry.id === lightbox.complaintId);
    if (!complaint) return;
    const photos = photoList(complaint);
    if (!photos.length) return;

    const nextIndex = (lightbox.index + step + photos.length) % photos.length;
    setLightbox({
      complaintId: lightbox.complaintId,
      index: nextIndex,
    });
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card className="border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100" key={item.id}>
          <button
            className="w-full text-left"
            onClick={() => {
              setActiveId((prev) => (prev === item.id ? null : item.id));
              setSelectedPhotoById((prev) => ({
                ...prev,
                [item.id]: prev[item.id] ?? 0,
              }));
            }}
            type="button"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xl font-black tracking-tight text-white">{item.title}</h3>
                <p className="text-sm text-slate-300">
                  {item.createdByUser?.name} ({item.createdByUser?.email})
                </p>
                <p className="mt-1 inline-flex rounded-full border border-cyan-900/40 bg-cyan-950/40 px-2 py-0.5 text-xs font-semibold tracking-wide text-cyan-300">
                  {item.category}
                </p>
              </div>
              <div className="text-right">
                <Badge text={item.status} />
                <p className="mt-2 text-xs text-slate-400">{activeId === item.id ? 'Hide details' : 'Click to view details'}</p>
              </div>
            </div>
          </button>

          {activeId === item.id && (
            <>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.description}</p>

              <div className="mt-4 grid gap-3 xl:grid-cols-[1.1fr_1fr]">
                <div className="rounded-xl border border-slate-700 bg-slate-950 p-2">
                  <p className="mb-2 px-1 text-xs uppercase tracking-wide text-slate-400">Photos</p>
                  {photoList(item).length > 0 ? (
                    <>
                      {(() => {
                        const selected = Math.min(
                          selectedPhotoById[item.id] || 0,
                          Math.max(photoList(item).length - 1, 0)
                        );
                        const selectedUrl = photoList(item)[selected];
                        const selectedKey = `${item.id}-${selected}`;
                        const selectedFailed = imageErrorById[selectedKey];

                        return (
                          <>
                            <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
                              {!selectedFailed ? (
                                <button
                                  className="block h-64 w-full bg-black sm:h-72"
                                  onClick={() => setLightbox({ complaintId: item.id, index: selected })}
                                  type="button"
                                >
                                  <img
                                    alt={`${item.title}-${selected + 1}`}
                                    className="h-64 w-full object-contain sm:h-72"
                                    src={resolveImageUrl(selectedUrl)}
                                    onError={() =>
                                      setImageErrorById((prev) => ({
                                        ...prev,
                                        [selectedKey]: true,
                                      }))
                                    }
                                  />
                                </button>
                              ) : (
                                <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-slate-500 sm:h-72">
                                  <p>Selected photo unavailable</p>
                                  <a
                                    className="text-cyan-300 hover:text-cyan-200"
                                    href={resolveImageUrl(selectedUrl)}
                                    rel="noreferrer"
                                    target="_blank"
                                  >
                                    Open image directly
                                  </a>
                                </div>
                              )}
                            </div>

                            {photoList(item).length > 1 && (
                              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                                {photoList(item).map((photoUrl, index) => (
                                  <button
                                    className={`shrink-0 overflow-hidden rounded-lg border ${
                                      index === selected ? 'border-cyan-400' : 'border-slate-700'
                                    }`}
                                    key={`${item.id}-thumb-${index}`}
                                    onClick={() =>
                                      setSelectedPhotoById((prev) => ({
                                        ...prev,
                                        [item.id]: index,
                                      }))
                                    }
                                    type="button"
                                  >
                                    <img
                                      alt={`${item.title}-thumb-${index + 1}`}
                                      className="h-16 w-24 object-cover"
                                      src={resolveImageUrl(photoUrl)}
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="flex h-28 items-center justify-center text-sm text-slate-500">No photos uploaded</div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Location</p>
                  <p className="mt-1 text-sm text-slate-200">{item.location.address || 'Address not provided'}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Lat: {item.location.latitude} | Lng: {item.location.longitude}
                  </p>

                  {!mapErrorById[item.id] ? (
                    <iframe
                      className="mt-3 h-64 w-full rounded-lg border border-slate-700 sm:h-72"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${item.location.latitude},${item.location.longitude}&z=15&output=embed`}
                      title={`map-${item.id}`}
                      onError={() =>
                        setMapErrorById((prev) => ({
                          ...prev,
                          [item.id]: true,
                        }))
                      }
                    />
                  ) : (
                    <a
                      className="mt-3 inline-block text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                      href={`https://www.google.com/maps?q=${item.location.latitude},${item.location.longitude}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open location in Maps
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.status === 'Pending' && (
                  <div className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Decision</p>
                    <p className="mt-1 text-sm text-slate-300">Choose whether to accept or reject this issue first.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button className="rounded-xl" variant="secondary" onClick={() => approve(item.id)}>
                        Accept Issue
                      </Button>
                      <Button className="rounded-xl" variant="danger" onClick={() => reject(item.id)}>
                        Reject Issue
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {item.status === 'Pending' && (
                <>
                  <input
                    className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
                    placeholder="Reject note (mandatory)"
                    value={noteById[item.id] || ''}
                    onChange={(e) => {
                      setNoteById((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }));
                      setNoteErrorById((prev) => ({
                        ...prev,
                        [item.id]: '',
                      }));
                    }}
                  />
                  {!!noteErrorById[item.id] && (
                    <p className="mt-1 text-xs font-semibold text-rose-400">{noteErrorById[item.id]}</p>
                  )}
                </>
              )}

              {item.status !== 'Pending' && item.status !== 'Rejected' && (
                <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Update Status</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Share a clear status and optional update comment for the user.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-[220px_1fr]">
                    <select
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200"
                      value={statusById[item.id] || item.status}
                      onChange={(e) =>
                        setStatusById((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                    >
                      {item.status === 'In Progress' && (
                        <option value="In Progress">In Progress</option>
                      )}
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
                      placeholder="Add update comment (for example: Team assigned, work starts tomorrow)"
                      value={updateNoteById[item.id] || ''}
                      onChange={(e) =>
                        setUpdateNoteById((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="mt-3">
                    <Button className="rounded-xl" variant="secondary" onClick={() => updateStatus(item.id)}>
                      Save Update
                    </Button>
                  </div>
                  {item.progressNote && (
                    <p className="mt-3 rounded-lg border border-cyan-900/40 bg-cyan-950/40 px-3 py-2 text-sm text-cyan-200">
                      Latest update: {item.progressNote}
                    </p>
                  )}
                </div>
              )}

              {item.status === 'Rejected' && item.rejectNote && (
                <div className="mt-4 rounded-xl border border-rose-900/50 bg-rose-950/30 p-3 text-sm text-rose-200">
                  <span className="font-semibold">Reject Note:</span> {item.rejectNote}
                </div>
              )}
            </>
          )}
        </Card>
      ))}
      {!items.length && (
        <Card className="border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300">
          No complaints available.
        </Card>
      )}

      {lightbox && (() => {
        const complaint = items.find((entry) => entry.id === lightbox.complaintId);
        if (!complaint) return null;
        const photos = photoList(complaint);
        if (!photos.length) return null;
        const safeIndex = Math.min(lightbox.index, photos.length - 1);
        const currentUrl = resolveImageUrl(photos[safeIndex]);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4" onClick={() => setLightbox(null)}>
            <div className="relative w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
              <img alt="Complaint preview" className="max-h-[82vh] w-full rounded-xl object-contain" src={currentUrl} />
              <button
                className="absolute right-3 top-3 rounded-md bg-black/60 px-3 py-1.5 text-sm font-semibold text-white hover:bg-black/80"
                onClick={() => setLightbox(null)}
                type="button"
              >
                Close
              </button>
              {photos.length > 1 && (
                <>
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md bg-black/60 px-3 py-2 text-white hover:bg-black/80"
                    onClick={() => updateLightboxIndex(-1)}
                    type="button"
                  >
                    Prev
                  </button>
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-black/60 px-3 py-2 text-white hover:bg-black/80"
                    onClick={() => updateLightboxIndex(1)}
                    type="button"
                  >
                    Next
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminReviewPage;
