import moment from 'moment'

export function getdefaultFilterDate(type = 'monthly') {
  const date = new Date()

  let from_date
  let to_date
  const year: number = date.getFullYear()
  const prevMonth: number = date.getMonth() - 1 < 0 ? 11 : date.getMonth() - 1
  const currMonth: number = date.getMonth()
  const nextMonth: number = date.getMonth() + 1

  const sevenDaysAgoFromToday
    = date.getDate() - 7 < 1 ? null : date.getDate() - 7

  if (type === 'monthly') {
    from_date = new Date(year, currMonth, 1)
    to_date = new Date(year, nextMonth, 0)
  }
  else if (type === 'weekly') {
    if (sevenDaysAgoFromToday == null) {
      const x = Math.abs(date.getDate() - 7)
      const daysInMonth = moment(new Date(year, prevMonth, 1)).daysInMonth()

      from_date = new Date(year, prevMonth, daysInMonth - x)
    }
    else {
      from_date = new Date(year, currMonth, sevenDaysAgoFromToday as number)
    }
    to_date = new Date()
  }
  const adjustedFromDate = moment(from_date).format('YYYY-MM-DD')
  const adjustedToDate = moment(to_date).format('YYYY-MM-DD')

  return {
    fromDate: from_date,
    toDate: to_date,
    adjustedFromDate,
    adjustedToDate,
  }
}
