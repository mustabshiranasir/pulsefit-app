import { ScrollViewStyleReset } from "expo-router/html";

export default function RootHtml() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>PulseFit</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow-x: hidden !important;
          }
          #root {
            display: flex !important;
            flex-direction: column !important;
            min-height: 100vh !important;
          }
        `}} />
      </head>
      <body>
        <div id="root" />
      </body>
    </html>
  );
}
