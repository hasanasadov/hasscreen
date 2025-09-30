import { Mode, Role } from "@/types";
import { Button } from "./ui";
import { cx, glass } from "@/lib/helpers";

export function Segmented({
  role,
  setRole,
}: {
  role: Role | null;
  setRole: (r: Role) => void;
}) {
  console.log("role", role);
  return (
    <div className={cx(glass.panel, "p-1 inline-flex gap-2 mr-2")}>
      <Button
        className={
          role != "presenter" ? "" : " !bg-orange-900/10 hover:!bg-orange-900/20"
        }
        onClick={() => setRole("presenter")}
      >
        Presenter
      </Button>
      <Button
        className={role != "viewer" ? "" : "!bg-orange-900/10 hover:!bg-orange-900/20"}
        onClick={() => setRole("viewer")}
      >
        Viewer
      </Button>
    </div>
  );
}

export function SegmentedMode({
  mode,
  setMode,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
}) {
  return (
    <div className={cx(glass.panel, "p-1 inline-flex gap-2")}>
      <Button
        className={mode != "mirror" ? "" : "!bg-orange-900/10 hover:!bg-orange-900/20"}
        onClick={() => setMode("mirror")}
      >
        Mirror
      </Button>
      <Button
        className={mode != "extend" ? "" : "!bg-orange-900/10 hover:!bg-orange-900/20"}
        onClick={() => setMode("extend")}
      >
        Extend
      </Button>
    </div>
  );
}
