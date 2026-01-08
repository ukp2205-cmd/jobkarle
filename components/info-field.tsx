interface InfoFieldProps {
  label: string
  value?: string | number | null
}

export function InfoField({ label, value }: InfoFieldProps) {
  if (!value) {
    return null
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-base text-gray-900">{value}</p>
    </div>
  )
}
