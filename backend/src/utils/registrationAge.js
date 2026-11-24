const indiaDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata' });

function isAdult(dateOfBirth, now = new Date()) {
  const today = indiaDate.format(now);
  const year = Number(dateOfBirth.slice(0, 4));
  if (year < 1 || year > Number(today.slice(0, 4))) return false;
  const eighteenthBirthday = String(year + 18).padStart(4, '0') + dateOfBirth.slice(4);
  return eighteenthBirthday <= today;
}

module.exports = { isAdult };
