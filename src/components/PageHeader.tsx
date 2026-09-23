export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
      {description && <p className="text-sm text-ink-muted mt-0.5">{description}</p>}
    </div>
  )
}
