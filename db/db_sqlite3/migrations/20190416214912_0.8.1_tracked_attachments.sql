
-- +goose Up
-- SQL in section 'Up' is executed when this migration is applied
CREATE TABLE IF NOT EXISTS "tracked_attachments" ("id" integer primary key autoincrement,"user_id" bigint,"name" varchar(255),"type" varchar(255),"content" blob, "modified_date" datetime, "filename" varchar(255));
CREATE TABLE IF NOT EXISTS "campaign_tracked_attachments" ("tracked_attachment_id" bigint,"campaign_id" bigint );

-- +goose Down
-- SQL section 'Down' is executed when this migration is rolled back
DROP TABLE "tracked_attachments";
DROP TABLE "campaign_tracked_attachments";
