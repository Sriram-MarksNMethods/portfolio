import { defineArrayMember, defineField, defineType } from "sanity";
import { fallbackContent } from "@/data/site";

// One document, "Website content", holds everything on the site, split into tabs.
// Field titles and descriptions are what the site owner sees in the dashboard, so keep them plain.

const videoFields = [
  defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required() }),
  defineField({
    name: "video",
    title: "Video file",
    type: "file",
    options: { accept: "video/mp4,video/webm" },
    description: "Upload an MP4 (keep it under about 20 MB). Or paste a direct link below instead.",
  }),
  defineField({
    name: "videoUrl",
    title: "…or a direct video link",
    type: "url",
    description: "A link that ends in .mp4, for example from Bunny Stream or Cloudflare. YouTube and Vimeo page links won't play here.",
  }),
  defineField({
    name: "poster",
    title: "Cover image",
    type: "image",
    description: "Shown before the video loads, and in the collage around the showreel.",
  }),
];

export const site = defineType({
  name: "site",
  title: "Website content",
  type: "document",
  groups: [
    { name: "profile", title: "Profile", default: true },
    { name: "showreel", title: "Showreel" },
    { name: "works", title: "Works" },
    { name: "about", title: "About me" },
  ],
  fields: [
    defineField({ name: "name", title: "Your name", type: "string", group: "profile", validation: (rule) => rule.required() }),
    defineField({ name: "role", title: "Role", type: "string", group: "profile", description: "Shown top-left in the hero." }),
    defineField({ name: "intro", title: "Intro line", type: "text", rows: 2, group: "profile" }),
    defineField({ name: "email", title: "Contact email", type: "string", group: "profile", validation: (rule) => rule.email() }),
    defineField({
      name: "tools",
      title: "Tools (logos scrolling along the bottom of the hero)",
      type: "array",
      group: "profile",
      description: "Add, remove or drag to reorder.",
      of: [
        defineArrayMember({
          name: "tool",
          title: "Tool",
          type: "object",
          fields: [
            defineField({ name: "name", title: "Name", type: "string", description: "For example: Houdini", validation: (rule) => rule.required() }),
            defineField({
              name: "logo",
              title: "Logo",
              type: "image",
              options: { accept: "image/svg+xml,image/png,image/webp" },
              description: `Upload an SVG or PNG with a transparent background; it's shown in white. Not needed for ${fallbackContent.tools
                .map((t) => t.name)
                .join(", ")} (built in).`,
            }),
          ],
          preview: { select: { title: "name", media: "logo" } },
        }),
      ],
    }),

    defineField({
      name: "showreel",
      title: "Showreel",
      type: "object",
      group: "showreel",
      fields: videoFields,
    }),

    defineField({
      name: "categories",
      title: "Work categories (tabs)",
      type: "array",
      group: "works",
      description: "Each category is a tab. Drag to reorder tabs and videos.",
      of: [
        defineArrayMember({
          name: "category",
          title: "Category",
          type: "object",
          fields: [
            defineField({ name: "name", title: "Tab name", type: "string", validation: (rule) => rule.required() }),
            defineField({
              name: "videos",
              title: "Videos",
              type: "array",
              of: [defineArrayMember({ name: "work", title: "Video", type: "object", fields: videoFields, preview: { select: { title: "title", media: "poster" } } })],
            }),
          ],
          preview: { select: { title: "name", videos: "videos" }, prepare: ({ title, videos }) => ({ title, subtitle: `${videos?.length ?? 0} videos` }) },
        }),
      ],
    }),

    defineField({
      name: "bio",
      title: "Bio paragraphs",
      type: "array",
      group: "about",
      of: [defineArrayMember({ type: "text", rows: 4 })],
    }),
    defineField({
      name: "services",
      title: "Services",
      type: "array",
      group: "about",
      of: [
        defineArrayMember({
          name: "service",
          type: "object",
          fields: [
            defineField({ name: "name", title: "Service", type: "string" }),
            defineField({
              name: "icon",
              title: "Icon",
              type: "string",
              options: {
                list: [
                  { title: "Play button", value: "play" },
                  { title: "Title (T)", value: "title" },
                  { title: "Film strip", value: "film" },
                  { title: "Music note", value: "music" },
                  { title: "Colour grade", value: "grade" },
                ],
              },
            }),
          ],
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Website content" }) },
});

export const schemaTypes = [site];
