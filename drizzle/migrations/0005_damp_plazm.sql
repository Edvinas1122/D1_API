ALTER TABLE `ch_member` RENAME COLUMN "added" TO "signed";--> statement-breakpoint
ALTER TABLE `chat` RENAME COLUMN "added" TO "signed";--> statement-breakpoint
ALTER TABLE `log` RENAME COLUMN "added" TO "signed";--> statement-breakpoint
ALTER TABLE `message` RENAME COLUMN "added" TO "signed";--> statement-breakpoint
ALTER TABLE `user` RENAME COLUMN "added" TO "signed";--> statement-breakpoint
DROP TABLE `words`;