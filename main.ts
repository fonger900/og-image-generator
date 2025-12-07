import { Hono } from "hono";
import satori, { init } from "satori/wasm";
import initYoga from "yoga-wasm-web";

// --- FIX STARTS HERE ---
// 1. Manually fetch the WASM binary from a CDN because Deno doesn't bundle it automatically.
const wasmResponse = await fetch("https://unpkg.com/yoga-wasm-web@0.3.3/dist/yoga.wasm");
const wasmBuffer = await wasmResponse.arrayBuffer();
const yoga = await initYoga(wasmBuffer);
// --- FIX ENDS HERE ---

init(yoga);

const app = new Hono();

// 2. Load a font (Required for Satori)
const fontData = await fetch(
  "https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf"
).then((res) => res.arrayBuffer());

app.get("/og", async (c) => {
  const { title, subtitle } = c.req.query();
  const text = title || "Hermit Bakery";
  const sub = subtitle || "Fresh Sourdough Daily";

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

  c.header("Content-Type", "image/svg+xml");
  return c.body(svg);
});

Deno.serve(app.fetch);
