# = ENDLESS RESPAWN CLEANUP =
# Mirrors spawn cleanup commands but applies only to @s.
scoreboard players reset @s music
tag @s add lobby
gamemode a @s
scoreboard players reset @s music
tag @s remove spectator
tag @s remove easy
tag @s remove easy_music
tag @s remove easytunnel1
tag @s remove easytunnel2
tag @s remove easytunnel3
tag @s remove easytunnel4
tag @s remove easytunnel5
tag @s remove easylift
tag @s remove easylift2
tag @s remove medium
tag @s remove medium_music
tag @s remove mediumtunnel1
tag @s remove mediumtunnel2
tag @s remove mediumtunnel3
tag @s remove mediumtunnel4
tag @s remove mediumtunnel5
tag @s remove mediumlift
tag @s remove mediumlift2
tag @s remove hard
tag @s remove hard_music
tag @s remove hardtunnel1
tag @s remove hardtunnel2
tag @s remove hardtunnel3
tag @s remove hardtunnel4
tag @s remove hardtunnel5
tag @s remove hardlift
tag @s remove hardlift2
tag @s remove extreme
tag @s remove training
tag @s remove endless
tag @s remove endlesslift
tag @s remove endlesstunnel
tag @s remove endless_music
title @s times 20 80 20
effect @s clear
clear @s[tag=!easylift2, tag=!mediumlift2, tag=!hardlift2] brr:fe_spectate
