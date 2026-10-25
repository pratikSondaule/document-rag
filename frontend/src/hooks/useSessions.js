import { useContext } from "react";
import { SessionsContext } from "../context/SessionsContext";

export function useSessions() {
  const ctx = useContext(SessionsContext);
  if (!ctx) throw new Error("useSessions must be used inside <SessionsProvider>");
  return ctx;
}