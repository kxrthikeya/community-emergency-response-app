CREATE TABLE `otp_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`phone_number` text NOT NULL,
	`otp_code` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` text NOT NULL
);
