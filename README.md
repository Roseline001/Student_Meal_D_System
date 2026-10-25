# SMeS: Student Meal Subsidy

A student meal coupon system. The admin registers schools, students and partner restaurants and issues term coupons; students check their coupon; restaurants check a student and serve a meal.

## Design (Figma)

Figma file: PASTE_YOUR_FIGMA_SHARE_LINK_HERE

I designed the pages in Figma before coding them. The exported screens are in `docs/figma/`:

| Figma design | What it shows |
| --- | --- |
| ![Style guide](docs/figma/style-guide.png) | Colours and fonts |
| ![Home](docs/figma/home-desktop.png) | Home page (desktop) |
| ![Student](docs/figma/student-desktop.png) | Student page (desktop) |
| ![Student on a phone](docs/figma/student-phone.png) | Student page (phone) |
| ![Restaurant](docs/figma/restaurant-desktop.png) | Restaurant page (desktop) |
| ![Admin](docs/figma/admin-desktop.png) | Admin page (desktop) |

- **Colours:** green `#006600` (main buttons, coupon), yellow `#FDC500` (highlights, "Redeem meal"), blue `#1F4E8C` (information, admin), plus greys. They are the same variables at the top of `styles.css`.
- **Font:** Nunito (Google Fonts).
- **What changed when I built it:** WRITE ONE OR TWO SENTENCES HERE, for example "On phones I stacked the coupon and the stats in one column."

## Run it locally

1. Start the API (JSON Server): `cd server && npm install && npm start` (runs on http://localhost:3000)
2. Open `index.html` with Live Server (or any local web server).

Demo logins: student `STU-1001` with date of birth 14/03/2012, restaurant `RES-501`.

## Tests

`npm install` then `npm test`.
