CREATE TABLE `ch_member` (
	`id` text PRIMARY KEY NOT NULL,
	`chat` text NOT NULL,
	`user` text NOT NULL,
	`role` text DEFAULT 'admin',
	`about` text DEFAULT '',
	`added` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`chat`) REFERENCES `chat`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user`) REFERENCES `user`(`email`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chat` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`public` text DEFAULT 'public',
	`description` text DEFAULT '',
	`added` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `message` (
	`id` text PRIMARY KEY NOT NULL,
	`chat` text NOT NULL,
	`member` text NOT NULL,
	`content` text NOT NULL,
	`added` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`chat`) REFERENCES `chat`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member`) REFERENCES `ch_member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`email` text PRIMARY KEY NOT NULL,
	`given_name` text NOT NULL,
	`family_name` text NOT NULL,
	`name` text NOT NULL,
	`picture` text NOT NULL,
	`sub` text NOT NULL,
	`added` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user`("email", "given_name", "family_name", "name", "picture", "sub", "added") SELECT "email", "given_name", "family_name", "name", "picture", "sub", "added" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_words` (
	`id` integer PRIMARY KEY NOT NULL,
	`language` text,
	`word` text NOT NULL,
	`added` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_words`("id", "language", "word", "added") SELECT "id", "language", "word", "added" FROM `words`;--> statement-breakpoint
DROP TABLE `words`;--> statement-breakpoint
ALTER TABLE `__new_words` RENAME TO `words`;