import { useState } from 'react';
import { complaintApi } from '../../api/services';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Input, TextArea } from '../../components/ui/Input';

const categories = ['Pothole', 'Garbage', 'Streetlight', 'Water Leakage', 'Road Damage', 'Other'];

const ReportIssuePage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [address, setAddress] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const replaceImages = (fileList: FileList | null) => {
    setImages(Array.from(fileList || []).slice(0, 8));
  };

  const appendImages = (fileList: FileList | null) => {
    const additions = Array.from(fileList || []);
    if (!additions.length) return;
    setImages((prev) => [...prev, ...additions].slice(0, 8));
  };

  const pickCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
      },
      () => {
        setError('Location access denied. Please enter location manually.');
      }
    );
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('address', address);
      images.forEach((file) => formData.append('images', file));

      const response = await complaintApi.create(formData);
      setMessage(response.data.message || 'Complaint submitted successfully');
      setTitle('');
      setDescription('');
      setAddress('');
      setImages([]);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white/95 shadow-md">
      <h2 className="text-3xl font-black tracking-tight text-slate-900">Report a Civic Issue</h2>
      <p className="mt-1 text-sm text-slate-600">Upload proof, add details, and submit for municipal review.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Input placeholder="Issue title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <TextArea
          placeholder="Describe the issue clearly"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <div className="grid gap-4 md:grid-cols-2">
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <Input placeholder="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
            type="number"
            step="any"
          />
          <Input
            placeholder="Longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            required
            type="number"
            step="any"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={pickCurrentLocation} type="button" variant="ghost">
            Use Current Location
          </Button>

          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Take Photo
            <input
              className="hidden"
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              capture="environment"
              onChange={(e) => appendImages(e.target.files)}
            />
          </label>

          <div className="min-w-[260px]">
            <Input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              multiple
              onChange={(e) => replaceImages(e.target.files)}
            />
            <p className="mt-1 text-xs text-slate-500">Allowed formats: JPG, JPEG, PNG (max 5MB each, up to 8 files)</p>
            {!!images.length && (
              <p className="mt-1 text-xs font-medium text-sky-700">{images.length} photo(s) selected</p>
            )}
          </div>
        </div>

        {!!images.length && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Photos</p>
              <button
                className="text-xs font-semibold text-rose-600 hover:text-rose-500"
                onClick={() => setImages([])}
                type="button"
              >
                Clear
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {images.map((file, index) => (
                <p className="truncate rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600" key={`${file.name}-${index}`}>
                  {index + 1}. {file.name}
                </p>
              ))}
            </div>
          </div>
        )}

        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}

        <Button className="min-w-44" disabled={loading} type="submit">
          {loading ? 'Submitting...' : 'Submit Complaint'}
        </Button>
      </form>
    </Card>
  );
};

export default ReportIssuePage;
