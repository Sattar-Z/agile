import { defineStore } from 'pinia'
import { type Ref, ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const mode
    = localStorage.getItem('theme') == null
      ? 'dark'
      : localStorage.getItem('theme')

  const theme = ref(mode)

  function getTheme(): Ref<string | null> {
    return theme
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'

    localStorage.setItem('theme', theme.value)

    if (theme.value === 'dark')
      document.body.classList.remove('lightMode')
    else
      document.body.classList.add('lightMode')
  }

  return { theme, getTheme, toggleTheme }
})
