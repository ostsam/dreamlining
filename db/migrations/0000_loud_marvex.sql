CREATE TYPE "public"."comment_kind" AS ENUM('root', 'reply');--> statement-breakpoint
CREATE TYPE "public"."comment_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."contact_method_type" AS ENUM('email', 'phone', 'other');--> statement-breakpoint
CREATE TYPE "public"."contact_request_status" AS ENUM('pending', 'approved', 'denied', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."participant_state" AS ENUM('active', 'abandoned', 'left');--> statement-breakpoint
CREATE TYPE "public"."report_action" AS ENUM('none', 'disclosed', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'reviewed', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."session_phase" AS ENUM('lobby', 'drafting', 'feedback', 'commitment', 'closed');--> statement-breakpoint
CREATE TYPE "public"."view_source" AS ENUM('manual', 'recommendation');--> statement-breakpoint
CREATE TABLE "admin_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid,
	"actor" text NOT NULL,
	"request_id" text NOT NULL,
	"metadata_redacted" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" uuid NOT NULL,
	"comment_id" uuid NOT NULL,
	"reporter_participant_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"disclosed_at" timestamp with time zone,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"action" "report_action" DEFAULT 'none' NOT NULL,
	"action_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"author_participant_id" uuid NOT NULL,
	"parent_comment_id" uuid,
	"kind" "comment_kind" DEFAULT 'root' NOT NULL,
	"body" text NOT NULL,
	"visibility" "comment_visibility" DEFAULT 'public' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comments_kind_parent_coherent" CHECK (("comments"."kind" = 'root' and "comments"."parent_comment_id" is null) or ("comments"."kind" = 'reply' and "comments"."parent_comment_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "commitments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"outcome" text NOT NULL,
	"first_action" text NOT NULL,
	"first_action_date" date,
	"help_wanted" text,
	"collaborators" text,
	"confirmed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "contact_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"owner_participant_id" uuid NOT NULL,
	"requester_participant_id" uuid NOT NULL,
	"method_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"revealed_at" timestamp with time zone,
	CONSTRAINT "contact_grants_owner_requester_distinct" CHECK ("contact_grants"."owner_participant_id" <> "contact_grants"."requester_participant_id")
);
--> statement-breakpoint
CREATE TABLE "contact_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"type" "contact_method_type" NOT NULL,
	"label" text NOT NULL,
	"ciphertext_envelope" jsonb NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "contact_methods_ciphertext_envelope_shape" CHECK ("contact_methods"."ciphertext_envelope" ? 'version' and "contact_methods"."ciphertext_envelope" ? 'algorithm' and "contact_methods"."ciphertext_envelope" ? 'ivB64' and "contact_methods"."ciphertext_envelope" ? 'ciphertextB64' and "contact_methods"."ciphertext_envelope" ? 'authTagB64')
);
--> statement-breakpoint
CREATE TABLE "contact_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" uuid NOT NULL,
	"owner_participant_id" uuid NOT NULL,
	"requester_participant_id" uuid NOT NULL,
	"context" text NOT NULL,
	"reason" text NOT NULL,
	"status" "contact_request_status" DEFAULT 'pending' NOT NULL,
	"decided_at" timestamp with time zone,
	CONSTRAINT "contact_requests_owner_requester_distinct" CHECK ("contact_requests"."owner_participant_id" <> "contact_requests"."requester_participant_id")
);
--> statement-breakpoint
CREATE TABLE "dreamline_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"having_entries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"being_entries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"doing_entries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"blockers" text,
	"revision" integer DEFAULT 0 NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dreamline_drafts_revision_nonnegative" CHECK ("dreamline_drafts"."revision" >= 0),
	CONSTRAINT "dreamline_drafts_having_max_five" CHECK (jsonb_typeof("dreamline_drafts"."having_entries") = 'array' and jsonb_array_length("dreamline_drafts"."having_entries") <= 5),
	CONSTRAINT "dreamline_drafts_being_max_five" CHECK (jsonb_typeof("dreamline_drafts"."being_entries") = 'array' and jsonb_array_length("dreamline_drafts"."being_entries") <= 5),
	CONSTRAINT "dreamline_drafts_doing_max_five" CHECK (jsonb_typeof("dreamline_drafts"."doing_entries") = 'array' and jsonb_array_length("dreamline_drafts"."doing_entries") <= 5)
);
--> statement-breakpoint
CREATE TABLE "dreamline_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"immutable_snapshot" jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dreamline_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" uuid NOT NULL,
	"viewer_participant_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"source" "view_source" DEFAULT 'manual' NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"commented_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mutation_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" uuid NOT NULL,
	"participant_id" uuid,
	"admin_actor" text,
	"operation" text NOT NULL,
	"idempotency_key_hash" "bytea" NOT NULL,
	"result_type" text NOT NULL,
	"result_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "mutation_receipts_exactly_one_actor" CHECK (("mutation_receipts"."participant_id" is not null and "mutation_receipts"."admin_actor" is null) or ("mutation_receipts"."participant_id" is null and "mutation_receipts"."admin_actor" is not null))
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"token_hash" "bytea" NOT NULL,
	"state" "participant_state" DEFAULT 'active' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "recommendation_impressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" uuid NOT NULL,
	"viewer_participant_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"algorithm_version" text NOT NULL,
	"served_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dedupe_bucket" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"public_join_token_hash" text NOT NULL,
	"title" text NOT NULL,
	"phase" "session_phase" DEFAULT 'lobby' NOT NULL,
	"phase_started_at" timestamp with time zone,
	"phase_ends_at" timestamp with time zone,
	"phase_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"paused_at" timestamp with time zone,
	"retention_days" integer DEFAULT 30 NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "sessions_retention_days_positive" CHECK ("sessions"."retention_days" > 0),
	CONSTRAINT "sessions_phase_timing_coherent" CHECK ("sessions"."phase_ends_at" is null or "sessions"."phase_started_at" is not null)
);
--> statement-breakpoint
ALTER TABLE "admin_audit_events" ADD CONSTRAINT "admin_audit_events_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_comment_session_fk" FOREIGN KEY ("session_id","comment_id") REFERENCES "public"."comments"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_reporter_session_fk" FOREIGN KEY ("session_id","reporter_participant_id") REFERENCES "public"."participants"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_submission_session_fk" FOREIGN KEY ("session_id","submission_id") REFERENCES "public"."dreamline_submissions"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_session_fk" FOREIGN KEY ("session_id","author_participant_id") REFERENCES "public"."participants"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_session_fk" FOREIGN KEY ("session_id","parent_comment_id") REFERENCES "public"."comments"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_participant_session_fk" FOREIGN KEY ("session_id","participant_id") REFERENCES "public"."participants"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_submission_session_fk" FOREIGN KEY ("session_id","submission_id") REFERENCES "public"."dreamline_submissions"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_grants" ADD CONSTRAINT "contact_grants_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_grants" ADD CONSTRAINT "contact_grants_request_session_fk" FOREIGN KEY ("session_id","request_id") REFERENCES "public"."contact_requests"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_grants" ADD CONSTRAINT "contact_grants_owner_session_fk" FOREIGN KEY ("session_id","owner_participant_id") REFERENCES "public"."participants"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_grants" ADD CONSTRAINT "contact_grants_requester_session_fk" FOREIGN KEY ("session_id","requester_participant_id") REFERENCES "public"."participants"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_grants" ADD CONSTRAINT "contact_grants_method_session_fk" FOREIGN KEY ("session_id","method_id") REFERENCES "public"."contact_methods"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_methods" ADD CONSTRAINT "contact_methods_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_methods" ADD CONSTRAINT "contact_methods_owner_session_fk" FOREIGN KEY ("session_id","participant_id") REFERENCES "public"."participants"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_owner_session_fk" FOREIGN KEY ("session_id","owner_participant_id") REFERENCES "public"."participants"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_requester_session_fk" FOREIGN KEY ("session_id","requester_participant_id") REFERENCES "public"."participants"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dreamline_drafts" ADD CONSTRAINT "dreamline_drafts_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dreamline_drafts" ADD CONSTRAINT "dreamline_drafts_participant_session_fk" FOREIGN KEY ("session_id","participant_id") REFERENCES "public"."participants"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dreamline_submissions" ADD CONSTRAINT "dreamline_submissions_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dreamline_submissions" ADD CONSTRAINT "dreamline_submissions_participant_session_fk" FOREIGN KEY ("session_id","participant_id") REFERENCES "public"."participants"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dreamline_views" ADD CONSTRAINT "dreamline_views_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dreamline_views" ADD CONSTRAINT "dreamline_views_viewer_session_fk" FOREIGN KEY ("session_id","viewer_participant_id") REFERENCES "public"."participants"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dreamline_views" ADD CONSTRAINT "dreamline_views_submission_session_fk" FOREIGN KEY ("session_id","submission_id") REFERENCES "public"."dreamline_submissions"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutation_receipts" ADD CONSTRAINT "mutation_receipts_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutation_receipts" ADD CONSTRAINT "mutation_receipts_participant_session_fk" FOREIGN KEY ("session_id","participant_id") REFERENCES "public"."participants"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_impressions" ADD CONSTRAINT "recommendation_impressions_session_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_impressions" ADD CONSTRAINT "recommendation_impressions_viewer_session_fk" FOREIGN KEY ("session_id","viewer_participant_id") REFERENCES "public"."participants"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_impressions" ADD CONSTRAINT "recommendation_impressions_submission_session_fk" FOREIGN KEY ("session_id","submission_id") REFERENCES "public"."dreamline_submissions"("session_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_events_session_occurred_idx" ON "admin_audit_events" USING btree ("session_id","occurred_at");--> statement-breakpoint
CREATE INDEX "admin_audit_events_session_target_idx" ON "admin_audit_events" USING btree ("session_id","target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "comment_reports_comment_reporter_uq" ON "comment_reports" USING btree ("comment_id","reporter_participant_id");--> statement-breakpoint
CREATE INDEX "comment_reports_session_status_created_idx" ON "comment_reports" USING btree ("session_id","status","created_at");--> statement-breakpoint
CREATE INDEX "comment_reports_session_comment_idx" ON "comment_reports" USING btree ("session_id","comment_id");--> statement-breakpoint
CREATE INDEX "comments_session_submission_created_idx" ON "comments" USING btree ("session_id","submission_id","created_at");--> statement-breakpoint
CREATE INDEX "comments_submission_parent_idx" ON "comments" USING btree ("submission_id","parent_comment_id");--> statement-breakpoint
CREATE INDEX "comments_session_author_idx" ON "comments" USING btree ("session_id","author_participant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commitments_session_participant_uq" ON "commitments" USING btree ("session_id","participant_id");--> statement-breakpoint
CREATE INDEX "commitments_session_confirmed_idx" ON "commitments" USING btree ("session_id","confirmed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "contact_grants_request_uq" ON "contact_grants" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "contact_grants_requester_expiry_idx" ON "contact_grants" USING btree ("session_id","requester_participant_id","expires_at","revoked_at");--> statement-breakpoint
CREATE INDEX "contact_grants_owner_idx" ON "contact_grants" USING btree ("session_id","owner_participant_id");--> statement-breakpoint
CREATE INDEX "contact_methods_session_participant_revoked_idx" ON "contact_methods" USING btree ("session_id","participant_id","revoked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "contact_requests_pending_pair_uq" ON "contact_requests" USING btree ("session_id","owner_participant_id","requester_participant_id") WHERE "contact_requests"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "contact_requests_owner_status_idx" ON "contact_requests" USING btree ("session_id","owner_participant_id","status");--> statement-breakpoint
CREATE INDEX "contact_requests_requester_status_idx" ON "contact_requests" USING btree ("session_id","requester_participant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "dreamline_drafts_session_participant_uq" ON "dreamline_drafts" USING btree ("session_id","participant_id");--> statement-breakpoint
CREATE INDEX "dreamline_drafts_session_participant_idx" ON "dreamline_drafts" USING btree ("session_id","participant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dreamline_submissions_session_participant_uq" ON "dreamline_submissions" USING btree ("session_id","participant_id");--> statement-breakpoint
CREATE INDEX "dreamline_submissions_session_submitted_idx" ON "dreamline_submissions" USING btree ("session_id","submitted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "dreamline_views_viewer_submission_uq" ON "dreamline_views" USING btree ("viewer_participant_id","submission_id");--> statement-breakpoint
CREATE INDEX "dreamline_views_session_viewer_comment_idx" ON "dreamline_views" USING btree ("session_id","viewer_participant_id","commented_at","viewed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "mutation_receipts_participant_scope_uq" ON "mutation_receipts" USING btree ("session_id","participant_id","operation","idempotency_key_hash") WHERE "mutation_receipts"."participant_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "mutation_receipts_admin_scope_uq" ON "mutation_receipts" USING btree ("session_id","admin_actor","operation","idempotency_key_hash") WHERE "mutation_receipts"."admin_actor" is not null;--> statement-breakpoint
CREATE INDEX "mutation_receipts_expiry_idx" ON "mutation_receipts" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "participants_id_session_uq" ON "participants" USING btree ("id","session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "participants_session_token_hash_uq" ON "participants" USING btree ("session_id","token_hash");--> statement-breakpoint
CREATE INDEX "participants_session_state_joined_idx" ON "participants" USING btree ("session_id","state","joined_at");--> statement-breakpoint
CREATE UNIQUE INDEX "recommendation_impressions_dedupe_uq" ON "recommendation_impressions" USING btree ("viewer_participant_id","submission_id","dedupe_bucket");--> statement-breakpoint
CREATE INDEX "recommendation_impressions_session_submission_served_idx" ON "recommendation_impressions" USING btree ("session_id","submission_id","served_at");--> statement-breakpoint
CREATE INDEX "recommendation_impressions_session_viewer_served_idx" ON "recommendation_impressions" USING btree ("session_id","viewer_participant_id","served_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_public_join_token_hash_uq" ON "sessions" USING btree ("public_join_token_hash");--> statement-breakpoint
CREATE INDEX "sessions_phase_closed_idx" ON "sessions" USING btree ("phase","closed_at");