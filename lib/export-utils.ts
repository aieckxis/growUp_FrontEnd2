export const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const csvContent = [headers, ...rows]
    .map(row => row.join(","))
    .join("\n")
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const formatDate = (date: Date = new Date()) => {
  return date.toISOString().split("T")[0] // YYYY-MM-DD
}