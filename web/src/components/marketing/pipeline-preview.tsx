interface PreviewCandidate {
  name: string;
  score: number;
}

const COLUMNS: { label: string; candidates: PreviewCandidate[] }[] = [
  {
    label: "Triagem",
    candidates: [
      { name: "Beatriz Coutinho", score: 78 },
      { name: "Ricardo Neto", score: 65 },
    ],
  },
  {
    label: "Entrevista",
    candidates: [{ name: "Ines Ferreira", score: 91 }],
  },
  {
    label: "Oferta",
    candidates: [{ name: "Marcelo Duarte", score: 88 }],
  },
];

export function PipelinePreview() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.05] p-4 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-white/60">
          Engenheiro(a) de Software Backend
        </span>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide"
          style={{ background: "var(--hero-accent)", color: "white" }}
        >
          3 novas
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {COLUMNS.map((col) => (
          <div key={col.label} className="flex flex-col gap-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-white/40">
              {col.label}
            </p>
            {col.candidates.map((c) => (
              <div
                key={c.name}
                className="rounded-lg border border-white/10 bg-white/[0.06] px-2 py-2"
              >
                <p className="truncate text-[11px] font-medium text-white/85">
                  {c.name}
                </p>
                <p
                  className="mt-1 text-[11px] font-semibold"
                  style={{ color: "var(--hero-accent)" }}
                >
                  {c.score}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
