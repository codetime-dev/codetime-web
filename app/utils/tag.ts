export function getTagDisplay(tag: { emoji?: string | null, name: string }) {
  if (tag.emoji) {
    return tag.emoji
  }
  // Return first character of tag name as fallback
  return tag.name.charAt(0).toUpperCase()
}

