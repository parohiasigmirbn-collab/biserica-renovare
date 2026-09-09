import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export type ContentBlock = {
  id: string;
  type: "hero" | "text" | "image" | "quote" | "contact";
  title?: string;
  subtitle?: string;
  body?: string;
  imageId?: number | null;
  imageUrl?: string;
  imageAlt?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  tone?: "light" | "sand" | "dark";
};

export const pages = pgTable("pages", {
  id: serial().primaryKey(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  navigationLabel: text("navigation_label").notNull(),
  metaDescription: text("meta_description").notNull().default(""),
  content: jsonb().$type<ContentBlock[]>().notNull().default([]),
  published: boolean().notNull().default(false),
  showInNavigation: boolean("show_in_navigation").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const media = pgTable("media", {
  id: serial().primaryKey(),
  blobKey: text("blob_key").notNull().unique(),
  filename: text().notNull(),
  altText: text("alt_text").notNull().default(""),
  mimeType: text("mime_type").notNull(),
  size: integer().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
