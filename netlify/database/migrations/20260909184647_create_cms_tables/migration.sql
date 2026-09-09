CREATE TABLE "media" (
	"id" serial PRIMARY KEY,
	"blob_key" text NOT NULL UNIQUE,
	"filename" text NOT NULL,
	"alt_text" text DEFAULT '' NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" serial PRIMARY KEY,
	"slug" text NOT NULL UNIQUE,
	"title" text NOT NULL,
	"navigation_label" text NOT NULL,
	"meta_description" text DEFAULT '' NOT NULL,
	"content" jsonb DEFAULT '[]' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"show_in_navigation" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
