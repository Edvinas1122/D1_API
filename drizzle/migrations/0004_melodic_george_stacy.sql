CREATE TABLE `log` (
	`id` text PRIMARY KEY NOT NULL,
	`added` text DEFAULT (current_timestamp),
	`route` text NOT NULL,
	`ip` text,
	`country` text,
	`user` text,
	FOREIGN KEY (`user`) REFERENCES `user`(`email`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ch_member` (
	`id` text PRIMARY KEY NOT NULL,
	`chat` text NOT NULL,
	`user` text NOT NULL,
	`role` text DEFAULT 'admin',
	`about` text DEFAULT '',
	`added` text DEFAULT (current_timestamp),
	FOREIGN KEY (`chat`) REFERENCES `chat`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user`) REFERENCES `user`(`email`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_ch_member`("id", "chat", "user", "role", "about", "added") SELECT "id", "chat", "user", "role", "about", "added" FROM `ch_member`;--> statement-breakpoint
DROP TABLE `ch_member`;--> statement-breakpoint
ALTER TABLE `__new_ch_member` RENAME TO `ch_member`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_chat` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`public` text DEFAULT 'public',
	`description` text DEFAULT '',
	`added` text DEFAULT (current_timestamp)
);
--> statement-breakpoint
INSERT INTO `__new_chat`("id", "name", "public", "description", "added") SELECT "id", "name", "public", "description", "added" FROM `chat`;--> statement-breakpoint
DROP TABLE `chat`;--> statement-breakpoint
ALTER TABLE `__new_chat` RENAME TO `chat`;--> statement-breakpoint
CREATE TABLE `__new_message` (
	`id` text PRIMARY KEY NOT NULL,
	`chat` text NOT NULL,
	`member` text NOT NULL,
	`content` text NOT NULL,
	`added` text DEFAULT (current_timestamp),
	FOREIGN KEY (`chat`) REFERENCES `chat`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member`) REFERENCES `ch_member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_message`("id", "chat", "member", "content", "added") SELECT "id", "chat", "member", "content", "added" FROM `message`;--> statement-breakpoint
DROP TABLE `message`;--> statement-breakpoint
ALTER TABLE `__new_message` RENAME TO `message`;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`email` text PRIMARY KEY NOT NULL,
	`given_name` text NOT NULL,
	`family_name` text NOT NULL,
	`name` text NOT NULL,
	`picture` text NOT NULL,
	`sub` text NOT NULL,
	`added` text DEFAULT (current_timestamp)
);
--> statement-breakpoint
INSERT INTO `__new_user`("email", "given_name", "family_name", "name", "picture", "sub", "added") SELECT "email", "given_name", "family_name", "name", "picture", "sub", "added" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
CREATE TABLE `__new_words` (
	`id` integer PRIMARY KEY NOT NULL,
	`language` text,
	`word` text NOT NULL,
	`added` text DEFAULT (current_timestamp)
);
--> statement-breakpoint
INSERT INTO `__new_words`("id", "language", "word", "added") SELECT "id", "language", "word", "added" FROM `words`;--> statement-breakpoint
DROP TABLE `words`;--> statement-breakpoint
ALTER TABLE `__new_words` RENAME TO `words`;