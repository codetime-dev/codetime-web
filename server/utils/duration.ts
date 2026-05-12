// Mirrors codetime-server-v3 src/utils/time.py::get_duration_text. The
// `minutes` argument is named accordingly (the Python docstring says
// milliseconds but the implementation actually treats the input as
// minutes — we preserve the behaviour).

export function getDurationText(minutes: number): string {
  let result = ''
  let remaining = Math.max(0, Math.trunc(minutes))

  if (remaining >= 60) {
    const hours = Math.floor(remaining / 60)
    result += `${hours}hr${hours > 1 ? 's' : ''}`
    remaining %= 60
  }

  if (remaining > 0) {
    if (result) result += ' '
    result += `${remaining}min${remaining > 1 ? 's' : ''}`
  }

  return result || '0mins'
}

// Mirrors controllers/users.py::get_message: append " / Day|Week|Month|
// Year" or the literal duration text when a custom window is supplied.
export function getShieldMessage(resultMinutes: number, minutes: number): string {
  let message = getDurationText(resultMinutes)
  if (minutes > 0) {
    let timeDesc = ''
    if (minutes === 60 * 24) timeDesc = 'Day'
    else if (minutes === 60 * 24 * 7) timeDesc = 'Week'
    else if (minutes === 60 * 24 * 30) timeDesc = 'Month'
    else if (minutes === 60 * 24 * 365) timeDesc = 'Year'
    else timeDesc = getDurationText(minutes)
    message += ` / ${timeDesc}`
  }
  return message
}
