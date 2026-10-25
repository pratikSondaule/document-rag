import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import toast from "react-hot-toast";
import { Pencil, Trash2 } from "lucide-react";
import { useSessions } from "../../hooks/useSessions";
import { getErrorMessage } from "../../utils/apiErrors";
import Button from "../common/Button";
import ConfirmDialog from "../common/ConfirmDialog";
import Input from "../common/Input";
import Modal from "../common/Modal";

function RenameSessionModal({ session, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(session?.title ?? "");
    setError("");
    setSaving(false);
  }, [session]);

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const next = title.trim();
    if (!next) return setError("Enter a name.");
    if (next === session.title) return onClose();
    setSaving(true);
    try {
      await onSubmit(next);
    } catch (err) {
      setError(getErrorMessage(err, "Could not rename this conversation."));
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!session}
      onClose={onClose}
      title="Rename conversation"
      dismissible={!saving}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="rename-session-form" loading={saving}>
            Save
          </Button>
        </div>
      }
    >
      <form id="rename-session-form" onSubmit={submit} noValidate>
        <Input
          label="Name"
          data-autofocus
          value={title}
          maxLength={120}
          onChange={(e) => {
            setTitle(e.target.value);
            setError("");
          }}
          error={error}
        />
      </form>
    </Modal>
  );
}

export default function SessionList({ onNavigate }) {
  const { sessions, loading, error, refresh, rename, remove } = useSessions();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const activeId = location.pathname === "/app" ? params.get("session") : null;

  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const submitRename = async (title) => {
    await rename(renameTarget.id, title);
    toast.success("Conversation renamed.");
    setRenameTarget(null);
  };

  const confirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await remove(deleteTarget.id);
      toast.success("Conversation deleted.");
      if (deleteTarget.id === activeId) navigate("/app");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete this conversation."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col px-3 pt-5">
      <h2 className="px-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        Recent
      </h2>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto pb-2">
        {loading ? (
          <div className="space-y-2 px-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-8 animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : error ? (
          <div className="px-3 text-sm text-slate-500">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => refresh()}
              className="mt-1 font-medium text-indigo-600 hover:text-indigo-700"
            >
              Try again
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <p className="px-3 text-sm text-slate-400">No conversations yet.</p>
        ) : (
          <ul className="space-y-0.5">
            {sessions.map((s) => {
              const active = s.id === activeId;
              return (
                <li key={s.id} className="group relative">
                  <Link
                    to={`/app?session=${encodeURIComponent(s.id)}`}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-9 items-center rounded-lg pl-3 pr-16 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600 motion-reduce:transition-none ${
                      active
                        ? "bg-indigo-50 font-medium text-indigo-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate">{s.title}</span>
                  </Link>
                  <div className="absolute inset-y-0 right-1 flex items-center gap-0.5 lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setRenameTarget(s)}
                      aria-label={`Rename ${s.title}`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-indigo-600"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(s)}
                      aria-label={`Delete ${s.title}`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-red-600 focus-visible:outline-2 focus-visible:outline-indigo-600"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <RenameSessionModal
        session={renameTarget}
        onClose={() => setRenameTarget(null)}
        onSubmit={submitRename}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete conversation?"
        description={`"${deleteTarget?.title ?? ""}" and its messages will be permanently deleted.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
