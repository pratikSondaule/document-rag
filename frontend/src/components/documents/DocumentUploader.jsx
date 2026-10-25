import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { UploadCloud } from "lucide-react";
import { documentsApi } from "../../api/documents.api";
import { getErrorMessage } from "../../utils/apiErrors";

const MAX_MB = Number(import.meta.env.VITE_MAX_UPLOAD_MB) || 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

function validate(file) {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return `${file.name} is not a PDF.`;
  if (file.size === 0) return `${file.name} is empty.`;
  if (file.size > MAX_BYTES) return `${file.name} is larger than ${MAX_MB} MB.`;
  return null;
}

export default function DocumentUploader({ onUploaded }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentName, setCurrentName] = useState("");
  const [error, setError] = useState("");

  const handleFiles = async (fileList) => {
    if (uploading) return; // block duplicate submissions
    const files = Array.from(fileList ?? []);
    if (!files.length) return;

    const invalid = files.map(validate).find(Boolean);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError("");
    setUploading(true);

    let okCount = 0;
    for (const file of files) {
      setCurrentName(file.name);
      setProgress(0);
      try {
        await documentsApi.upload(file, setProgress);
        okCount += 1;
        toast.success(`Uploaded ${file.name}`);
      } catch (err) {
        toast.error(`${file.name}: ${getErrorMessage(err, "Upload failed.")}`);
      }
    }

    setUploading(false);
    setProgress(0);
    setCurrentName("");
    if (inputRef.current) inputRef.current.value = "";
    if (okCount) await onUploaded?.();
  };

  const openPicker = () => !uploading && inputRef.current?.click();

  return (
    <div>
      <div
        role="button"
        tabIndex={uploading ? -1 : 0}
        aria-disabled={uploading}
        aria-label="Upload PDF files"
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 motion-reduce:transition-none ${
          uploading
            ? "cursor-not-allowed border-slate-200 bg-slate-50"
            : dragging
              ? "cursor-pointer border-indigo-400 bg-indigo-50"
              : "cursor-pointer border-slate-300 bg-white hover:border-indigo-300 hover:bg-slate-50"
        }`}
      >
        <div className="grid size-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
          <UploadCloud className="size-5" strokeWidth={1.75} />
        </div>

        {uploading ? (
          <div className="mt-4 w-full max-w-xs">
            <p className="truncate text-sm font-medium text-slate-900">
              Uploading {currentName}
            </p>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200"
            >
              <div
                className="h-full rounded-full bg-indigo-600 transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">{progress}%</p>
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm font-medium text-slate-900">
              Drag and drop PDFs here, or{" "}
              <span className="text-indigo-600">browse files</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              PDF only, up to {MAX_MB} MB each
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          tabIndex={-1}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
