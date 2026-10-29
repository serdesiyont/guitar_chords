import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach twMerge our custom font-size tokens, otherwise it treats text-display as a colour.
const twMerge = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: ['display', 'display-lg', 'chord'] }] } },
})

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
