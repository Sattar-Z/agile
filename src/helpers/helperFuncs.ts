import moment from 'moment'

export const getListOfYears = () => {
  const start = new Date('01 January 2018')
  const from = start.getFullYear()

  const endYear = moment().year()

  const end = new Date(`01 January ${endYear}`)
  const to = end.getFullYear()
  const arr = []

  for (let i = from; i <= to; i++) arr.push(i)

  return arr
}

export const getCurrentYear = () => {
  return moment().year()
}

interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void
  cancel: () => void
}

export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): DebouncedFunction<T> {
  let timeoutId: NodeJS.Timeout

  const debounced: DebouncedFunction<T> = (...args: Parameters<T>) => {
    clearTimeout(timeoutId)

    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }

  debounced.cancel = () => {
    clearTimeout(timeoutId)
  }

  return debounced
}

// export function debounce(func: (...args: any[]) => void, delay: number): (...args: any[]) => void {
//   let timeoutId: NodeJS.Timeout;

//   return (...args: any[]) => {
//     clearTimeout(timeoutId);

//     timeoutId = setTimeout(() => {
//       func(...args);
//     }, delay);
//   };
// }
