import { useEffect, useRef, useState } from "react";
import { ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { uploadImage } from "@/lib/api/uploads";
import { getApiErrorMessage } from "@/lib/api/errors";

// Backend multipart limit is 10MB (spring.servlet.multipart.max-file-size).
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const RASTER_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

type ImageUploadFieldProps = {
  label?: string;
  /** Current image URL ("" when none). */
  value: string;
  /** Called with the uploaded URL, or "" when the image is removed. */
  onChange: (url: string) => void;
  /** Cloudinary folder, e.g. "categories". */
  folder: string;
  /** Lets the parent block saving while an upload is in flight. */
  onUploadingChange?: (uploading: boolean) => void;
  /** SVG is fine for logos; turn it off for user-facing photos like avatars. */
  allowSvg?: boolean;
  /** Rounds the preview, e.g. for avatars. */
  rounded?: boolean;
};

export default function ImageUploadField({ label = "Logo / Image", value, onChange, folder, onUploadingChange, allowSvg = true, rounded = false }: ImageUploadFieldProps) {
  const acceptedTypes = allowSvg ? [...RASTER_TYPES, "image/svg+xml"] : RASTER_TYPES;
  const typeLabel = allowSvg ? "PNG, JPG, WEBP, SVG or GIF" : "PNG, JPG, WEBP or GIF";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [localPreview, setLocalPreview] = useState("");
  const [dragging, setDragging] = useState(false);

  // Free the object URL when it's replaced or the field unmounts
  useEffect(() => () => { if (localPreview) URL.revokeObjectURL(localPreview); }, [localPreview]);

  const setUploadingState = (next: boolean) => {
    setUploading(next);
    onUploadingChange?.(next);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError("");
    if (!acceptedTypes.includes(file.type)) {
      setUploadError(`Please choose a ${typeLabel} image.`);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError("Image must be 10MB or smaller.");
      return;
    }

    setLocalPreview(URL.createObjectURL(file));
    setUploadingState(true);
    try {
      const { data } = await uploadImage(file, folder);
      onChange(data.url);
    } catch (err) {
      setUploadError(getApiErrorMessage(err));
    } finally {
      setUploadingState(false);
      setLocalPreview("");
      // Allow picking the same file again after an error
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const preview = localPreview || value;

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      {preview ? (
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 p-3">
          <div className={`relative h-20 w-20 shrink-0 overflow-hidden bg-slate-50 ${rounded ? "rounded-full" : "rounded-lg"}`}>
            <img src={preview} alt="Preview" className={rounded ? "h-full w-full object-cover" : "h-full w-full object-contain p-1"} />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Spinner size="lg" className="text-blue-600" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-700">{uploading ? "Uploading..." : "Image uploaded"}</p>
            <div className="mt-2 flex gap-2">
              <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                <RefreshCw className="h-3.5 w-3.5" /> Replace
              </button>
              <button type="button" disabled={uploading} onClick={() => { setUploadError(""); onChange(""); }} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); handleFile(event.dataTransfer.files?.[0]); }}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${
            dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50"
          }`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm"><ImagePlus className="h-5 w-5" /></span>
          <span className="text-sm font-medium text-slate-700">Click to upload or drag and drop</span>
          <span className="text-xs text-slate-400">{typeLabel} · up to 10MB</span>
        </button>
      )}
      {uploadError && <p role="alert" className="mt-1.5 text-xs text-red-600">{uploadError}</p>}
    </div>
  );
}
