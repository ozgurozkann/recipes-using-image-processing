interface Props {
  size?: "sm" | "md" | "lg";
  center?: boolean;
}

export default function Spinner({ size = "md", center = false }: Props) {
  const dim = size === "sm" ? 16 : size === "lg" ? 36 : 24;
  const cls = `spinner spinner-primary${center ? " mx-auto" : ""}`;
  return <span className={cls} role="status" aria-label="Yükleniyor" style={{ width: dim, height: dim }} />;
}

export function PageLoader() {
  return (
    <div className="page-loader">
      <Spinner size="lg" />
      <p className="text-on-surface-variant text-sm mt-3">Yükleniyor…</p>
    </div>
  );
}
