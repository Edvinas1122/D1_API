PRAGMA foreign_keys=OFF;--> statement-breakpoint
DROP TABLE `words`;
CREATE TABLE `words` (
	`id` integer PRIMARY KEY NOT NULL,
	`language` text,
	`word` text NOT NULL,
	`added` text DEFAULT 'CURRENT_TIMESTAMP'
);

PRAGMA foreign_keys=ON;
