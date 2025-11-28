# Betterweb Project Specification

## Project Overview

**Project Name:** Betterweb  
**Description:** A website discovery platform that displays top websites and provides a "scroll" feature to randomly browse websites.  
**Copyright:** © 2025 Betterweb

---

## File Structure

| File | Purpose |
|------|---------|
| `index.html` | Home page - displays ranked list of top websites |
| `index2.html` | Betterweb Scroll - random website viewer with iframe |
| `specsheet.md` | Project specification document |

---

## Page 1: index.html (Top Sites)

### Purpose
Displays a comprehensive table of top websites ranked by score.

### Structure
- **Title:** "Top Sites"
- **Header:** `<h1>` - "Top Websites"
- **Navigation:** Link to `index2.html` (Betterweb scroll)
- **Content:** HTML table with ranked website data
- **Footer:** Copyright notice (© 2025 Betterweb)

### Table Schema
| Column | Data Attribute | Description |
|--------|----------------|-------------|
| Rank | `data-column="rank"` / `data-label="Rank"` | Numerical ranking (1-1000+) |
| Domain | `data-column="domain"` / `data-label="Domain"` | Website domain name |
| Score | `data-column="score"` / `data-label="Score"` | Score value (0-10 scale) |

### Sample Data (First 15 entries)
| Rank | Domain | Score |
|------|--------|-------|
| 1 | fonts.googleapis.com | 10 |
| 2 | facebook.com | 10 |
| 3 | twitter.com | 10 |
| 4 | google.com | 10 |
| 5 | youtube.com | 10 |
| 6 | s.w.org | 10 |
| 7 | instagram.com | 10 |
| 8 | googletagmanager.com | 10 |
| 9 | linkedin.com | 10 |
| 10 | ajax.googleapis.com | 10 |
| 11 | plus.google.com | 10 |
| 12 | gmpg.org | 10 |
| 13 | pinterest.com | 9.63 |
| 14 | fonts.gstatic.com | 9.6 |
| 15 | wordpress.org | 9.54 |

### Styling
```css
body {
    color: rgb(255, 255, 255);  /* White text */
    background-color: black;    /* Black background */
}
```

### Data Volume
- **Total Table Rows:** ~1000+ websites
- **File Size:** ~5030 lines

---

## Page 2: index2.html (Betterweb Scroll)

### Purpose
Interactive random website discovery tool that loads websites in an iframe.

### Structure
- **Title:** "Betterweb Scroll"
- **Header:** `<h1>` - "Betterweb scroll"
- **Navigation:** Link to `index` (home page) - ⚠️ Missing `.html` extension
- **Description:** "Click the button to find what you ware looking for" (typo: "ware" should be "were")
- **Interactive Elements:**
  - Scroll button
  - Website display container with iframe
  - Like/Dislike buttons
- **Notice:** "Some websites might be banned"

### HTML Elements

| Element ID | Type | Purpose |
|------------|------|---------|
| `website-container` | `<div>` | Container for iframe display |
| `current-website-display` | `<div>` | Shows current website URL |
| `website-iframe` | `<iframe>` | Displays the random website |
| `2` | `<button>` (x2) | Like and Dislike buttons (⚠️ duplicate IDs) |

### Styling

```css
body {
    font-family: sans-serif;
    margin: 20px;
    text-align: center;
    background-color: black;
    color: rgb(255, 255, 255);
}

#website-container {
    border: 2px solid #ffffff;
    padding: 10px;
    overflow: hidden;
    white-space: nowrap;
    width: 80%;
    margin: 20px auto;
}

#website-iframe {
    width: 100%;
    height: 400px;
    border: none;
}

#current-website-display {
    font-weight: bold;
    margin-bottom: 10px;
    color: #fdfdfd;
}

button {
    background-color: #2ecc71;  /* Green */
    color: white;
    padding: 10px 20px;
    border: none;
    cursor: pointer;
    font-size: 16px;
    border-radius: 5px;
    transition: background-color 0.3s;
}

button:hover {
    background-color: #27ae60;  /* Darker green */
}
```

### JavaScript Functionality

#### Website Array
- **Total URLs:** 1000+ websites
- **Format:** HTTPS URLs stored in array
- **Categories include:**
  - Social Media (Facebook, Twitter, Instagram, LinkedIn, etc.)
  - Search Engines (Google, Bing, Yahoo)
  - Tech Companies (Microsoft, Apple, Adobe, IBM)
  - News Outlets (CNN, BBC, NYTimes, Guardian)
  - Developer Tools (GitHub, StackOverflow, npm)
  - E-commerce (Amazon, eBay, Etsy)
  - Entertainment (YouTube, Netflix, Spotify, Twitch)
  - CDNs (Cloudflare, jsDelivr, Google APIs)

#### Functions

**`loadRandomWebsite()`**
```javascript
function loadRandomWebsite() {
    const randomIndex = Math.floor(Math.random() * websites.length);
    const randomUrl = websites[randomIndex];
    const iframe = document.getElementById('website-iframe');
    iframe.src = randomUrl;
    const display = document.getElementById('current-website-display');
    display.textContent = `Displaying: ${randomUrl}`;
}
```
- Selects random index from websites array
- Updates iframe source to random URL
- Updates display text with current URL

**`window.onload`**
- Automatically calls `loadRandomWebsite()` on page load

---

## Design Specifications

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Black | `#000000` | Background |
| White | `#FFFFFF` / `rgb(255,255,255)` | Text, borders |
| Off-white | `#FDFDFD` | Display text |
| Green | `#2ECC71` | Buttons |
| Dark Green | `#27AE60` | Button hover |

### Typography
- **Font Family:** sans-serif (system default)
- **Text Alignment:** Center (index2.html)

---

## Known Issues / Bugs

| Issue | Location | Description |
|-------|----------|-------------|
| Broken link | index2.html | `<a href="index">` missing `.html` extension |
| Typo | index2.html | "ware" should be "were" |
| Duplicate IDs | index2.html | Both Like/Dislike buttons have `id="2"` |
| Style placement | index.html | `<style>` tag outside `<head>` |
| Duplicate body rules | Both files | Multiple `body {}` declarations |
| X-Frame-Options | index2.html | Many websites block iframe embedding |

---

## Browser Compatibility

- **Required Features:**
  - ES6 JavaScript (const, template literals, arrow functions)
  - CSS3 (transitions, border-radius)
  - HTML5 (iframe, data attributes)

---

## Security Considerations

1. **Iframe Security:** Many websites in the array block iframe embedding via `X-Frame-Options` or `Content-Security-Policy`
2. **Mixed Content:** All URLs use HTTPS
3. **User Input:** No user input handling currently implemented
4. **Like/Dislike:** Buttons have no functionality implemented

---

## Future Enhancements (Suggested)

1. Fix navigation link (`index` → `index.html`)
2. Implement Like/Dislike functionality with local storage
3. Add unique IDs to buttons
4. Filter out websites that block iframe embedding
5. Add loading indicator for iframe
6. Add search/filter functionality to top sites table
7. Make table sortable by column
8. Add responsive design for mobile devices
9. Consolidate duplicate CSS rules
