import { Link } from "react-router-dom";
import Button from "../components/common/Button";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-medium text-indigo-600">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/app" className="mt-6 inline-block">
          <Button>Back to app</Button>
        </Link>
      </div>
    </main>
  );
}
