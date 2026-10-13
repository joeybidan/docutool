// Official reference calendars; only national regular/federal holidays are included.
// US dates below are the OPM observed dates, not necessarily the calendar anniversary.
export const HOLIDAY_YEARS = [2026, 2027]
export const HOLIDAY_SOURCES = {
  us: 'https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/',
  philippines: {
    2026: 'https://pco.gov.ph/news_releases/pbbm-issues-proclamation-declaring-regular-holidays-special-non-working-days-for-2026/',
    2027: 'https://pco.gov.ph/news_releases/pbbm-declares-2027-regular-and-special-holidays/',
  },
  eidFitr2026: 'https://prc.gov.ph/article/prc-observes-feast-ramadhan',
  eidAdha2026: 'https://pia.gov.ph/news/palace-declares-may-27-as-a-regular-holiday-for-eidl-adha-observance/',
}

const usNames = ["New Year's Day", 'Martin Luther King Jr. Day', "Washington's Birthday", 'Memorial Day', 'Juneteenth', 'Independence Day', 'Labor Day', 'Columbus Day', 'Veterans Day', 'Thanksgiving Day', 'Christmas Day']
const usDates = {
  2026: ['01-01', '01-19', '02-16', '05-25', '06-19', '07-03', '09-07', '10-12', '11-11', '11-26', '12-25'],
  2027: ['01-01', '01-18', '02-15', '05-31', '06-18', '07-05', '09-06', '10-11', '11-11', '11-25', '12-24'],
}
const phDates = {
  2026: [
    ['01-01', "New Year's Day"], ['03-20', "Eid'l Fitr"], ['04-02', 'Maundy Thursday'],
    ['04-03', 'Good Friday'], ['04-09', 'Araw ng Kagitingan'], ['05-01', 'Labor Day'],
    ['05-27', "Eid'l Adha"], ['06-12', 'Independence Day'], ['08-31', 'National Heroes Day'],
    ['11-30', 'Bonifacio Day'], ['12-25', 'Christmas Day'], ['12-30', 'Rizal Day'],
  ],
  2027: [
    ['01-01', "New Year's Day"], ['03-25', 'Maundy Thursday'], ['03-26', 'Good Friday'],
    ['04-09', 'Araw ng Kagitingan'], ['05-01', 'Labor Day'], ['06-12', 'Independence Day'],
    ['08-30', 'National Heroes Day'], ['11-30', 'Bonifacio Day'], ['12-25', 'Christmas Day'], ['12-30', 'Rizal Day'],
    [null, "Eid'l Fitr"], [null, "Eid'l Adha"],
  ],
}

export function holidaysForYear(year) {
  if (!HOLIDAY_YEARS.includes(year)) return { us: [], philippines: [] }
  return {
    us: usDates[year].map((date, index) => ({
      date: `${year}-${date}`, name: usNames[index],
      observed: (index === 4 && date !== '06-19') || (index === 5 && date !== '07-04') || (index === 10 && date !== '12-25'),
    })),
    philippines: phDates[year].map(([date, name]) => ({ date: date ? `${year}-${date}` : null, name })),
  }
}
