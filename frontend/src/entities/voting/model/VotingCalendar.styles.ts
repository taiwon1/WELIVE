export const customStyle = `
.react-calendar {
  border: none;
}

.react-calendar__tile--now {
  background: inherit;
  color: #78CA94
}

.react-calendar__tile--active {
  background: #78CA94;
  color: white;
}
.react-calendar__tile--active:enabled:hover,
.react-calendar__tile--active:enabled:focus {
  background: #7fb77e;
  font-weight: bold;
}

.react-calendar__month-view__weekdays abbr {
  text-decoration: none;
}

.react-calendar__month-view__days__day--weekend {
  color: black;
}

.react-calendar__navigation__prev-button,
.react-calendar__navigation__next-button {
  font-size: 2rem; /* 크기 크게 */
  font-weight: 900;
  padding-bottom: 10px; 
}
`;
