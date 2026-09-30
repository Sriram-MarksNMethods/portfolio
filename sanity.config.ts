"use client";

// Sanity Studio (the dashboard), served by this site at /studio.
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { dataset, projectId } from "@/sanity/env";
import { schemaTypes } from "@/sanity/schema";

export default defineConfig({
  basePath: "/studio",
  title: "Portfolio",
  projectId,
  dataset,
  schema: {
    types: schemaTypes,
    // there's exactly one "Website content" document, so hide "create new"
    templates: (templates) => templates.filter((template) => template.schemaType !== "site"),
  },
  document: {
    // no duplicating or deleting the one document
    actions: (actions, context) =>
      context.schemaType === "site" ? actions.filter(({ action }) => action !== "duplicate" && action !== "delete") : actions,
  },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Portfolio")
          .items([S.listItem().title("Website content").id("site").child(S.document().schemaType("site").documentId("site"))]),
    }),
  ],
});
