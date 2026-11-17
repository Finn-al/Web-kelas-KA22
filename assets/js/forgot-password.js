const resetForm = document.querySelector('#reset-form');
const resetNotice = document.querySelector('#reset-notice');

resetForm.addEventListener('submit', (event) => {
  event.preventDefault();
  resetNotice.hidden = false;
});
