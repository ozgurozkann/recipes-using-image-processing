interface Props {
  size?: "sm" | "md" | "lg";
  center?: boolean;
}

export default function Spinner({ size = "md", center = false }: Props) {
  const cls = `spinner${size === "lg" ? " spinner-lg" : ""}${center ? " spinner-center" : ""}`;
  return <div className={cls} role="status" aria-label="Yükleniyor" />;
}

export function PageLoader() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 280, gap: 16 }}>
      <Spinner size="lg" />
      <p style={{ color: "var(--muted)", fontSize: 14 }}>Yükleniyor…</p>
    </div>
  );
}
