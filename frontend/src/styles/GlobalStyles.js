import { createGlobalStyle } from 'styled-components';
import '@fontsource/marcellus';
import '@fontsource/cinzel/600.css';

export const GlobalStyles = createGlobalStyle`
  :root {
    --primary: #1a1a1a;
    --secondary: #2d2d2d;
    --accent: #C6A964;
    --accent-light: #D4B87B;
    --background: #0A0A0A;
    --text: #FFFFFF;
    --text-secondary: #E0E0E0;
    --gradient-start: #000000;
    --gradient-mid: #0A0A0A;
    --gradient-end: #1A1A1A;
    --card-bg: rgba(255, 255, 255, 0.03);
    --white: #FFFFFF;
    --gold-gradient: linear-gradient(45deg, #C6A964 0%, #E2C385 50%, #C6A964 100%);
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    width: 100%;
    overflow-x: hidden;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Marcellus', serif;
    background-color: var(--background);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    line-height: 1.8;
  }

  h1, h2 {
    font-family: 'Cinzel', serif;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  h3, h4, h5, h6 {
    font-family: 'Cormorant', serif;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  button {
    cursor: pointer;
    border: none;
    outline: none;
    font-family: 'Italiana', serif;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  p {
    font-family: 'Marcellus', serif;
    line-height: 1.8;
    letter-spacing: 0.3px;
  }
`;
