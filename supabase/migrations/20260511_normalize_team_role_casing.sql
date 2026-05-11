update team_members
set role = replace(replace(replace(role, '(Uae)', '(UAE)'), '(Uk)', '(UK)'), 'Hr ', 'HR ')
where role like '%(Uae)%'
   or role like '%(Uk)%'
   or role like '%Hr %';
