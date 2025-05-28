DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
	`email` text PRIMARY KEY NOT NULL,
	`given_name` text NOT NULL,
	`family_name` text NOT NULL,
	`name` text NOT NULL,
	`picture` text NOT NULL,
	`sub` text NOT NULL
);
