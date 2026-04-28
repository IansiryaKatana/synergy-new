alter table branding_content
add column if not exists homepage_hero_video_url text;

alter table branding_content
add column if not exists homepage_team_background_url text;

alter table branding_content
add column if not exists about_hero_background_url text;

alter table branding_content
add column if not exists contact_hero_background_url text;

alter table branding_content
add column if not exists services_hero_background_url text;
