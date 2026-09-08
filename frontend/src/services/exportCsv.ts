// Exports an array of objects as a UTF-8 CSV file download.
// Headers come from the keys of the first row (or an explicit header map).

export function exportToCsv(
  filename: string,
  rows: Record<string, unknown>[],
  headerMap?: Record<string, string>, // column key → display header
) {
  if (!rows.length) return

  const keys = Object.keys(rows[0])
  const headers = keys.map((k) => headerMap?.[k] ?? k)

  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str
  }

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => keys.map((k) => escape(row[k])).join(',')),
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
