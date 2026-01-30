/**
 * Converts a timestamp to a human-readable relative time string
 * @param dateString - ISO timestamp string
 * @returns Relative time string (e.g., "2 mins ago", "5 hrs ago", "3 days ago")
 */
export function getTimeAgo(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const diffInMs = now - then

  // Convert to different units
  const minutes = Math.floor(diffInMs / (1000 * 60))
  const hours = Math.floor(diffInMs / (1000 * 60 * 60))
  const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  // Return appropriate format based on time elapsed
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "min" : "mins"} ago`
  if (hours < 24) return `${hours} ${hours === 1 ? "hr" : "hrs"} ago`
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`
  if (weeks < 4) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`

  const years = Math.floor(months / 12)
  return `${years} ${years === 1 ? "year" : "years"} ago`
}
