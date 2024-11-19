if (
  window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: dark)').matches
) {
  document.body.classList.add('dark')
  document.querySelector('link[rel=icon]').href = './favicon-dark.png'
}
