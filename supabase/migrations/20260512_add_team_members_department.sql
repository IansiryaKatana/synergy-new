alter table if exists team_members
add column if not exists department text not null default '';
