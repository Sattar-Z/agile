import * as XLSX from 'xlsx'

export async function convertToExcel(
  rawData: Record<string, any>[],
  fileName = 'Output.xlsx',
) {
  // Extract unique keys from rawData as column labels
  const uniqueKeys = new Set<string>()

  rawData.forEach(item => {
    Object.keys(item).forEach(key => uniqueKeys.add(key))
  })

  // Generate column labels map (key: label)
  const columnLabels: Record<string, string> = {}

  uniqueKeys.forEach(key => {
    columnLabels[key] = key
  })

  // Map raw data to only include specified labels
  const filteredData = rawData.map(item => {
    const filteredItem: Record<string, any> = {}
    for (const key in columnLabels)
      filteredItem[key] = item[key]

    return filteredItem
  })

  // Generate worksheet and workbook
  const worksheet = XLSX.utils.json_to_sheet(filteredData)
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

  // Fix headers to use column labels
  XLSX.utils.sheet_add_aoa(worksheet, [Object.values(columnLabels)], {
    origin: 'A1',
  })

  // Calculate and set column width for better readability
  const columnWidths = Array.from(uniqueKeys).map(key => ({
    wch: Math.max(
      ...filteredData.map(item =>
        item[key] ? item[key].toString().length : 0,
      ),
      key.length,
    ),
  }))

  worksheet['!cols'] = columnWidths

  // Try to create an XLSX file and save it
  try {
    XLSX.writeFile(workbook, fileName)
    console.log('Excel file created successfully.')
  }
  catch (error) {
    console.error('Error creating Excel file:', error)
  }
}
