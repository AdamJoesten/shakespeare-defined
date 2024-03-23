import lume from "lume/mod.ts";
import eta from "lume/plugins/eta.ts";
import tailwindcss from "lume/plugins/tailwindcss.ts";
import postcss from "lume/plugins/postcss.ts";
const site = lume();

site.use(eta());
site.use(tailwindcss());
site.use(postcss());

export default site;
