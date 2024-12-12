const checkSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M17.25 6.41667L8.08333 15.5833C7.91667 15.75 7.75 15.8333 7.5 15.8333C7.25 15.8333 7.08333 15.75 6.91667 15.5833L2.75 11.4167C2.41667 11.0833 2.41667 10.5833 2.75 10.25C3.08333 9.91667 3.58333 9.91667 3.91667 10.25L7.5 13.8333L16.0833 5.25C16.4167 4.91667 16.9167 4.91667 17.25 5.25C17.5833 5.58333 17.5833 6.08333 17.25 6.41667Z" fill="black"/>
  <mask id="mask0_140_7780" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="2" y="5" width="16" height="11">
  <path d="M17.25 6.41667L8.08333 15.5833C7.91667 15.75 7.75 15.8333 7.5 15.8333C7.25 15.8333 7.08333 15.75 6.91667 15.5833L2.75 11.4167C2.41667 11.0833 2.41667 10.5833 2.75 10.25C3.08333 9.91667 3.58333 9.91667 3.91667 10.25L7.5 13.8333L16.0833 5.25C16.4167 4.91667 16.9167 4.91667 17.25 5.25C17.5833 5.58333 17.5833 6.08333 17.25 6.41667Z" fill="white"/>
  </mask>
  <g mask="url(#mask0_140_7780)">
  <rect width="20" height="20" fill="#28C76F"/>
  </g>
  </svg>`

export function copyToClipboard(id: string) {
  const inputElement = document.querySelector(`#${id}`) as HTMLInputElement

  window.navigator.clipboard.writeText(inputElement.value)

  const copyButton = document.getElementById(`${id}-copy`) as HTMLSpanElement

  copyButton.innerHTML = `<span class='text-green-500 flex items-center space-x-1'><span>Copied</span> ${checkSVG}</span>`
  setTimeout(() => {
    copyButton.innerHTML = 'Click to Copy'
  }, 2000)
}

export function copyToClipboardElement(id: string) {
  const element = document.querySelector(`#${id}`) as HTMLElement

  window.navigator.clipboard.writeText(element.innerText)

  const copyButton = document.getElementById(`${id}-copy`) as HTMLSpanElement;

  (copyButton.firstElementChild as HTMLElement).style.display = 'none'
  copyButton.innerHTML += `<span class='text-green-500 flex items-center space-x-1'><span>Copied</span> ${checkSVG}</span>`
  setTimeout(() => {
    copyButton.removeChild(copyButton.lastElementChild as HTMLElement);
    (copyButton.firstElementChild as HTMLElement).style.display = 'block'
  }, 2000)
}
