Proponowana struktura Firestore

Kolekcje główne:
- user_profiles
- organizations
- places
- quests
- quest_steps
- checkins
- qr_codes
- categories
- badges
- user_progress
- user_badges

Minimalne pola:
- user_profiles/{uid}: display_name, email, is_admin, total_points, home_city
- organizations/{id}: name, short_description, address, phone, email, website, category_id, is_active
- places/{id}: name, type, short_description, full_description, latitude, longitude, category_id, organization_id, verification_type, verification_data, is_active, is_promoted
- quests/{id}: title, description, difficulty, estimated_time, category_id, is_active
- quest_steps/{id}: quest_id, place_id, step_number, title, is_optional
- checkins/{id}: user_id, place_id, verification_method, verified_at, points_earned
