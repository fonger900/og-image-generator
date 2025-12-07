import { Hono } from "hono";
import satori, { init } from "satori/wasm";
import initYoga from "yoga-wasm-web";
import { Resvg, initWasm } from "@resvg/resvg-wasm"; // Import Resvg

// --- 1. INITIALIZE WASM (YOGA & RESVG) ---

// Load Yoga (Layout Engine)
const yogaWasm = await fetch("https://unpkg.com/yoga-wasm-web@0.3.3/dist/yoga.wasm").then(res => res.arrayBuffer());
const yoga = await initYoga(yogaWasm);
init(yoga);

// Load Resvg (SVG -> PNG Renderer)
// We fetch the index_bg.wasm specifically for version 2.6.2
const resvgWasm = await fetch("https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm");
await initWasm(resvgWasm);

const app = new Hono();

// --- 2. LOAD FONTS ---
const fontData = await fetch(
  "https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf"
).then((res) => res.arrayBuffer());

app.get("/og", async (c) => {
  const { title, subtitle } = c.req.query();
  const text = title || "Hermit Bakery";
  const sub = subtitle || "Fresh Sourdough Daily";

  // --- 3. GENERATE SVG (SATORI) ---
  const svg = await satori(
    {
      type: "div",
      props: {
        children: [
          {
            type: "div",
            props: {
              children: text,
              style: { fontSize: 60, fontWeight: "bold", color: "#333" },
            },
          },
          {
            type: "div",
            props: {
              children: sub,
              style: { fontSize: 30, color: "#666", marginTop: 20 },
            },
          },
        ],
        style: {
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
          border: "20px solid #e2e8f0",
        },
      },
    },
    {
      width: 800,
      height: 400,
      fonts: [
        {
          name: "Roboto",
          data: fontData,
          weight: 400,
          style: "normal",
        },
      ],
    }
  );

  // --- 4. RENDER TO PNG (RESVG) ---
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: 800,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  // --- 5. RETURN IMAGE ---
  c.header("Content-Type", "image/png");
  // Optional: Cache control so browsers don't hammer your server
  c.header("Cache-Control", "public, max-age=604800"); 
  
  return c.body(pngBuffer);
});

Deno.serve(app.fetch);
